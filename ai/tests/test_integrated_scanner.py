import os
import sys
import glob
import time
import json
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

try:
    import torch
    from torchvision import transforms, models
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

BASE_SCANNER_DIR = os.path.abspath("Medical waste detection/CleanTrack_Image_Scanner")
INPUT_DIR = os.path.join(BASE_SCANNER_DIR, "1_DROP_IMAGES_HERE")
OUTPUT_DIR = os.path.join(BASE_SCANNER_DIR, "2_VIEW_RESULTS_HERE")

def compute_iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if inter <= 0:
        return 0.0
    a1 = max(1e-5, (box1[2] - box1[0]) * (box1[3] - box1[1]))
    a2 = max(1e-5, (box2[2] - box2[0]) * (box2[3] - box2[1]))
    return inter / float(a1 + a2 - inter)

class FastMedicalClassifier:
    def __init__(self, weights_path):
        self.model = None
        self.classes = []
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if not TORCH_AVAILABLE or not os.path.exists(weights_path):
            return
        try:
            checkpoint = torch.load(weights_path, map_location=self.device, weights_only=False)
            self.classes = checkpoint["classes"]
            self.model = models.efficientnet_b0(weights=None)
            self.model.classifier[1] = torch.nn.Linear(self.model.classifier[1].in_features, len(self.classes))
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.to(self.device)
            self.model.eval()
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            print(f"Loaded FastMedicalClassifier with {len(self.classes)} classes.")
        except Exception as e:
            print(f"Failed to load classifier: {e}")

    def predict(self, pil_img):
        if not self.model:
            return None
        try:
            tensor = self.transform(pil_img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                out = self.model(tensor)
                probs = torch.softmax(out, dim=1)[0]
            top_prob, top_idx = torch.topk(probs, 1)
            cname = self.classes[top_idx.item()]
            conf = float(top_prob.item())
            return {"class": cname, "confidence": conf}
        except Exception as e:
            return None

def test():
    m_bio_path = os.path.join(BASE_SCANNER_DIR, "models", "best.pt")
    m_clf_path = os.path.join(BASE_SCANNER_DIR, "models", "best_medical_classifier.pth")
    m_ew_path = os.path.join(BASE_SCANNER_DIR, "models", "CleanTrack_ewaste_best.pt")
    m_pl_path = os.path.join(BASE_SCANNER_DIR, "models", "plastic_best.pt")

    m_bio = YOLO(m_bio_path)
    clf = FastMedicalClassifier(m_clf_path)
    m_ew = YOLO(m_ew_path)
    m_pl = YOLO(m_pl_path)

    images = glob.glob(os.path.join(INPUT_DIR, "*.*"))
    for img_path in sorted(images):
        if not (img_path.endswith('.jpg') or img_path.endswith('.webp') or img_path.endswith('.png')):
            continue
        print(f"\n=======================================================")
        print(f"TESTING: {os.path.basename(img_path)}")
        pil_img = Image.open(img_path).convert('RGB')
        img_w, img_h = pil_img.size

        # 1. Biomedical YOLO
        b_res = m_bio(pil_img, conf=0.15, verbose=False)[0]
        bio_boxes = []
        for box in b_res.boxes:
            cid = int(box.cls[0])
            cname = m_bio.names[cid]
            conf = float(box.conf[0])
            xyxy = [int(x) for x in box.xyxy[0].tolist()]
            bio_boxes.append((cname, conf, xyxy))
        print("  Biomedical YOLO:", bio_boxes)

        # 2. Medical Classifier
        clf_res = clf.predict(pil_img)
        print("  Medical Classifier Global:", clf_res)

        # 3. EWaste YOLO
        e_res = m_ew(pil_img, conf=0.35, verbose=False)[0]
        ew_boxes = []
        for box in e_res.boxes:
            cid = int(box.cls[0])
            cname = m_ew.names[cid]
            conf = float(box.conf[0])
            xyxy = [int(x) for x in box.xyxy[0].tolist()]
            ew_boxes.append((cname, conf, xyxy))
        print("  EWaste YOLO:", ew_boxes)

        # 4. Plastic YOLO
        p_res = m_pl(pil_img, conf=0.25, verbose=False)[0]
        pl_boxes = []
        for box in p_res.boxes:
            cid = int(box.cls[0])
            cname = m_pl.names[cid]
            conf = float(box.conf[0])
            xyxy = [int(x) for x in box.xyxy[0].tolist()]
            pl_boxes.append((cname, conf, xyxy))
        print(f"  Plastic YOLO count: {len(pl_boxes)}")

if __name__ == "__main__":
    test()
