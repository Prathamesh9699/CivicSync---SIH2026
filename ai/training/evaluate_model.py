"""
Evaluation Script for Plastic Detection Model (YOLO11)
Runs validation on the held-out test set and extracts:
- Precision
- Recall
- mAP@50
- mAP@50-95
- F1 Score
- Per-class metrics
- Confusion matrix data
"""

import os
import sys
import json
import argparse
from ultralytics import YOLO

def evaluate(model_path: str, data_yaml: str, split: str = 'test', imgsz: int = 640):
    print(f"==================================================")
    print(f"Evaluating Model: {model_path}")
    print(f"Dataset Config  : {data_yaml}")
    print(f"Split           : {split} | Image Size: {imgsz}")
    print(f"==================================================")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model path not found: {model_path}")
        
    model = YOLO(model_path)
    
    # Run evaluation on CPU
    metrics = model.val(
        data=data_yaml,
        split=split,
        imgsz=imgsz,
        batch=4,
        device='cpu',
        plots=True,
        verbose=True
    )
    
    # Extract precision, recall, map50, map50-95
    p = float(metrics.box.mp)
    r = float(metrics.box.mr)
    map50 = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)
    f1 = 2 * (p * r) / (p + r) if (p + r) > 0 else 0.0
    
    # Per class metrics
    per_class = {}
    class_names = model.names
    for idx, name in class_names.items():
        if idx < len(metrics.box.p):
            cp = float(metrics.box.p[idx])
            cr = float(metrics.box.r[idx])
            cmap50 = float(metrics.box.ap50[idx])
            cmap = float(metrics.box.ap[idx])
            cf1 = 2 * (cp * cr) / (cp + cr) if (cp + cr) > 0 else 0.0
            per_class[name] = {
                'precision': cp,
                'recall': cr,
                'map50': cmap50,
                'map50_95': cmap,
                'f1': cf1
            }
            
    summary = {
        'model': model_path,
        'split': split,
        'precision': p,
        'recall': r,
        'map50': map50,
        'map50_95': map50_95,
        'f1': f1,
        'per_class': per_class
    }
    
    print("\n---------------- EVALUATION SUMMARY ----------------")
    print(f"Precision : {p:.4f} ({p*100:.2f}%)")
    print(f"Recall    : {r:.4f} ({r*100:.2f}%)")
    print(f"mAP@50    : {map50:.4f} ({map50*100:.2f}%)")
    print(f"mAP@50-95 : {map50_95:.4f} ({map50_95*100:.2f}%)")
    print(f"F1 Score  : {f1:.4f} ({f1*100:.2f}%)")
    print("----------------------------------------------------\n")
    
    return summary

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Path to .pt weights")
    parser.add_argument("--data", default="datasets/unified_plastic_dataset/dataset.yaml", help="Path to dataset.yaml")
    parser.add_argument("--split", default="test", help="Split to evaluate: test or val")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--output", default=None, help="Path to save output JSON")
    args = parser.parse_args()
    
    res = evaluate(args.model, args.data, args.split, args.imgsz)
    if args.output:
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(res, f, indent=2)
        print(f"Saved evaluation metrics to: {args.output}")
