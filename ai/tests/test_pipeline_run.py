import os, sys
sys.path.insert(0, os.getcwd())
import glob
from backend.ai_engine.pipeline import CleanTrackPipeline

pipeline = CleanTrackPipeline()
for p in sorted(glob.glob('Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/*.*')):
    if not (p.endswith('.jpg') or p.endswith('.webp') or p.endswith('.png')):
        continue
    res = pipeline.process_image(p)
    print(f'=== {p} ===')
    cat = res.get('category')
    stream = res.get('segregationStream')
    print(f'  Category: {cat} | Stream: {stream}')
    dets = res.get('detections', [])
    print(f'  Detections ({len(dets)}):')
    for d in dets:
        print(f"    - {d.get('label')} ({d.get('category')}, conf={d.get('confidence')}%, classId={d.get('classId')})")
