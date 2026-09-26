import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from backend.ai_engine.roboflow_medical import RoboflowMedicalDetector

detector = RoboflowMedicalDetector()
print("Initialized detector:", detector.status())

for img_p in ["public/samples/sample_clinical_waste.jpg", "public/samples/sample_syringes_and_needle.jpg"]:
    if not os.path.exists(img_p):
        continue
    img = Image.open(img_p)
    res = detector.predict(img)
    print(f"Image: {img_p}")
    print(f"  Success: {res.get('success')}")
    print(f"  Error: {res.get('error')}")
    print(f"  Detections Count: {len(res.get('detections', []))}")
    for d in res.get('detections', []):
        print(f"    - {d.get('label')} ({d.get('confidence')}%)")
