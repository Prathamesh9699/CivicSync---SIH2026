import sys, os
sys.path.insert(0, os.path.abspath('.'))
from PIL import Image
from ultralytics import YOLO
import glob
from backend.ai_engine.medical_classifier import MedicalWasteClassifier, MEDICAL_CLASS_METADATA

bio_model = YOLO('backend/models/biomedical_best.pt')
plastic_model = YOLO('backend/models/plastic_best.pt')
clf = MedicalWasteClassifier()

SPECIFIC_MEDICAL = {
    'syringe', 'syringe_needle', 'gloves', 'mask', 'gauze',
    'test_tube', 'urine_bag', 'medical_cap', 'glass_equipment_packaging',
    'tweezers', 'shoe_cover'
}

def analyze_test(img_path):
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    total_area = w * h
    
    # 1. Bio YOLO at 0.15 with edge filter
    bio_dets = []
    b_res = bio_model(img, conf=0.15, verbose=False)[0]
    for b in b_res.boxes:
        c_name = bio_model.names[int(b.cls[0])]
        conf = float(b.conf[0])
        xy = [round(x, 1) for x in b.xyxy[0].tolist()]
        # edge filter
        area = (xy[2] - xy[0]) * (xy[3] - xy[1])
        is_edge = (xy[0] <= 2 and xy[1] <= 2 and area < 0.05 * total_area and conf < 0.25)
        if not is_edge:
            bio_dets.append({'label': c_name, 'conf': round(conf*100, 1), 'box': xy, 'source': 'bio_yolo'})
            
    # 2. Plastic YOLO at 0.25 + Crop re-verification
    plastic_dets = []
    converted_bio = []
    p_res = plastic_model(img, conf=0.25, verbose=False)[0]
    for b in p_res.boxes:
        c_name = plastic_model.names[int(b.cls[0])]
        conf = float(b.conf[0])
        xy = [round(x, 1) for x in b.xyxy[0].tolist()]
        x1, y1, x2, y2 = max(0, xy[0]), max(0, xy[1]), min(w, xy[2]), min(h, xy[3])
        
        # Check crop with medical classifier if box is of reasonable size
        is_reclassified = False
        if (x2 - x1) >= 25 and (y2 - y1) >= 25:
            crop = img.crop((x1, y1, x2, y2))
            c_res = clf.classify(crop)
            top_c = c_res.get('top_class')
            c_conf = c_res.get('confidence', 0)
            if top_c in SPECIFIC_MEDICAL and c_conf >= 35.0:
                is_reclassified = True
                converted_bio.append({'label': c_res['top_label'], 'conf': round(c_conf, 1), 'box': [x1, y1, x2, y2], 'source': 'crop_reclassified'})
                
        if not is_reclassified:
            plastic_dets.append({'label': c_name, 'conf': round(conf*100, 1), 'box': [x1, y1, x2, y2]})
            
    # 3. Quadrant / Tile scan if 0 bio detections so far
    quad_bio = []
    if len(bio_dets) == 0 and len(converted_bio) == 0:
        quads = [
            (0, 0, int(w*0.55), int(h*0.55)),
            (int(w*0.45), 0, w, int(h*0.55)),
            (0, int(h*0.45), int(w*0.55), h),
            (int(w*0.45), int(h*0.45), w, h),
            (int(w*0.25), int(h*0.25), int(w*0.75), int(h*0.75))
        ]
        for qx1, qy1, qx2, qy2 in quads:
            q_crop = img.crop((qx1, qy1, qx2, qy2))
            q_res = clf.classify(q_crop)
            q_top = q_res.get('top_class')
            q_conf = q_res.get('confidence', 0)
            if q_top in SPECIFIC_MEDICAL and q_conf >= 40.0:
                quad_bio.append({'label': q_res['top_label'], 'conf': round(q_conf, 1), 'box': [qx1, qy1, qx2, qy2], 'source': 'quadrant_scan'})
                break

    all_bio = bio_dets + converted_bio + quad_bio
    print(f"\n{img_path}:")
    print(f"  Bio detections: {len(all_bio)}, Plastic detections: {len(plastic_dets)}")
    for b in all_bio:
        print(f"    -> [BIO ({b['source']})] {b['label']} ({b['conf']}%)")

if __name__ == '__main__':
    for p in sorted(glob.glob('public/samples/*.*')):
        analyze_test(p)
