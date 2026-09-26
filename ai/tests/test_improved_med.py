import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from ultralytics import YOLO
from backend.ai_engine.medical_classifier import MedicalWasteClassifier
from backend.ai_engine.stage2_detector import compute_iou, compute_box_intersection_ratio, compute_box_union_coverage, CLEANTRACK_TAXONOMY, PHYSICAL_UNIT_MAP

img_path = 'public/samples/sample_clinical_waste.jpg'
img = Image.open(img_path).convert('RGB')
img_w, img_h = img.size

p_model = YOLO('backend/models/plastic_best.pt')
b_model = YOLO('backend/models/biomedical_best.pt')
clf = MedicalWasteClassifier()

BIOMEDICAL_MIN_CONFIDENCES = {
    'Syringe': 0.18,
    'Needle': 0.18,
    'Needle Cap': 0.18,
    'Test Tube': 0.20,
    'Medical Bottle / Vial': 0.20,
    'Face Mask': 0.25,
    'Medical/Surgical Glove': 0.24,
    'Bandage': 0.25,
    'Gauze': 0.25,
    'Cotton / Medical Cotton': 0.25,
    'IV/Infusion Tube': 0.25,
    'IV/Fluid Bottle': 0.25,
    'Medicine Packaging': 0.28,
    'Medical Packaging': 0.28,
    'Sanitary Waste': 0.28,
    'Medical Disposable': 0.28,
    'Other Biomedical-looking Waste': 0.35,
}

all_detections = []
sharps_count = 0

# Biomedical YOLO pass at conf=0.15
b_res = b_model(img, conf=0.15, verbose=False)[0]
for box in b_res.boxes:
    cls_idx = int(box.cls[0])
    raw_name = b_model.names.get(cls_idx, f"class_{cls_idx}")
    conf = float(box.conf[0])
    min_req_conf = BIOMEDICAL_MIN_CONFIDENCES.get(raw_name, 0.25)
    if conf < min_req_conf:
        continue
    xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
    xyxyn = [round(x, 4) for x in box.xyxyn[0].tolist()] if hasattr(box, 'xyxyn') else [0, 0, 0, 0]
    if any(compute_iou(xyxy, d['box']) > 0.40 for d in all_detections):
        continue
    unit = PHYSICAL_UNIT_MAP.get(raw_name, {
        'volume_l': 0.25,
        'weight_g': 25.0,
        'class_id': 8,
        'name': raw_name,
        'polymer': 'Clinical Biohazard Polymer',
        'is_sharps': any(s in raw_name.lower() for s in ['syringe', 'needle', 'ampoule', 'vial'])
    })
    if unit.get('is_sharps', False):
        sharps_count += 1
    class_info = CLEANTRACK_TAXONOMY[unit['class_id']]
    all_detections.append({
        "classId": unit['class_id'],
        "label": unit['name'],
        "confidence": round(conf * 100.0, 1),
        "box": xyxy,
        "source": "BiomedicalYOLO"
    })

# Plastic YOLO pass with crop re-verification
CLINICAL_DIRECT_ITEMS = {'syringe', 'syringe_needle', 'test_tube', 'urine_bag', 'tweezers', 'glass_equipment_packaging'}
CLINICAL_HYGIENE_ITEMS = {'gauze', 'gloves', 'mask', 'medical_cap', 'shoe_cover', 'medical_glasses'}
CLINICAL_PACKAGING_ITEMS = {'paper_equipment_packaging', 'plastic_equipment_packaging', 'metal_equipment_packaging'}

p_res = p_model(img, conf=0.25, verbose=False)[0]
for box in p_res.boxes:
    cls_idx = int(box.cls[0])
    raw_name = p_model.names.get(cls_idx, f"class_{cls_idx}")
    conf = float(box.conf[0])
    xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
    xyxyn = [round(x, 4) for x in box.xyxyn[0].tolist()] if hasattr(box, 'xyxyn') else [0, 0, 0, 0]

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

        is_match = (
            (c_sharps and c_conf >= 25.0) or
            (top_c in CLINICAL_DIRECT_ITEMS and c_conf >= 25.0) or
            (top_c in CLINICAL_HYGIENE_ITEMS and c_conf >= 38.0) or
            (top_c in CLINICAL_PACKAGING_ITEMS and c_conf >= 45.0)
        )
        if is_match:
            unit = PHYSICAL_UNIT_MAP.get(top_c, {
                'volume_l': c_res.get('volume_l', 0.20),
                'weight_g': c_res.get('weight_g', 20.0),
                'class_id': 8,
                'name': c_res.get('top_label', 'Clinical Biohazard Waste'),
                'polymer': 'Clinical Biohazard Material',
                'is_sharps': c_sharps or any(s in top_c for s in ['syringe', 'needle', 'vial', 'ampoule'])
            })
            all_detections.append({
                "classId": 8,
                "label": unit['name'],
                "confidence": round(c_conf, 1),
                "box": xyxy,
                "source": "CropReverifiedMedical"
            })
            reclassified = True

    if reclassified:
        continue

    unit = PHYSICAL_UNIT_MAP.get(raw_name, {
        'volume_l': 0.60,
        'weight_g': 40.0,
        'class_id': 1,
        'name': raw_name.replace('_', ' ').title(),
        'polymer': 'Recyclable Polymer Composite',
        'is_sharps': False
    })
    all_detections.append({
        "classId": unit['class_id'],
        "label": unit['name'],
        "confidence": round(conf * 100.0, 1),
        "box": xyxy,
        "source": "PlasticModel"
    })

# Compute coverage
med_boxes = [d['box'] for d in all_detections if d['classId'] == 8]
plastic_boxes = [d['box'] for d in all_detections if d['classId'] == 1]
all_boxes = [d['box'] for d in all_detections]

total_cov = compute_box_union_coverage(all_boxes, img_w, img_h)
med_cov = compute_box_union_coverage(med_boxes, img_w, img_h)
plastic_cov = compute_box_union_coverage(plastic_boxes, img_w, img_h)

med_count = sum(1 for d in all_detections if d['classId'] == 8)
plastic_count = sum(1 for d in all_detections if d['classId'] == 1)

print(f"Results with improved calibration:")
print(f"  Total Items: {len(all_detections)} (Medical: {med_count}, Plastic: {plastic_count})")
print(f"  Total Coverage: {total_cov}%, Medical Coverage: {med_cov}%, Plastic Coverage: {plastic_cov}%")
for d in all_detections:
    print(f"    - [{d['classId']}] {d['label']} ({d['confidence']}%) | Source: {d['source']}")
