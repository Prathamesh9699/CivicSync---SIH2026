"""
CleanTrack AI - Medical Waste EfficientNet-B0 Classifier
=========================================================
Integrates the new Medical Waste Model (best_medical_classifier.pth)
trained on Medical Waste 4.0 + PBW dataset across 17 clinical classes.
Provides fine-grained classification, biohazard severity flags, and sharps tagging.
"""

import os
import sys
import json
from typing import Dict, Any, List, Optional, Union
from PIL import Image

try:
    import torch
    import torch.nn as nn
    from torchvision import transforms, models
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


MEDICAL_CLASS_METADATA = {
    "body_tissue_organ": {
        "label": "Pathological Anatomical Waste",
        "polymer": "Human/Animal Pathological Waste",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.50,
        "weight_g": 300.0,
        "severity": "Critical"
    },
    "gauze": {
        "label": "Surgical Gauze & Swab",
        "polymer": "Woven Cotton Mesh",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.15,
        "weight_g": 15.0,
        "severity": "High"
    },
    "glass_equipment_packaging": {
        "label": "Medical Glass Ampoule / Packaging",
        "polymer": "Type I Pharmaceutical Glass",
        "is_sharps": True,
        "is_specific_medical": True,
        "volume_l": 0.10,
        "weight_g": 35.0,
        "severity": "High"
    },
    "gloves": {
        "label": "Medical / Surgical Latex Glove",
        "polymer": "Latex / Nitrile Rubber",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.20,
        "weight_g": 11.0,
        "severity": "High"
    },
    "mask": {
        "label": "Medical / Surgical Face Mask",
        "polymer": "Non-Woven Polypropylene",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.12,
        "weight_g": 7.0,
        "severity": "High"
    },
    "medical_cap": {
        "label": "Disposable Medical Surgical Cap",
        "polymer": "Non-Woven Polypropylene",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.10,
        "weight_g": 6.0,
        "severity": "Medium"
    },
    "medical_glasses": {
        "label": "Medical Protective Eye Goggles",
        "polymer": "Polycarbonate Plastic",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.25,
        "weight_g": 45.0,
        "severity": "Medium"
    },
    "metal_equipment_packaging": {
        "label": "Medical Metal Equipment Packaging",
        "polymer": "Aluminium / Foil Barrier",
        "is_sharps": False,
        "is_specific_medical": False,
        "volume_l": 0.20,
        "weight_g": 25.0,
        "severity": "Medium"
    },
    "organic_waste": {
        "label": "Clinical Organic / Biological Waste",
        "polymer": "Organic Bio-Waste",
        "is_sharps": False,
        "is_specific_medical": False,
        "volume_l": 0.40,
        "weight_g": 200.0,
        "severity": "High"
    },
    "paper_equipment_packaging": {
        "label": "Pharmaceutical / Medical Paper Packaging",
        "polymer": "Medical Grade Paper / Foil",
        "is_sharps": False,
        "is_specific_medical": False,
        "volume_l": 0.20,
        "weight_g": 12.0,
        "severity": "Medium"
    },
    "plastic_equipment_packaging": {
        "label": "Sterile Medical Plastic Packaging",
        "polymer": "Sterile Medical Polymer Film",
        "is_sharps": False,
        "is_specific_medical": False,
        "volume_l": 0.25,
        "weight_g": 15.0,
        "severity": "Medium"
    },
    "shoe_cover": {
        "label": "Medical Disposable Shoe Cover",
        "polymer": "Chlorinated Polyethylene (CPE)",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.08,
        "weight_g": 8.0,
        "severity": "Medium"
    },
    "syringe": {
        "label": "Clinical Syringe (Biohazard / Sharps)",
        "polymer": "Contaminated Polypropylene / Steel",
        "is_sharps": True,
        "is_specific_medical": True,
        "volume_l": 0.08,
        "weight_g": 14.0,
        "severity": "Critical"
    },
    "syringe_needle": {
        "label": "Hypodermic Needle (Sharps Hazard)",
        "polymer": "Surgical Steel",
        "is_sharps": True,
        "is_specific_medical": True,
        "volume_l": 0.015,
        "weight_g": 3.5,
        "severity": "Critical"
    },
    "test_tube": {
        "label": "Clinical Blood / Vacutainer Test Tube",
        "polymer": "Borosilicate Glass / PET",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.06,
        "weight_g": 28.0,
        "severity": "Critical"
    },
    "tweezers": {
        "label": "Medical Dressing Tweezers / Forceps",
        "polymer": "Surgical Stainless Steel",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 0.04,
        "weight_g": 25.0,
        "severity": "Medium"
    },
    "urine_bag": {
        "label": "Medical Urine Drainage Bag",
        "polymer": "Medical PVC",
        "is_sharps": False,
        "is_specific_medical": True,
        "volume_l": 1.50,
        "weight_g": 65.0,
        "severity": "Critical"
    }
}


