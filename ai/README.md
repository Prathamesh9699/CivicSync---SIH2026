# CleanTrack AI Vision Engine 🤖🌿

Hierarchical Multi-Stage Computer Vision & Inference Pipeline for Smart Civic Waste Management.

---

## 🌟 Overview

The CleanTrack AI Engine utilizes a multi-model hierarchical pipeline combining **YOLOv8**, specialized biohazard classifiers, and environmental context heuristic analyzers. It provides real-time detection, pinpointed physical volume/weight calculation, CPCB severity scoring, and biodegradability stream composition breakdown.

---

## 🏗️ 5-Stage Vision Architecture

```
[ Input Civic / Surveillance Photo ]
                │
                ▼
┌───────────────────────────────────────────────┐
│ Stage 1: Fast Scene Gatekeeper               │
│ - Indoor non-waste suppression                │
│ - Personal privacy protection                 │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ Stage 2: Multi-Stream YOLO Detection Engine  │
│ - Plastic & Dry Recyclables (YOLOv8)          │
│ - Biomedical & Sharps Biohazards (WHO/CPCB)   │
│ - Electronic Waste (RoHS/EPR)                 │
│ - Degradable vs. Biodegradable Stream         │
│ - Non-overlapping Soft-NMS bounding box union │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ Stage 3: Condition & Environmental Context    │
│ - Spatial dispersion index                    │
│ - Drain / storm gutter blockage risk          │
│ - Roadway obstruction & fire hazard           │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ Stage 4: Dynamic Severity & Priority Scoring │
│ - CPCB matrix alignment                       │
│ - Material toxicity + visual extent + location│
│ - Dynamic SLA deadline calculation (12h-48h)  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ Stage 5: Municipal Action & Safety Dispatch   │
│ - Squad assignment & required equipment       │
│ - Mandatory PPE level (A/B/C)                 │
│ - Circular economy disposal stream routing    │
└───────────────────────────────────────────────┘
```

---

## 📂 Directory Layout

```
ai/
├── models/                     # Trained YOLO & classifier weights (.pt, .pth)
│   ├── best.pt                 # Plastic & general dry waste detector
│   ├── biomedical_best.pt      # Clinical sharps & biohazard detector
│   ├── ewaste_best.pt          # Electronic waste detector
│   ├── degradable_best.pt      # Degradable vs Biodegradable YOLO model
│   ├── best_medical_classifier.pth
│   └── yolov8n.pt              # Base nano checkpoint
├── pipelines/                  # Production inference pipeline
│   ├── predict.py              # CLI & stdin inference entrypoint
│   ├── pipeline.py             # 5-stage hierarchical orchestrator
│   ├── stage1_gatekeeper.py    # Scene context filter
│   ├── stage2_detector.py      # Multi-object detection
│   ├── condition_analyzer.py   # Environmental risk analyzer
│   ├── severity_engine.py      # Severity scoring
│   ├── municipal_action.py     # Sanitation squad recommendations
│   └── medical_classifier.py   # Specialized medical classifier
├── training/                   # Model training and fine-tuning scripts
│   ├── train_improved_model.py
│   ├── evaluate_model.py
│   ├── prepare_unified_dataset.py
│   └── error_analysis.py
└── requirements.txt            # Python dependencies
```

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
cd ai
pip install -r requirements.txt
```

### 2. Run Inference via CLI
```bash
python pipelines/predict.py --image path/to/waste_photo.jpg
```
Or stream an image URL / Base64 payload via stdin:
```bash
echo "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5" | python pipelines/predict.py
```
