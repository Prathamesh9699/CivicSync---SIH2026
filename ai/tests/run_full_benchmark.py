import os
import sys
import glob

sys.path.insert(0, os.getcwd())
from backend.ai_engine.pipeline import CleanTrackPipeline

pipeline = CleanTrackPipeline()
samples = sorted(glob.glob('public/samples/*.*')) + ['scratch/user_test_case.jpg']

print(f"{'File':<32} | {'Category':<16} | {'Severity':<10} | {'Score':<5} | {'Sharps':<6} | {'Acc':<6} | {'Detections'}")
print("-" * 115)

for s in samples:
    try:
        r = pipeline.process_image(s)
        fn = os.path.basename(s)
        cat = r.get('category', 'None')
        sev = r.get('severity', 'None')
        sc = r.get('severityScore', 0)
        sh = r.get('sharpsCount', 0)
        acc = r.get('confidence', 0.0)
        dets = [f"{d['label']} ({d['confidence']:.1f}%)" for d in r.get('detections', [])[:2]]
        print(f"{fn:<32} | {cat:<16} | {sev:<10} | {sc:<5} | {sh:<6} | {acc:.1f}% | {', '.join(dets)}")
    except Exception as e:
        print(f"{os.path.basename(s):<32} | ERROR: {e}")