class MedicalWasteClassifier:
    """Production EfficientNet-B0 medical waste image classifier."""

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.classes: List[str] = []
        self.device = torch.device("cuda" if TORCH_AVAILABLE and torch.cuda.is_available() else "cpu") if TORCH_AVAILABLE else "cpu"
        self.model_path = None

        if not TORCH_AVAILABLE:
            print("[Medical Waste Classifier] PyTorch is not available.", file=sys.stderr)
            return

        if not model_path:
            candidates = [
                os.path.join(os.getcwd(), 'Medical Waste New Model', 'best_medical_classifier.pth'),
                os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'best_medical_classifier.pth'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'Medical Waste New Model', 'best_medical_classifier.pth'),
                os.path.join(os.getcwd(), 'backend', 'models', 'best_medical_classifier.pth')
            ]
            for c in candidates:
                if os.path.exists(c):
                    model_path = os.path.abspath(c)
                    break

        if not model_path or not os.path.exists(model_path):
            print("[Medical Waste Classifier] Model weights not found in candidates.", file=sys.stderr)
            return

        try:
            self.model_path = model_path
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
            self.classes = checkpoint.get("classes", [])
            num_classes = len(self.classes)

            self.model = models.efficientnet_b0(weights=None)
            self.model.classifier[1] = nn.Linear(
                self.model.classifier[1].in_features,
                num_classes
            )
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.to(self.device)
            self.model.eval()

            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            print(f"[Medical Waste Classifier] Successfully loaded EfficientNet-B0 from: {model_path} ({num_classes} classes)", file=sys.stderr)
        except Exception as e:
            print(f"[Medical Waste Classifier] Failed to initialize model: {e}", file=sys.stderr)
            self.model = None

    @property
    def is_loaded(self) -> bool:
        return self.model is not None and len(self.classes) > 0

    def classify(self, image_input: Union[str, Image.Image]) -> Dict[str, Any]:
        """
        Classifies an image using the Medical Waste 17-class model.
        Returns top prediction, confidence, whether it's verified medical waste, and sharps flag.
        """
        if not self.is_loaded:
            return {
                "success": False,
                "is_medical": False,
                "confidence": 0.0,
                "error": "Medical classifier not initialized"
            }

        try:
            if isinstance(image_input, str):
                img = Image.open(image_input).convert("RGB")
            elif isinstance(image_input, Image.Image):
                img = image_input.convert("RGB")
            else:
                return {"success": False, "is_medical": False, "error": "Invalid image input"}

            tensor = self.transform(img).unsqueeze(0).to(self.device)

            with torch.no_grad():
                output = self.model(tensor)
                probs = torch.softmax(output, dim=1)[0]

            top_values, top_indices = torch.topk(probs, min(5, len(self.classes)))

            all_predictions = []
            for val, idx in zip(top_values, top_indices):
                cls_raw = self.classes[idx.item()]
                c_conf = round(float(val.item()) * 100.0, 1)
                c_meta = MEDICAL_CLASS_METADATA.get(cls_raw, {
                    "label": cls_raw.replace('_', ' ').title(),
                    "polymer": "Clinical Material",
                    "is_sharps": False,
                    "is_specific_medical": False,
                    "volume_l": 0.25,
                    "weight_g": 25.0,
                    "severity": "Medium"
                })
                all_predictions.append({
                    "class": cls_raw,
                    "label": c_meta["label"],
                    "confidence": c_conf,
                    "is_sharps": c_meta.get("is_sharps", False),
                    "is_specific_medical": c_meta.get("is_specific_medical", False),
                    "severity": c_meta.get("severity", "Medium"),
                    "volume_l": c_meta.get("volume_l", 0.25),
                    "weight_g": c_meta.get("weight_g", 25.0)
                })

            top = all_predictions[0]
            top_raw = top["class"]
            top_conf = top["confidence"]
            top_meta = MEDICAL_CLASS_METADATA.get(top_raw, {})
            is_specific = top_meta.get("is_specific_medical", False)

            # Precise Sharps Hazard Detection:
            # Sharps hazard requires actual syringes or hypodermic needles with confidence >= 35%
            has_sharps = any(
                (p["class"] in ["syringe", "syringe_needle"] and p["confidence"] >= 35.0) or
                (p["class"] == "glass_equipment_packaging" and p["confidence"] >= 65.0)
                for p in all_predictions[:2]
            )

            # Direct clinical items (excluding ambiguous outdoor organic textures or metallic scrap)
            direct_clinical_classes = {
                "syringe", "syringe_needle", "test_tube", "gauze", "gloves", "mask", "urine_bag",
                "shoe_cover", "medical_cap", "medical_glasses"
            }
            direct_clinical_conf_sum = sum(p["confidence"] for p in all_predictions[:3] if p["class"] in direct_clinical_classes)

            # Medical Verification Criteria:
            # - Presence of confirmed sharps (needles / syringes >= 35%), OR
            # - Direct specific clinical item (gloves, mask, tube, etc.) with >= 55% confidence, OR
            # - Cumulative direct clinical confidence >= 60%, OR
            # - General medical packaging only if confidence is very high (>= 80%)
            is_medical = (
                has_sharps or
                (is_specific and top_conf >= 55.0 and top_raw not in ["body_tissue_organ", "tweezers", "glass_equipment_packaging"]) or
                (top_raw == "body_tissue_organ" and top_conf >= 75.0) or
                (top_raw in ["tweezers", "glass_equipment_packaging"] and top_conf >= 65.0) or
                direct_clinical_conf_sum >= 60.0 or
                (not is_specific and top_conf >= 80.0)
            )

            effective_severity = "Critical" if has_sharps else top["severity"]

            return {
                "success": True,
                "is_medical": is_medical,
                "is_specific_medical": is_specific,
                "top_class": top_raw,
                "top_label": top["label"],
                "confidence": top_conf,
                "is_sharps": has_sharps,
                "severity": effective_severity,
                "volume_l": top["volume_l"],
                "weight_g": top["weight_g"],
                "all_predictions": all_predictions,
                "model": "CleanTrack EfficientNet-B0 Medical Classifier (17 classes)"
            }
        except Exception as e:
            return {
                "success": False,
                "is_medical": False,
                "confidence": 0.0,
                "error": str(e)
            }
