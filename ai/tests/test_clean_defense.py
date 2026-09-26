import os
import sys
from PIL import Image
from ultralytics import YOLO

def test_proposed_filters():
    img_path = 'scratch/park_bench_only.jpg'
    img = Image.open(img_path).convert('RGB')
    img_w, img_h = img.size
    total_area = max(1, img_w * img_h)

    print("--- 1. Testing Biomedical YOLO with Calibrated Thresholds ---")
    bio = YOLO('backend/models/biomedical_best.pt')
    b_res = bio(img, conf=0.10, verbose=False)[0]

    BIOMEDICAL_MIN_CONFIDENCES = {
        'Syringe': 0.25,
        'Needle': 0.25,
        'Needle Cap': 0.25,
        'Test Tube': 0.28,
        'Medical Bottle / Vial': 0.28,
        'Face Mask': 0.35,
        'Medical/Surgical Glove': 0.35,
        'Bandage': 0.35,
        'Gauze': 0.35,
        'Cotton / Medical Cotton': 0.35,
        'IV/Infusion Tube': 0.30,
        'IV/Fluid Bottle': 0.30,
        'Medicine Packaging': 0.35,
        'Medical Packaging': 0.35,
        'Sanitary Waste': 0.35,
        'Medical Disposable': 0.35,
        'Other Biomedical-looking Waste': 0.40,
    }

    filtered_bio = []
    for b in b_res.boxes:
        cls_idx = int(b.cls[0])
        raw_name = bio.names.get(cls_idx, f"class_{cls_idx}")
        conf = float(b.conf[0])
        min_conf = BIOMEDICAL_MIN_CONFIDENCES.get(raw_name, 0.30)
        print(f"  Raw Bio Detection: {raw_name} ({conf*100:.1f}%) | Required: {min_conf*100:.0f}%")
        if conf >= min_conf:
            filtered_bio.append((raw_name, conf))
        else:
            print(f"    --> REJECTED as low-confidence noise ({conf*100:.1f}% < {min_conf*100:.0f}%)")

    print(f"Filtered Bio Detections count: {len(filtered_bio)}")

    print("\n--- 2. Testing COCO General Model for Civic Structure (Bench) ---")
    coco = YOLO('yolov8n.pt')
    c_res = coco(img, conf=0.30, verbose=False)[0]
    bench_boxes = []
    for b in c_res.boxes:
        cls_name = coco.names[int(b.cls[0])]
        conf = float(b.conf[0])
        xyxy = b.xyxy[0].tolist()
        box_area = (xyxy[2] - xyxy[0]) * (xyxy[3] - xyxy[1])
        area_pct = (box_area / float(total_area)) * 100.0
        print(f"  COCO Detection: {cls_name} ({conf*100:.1f}%) | Area: {area_pct:.1f}% | Box: {[round(x,1) for x in xyxy]}")
        if cls_name in ['bench', 'chair']:
            bench_boxes.append((xyxy, area_pct, conf))

    print(f"Civic structures detected: {len(bench_boxes)}")

    print("\n--- 3. Testing Structure Suppression on Plastic Detections ---")
    plas = YOLO('backend/models/plastic_best.pt')
    p_res = plas(img, conf=0.25, verbose=False)[0]

    def compute_iou(box1, box2):
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        if inter <= 0: return 0.0
        a1 = max(1e-5, (box1[2] - box1[0]) * (box1[3] - box1[1]))
        a2 = max(1e-5, (box2[2] - box2[0]) * (box2[3] - box2[1]))
        return inter / float(a1 + a2 - inter)

    def compute_inter_ratio(box1, box2):
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        if inter <= 0: return 0.0
        a1 = max(1e-5, (box1[2] - box1[0]) * (box1[3] - box1[1]))
        return inter / a1

    filtered_plas = []
    for b in p_res.boxes:
        cls_idx = int(b.cls[0])
        raw_name = plas.names.get(cls_idx, f"class_{cls_idx}")
        conf = float(b.conf[0])
        xyxy = b.xyxy[0].tolist()
        box_area = (xyxy[2] - xyxy[0]) * (xyxy[3] - xyxy[1])
        area_pct = (box_area / float(total_area)) * 100.0

        # Check suppression against civic structures
        suppressed_by_structure = False
        for s_box, s_area, s_conf in bench_boxes:
            iou = compute_iou(xyxy, s_box)
            overlap_with_structure = compute_inter_ratio(xyxy, s_box)
            overlap_structure_with_box = compute_inter_ratio(s_box, xyxy)
            if iou > 0.15 or overlap_with_structure > 0.50 or overlap_structure_with_box > 0.35:
                suppressed_by_structure = True
                print(f"  Plastic candidate {raw_name} ({conf*100:.1f}%) SUPPRESSED by civic bench (IoU={iou:.2f}, Overlap={overlap_with_structure:.2f})")
                break

        if not suppressed_by_structure:
            # Low confidence plastic in outdoor foliage
            if conf < 0.35:
                print(f"  Plastic candidate {raw_name} ({conf*100:.1f}%) REJECTED as low confidence (< 35%)")
            else:
                filtered_plas.append((raw_name, conf))

    print(f"Remaining Plastic Detections: {len(filtered_plas)}")

    if len(filtered_bio) == 0 and len(filtered_plas) == 0:
        print("\n>>> SUCCESS: Park Bench image is correctly classified as CLEAN (0 waste items detected)!")
    else:
        print(f"\n>>> FAILED: Still {len(filtered_bio)} bio and {len(filtered_plas)} plastic items detected.")

if __name__ == '__main__':
    test_proposed_filters()
