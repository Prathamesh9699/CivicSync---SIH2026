import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from ultralytics import YOLO
from backend.ai_engine.medical_classifier import MedicalWasteClassifier

img_path = 'public/samples/sample_clinical_waste.jpg'
img = Image.open(img_path).convert('RGB')
w, h = img.size

p_model = YOLO('backend/models/plastic_best.pt')
b_model = YOLO('backend/models/biomedical_best.pt')
clf = MedicalWasteClassifier()

print("--- BIOMEDICAL YOLO RAW BOXES (conf=0.10) ---")
b_res = b_model(img, conf=0.10, verbose=False)[0]
for box in b_res.boxes:
    cls_idx = int(box.cls[0])
    name = b_model.names.get(cls_idx, f"class_{cls_idx}")
    conf = float(box.conf[0])
    xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
    print(f"  Biomedical YOLO: {name} ({round(conf*100, 1)}%) box: {xyxy}")

print("\n--- PLASTIC YOLO BOXES & WHAT MEDICAL CLASSIFIER THINKS OF EACH CROP ---")
p_res = p_model(img, conf=0.20, verbose=False)[0]
for box in p_res.boxes:
    cls_idx = int(box.cls[0])
    p_name = p_model.names.get(cls_idx, f"class_{cls_idx}")
    p_conf = float(box.conf[0])
    xyxy = [int(x) for x in box.xyxy[0].tolist()]
    crop = img.crop((xyxy[0], xyxy[1], xyxy[2], xyxy[3]))
    c_res = clf.classify(crop)
    print(f"  Plastic box: {p_name} ({round(p_conf*100, 1)}%) -> MedClassifier: {c_res['top_class']} ({c_res['confidence']}%) is_sharps={c_res['is_sharps']} is_med={c_res['is_medical']}")
