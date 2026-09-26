import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from backend.ai_engine.stage2_detector import Stage2Detector

s2 = Stage2Detector()

# Let's inspect what s2 detects currently vs after adjusting
res = s2.detect('public/samples/sample_clinical_waste.jpg')
print("Current detections on sample_clinical_waste.jpg:")
print(f"Total: {res['totalItems']}, Plastic: {res['plasticDetectionsCount']}, Medical: {res['medicalDetectionsCount']}")
print(f"Total Coverage: {res['totalCoveragePercent']}%, Plastic Coverage: {res['plasticCoveragePercent']}%, Medical Coverage: {res['medicalCoveragePercent']}%")
for d in res['detections']:
    print(f"  - [{d['classId']}] {d['label']} ({d['confidence']}%) | Source: {d.get('source', 'Model')}")
