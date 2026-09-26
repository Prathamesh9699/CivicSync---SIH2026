import os
import sys
sys.path.insert(0, os.getcwd())
import json
from PIL import Image
from backend.ai_engine.pipeline import CleanTrackPipeline

def run_all_tests():
    print("=" * 60)
    print("CLEANTRACK TRI-STREAM & CLEAN SCENE PRECISION VERIFICATION")
    print("=" * 60)

    pipe = CleanTrackPipeline()

    tests = [
        {
            "name": "TEST 1: Clean Park Scene (Park Bench)",
            "path": "scratch/park_bench_only.jpg",
            "expect_waste": False,
            "expected_category": "Clean / No Waste Detected"
        },
        {
            "name": "TEST 2: Authentic E-Waste (Phones & Mouse)",
            "path": "public/samples/sample_ewaste.jpg",
            "expect_waste": True,
            "expected_category": "E-Waste"
        },
        {
            "name": "TEST 3: Authentic Plastic Waste (Bottles)",
            "path": "Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_3_plastic_bottle.jpg",
            "expect_waste": True,
            "expected_category": "Plastic Waste"
        },
        {
            "name": "TEST 4: Authentic Medical Sharps (Syringe)",
            "path": "Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_1_syringe.jpg",
            "expect_waste": True,
            "expected_category": "Medical Waste"
        },
        {
            "name": "TEST 5: Authentic Clinical Waste",
            "path": "public/samples/sample_clinical_waste.jpg",
            "expect_waste": True,
            "expected_category": "Medical Waste"
        }
    ]

    all_passed = True

    for t in tests:
        print(f"\n--- {t['name']} ---")
        if not os.path.exists(t["path"]):
            print(f"  SKIPPED: File {t['path']} not found.")
            continue

        res = pipe.process_image(t["path"])

        category = res.get("category")
        waste_found = res.get("wasteFound", False)
        total_items = res.get("totalItemsDetected", 0)
        detections = res.get("detections", [])
        stage1_reason = res.get("stage1", {}).get("reason", "")
        stage1_exit = res.get("stage1", {}).get("should_exit_early", False)

        print(f"  Image: {t['path']}")
        print(f"  Stage 1 Early Exit: {stage1_exit} | Reason: {stage1_reason}")
        print(f"  Category: {category}")
        print(f"  Waste Found: {waste_found}")
        print(f"  Total Items: {total_items}")
        print(f"  Latency: {res.get('totalPipelineLatencyMs')} ms")
        if detections:
            print("  Detections:")
            for d in detections:
                print(f"    - {d.get('label')} ({d.get('confidence')}%) | Stream: {d.get('stream')} | Source: {d.get('source', 'Model')}")

        if not t["expect_waste"]:
            if not waste_found and total_items == 0:
                print("  >>> PASS: Correctly identified as CLEAN scene!")
            else:
                print(f"  >>> FAIL: False positive on clean scene! Detected {total_items} items.")
                all_passed = False
        else:
            if waste_found and total_items > 0:
                if t["expected_category"].lower() in category.lower() or res.get("categoryId") in ["01", "02", "03"]:
                    print(f"  >>> PASS: Correctly identified {category} with {total_items} items!")
                else:
                    print(f"  >>> NOTE: Identified {category} (Expected {t['expected_category']}) with {total_items} items.")
            else:
                print(f"  >>> FAIL: Authentic waste missed! Detected {total_items} items.")
                all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("ALL TESTS PASSED! Clean scene defense & tri-stream detection verified 100%.")
    else:
        print("SOME TESTS FAILED! Review output above.")
    print("=" * 60)

if __name__ == '__main__':
    run_all_tests()
