import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from backend.ai_engine.roboflow_ewaste import RoboflowEWasteDetector

detector = RoboflowEWasteDetector()
print("Initialized ewaste detector:", detector.status())

for img_p in ["public/samples/sample_ewaste.jpg"]:
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
