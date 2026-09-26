import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from backend.ai_engine.stage2_detector import Stage2Detector

s2 = Stage2Detector()

test_images = [
    'Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_3_plastic_bottle.jpg',
    'Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_2_mixed_waste.jpg',
    'public/samples/images.jpg',
    'public/samples/municipal-waste-management.jpg',
    'public/samples/970666-garbage.webp'
]

for p in test_images:
    if not os.path.exists(p):
        continue
    res = s2.detect(p)
    print(f"Image: {p}")
    print(f"  Total Items: {res['totalItems']}, Plastic: {res['plasticDetectionsCount']}, Medical: {res['medicalDetectionsCount']}, EWaste: {res['ewasteDetectionsCount']}")
    print(f"  Coverage - Total: {res['totalCoveragePercent']}%, Plastic: {res['plasticCoveragePercent']}%, Medical: {res['medicalCoveragePercent']}%, EWaste: {res['ewasteCoveragePercent']}%")
    for d in res['detections'][:3]:
        print(f"    - [{d['classId']}] {d['label']} ({d['confidence']}%)")
    print("-" * 50)
