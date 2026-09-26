"""
CleanTrack AI - Stage 1 Fast Scene Gatekeeper
Identifies whether citizen-uploaded images contain civic/municipal waste
or are clean/indoor/personal scenes (bedroom, selfie, desk, clean road).

Execution Target: < 50ms
Decisions:
  - NO_WASTE (P < 0.25): Early exit. Rejects false alarms immediately.
  - UNCERTAIN (0.25 <= P < 0.65): Forward to Stage 2 with manual_triage_flag = True.
  - WASTE (P >= 0.65): Forward to Stage 2 multi-object detector.
"""

import os
import sys
import time
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageStat
import numpy as np

try:
    import torch
    import torch.nn as nn
    import torchvision.transforms as transforms
    import torchvision.models as models
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class MobileNetV3WasteGatekeeper(nn.Module):
    """MobileNetV3-Small binary classifier for scene-level waste vs clean classification."""
    def __init__(self, pretrained: bool = False):
        super().__init__()
        if TORCH_AVAILABLE:
            base = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None)
            self.features = base.features
            self.avgpool = base.avgpool
            in_features = base.classifier[0].in_features
            self.classifier = nn.Sequential(
                nn.Linear(in_features, 256),
                nn.Hardswish(),
                nn.Dropout(p=0.2),
                nn.Linear(256, 2)  # [0 = NO_WASTE, 1 = WASTE]
            )
        else:
            self.classifier = None

    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x


