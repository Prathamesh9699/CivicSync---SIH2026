import re
import shutil

src_path = 'backend/ai_engine/stage2_detector.py'
with open(src_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update __init__ parameters
p1 = r'(roboflow_api_key:\s*Optional\[str\]\s*=\s*None\):)'
r1 = r'''roboflow_api_key: Optional[str] = None,
                 roboflow_ewaste_model_id: Optional[str] = None,
                 roboflow_ewaste_api_key: Optional[str] = None):'''
assert re.search(p1, content), 'p1 not found'
content = re.sub(p1, r1, content, count=1)

# 2. Add self.roboflow_ewaste_detector attribute
p2 = r'(self\.roboflow_detector\s*=\s*None)'
r2 = r'''self.roboflow_detector = None
        self.roboflow_ewaste_detector = None'''
assert re.search(p2, content), 'p2 not found'
content = re.sub(p2, r2, content, count=1)

# 3. Add Roboflow E-Waste init block
p3 = r'(# 0B\. Initialize Medical Waste EfficientNet-B0 Classifier)'
r3 = r'''# 0B. Initialize Roboflow E-Waste Detector
        try:
            self.roboflow_ewaste_detector = RoboflowEWasteDetector(
                model_id=roboflow_ewaste_model_id,
                api_key=roboflow_ewaste_api_key
            )
        except Exception as ree:
            print(f"[Stage 2 Detector] Failed to initialize Roboflow e-waste detector: {ree}", file=sys.stderr)

        \1'''
assert re.search(p3, content), 'p3 not found'
content = re.sub(p3, r3, content, count=1)

# 4. Update Pass 1C: Add BIOMEDICAL_MIN_CONFIDENCES
p4 = r'(\s*# Pass 1C: Biomedical YOLOv8 Detections \(conf=0\.10[^\n]*\n\s*if self\.biomedical_model:\s*\n\s*try:\s*\n\s*b_res = self\.biomedical_model\(img_rgb, conf=)0\.10(, verbose=False\)\[0\]\s*\n\s*total_area = max\(1, img_w \* img_h\)\s*\n\s*for box in b_res\.boxes:\s*\n\s*cls_idx = int\(box\.cls\[0\]\)\s*\n\s*raw_name = self\.biomedical_model\.names\.get\(cls_idx, f"class_\{cls_idx\}"\)\s*\n\s*conf = float\(box\.conf\[0\]\))'

r4 = r'''
        # Class-calibrated confidence thresholds to prevent false positives on wood/foliage
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

        # Pass 1C: Biomedical YOLOv8 Detections (class-specific calibrated thresholds)
        if self.biomedical_model:
            try:
                b_res = self.biomedical_model(img_rgb, conf=0.20, verbose=False)[0]
                total_area = max(1, img_w * img_h)
                for box in b_res.boxes:
                    cls_idx = int(box.cls[0])
                    raw_name = self.biomedical_model.names.get(cls_idx, f"class_{cls_idx}")
                    conf = float(box.conf[0])

                    # Class-calibrated confidence threshold
                    min_req_conf = BIOMEDICAL_MIN_CONFIDENCES.get(raw_name, 0.32)
                    if conf < min_req_conf:
                        continue'''

assert re.search(p4, content), 'p4 not found'
content = re.sub(p4, r4, content, count=1)

# 5. Insert Pass 1D (Roboflow E-Waste) before Pass 2
p5 = r'(\s*# Pass 2: E-Waste & Electronics Detections)'
r5 = r'''
        # Pass 1D: Roboflow E-Waste Instance Segmentation (Cloud outline / Local container)
        rf_ewaste_result = None
        if self.roboflow_ewaste_detector:
            try:
                rf_ewaste_result = self.roboflow_ewaste_detector.predict(img_rgb)
                if rf_ewaste_result.get("success") and rf_ewaste_result.get("detections"):
                    for d in rf_ewaste_result["detections"]:
                        if any(compute_iou(d['box'], exist['box']) > 0.40 for exist in all_detections):
                            continue
                        if d.get("isSharps"):
                            sharps_count += 1
                        all_detections.append(d)
            except Exception as rfee:
                print(f"[Stage 2 Detector] Roboflow E-Waste pass error: {rfee}", file=sys.stderr)

        # Pass 2: E-Waste & Electronics Detections (conf=0.25, 37 classes from CleanTrack YOLO11)'''

assert re.search(p5, content), 'p5 not found'
content = re.sub(p5, r5, content, count=1)

# Update Pass 2 conf to 0.25
content = content.replace("e_res = self.ewaste_model(img_rgb, conf=0.20, verbose=False)[0]", "e_res = self.ewaste_model(img_rgb, conf=0.25, verbose=False)[0]", 1)

# 6. Update Pass 3 Crop Re-verification
old_crop = """                    DIRECT_CLINICAL_ITEMS = {
                        'syringe', 'syringe_needle', 'test_tube', 'urine_bag', 'gauze', 'tweezers',
                        'gloves', 'mask', 'body_tissue_organ'
                    }
                    if self.medical_classifier and self.medical_classifier.is_loaded and (x2 - x1) >= 25 and (y2 - y1) >= 25:
                        try:
                            crop = img_rgb.crop((x1, y1, x2, y2))
                            c_res = self.medical_classifier.classify(crop)
                            top_c = c_res.get('top_class')
                            c_conf = c_res.get('confidence', 0.0)
                            c_sharps = c_res.get('is_sharps', False)

                            # Reclassify only if crop is confirmed direct clinical item (syringe, needle, tube, glove, mask)
                            is_clinical_match = (
                                (top_c in DIRECT_CLINICAL_ITEMS and c_conf >= 35.0) or
                                c_sharps or
                                (top_c in {'syringe', 'syringe_needle'} and c_conf >= 12.0) or
                                (top_c == 'plastic_equipment_packaging' and c_conf >= 65.0)
                            )"""

new_crop = """                    DIRECT_CLINICAL_ITEMS = {
                        'syringe', 'syringe_needle', 'test_tube', 'urine_bag', 'gauze', 'tweezers'
                    }
                    if self.medical_classifier and self.medical_classifier.is_loaded and (x2 - x1) >= 30 and (y2 - y1) >= 30:
                        try:
                            crop = img_rgb.crop((x1, y1, x2, y2))
                            c_res = self.medical_classifier.classify(crop)
                            top_c = c_res.get('top_class')
                            c_conf = c_res.get('confidence', 0.0)
                            c_sharps = c_res.get('is_sharps', False)

                            # Reclassify only if crop is confirmed direct clinical item (syringe, needle, tube) with high confidence
                            is_clinical_match = (
                                (c_sharps and c_conf >= 25.0) or
                                (top_c in {'syringe', 'syringe_needle'} and c_conf >= 20.0) or
                                (top_c in DIRECT_CLINICAL_ITEMS and c_conf >= 60.0) or
                                (top_c == 'plastic_equipment_packaging' and c_conf >= 80.0)
                            )"""

assert old_crop in content, 'old_crop not found'
content = content.replace(old_crop, new_crop, 1)

# 7. Add Civic Structure Suppression and Guard Pass 5
old_pass5 = """        # Pass 5: Medical Waste Classifier Synthesis (Ensemble trigger if scene is verified medical)
        has_bio_in_detections = any(d['classId'] == 8 for d in all_detections)
        should_synthesize = False
        if len(all_detections) == 0 and med_clf_res and med_clf_res.get("is_medical", False):
            should_synthesize = True
        elif not has_bio_in_detections and med_clf_res and med_clf_res.get("is_medical", False) and (med_clf_res.get("is_sharps", False) or med_clf_res.get("confidence", 0.0) >= 35.0):
            should_synthesize = True"""

new_pass5 = """        # Civic Structure Suppression (Bench, Chair, etc. to prevent structural false alarms)
        if self.general_model:
            try:
                g_res = self.general_model(img_rgb, conf=0.30, verbose=False)[0]
                civic_structures = []
                for box in g_res.boxes:
                    cls_name = self.general_model.names[int(box.cls[0])]
                    if cls_name in ['bench', 'chair', 'couch', 'sofa', 'dining table']:
                        civic_structures.append(box.xyxy[0].tolist())

                if civic_structures:
                    def is_suppressed_by_structure(det_box, det_conf, is_sharps):
                        if is_sharps or det_conf >= 90.0:
                            return False
                        for s_box in civic_structures:
                            iou = compute_iou(det_box, s_box)
                            inter_det = compute_box_intersection_ratio(det_box, s_box)
                            inter_struct = compute_box_intersection_ratio(s_box, det_box)
                            if iou > 0.08 or inter_det > 0.15 or inter_struct > 0.15:
                                return True
                        return False

                    all_detections = [
                        d for d in all_detections
                        if not is_suppressed_by_structure(d['box'], d['confidence'], d.get('isSharps', False))
                    ]
            except Exception as se:
                print(f"[Stage 2 Detector] Structure suppression error: {se}", file=sys.stderr)

        # Pass 5: Medical Waste Classifier Synthesis (Ensemble trigger ONLY if verified sharps or high confidence)
        has_bio_in_detections = any(d['classId'] == 8 for d in all_detections)
        should_synthesize = False
        if len(all_detections) == 0:
            # If YOLO found 0 objects, do NOT synthesize phantom boxes on clean scenes unless verified sharps are detected with high confidence
            if med_clf_res and med_clf_res.get("is_sharps", False) and med_clf_res.get("confidence", 0.0) >= 30.0:
                should_synthesize = True
        elif not has_bio_in_detections and med_clf_res and med_clf_res.get("is_medical", False) and (med_clf_res.get("is_sharps", False) or med_clf_res.get("confidence", 0.0) >= 65.0):
            should_synthesize = True"""

assert old_pass5 in content, 'old_pass5 not found'
content = content.replace(old_pass5, new_pass5, 1)

# 8. Add roboflowEWasteStatus to return dict
old_ret = '''            "roboflowStatus": self.roboflow_detector.status() if self.roboflow_detector else None,
            "roboflowResult": rf_result,'''

new_ret = '''            "roboflowStatus": self.roboflow_detector.status() if self.roboflow_detector else None,
            "roboflowResult": rf_result,
            "roboflowEWasteStatus": self.roboflow_ewaste_detector.status() if self.roboflow_ewaste_detector else None,
            "roboflowEWasteResult": rf_ewaste_result,'''

assert old_ret in content, 'old_ret not found'
content = content.replace(old_ret, new_ret, 1)

with open(src_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully updated stage2_detector.py')
