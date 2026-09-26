import os, sys
sys.path.insert(0, os.getcwd())
from PIL import Image
from backend.ai_engine.pipeline import CleanTrackPipeline

pipe = CleanTrackPipeline()
images = [
    'public/samples/sample_clinical_waste.jpg',
    'public/samples/sample_syringes_and_needle.jpg',
    'Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_1_syringe.jpg',
    'public/samples/sample_ewaste.jpg',
    'Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_3_plastic_bottle.jpg',
    'scratch/park_bench_only.jpg'
]

for img_p in images:
    if not os.path.exists(img_p):
        print(f"Skipping {img_p}")
        continue
    res = pipe.process_image(img_p)
    print('IMAGE:', img_p)
    print('  Category:', res.get('category'))
    print('  Total Coverage:', res.get('totalCoveragePercent'))
    print('  Plastic Coverage:', res.get('plasticCoveragePercent'))
    print('  Medical Coverage:', res.get('medicalCoveragePercent'))
    print('  EWaste Coverage:', res.get('ewasteCoveragePercent'))
    print('  Counts - Plastic:', res.get('plasticDetectionsCount'), 'Medical:', res.get('biomedicalDetectionsCount'), 'EWaste:', res.get('ewasteDetectionsCount'))
    print('  Priority:', res.get('priority'), 'Severity Score:', res.get('severityScore'))
    for d in res.get('detections', []):
        print('    -', d.get('classId'), d.get('label'), f"{d.get('confidence')}%", f"Source: {d.get('source', 'Model')}")
    print('-'*50)