class Stage1Gatekeeper:
    """
    Production-grade Stage 1 Fast Scene Gatekeeper.
    Combines:
      1. Fine-tuned MobileNetV3-Small if checkpoint exists.
      2. High-speed general object & scene context analysis (detects person, bed, couch, chair, desk, electronics).
      3. Surface texture / homogeneity analysis (clean walls, bedsheets, uniform flooring vs textured litter clutter).
    """

    def __init__(self, weights_path: Optional[str] = None, general_yolo_path: Optional[str] = None):
        self.device = 'cuda' if TORCH_AVAILABLE and torch.cuda.is_available() else 'cpu'
        self.mobilenet_model = None
        self.yolo_scene_model = None
        self.transform = None

        # 1. Load MobileNetV3 if weights provided
        if TORCH_AVAILABLE:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            if weights_path and os.path.exists(weights_path):
                try:
                    self.mobilenet_model = MobileNetV3WasteGatekeeper(pretrained=False)
                    state = torch.load(weights_path, map_location=self.device)
                    self.mobilenet_model.load_state_dict(state)
                    self.mobilenet_model.to(self.device).eval()
                except Exception as e:
                    print(f"[Stage 1 Gatekeeper] Failed to load MobileNetV3 weights: {e}", file=sys.stderr)

        # 2. Locate YOLO general model for context verification
        if YOLO_AVAILABLE:
            if not general_yolo_path:
                candidates = [
                    os.path.join(os.getcwd(), 'yolov8n.pt'),
                    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'yolov8n.pt'),
                    os.path.join(os.path.dirname(os.path.dirname(__file__)), 'yolov8n.pt'),
                    os.path.join(os.path.dirname(__file__), 'yolov8n.pt'),
                    'c:/Users/hadol/OneDrive/Desktop/SIH_website/yolov8n.pt'
                ]
                for c in candidates:
                    if os.path.exists(c):
                        general_yolo_path = os.path.abspath(c)
                        break

            if general_yolo_path and os.path.exists(general_yolo_path):
                try:
                    self.yolo_scene_model = YOLO(general_yolo_path)
                except Exception as ye:
                    print(f"[Stage 1 Gatekeeper] Failed to load YOLO general model: {ye}", file=sys.stderr)

    def evaluate(self, image: Image.Image) -> Dict[str, Any]:
        """
        Evaluates an input PIL image and returns decision band, waste probability, and reasoning.
        """
        start_time = time.time()
        img_rgb = image.convert('RGB')
        img_w, img_h = img_rgb.size
        total_area = max(1, img_w * img_h)

        scene_tags = []
        indoor_elements = []
        waste_prob = 0.50  # baseline prior
        reason = "Standard scene evaluation"

        # Check 1: Fine-tuned MobileNetV3 prediction if available
        if self.mobilenet_model and self.transform:
            try:
                t_img = self.transform(img_rgb).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    logits = self.mobilenet_model(t_img)
                    probs = torch.softmax(logits, dim=-1)[0]
                    mobilenet_waste_prob = float(probs[1].item())
                    waste_prob = mobilenet_waste_prob
            except Exception as me:
                print(f"[Stage 1 Gatekeeper] MobileNet evaluation error: {me}", file=sys.stderr)

        # Check 2: Context Scene Analysis via YOLO General Model
        is_personal_indoor = False
        dominant_person = False
        has_indoor_furniture = False
        indoor_area_pct = 0.0

        if self.yolo_scene_model:
            try:
                res = self.yolo_scene_model(img_rgb, conf=0.35, verbose=False)[0]
                person_count = 0
                furniture_found = []

                for b in res.boxes:
                    cls_name = self.yolo_scene_model.names[int(b.cls[0])]
                    conf = float(b.conf[0])
                    xyxy = [float(x) for x in b.xyxy[0].tolist()]
                    box_area = (xyxy[2] - xyxy[0]) * (xyxy[3] - xyxy[1])
                    area_pct = (box_area / float(total_area)) * 100.0

                    if cls_name == 'person':
                        person_count += 1
                        if area_pct >= 8.0:
                            dominant_person = True
                            scene_tags.append("person")
                    elif cls_name in ['bench', 'chair', 'bed', 'couch', 'sofa', 'dining table']:
                        furniture_found.append(cls_name)
                        indoor_area_pct += area_pct
                        scene_tags.append(cls_name)
                    elif cls_name in ['tv', 'laptop', 'cell phone', 'keyboard', 'mouse']:
                        scene_tags.append(f"electronic_{cls_name}")

                if dominant_person or (len(furniture_found) >= 1 and indoor_area_pct >= 6.0):
                    is_personal_indoor = True
                    has_indoor_furniture = len(furniture_found) > 0
                    indoor_elements = list(set(furniture_found + (["person"] if dominant_person else [])))

            except Exception as ye:
                print(f"[Stage 1 Gatekeeper] Scene YOLO error: {ye}", file=sys.stderr)

        # Check 3: Surface Homogeneity / Clean Wall & Sheet Texture Check
        try:
            stat = ImageStat.Stat(img_rgb)
            var = stat.var
            mean_var = sum(var) / len(var)
            if mean_var < 150.0 and is_personal_indoor:
                scene_tags.append("smooth_uniform_surface")
        except Exception:
            pass

        # Compute Final Waste Probability Adjustment
        if is_personal_indoor:
            waste_prob = min(waste_prob, 0.12)
            if 'bench' in indoor_elements:
                reason = "Clean civic park / public infrastructure detected (bench). No visible waste accumulation."
            else:
                reason = f"Indoor/personal context detected ({', '.join(indoor_elements)}). Suppressed false-alarm noise."
        elif "smooth_uniform_surface" in scene_tags:
            waste_prob = min(waste_prob, 0.20)
            reason = "Clean, uniform surface with no visible litter clutter."
        else:
            if not self.mobilenet_model:
                waste_prob = 0.70
                reason = "Outdoor or general environment; passing to Stage 2 multi-object detector."

        # Decision Band Mapping
        if waste_prob < 0.25:
            decision = "NO_WASTE"
            should_exit_early = True
            manual_triage_flag = False
        elif waste_prob < 0.65:
            decision = "UNCERTAIN"
            should_exit_early = False
            manual_triage_flag = True
            reason += " [Uncertain confidence: Flagged for manual verification]"
        else:
            decision = "WASTE"
            should_exit_early = False
            manual_triage_flag = False

        duration_ms = round((time.time() - start_time) * 1000.0, 2)

        return {
            "decision": decision,
            "waste_probability": round(waste_prob, 3),
            "should_exit_early": should_exit_early,
            "manual_triage_flag": manual_triage_flag,
            "reason": reason,
            "is_personal_indoor": is_personal_indoor,
            "indoor_elements": indoor_elements,
            "scene_tags": list(set(scene_tags)),
            "latency_ms": duration_ms
        }
