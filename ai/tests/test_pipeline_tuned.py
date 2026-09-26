import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from ultralytics import YOLO
from backend.ai_engine.medical_classifier import MedicalWasteClassifier
from backend.ai_engine.stage2_detector import compute_iou, compute_box_intersection_ratio, compute_box_union_coverage, CLEANTRACK_TAXONOMY, PHYSICAL_UNIT_MAP
from backend.ai_engine.stage1_gatekeeper import Stage1Gatekeeper

p_model = YOLO('backend/models/plastic_best.pt')
b_model = YOLO('backend/models/biomedical_best.pt')
e_model = YOLO('Ewaste new model/CleanTrack_ewaste_best.pt')
clf = MedicalWasteClassifier()
gatekeeper = Stage1Gatekeeper()

BIOMEDICAL_MIN_CONFIDENCES = {
    'Syringe': 0.24,
    'Needle': 0.24,
    'Needle Cap': 0.24,
    'Test Tube': 0.24,
    'Medical Bottle / Vial': 0.24,
    'Face Mask': 0.28,
    'Medical/Surgical Glove': 0.24,
    'Bandage': 0.28,
    'Gauze': 0.28,
    'Cotton / Medical Cotton': 0.28,
    'IV/Infusion Tube': 0.28,
    'IV/Fluid Bottle': 0.28,
    'Medicine Packaging': 0.32,
    'Medical Packaging': 0.32,
    'Sanitary Waste': 0.32,
    'Medical Disposable': 0.32,
    'Other Biomedical-looking Waste': 0.35,
}

SPECIFIC_CLINICAL_ITEMS = {
    'syringe', 'syringe_needle', 'test_tube', 'urine_bag', 'tweezers',
    'glass_equipment_packaging', 'gauze', 'gloves', 'mask',
    'medical_cap', 'shoe_cover', 'medical_glasses'
}

