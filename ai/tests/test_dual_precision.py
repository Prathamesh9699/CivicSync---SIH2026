"""
CleanTrack AI - Medical Waste and Plastic Waste Dual Precision Verification
"""

import os
import sys
import json

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath('.'))

from backend.ai_engine.pipeline import CleanTrackPipeline
from backend.ai_engine.roboflow_medical import RoboflowMedicalDetector

def run_tests():
    print("=" * 70)
    print(" CleanTrack AI - Medical & Plastic Waste Dual Precision Test Suite")
    print("=" * 70)

    # 1. Test Roboflow Medical Detector
    rf = RoboflowMedicalDetector()
    rf_status = rf.status()
    print(f"Roboflow Model ID      : {rf_status.get('model_id')}")
    print(f"Roboflow Configured    : {rf_status.get('configured')}")
    print(f"Roboflow Key Present   : {rf_status.get('has_key')}")

    # 2. Test Pipeline on All Sample Waste Types
    pipeline = CleanTrackPipeline()
    test_cases = [
        {
            "name": "Single PET/HDPE Plastic Bottle",
            "file": "public/samples/sample_3_plastic_bottle.jpg",
            "expected_category": "Plastic Waste",
            "expected_stream": "BLUE",
            "min_items": 1,
            "sharps_allowed": False
        },
        {
            "name": "Clinical Syringes & Hypodermic Needle",
            "file": "public/samples/sample_syringes_and_needle.jpg",
            "expected_category": "Medical Waste",
            "expected_stream": "YELLOW/WHITE",
            "min_items": 1,
            "sharps_allowed": True
        },
        {
            "name": "Single Clinical Syringe / Ampoule",
            "file": "public/samples/sample_1_syringe.jpg",
            "expected_category": "Medical Waste",
            "expected_stream": "YELLOW/WHITE",
            "min_items": 1,
            "sharps_allowed": True
        },
        {
            "name": "Clinical Gloves & Mixed Waste",
            "file": "public/samples/sample_clinical_waste.jpg",
            "expected_category": "Medical Waste",
            "expected_stream": "YELLOW/WHITE",
            "min_items": 1,
            "sharps_allowed": False
        },
        {
            "name": "Biomedical Dump Pile",
            "file": "public/samples/biomedical.jpg",
            "expected_category": "Medical Waste",
            "expected_stream": "YELLOW/WHITE",
            "min_items": 5,
            "sharps_allowed": True
        }
    ]

    all_passed = True
    print("\nExecuting Test Cases:")
    print("-" * 70)

    for tc in test_cases:
        filepath = tc["file"]
        if not os.path.exists(filepath):
            print(f"[SKIP] File not found: {filepath}")
            continue

        res = pipeline.process_image(filepath)
        detected_category = res.get("category", "")
        detected_stream = res.get("segregationStream", "")
        total_items = res.get("totalItemsDetected", 0)
        sharps_count = res.get("sharpsCount", 0)
        priority = res.get("priority", "")
        score = res.get("severityScore", 0)

        cat_match = (detected_category == tc["expected_category"])
        stream_match = (tc["expected_stream"] in detected_stream)
        items_match = (total_items >= tc["min_items"])
        passed = cat_match and stream_match and items_match

        if not passed:
            all_passed = False

        status_str = "PASS" if passed else "FAIL"
        print(f"[{status_str}] {tc['name']}")
        print(f"       File             : {filepath}")
        print(f"       Category         : {detected_category} (Expected: {tc['expected_category']})")
        print(f"       Stream           : {detected_stream}")
        print(f"       Priority Level   : {priority} (Score: {score}/100)")
        print(f"       Items Detected   : {total_items} (Sharps: {sharps_count})")
        print(f"       Estimated Metric : {res.get('totalVolumeLiters', 0)} L / {res.get('totalWeightKg', 0)} kg")
        top_dets = res.get("detections", [])[:3]
        for d in top_dets:
            sharps_tag = " [SHARPS]" if d.get("isSharps") else ""
            print(f"         * {d.get('label')} ({d.get('confidence')}%) -> {d.get('category')}{sharps_tag}")
        print()

    print("=" * 70)
    print(f"OVERALL RESULT: {'ALL TESTS PASSED PERFECTLY!' if all_passed else 'SOME TESTS FAILED'}")
    print("=" * 70)
    return all_passed

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
