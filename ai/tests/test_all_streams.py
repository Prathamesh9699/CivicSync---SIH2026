import os
import sys
import json
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.ai_engine.pipeline import CleanTrackPipeline

def run_tests():
    pipeline = CleanTrackPipeline()

    test_images = [
        # Medical waste tests
        ("Medical 1 (Syringes)", "Biomedical_Waste_Detector/Biomedical_Waste_Detector/UPLOAD_IMAGES_HERE/sample_syringes_and_needle.jpg"),
        ("Medical 2 (Clinical)", "Biomedical_Waste_Detector/Biomedical_Waste_Detector/UPLOAD_IMAGES_HERE/sample_clinical_waste.jpg"),
        ("Medical 3 (Syringe)", "Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_1_syringe.jpg"),
        # Plastic waste tests
        ("Plastic 1 (Bottles)", "Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_3_plastic_bottle.jpg"),
    ]

    # Look for e-waste images in the project
    ewaste_candidates = []
    for root, dirs, files in os.walk("."):
        if "node_modules" in root or ".git" in root:
            continue
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and ('ewaste' in f.lower() or 'electronic' in f.lower() or 'battery' in f.lower() or 'phone' in f.lower() or 'computer' in f.lower()):
                ewaste_candidates.append(os.path.join(root, f))

    if ewaste_candidates:
        test_images.append(("E-Waste Candidate", ewaste_candidates[0]))
    else:
        print(f"No direct ewaste image name found, searching all images...")

    print("=" * 70)
    print("RUNNING MULTI-STREAM CLEANTRACK PIPELINE TESTS")
    print("=" * 70)

    for label, path in test_images:
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path):
            print(f"SKIP [{label}]: {abs_path} not found")
            continue

        res = pipeline.process_image(abs_path)
        print(f"\n--- {label} ---")
        print(f"File: {path}")
        print(f"Waste Found: {res.get('wasteFound')}")
        print(f"Category: {res.get('category')} (ID: {res.get('categoryId')})")
        print(f"Subtype: {res.get('subtype')}")
        print(f"Confidence: {res.get('confidence')}% (Avg: {res.get('averageConfidence')}%)")
        print(f"Detections Count: Total={res.get('totalItemsDetected')}, Plastic={res.get('plasticDetectionsCount')}, Medical={res.get('biomedicalDetectionsCount')}, E-Waste={res.get('ewasteDetectionsCount')}")
        print(f"Coverage: Total={res.get('totalCoveragePercent')}%, Plastic={res.get('plasticCoveragePercent')}%, Medical={res.get('medicalCoveragePercent')}%, E-Waste={res.get('ewasteCoveragePercent')}%")
        print(f"Segregation Stream: {res.get('segregationStream')}")
        print(f"Severity: {res.get('severity')} (Score: {res.get('severityScore')})")
        if res.get('detections'):
            print(f"Sample Detections:")
            for d in res['detections'][:5]:
                print(f"  - [{d.get('category')}] {d.get('label')} ({d.get('confidence')}%) box={d.get('box')}")

if __name__ == '__main__':
    run_tests()
