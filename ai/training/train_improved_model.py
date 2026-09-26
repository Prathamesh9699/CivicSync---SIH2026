"""
CleanTrack AI - Improved Plastic Model Fine-Tuning Pipeline
Implements conservative fine-tuning of YOLO11 on the unified multi-source dataset (TACO + TrashNet negatives).
"""

import os
import sys
import time
import json
import torch
from ultralytics import YOLO

def main():
    print("=========================================================")
    print("  CleanTrack AI: Plastic Detection Fine-Tuning Pipeline  ")
    print("=========================================================")
    
    data_yaml = os.path.abspath("datasets/unified_plastic_dataset/dataset.yaml")
    base_weights = os.path.abspath("best.pt")
    output_dir = os.path.abspath("models/improved_plastic_model")
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Base Weights: {base_weights}")
    print(f"Dataset YAML: {data_yaml}")
    print(f"Target Dir  : {output_dir}")
    print(f"Device      : CPU (Auto-calibrated batch=16, imgsz=512, workers=4)")
    
    # Load base model
    model = YOLO(base_weights)
    
    t0 = time.time()
    results = model.train(
        data=data_yaml,
        epochs=6,
        imgsz=512,
        batch=16,
        device='cpu',
        workers=4,
        optimizer='AdamW',
        lr0=0.003,
        lrf=0.01,
        weight_decay=0.0005,
        warmup_epochs=1,
        mosaic=0.5,
        mixup=0.1,
        fliplr=0.5,
        scale=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        project='models/training_runs',
        name='improved_plastic_model_v1',
        exist_ok=True,
        save=True,
        val=True,
        plots=True,
        verbose=True
    )
    
    dt = time.time() - t0
    print(f"\n[SUCCESS] Training completed in {dt/60:.2f} minutes ({dt:.1f}s)")
    
    # Locate best trained weights
    trained_best = os.path.join('models/training_runs/improved_plastic_model_v1/weights/best.pt')
    if not os.path.exists(trained_best):
        trained_best = os.path.join('models/training_runs/improved_plastic_model_v1/weights/last.pt')
        
    final_dest = os.path.join(output_dir, 'improved_plastic_best.pt')
    import shutil
    shutil.copy2(trained_best, final_dest)
    print(f"Saved final improved model weights to: {final_dest}")
    
    # Save training configuration
    train_config = {
        'base_model': 'best.pt (YOLO11n)',
        'architecture': 'YOLO11n',
        'epochs': 6,
        'batch_size': 16,
        'image_size': 512,
        'optimizer': 'AdamW',
        'lr0': 0.003,
        'lrf': 0.01,
        'weight_decay': 0.0005,
        'mosaic': 0.5,
        'mixup': 0.1,
        'training_duration_sec': dt,
        'device': 'cpu',
        'dataset': 'unified_plastic_dataset (1700 images, TACO + TrashNet Negatives)',
        'classes': model.names
    }
    with open(os.path.join(output_dir, 'training_config.json'), 'w', encoding='utf-8') as f:
        json.dump(train_config, f, indent=2)
    print(f"Saved training configuration to: {os.path.join(output_dir, 'training_config.json')}")

if __name__ == "__main__":
    main()
