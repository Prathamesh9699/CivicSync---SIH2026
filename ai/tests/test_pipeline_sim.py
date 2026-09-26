import os
import sys
sys.path.insert(0, os.path.abspath('.'))

from PIL import Image
from ultralytics import YOLO
import glob
from backend.ai_engine.medical_classifier import MedicalWasteClassifier, MEDICAL_CLASS_METADATA

bio_model = YOLO('backend/models/biomedical_best.pt')
plastic_model = YOLO('backend/models/plastic_best.pt')
ewaste_model = YOLO('backend/models/ewaste_best.pt')
clf = MedicalWasteClassifier()

SPECIFIC_MEDICAL_CLASSES = {
    'syringe', 'syringe_needle', 'gloves', 'mask', 'gauze',
    'test_tube', 'urine_bag', 'medical_cap', 'tweezers', 'shoe_cover', 'medical_glasses'
}

def compute_iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if inter <= 0:
        return 0.0
    a1 = max(1e-5, (box1[2] - box1[0]) * (box1[3] - box1[1]))
    a2 = max(1e-5, (box2[2] - box2[0]) * (box2[3] - box2[1]))
    return inter / float(a1 + a2 - inter)

def compute_intersection_ratio(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if inter <= 0:
        return 0.0
    a1 = max(1e-5, (box1[2] - box1[0]) * (box1[3] - box1[1]))
    return inter / float(a1)

def run_pipeline_simulation(img_path):
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    total_area = w * h

    all_dets = []
    bio_dets = []
    sharps_count = 0

    # Pass 1: Biomedical YOLO at conf=0.14 with edge artifact filter
    b_res = bio_model(img, conf=0.14, verbose=False)[0]
    for b in b_res.boxes:
        c_name = bio_model.names[int(b.cls[0])]
        conf = float(b.conf[0])
        xy = [round(x, 1) for x in b.xyxy[0].tolist()]
        area = (xy[2] - xy[0]) * (xy[3] - xy[1])
        # Filter corner/edge artifacts
        is_edge = (xy[0] <= 2 and xy[1] <= 2 and area < 0.05 * total_area and conf < 0.25)
        if is_edge:
            continue
        is_sharps = any(s in c_name.lower() for s in ['syringe', 'needle', 'vial', 'ampoule'])
        if is_sharps:
            sharps_count += 1
        d = {
            'classId': 8,
            'category': 'Medical Waste',
            'label': c_name,
            'conf': round(conf * 100, 1),
            'box': xy,
            'isSharps': is_sharps,
            'source': 'Biomedical_YOLO'
        }
        all_dets.append(d)
        bio_dets.append(d)

    # Pass 2: E-Waste YOLO at conf=0.20
    e_res = ewaste_model(img, conf=0.20, verbose=False)[0]
    for b in e_res.boxes:
        c_name = ewaste_model.names[int(b.cls[0])]
        conf = float(b.conf[0])
        xy = [round(x, 1) for x in b.xyxy[0].tolist()]
        if any(compute_iou(xy, d['box']) > 0.35 and d['classId'] == 8 for d in all_dets):
            continue
        all_dets.append({
            'classId': 6,
            'category': 'E-Waste',
            'label': c_name,
            'conf': round(conf * 100, 1),
            'box': xy,
            'source': 'EWaste_YOLO'
        })

    # Pass 3: Plastic YOLO at conf=0.25 + Crop Re-verification
    p_res = plastic_model(img, conf=0.25, verbose=False)[0]
    for b in p_res.boxes:
        c_name = plastic_model.names[int(b.cls[0])]
        conf = float(b.conf[0])
        xy = [round(x, 1) for x in b.xyxy[0].tolist()]
        
        # De-overlap against existing medical and e-waste
        if any((compute_iou(xy, d['box']) > 0.15 or compute_intersection_ratio(xy, d['box']) > 0.20) and d['classId'] in [6, 8] for d in all_dets):
            continue

        x1, y1, x2, y2 = max(0, int(xy[0])), max(0, int(xy[1])), min(w, int(xy[2])), min(h, int(xy[3]))
        reclassified = False
        
        # Crop re-verification if box is adequate size
        if (x2 - x1) >= 30 and (y2 - y1) >= 30:
            crop = img.crop((x1, y1, x2, y2))
            c_res = clf.classify(crop)
            top_c = c_res.get('top_class')
            c_conf = c_res.get('confidence', 0.0)
            
            # If crop is a specific medical waste item (syringe, gloves, gauze, test tube, etc.)
            if top_c in SPECIFIC_MEDICAL_CLASSES and c_conf >= 30.0:
                is_sharps = c_res.get('is_sharps', False) or any(s in top_c for s in ['syringe', 'needle'])
                if is_sharps:
                    sharps_count += 1
                bio_d = {
                    'classId': 8,
                    'category': 'Medical Waste',
                    'label': c_res['top_label'],
                    'conf': round(c_conf, 1),
                    'box': [x1, y1, x2, y2],
                    'isSharps': is_sharps,
                    'source': f'CropReverified_{top_c}'
                }
                all_dets.append(bio_d)
                bio_dets.append(bio_d)
                reclassified = True

        if not reclassified:
            all_dets.append({
                'classId': 1,
                'category': 'Plastic Waste',
                'label': c_name,
                'conf': round(conf * 100, 1),
                'box': xy,
                'source': 'Plastic_YOLO'
            })

    # Pass 4: Patch-level Scan if no bio detections so far
    if len(bio_dets) == 0:
        quads = [
            (0, 0, int(w * 0.55), int(h * 0.55)),
            (int(w * 0.45), 0, w, int(h * 0.55)),
            (0, int(h * 0.45), int(w * 0.55), h),
            (int(w * 0.45), int(h * 0.45), w, h),
            (int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75))
        ]
        for qx1, qy1, qx2, qy2 in quads:
            q_crop = img.crop((qx1, qy1, qx2, qy2))
            q_res = clf.classify(q_crop)
            q_top = q_res.get('top_class')
            q_conf = q_res.get('confidence', 0.0)
            if q_top in SPECIFIC_MEDICAL_CLASSES and q_conf >= 35.0:
                is_sharps = q_res.get('is_sharps', False)
                if is_sharps:
                    sharps_count += 1
                patch_d = {
                    'classId': 8,
                    'category': 'Medical Waste',
                    'label': q_res['top_label'],
                    'conf': round(q_conf, 1),
                    'box': [qx1, qy1, qx2, qy2],
                    'isSharps': is_sharps,
                    'source': f'PatchScan_{q_top}'
                }
                all_dets.append(patch_d)
                bio_dets.append(patch_d)
                break

    # Pass 5: Whole-Image Classifier Synthesis if still 0 bio detections and 0 total detections
    if len(all_dets) == 0:
        w_res = clf.classify(img)
        if w_res.get('is_medical', False):
            is_sharps = w_res.get('is_sharps', False)
            if is_sharps:
                sharps_count += 1
            box_xyxy = [round(w * 0.15, 1), round(h * 0.15, 1), round(w * 0.85, 1), round(h * 0.85, 1)]
            w_d = {
                'classId': 8,
                'category': 'Medical Waste',
                'label': w_res['top_label'],
                'conf': round(w_res['confidence'], 1),
                'box': box_xyxy,
                'isSharps': is_sharps,
                'source': 'ImageLevel_Classifier'
            }
            all_dets.append(w_d)
            bio_dets.append(w_d)

    # Primary Stream Arbitration
    p_count = sum(1 for d in all_dets if d['classId'] == 1)
    e_count = sum(1 for d in all_dets if d['classId'] == 6)
    m_count = sum(1 for d in all_dets if d['classId'] == 8)

    if m_count > 0:
        cat = "Medical Waste"
        cid = "02"
    elif e_count > 0 and (p_count == 0 or e_count >= p_count):
        cat = "E-Waste"
        cid = "03"
    elif p_count > 0:
        cat = "Plastic Waste"
        cid = "01"
    else:
        cat = "Clean Scene"
        cid = "00"

    print(f"[{os.path.basename(img_path)}] -> Category: {cat} (ID {cid}) | Total: {len(all_dets)} (Bio: {m_count}, Plastic: {p_count}, EWaste: {e_count})")
    for d in bio_dets:
        print(f"    * [MED] {d['label']} ({d['conf']}%) via {d['source']}")

if __name__ == '__main__':
    print('='*70)
    print('TESTING ENHANCED MULTI-TIER MEDICAL WASTE DETECTION')
    print('='*70)
    for p in sorted(glob.glob('public/samples/*.*')):
        run_pipeline_simulation(p)