def run_pipeline_sim(img_path):
    img = Image.open(img_path).convert('RGB')
    img_w, img_h = img.size

    s1 = gatekeeper.evaluate(img)
    if s1['should_exit_early']:
        return {
            'image': img_path,
            'category': 'Clean / No Waste Detected',
            'totalItems': 0,
            'totalCoverage': 0.0,
            'plasticCoverage': 0.0,
            'medicalCoverage': 0.0,
            'ewasteCoverage': 0.0,
            'detections': []
        }

    all_detections = []
    sharps_count = 0

    # 1. Biomedical YOLO
    b_res = b_model(img, conf=0.18, verbose=False)[0]
    for box in b_res.boxes:
        cls_idx = int(box.cls[0])
        raw_name = b_model.names.get(cls_idx, f"class_{cls_idx}")
        conf = float(box.conf[0])
        min_req = BIOMEDICAL_MIN_CONFIDENCES.get(raw_name, 0.28)
        if conf < min_req:
            continue
        xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
        if any(compute_iou(xyxy, d['box']) > 0.40 for d in all_detections):
            continue
        unit = PHYSICAL_UNIT_MAP.get(raw_name, {'volume_l': 0.25, 'weight_g': 25.0, 'class_id': 8, 'name': raw_name, 'is_sharps': any(s in raw_name.lower() for s in ['syringe', 'needle', 'ampoule', 'vial'])})
        if unit.get('is_sharps', False): sharps_count += 1
        all_detections.append({'classId': 8, 'label': unit['name'], 'confidence': round(conf * 100.0, 1), 'box': xyxy, 'isSharps': unit.get('is_sharps', False), 'source': 'BiomedicalYOLO'})

    # 2. EWaste YOLO
    e_res = e_model(img, conf=0.25, verbose=False)[0]
    for box in e_res.boxes:
        cls_idx = int(box.cls[0])
        raw_name = e_model.names.get(cls_idx, f"class_{cls_idx}")
        conf = float(box.conf[0])
        xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
        if any(compute_iou(xyxy, d['box']) > 0.35 and d['classId'] == 8 for d in all_detections):
            continue
        if any(compute_iou(xyxy, d['box']) > 0.40 for d in all_detections):
            continue
        unit = PHYSICAL_UNIT_MAP.get(raw_name, {'volume_l': 1.0, 'weight_g': 350.0, 'class_id': 6, 'name': raw_name.replace('-', ' ').title(), 'is_sharps': False})
        all_detections.append({'classId': 6, 'label': unit['name'], 'confidence': round(conf * 100.0, 1), 'box': xyxy, 'isSharps': False, 'source': 'EWasteModel'})

    # 3. Plastic YOLO with Context-Aware Medical Crop Re-verification
    has_prior_biomed = any(d['classId'] == 8 for d in all_detections)

    p_res = p_model(img, conf=0.25, verbose=False)[0]
    for box in p_res.boxes:
        cls_idx = int(box.cls[0])
        raw_name = p_model.names.get(cls_idx, f"class_{cls_idx}")
        conf = float(box.conf[0])
        xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
        if any((compute_iou(xyxy, d['box']) > 0.18 or compute_box_intersection_ratio(xyxy, d['box']) > 0.25) and d['classId'] in [6, 8] for d in all_detections):
            continue
        if any(compute_iou(xyxy, d['box']) > 0.40 for d in all_detections):
            continue

        # Crop re-verification
        x1, y1, x2, y2 = max(0, int(xyxy[0])), max(0, int(xyxy[1])), min(img_w, int(xyxy[2])), min(img_h, int(xyxy[3]))
        reclassified = False
        if (x2 - x1) >= 30 and (y2 - y1) >= 30:
            crop = img.crop((x1, y1, x2, y2))
            c_res = clf.classify(crop)
            top_c = c_res.get('top_class')
            c_conf = c_res.get('confidence', 0.0)
            c_sharps = c_res.get('is_sharps', False)

            # Reclassify if specific clinical item OR if packaging in confirmed clinical scene
            is_match = (
                (c_sharps and c_conf >= 25.0) or
                (top_c in {'syringe', 'syringe_needle'} and c_conf >= 20.0) or
                (top_c in SPECIFIC_CLINICAL_ITEMS and c_conf >= 40.0) or
                (has_prior_biomed and top_c in {'paper_equipment_packaging', 'plastic_equipment_packaging', 'metal_equipment_packaging'} and c_conf >= 60.0) or
                (top_c in {'paper_equipment_packaging', 'plastic_equipment_packaging'} and c_conf >= 85.0)
            )
            if is_match:
                unit = PHYSICAL_UNIT_MAP.get(top_c, {'volume_l': c_res.get('volume_l', 0.20), 'weight_g': c_res.get('weight_g', 20.0), 'class_id': 8, 'name': c_res.get('top_label', 'Clinical Biohazard Waste'), 'is_sharps': c_sharps or any(s in top_c for s in ['syringe', 'needle', 'vial', 'ampoule'])})
                is_sharps = unit.get('is_sharps', False) or c_sharps
                if is_sharps: sharps_count += 1
                all_detections.append({'classId': 8, 'label': unit['name'], 'confidence': round(c_conf, 1), 'box': xyxy, 'isSharps': is_sharps, 'source': 'CropReverifiedMedical'})
                reclassified = True

        if reclassified:
            continue

        unit = PHYSICAL_UNIT_MAP.get(raw_name, {'volume_l': 0.60, 'weight_g': 40.0, 'class_id': 1, 'name': raw_name.replace('_', ' ').title(), 'is_sharps': False})
        all_detections.append({'classId': unit['class_id'], 'label': unit['name'], 'confidence': round(conf * 100.0, 1), 'box': xyxy, 'isSharps': False, 'source': 'PlasticModel'})

    # If 0 objects found, try medical classifier synthesis
    if len(all_detections) == 0:
        c_full = clf.classify(img)
        if c_full.get('is_medical') and (c_full.get('is_sharps') or c_full.get('confidence', 0) >= 55.0):
            top_raw = c_full['top_class']
            unit = PHYSICAL_UNIT_MAP.get(top_raw, {'volume_l': 0.25, 'weight_g': 25.0, 'class_id': 8, 'name': c_full['top_label'], 'is_sharps': c_full.get('is_sharps', False)})
            box_xyxy = [round(img_w * 0.15, 1), round(img_h * 0.15, 1), round(img_w * 0.85, 1), round(img_h * 0.85, 1)]
            all_detections.append({'classId': 8, 'label': unit['name'], 'confidence': round(c_full['confidence'], 1), 'box': box_xyxy, 'isSharps': unit.get('is_sharps', False), 'source': 'MedicalClassifier'})

    p_boxes = [d['box'] for d in all_detections if d['classId'] == 1]
    m_boxes = [d['box'] for d in all_detections if d['classId'] == 8]
    e_boxes = [d['box'] for d in all_detections if d['classId'] == 6]
    all_b = [d['box'] for d in all_detections]

    p_cov = compute_box_union_coverage(p_boxes, img_w, img_h)
    m_cov = compute_box_union_coverage(m_boxes, img_w, img_h)
    e_cov = compute_box_union_coverage(e_boxes, img_w, img_h)
    tot_cov = compute_box_union_coverage(all_b, img_w, img_h)

    # Calibrated Category Determination (Respecting ~80% plastic, ~40% medical, ~20% ewaste)
    has_medical = len(m_boxes) > 0 or sharps_count > 0
    has_ewaste = len(e_boxes) > 0
    has_plastic = len(p_boxes) > 0

    if sharps_count > 0:
        cat = "Medical Waste"
    elif has_medical and (m_cov >= 35.0 or m_cov >= p_cov or (not has_plastic) or len(m_boxes) >= len(p_boxes)):
        cat = "Medical Waste"
    elif has_ewaste and (e_cov >= 15.0 or e_cov >= p_cov or (not has_plastic) or len(e_boxes) >= len(p_boxes)):
        cat = "E-Waste"
    elif has_plastic:
        cat = "Plastic Waste"
    elif has_medical:
        cat = "Medical Waste"
    elif has_ewaste:
        cat = "E-Waste"
    elif len(all_detections) > 0:
        cat = "Mixed Solid Waste"
    else:
        cat = "Clean / No Waste Detected"

    return {
        'image': img_path,
        'category': cat,
        'totalItems': len(all_detections),
        'totalCoverage': tot_cov,
        'plasticCoverage': p_cov,
        'medicalCoverage': m_cov,
        'ewasteCoverage': e_cov,
        'sharpsCount': sharps_count,
        'detections': all_detections
    }

test_set = [
    'scratch/park_bench_only.jpg',
    'public/samples/sample_clinical_waste.jpg',
    'public/samples/sample_syringes_and_needle.jpg',
    'Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_1_syringe.jpg',
    'public/samples/sample_ewaste.jpg',
    'Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_3_plastic_bottle.jpg',
    'public/samples/municipal-waste-management.jpg'
]

print("=" * 60)
print("TESTING FULLY CALIBRATED PIPELINE SIMULATION")
print("=" * 60)
for path in test_set:
    if not os.path.exists(path):
        continue
    r = run_pipeline_sim(path)
    print(f"\nImage: {r['image']}")
    print(f"  Category: {r['category']}")
    print(f"  Total Items: {r['totalItems']} | Total Coverage: {r['totalCoverage']}%")
    print(f"  Plastic Coverage: {r['plasticCoverage']}% | Medical Coverage: {r['medicalCoverage']}% | EWaste Coverage: {r['ewasteCoverage']}%")
