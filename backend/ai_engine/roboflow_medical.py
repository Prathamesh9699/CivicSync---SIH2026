"""
CleanTrack AI - Roboflow Medical Waste Segmentation Inference Client
=====================================================================
Connects to Roboflow Inference API for fine-grained medical waste instance segmentation.
Model: sih-pzryl/medbin_dataset-pr2o1-1-yolo26n-seg-t1
API Key: rf_sg7J8vYlWPb37GwXm5O0XytyKMt2

Features:
  - Supports Roboflow cloud segmentation outline endpoint (https://outline.roboflow.com/)
  - Supports self-hosted / local Docker inference container (http://localhost:9001/)
  - Extracts segmentation polygon masks, bounding boxes, class labels, and confidence scores
  - Maps detected instances to CleanTrack master taxonomy (Class 8: Biomedical/Sanitary, Class 1: Plastic)
  - Identifies clinical sharps hazard (syringes, needles, glass ampoules, blades)
  - Computes physical unit metrics (Volume in Liters, Weight in Grams)
  - Zero-downtime graceful fallback: if serverless inference returns 401 or times out,
    safely logs diagnostic status and allows local 17-class EfficientNet-B0 + YOLO models to take over.
"""

import os
import sys
import io
import json
import time
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Union
from PIL import Image


# CPCB & WHO Medical Waste Physical Calibration Dictionary
ROBOFLOW_MEDICAL_TAXONOMY_MAP = {
    # Sharps Hazards
    'syringe': {
        'class_id': 8,
        'label': 'Clinical Syringe (Biohazard / Sharps)',
        'polymer': 'Polypropylene / Surgical Steel',
        'is_sharps': True,
        'volume_l': 0.08,
        'weight_g': 14.0,
        'severity': 'Critical'
    },
    'needle': {
        'class_id': 8,
        'label': 'Hypodermic Needle (Sharps Hazard)',
        'polymer': 'Surgical Steel',
        'is_sharps': True,
        'volume_l': 0.015,
        'weight_g': 3.5,
        'severity': 'Critical'
    },
    'syringe_needle': {
        'class_id': 8,
        'label': 'Hypodermic Needle (Sharps Hazard)',
        'polymer': 'Surgical Steel',
        'is_sharps': True,
        'volume_l': 0.015,
        'weight_g': 3.5,
        'severity': 'Critical'
    },
    'needle_cap': {
        'class_id': 8,
        'label': 'Needle Protective Cap',
        'polymer': 'Rigid Polypropylene',
        'is_sharps': True,
        'volume_l': 0.02,
        'weight_g': 3.0,
        'severity': 'High'
    },
    'vial': {
        'class_id': 8,
        'label': 'Medicine Glass Ampoule / Vial',
        'polymer': 'Type I Pharmaceutical Glass',
        'is_sharps': True,
        'volume_l': 0.08,
        'weight_g': 40.0,
        'severity': 'High'
    },
    'ampoule': {
        'class_id': 8,
        'label': 'Medical Glass Ampoule',
        'polymer': 'Type I Pharmaceutical Glass',
        'is_sharps': True,
        'volume_l': 0.05,
        'weight_g': 25.0,
        'severity': 'High'
    },
    'tweezers': {
        'class_id': 8,
        'label': 'Medical Forceps / Tweezers',
        'polymer': 'Stainless Steel',
        'is_sharps': True,
        'volume_l': 0.04,
        'weight_g': 25.0,
        'severity': 'High'
    },

    # Non-Sharps Clinical & Sanitary Items
    'gloves': {
        'class_id': 8,
        'label': 'Latex / Nitrile Medical Glove',
        'polymer': 'Nitrile / Latex Rubber',
        'is_sharps': False,
        'volume_l': 0.20,
        'weight_g': 11.0,
        'severity': 'High'
    },
    'glove': {
        'class_id': 8,
        'label': 'Latex / Nitrile Medical Glove',
        'polymer': 'Nitrile / Latex Rubber',
        'is_sharps': False,
        'volume_l': 0.20,
        'weight_g': 11.0,
        'severity': 'High'
    },
    'mask': {
        'class_id': 8,
        'label': 'Medical / Surgical Face Mask',
        'polymer': 'Non-Woven Polypropylene',
        'is_sharps': False,
        'volume_l': 0.12,
        'weight_g': 7.0,
        'severity': 'High'
    },
    'face_mask': {
        'class_id': 8,
        'label': 'Medical / Surgical Face Mask',
        'polymer': 'Non-Woven Polypropylene',
        'is_sharps': False,
        'volume_l': 0.12,
        'weight_g': 7.0,
        'severity': 'High'
    },
    'gauze': {
        'class_id': 8,
        'label': 'Surgical Gauze & Swab',
        'polymer': 'Woven Cotton Mesh',
        'is_sharps': False,
        'volume_l': 0.15,
        'weight_g': 15.0,
        'severity': 'High'
    },
    'bandage': {
        'class_id': 8,
        'label': 'Medical Bandage Roll',
        'polymer': 'Cotton / Viscose Gauze',
        'is_sharps': False,
        'volume_l': 0.25,
        'weight_g': 25.0,
        'severity': 'High'
    },
    'test_tube': {
        'class_id': 8,
        'label': 'Clinical Blood Vacutainer / Test Tube',
        'polymer': 'Borosilicate Glass / PET',
        'is_sharps': False,
        'volume_l': 0.06,
        'weight_g': 28.0,
        'severity': 'Critical'
    },
    'urine_bag': {
        'class_id': 8,
        'label': 'Medical Urine Drainage Bag',
        'polymer': 'Medical Grade PVC',
        'is_sharps': False,
        'volume_l': 1.50,
        'weight_g': 65.0,
        'severity': 'Critical'
    },
    'iv_tube': {
        'class_id': 8,
        'label': 'IV Infusion Tubing Set',
        'polymer': 'Medical Grade PVC / Polyurethane',
        'is_sharps': False,
        'volume_l': 0.45,
        'weight_g': 60.0,
        'severity': 'High'
    },
    'iv_bottle': {
        'class_id': 8,
        'label': 'IV Saline / Infusion Bottle',
        'polymer': 'Medical Grade LDPE / PP',
        'is_sharps': False,
        'volume_l': 0.90,
        'weight_g': 75.0,
        'severity': 'High'
    },
    'medical_cap': {
        'class_id': 8,
        'label': 'Disposable Medical Surgical Cap',
        'polymer': 'Non-Woven Polypropylene',
        'is_sharps': False,
        'volume_l': 0.10,
        'weight_g': 6.0,
        'severity': 'Medium'
    },
    'shoe_cover': {
        'class_id': 8,
        'label': 'Medical Disposable Shoe Cover',
        'polymer': 'Chlorinated Polyethylene (CPE)',
        'is_sharps': False,
        'volume_l': 0.08,
        'weight_g': 8.0,
        'severity': 'Medium'
    },
    'medical_glasses': {
        'class_id': 8,
        'label': 'Medical Protective Eye Goggles',
        'polymer': 'Polycarbonate Plastic',
        'is_sharps': False,
        'volume_l': 0.25,
        'weight_g': 45.0,
        'severity': 'Medium'
    },
    'plastic_equipment_packaging': {
        'class_id': 8,
        'label': 'Sterile Medical Plastic Packaging',
        'polymer': 'Sterile Medical Polymer Film',
        'is_sharps': False,
        'volume_l': 0.25,
        'weight_g': 15.0,
        'severity': 'Medium'
    },
    'paper_equipment_packaging': {
        'class_id': 8,
        'label': 'Pharmaceutical / Medical Paper Packaging',
        'polymer': 'Medical Grade Paper / Foil',
        'is_sharps': False,
        'volume_l': 0.20,
        'weight_g': 12.0,
        'severity': 'Medium'
    },
    'metal_equipment_packaging': {
        'class_id': 8,
        'label': 'Medical Metal Equipment Packaging',
        'polymer': 'Aluminium / Foil Barrier',
        'is_sharps': False,
        'volume_l': 0.20,
        'weight_g': 25.0,
        'severity': 'Medium'
    },
    'body_tissue_organ': {
        'class_id': 8,
        'label': 'Pathological Anatomical Waste',
        'polymer': 'Human / Pathological Biological Tissue',
        'is_sharps': False,
        'volume_l': 0.50,
        'weight_g': 300.0,
        'severity': 'Critical'
    },
    'organic_waste': {
        'class_id': 8,
        'label': 'Clinical Organic / Biological Waste',
        'polymer': 'Organic Bio-Waste',
        'is_sharps': False,
        'volume_l': 0.40,
        'weight_g': 200.0,
        'severity': 'High'
    }
}


class RoboflowMedicalDetector:
    """
    Client for the Roboflow Medical Instance Segmentation Model:
      Model ID: sih-pzryl/medbin_dataset-pr2o1-1-yolo26n-seg-t1
      API Key: rf_sg7J8vYlWPb37GwXm5O0XytyKMt2
    """

    def __init__(self,
                 model_id: Optional[str] = None,
                 api_key: Optional[str] = None,
                 confidence_threshold: float = 0.25,
                 server_url: Optional[str] = None):
        self.model_id = model_id or os.getenv("ROBOFLOW_MEDICAL_MODEL", "sih-pzryl/medbin_dataset-pr2o1-1-yolo26n-seg-t1")
        self.api_key = api_key or os.getenv("ROBOFLOW_API_KEY", "rf_sg7J8vYlWPb37GwXm5O0XytyKMt2")
        self.confidence_threshold = confidence_threshold
        self.server_url = server_url or os.getenv("ROBOFLOW_INFERENCE_SERVER_URL")

        # Track execution status and diagnostics
        self.last_status: Dict[str, Any] = {
            "configured": bool(self.model_id and self.api_key),
            "model_id": self.model_id,
            "has_key": bool(self.api_key),
            "endpoint_available": False,
            "last_error": None,
            "last_latency_ms": 0.0
        }

    def _get_endpoint_urls(self) -> List[str]:
        """Constructs target Roboflow inference URLs in priority order."""
        if self.server_url:
            base = self.server_url.rstrip('/')
            return [
                f"{base}/{self.model_id}?api_key={self.api_key}&confidence={int(self.confidence_threshold * 100)}",
                f"{base}/infer/{self.model_id}?api_key={self.api_key}"
            ]

        # Cloud outline (segmentation) & detect endpoints
        # Note: model_id might be "workspace/project-version" or "project/version"
        clean_id = self.model_id.strip('/')
        return [
            f"https://outline.roboflow.com/{clean_id}?api_key={self.api_key}&confidence={int(self.confidence_threshold * 100)}&format=json",
            f"https://detect.roboflow.com/{clean_id}?api_key={self.api_key}&confidence={int(self.confidence_threshold * 100)}&format=json"
        ]

    def predict(self, image_input: Union[str, Image.Image, bytes]) -> Dict[str, Any]:
        """
        Sends image to Roboflow Segmentation Inference API.
        Returns parsed segmentation detections, polygons, bounding boxes,
        and CleanTrack taxonomy mapping.
        """
        start_time = time.time()

        if not self.api_key or not self.model_id:
            self.last_status["endpoint_available"] = False
            self.last_status["last_error"] = "Roboflow credentials or model_id missing"
            return {
                "success": False,
                "error": "Roboflow credentials missing",
                "detections": [],
                "segmentation_available": False
            }

        # 1. Convert image to base64 JPEG bytes
        try:
            if isinstance(image_input, Image.Image):
                img = image_input.convert("RGB")
            elif isinstance(image_input, str):
                if image_input.startswith("data:image"):
                    _, b64data = image_input.split(",", 1)
                    img = Image.open(io.BytesIO(base64.b64decode(b64data))).convert("RGB")
                elif os.path.exists(image_input):
                    img = Image.open(image_input).convert("RGB")
                else:
                    return {"success": False, "error": f"Image file not found: {image_input}", "detections": []}
            elif isinstance(image_input, bytes):
                img = Image.open(io.BytesIO(image_input)).convert("RGB")
            else:
                return {"success": False, "error": "Invalid image input type", "detections": []}

            img_w, img_h = img.size
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception as prep_err:
            self.last_status["last_error"] = f"Image preparation failed: {prep_err}"
            return {"success": False, "error": str(prep_err), "detections": []}

        # 2. Query Roboflow API endpoints
        endpoints = self._get_endpoint_urls()
        raw_response = None
        last_http_code = None

        for url in endpoints:
            try:
                # Roboflow expects base64 in POST body or multipart form
                req = urllib.request.Request(
                    url,
                    data=img_b64.encode("utf-8"),
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                        "User-Agent": "CleanTrack-Roboflow-Medical-Client/2.0"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=8.0) as resp:
                    resp_bytes = resp.read()
                    raw_response = json.loads(resp_bytes.decode("utf-8"))
                    self.last_status["endpoint_available"] = True
                    self.last_status["last_error"] = None
                    break
            except urllib.error.HTTPError as he:
                last_http_code = he.code
                err_msg = he.read().decode("utf-8", errors="replace")
                self.last_status["endpoint_available"] = False
                self.last_status["last_error"] = f"HTTP {he.code}: {err_msg[:200]}"
                # If 401 Unauthorized for serverless inference, log once and break out to local fallback
                if he.code in (401, 403):
                    break
            except Exception as net_err:
                self.last_status["endpoint_available"] = False
                self.last_status["last_error"] = f"Connection error: {net_err}"

        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        self.last_status["last_latency_ms"] = latency_ms

        if raw_response is None:
            return {
                "success": False,
                "error": self.last_status["last_error"] or f"Inference failed (HTTP {last_http_code})",
                "http_status": last_http_code,
                "model_id": self.model_id,
                "detections": [],
                "segmentation_available": False,
                "fallback_triggered": True,
                "latency_ms": latency_ms
            }

        # 3. Parse Roboflow Segmentation Predictions
        detections: List[Dict[str, Any]] = []
        predictions = raw_response.get("predictions", [])
        if not isinstance(predictions, list):
            predictions = []

        sharps_count = 0
        total_vol_l = 0.0
        total_wt_g = 0.0

        for pred in predictions:
            raw_cls = str(pred.get("class", "medical_waste")).lower().strip().replace(" ", "_").replace("-", "_")
            conf = float(pred.get("confidence", 0.0))
            if conf < self.confidence_threshold:
                continue

            # Bounding box coordinates: Roboflow returns center x, y, width, height
            cx = float(pred.get("x", 0.0))
            cy = float(pred.get("y", 0.0))
            bw = float(pred.get("width", 0.0))
            bh = float(pred.get("height", 0.0))

            x1 = max(0.0, cx - bw / 2.0)
            y1 = max(0.0, cy - bh / 2.0)
            x2 = min(float(img_w), cx + bw / 2.0)
            y2 = min(float(img_h), cy + bh / 2.0)
            box_xyxy = [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)]

            normalizedBox = [
                round(x1 / max(1, img_w), 4),
                round(y1 / max(1, img_h), 4),
                round(x2 / max(1, img_w), 4),
                round(y2 / max(1, img_h), 4)
            ]

            # Segmentation polygon points (if available from outline endpoint)
            points = pred.get("points") or []
            polygon_coords = []
            if isinstance(points, list):
                for pt in points:
                    if isinstance(pt, dict) and "x" in pt and "y" in pt:
                        polygon_coords.append([round(float(pt["x"]), 1), round(float(pt["y"]), 1)])
                    elif isinstance(pt, (list, tuple)) and len(pt) >= 2:
                        polygon_coords.append([round(float(pt[0]), 1), round(float(pt[1]), 1)])

            # Taxonomy matching
            meta = ROBOFLOW_MEDICAL_TAXONOMY_MAP.get(raw_cls)
            if not meta:
                # Fuzzy fallback matching
                for k, v in ROBOFLOW_MEDICAL_TAXONOMY_MAP.items():
                    if k in raw_cls or raw_cls in k:
                        meta = v
                        break

            if not meta:
                is_sharps_item = any(s in raw_cls for s in ["syringe", "needle", "vial", "ampoule", "scalpel", "glass"])
                meta = {
                    "class_id": 8,
                    "label": raw_cls.replace("_", " ").title(),
                    "polymer": "Clinical Biohazard Composite",
                    "is_sharps": is_sharps_item,
                    "volume_l": 0.25,
                    "weight_g": 30.0,
                    "severity": "Critical" if is_sharps_item else "High"
                }

            is_sharps = meta.get("is_sharps", False)
            if is_sharps:
                sharps_count += 1

            vol_l = meta.get("volume_l", 0.20)
            wt_g = meta.get("weight_g", 25.0)
            total_vol_l += vol_l
            total_wt_g += wt_g

            detections.append({
                "classId": meta.get("class_id", 8),
                "categoryKey": "biomedical_sanitary" if meta.get("class_id", 8) == 8 else "plastic",
                "category": "Biomedical-looking & Sanitary Waste" if meta.get("class_id", 8) == 8 else "Plastic Waste (Dry Recyclable)",
                "rawClass": raw_cls,
                "label": meta.get("label", raw_cls.replace("_", " ").title()),
                "polymer": meta.get("polymer", "Clinical Material"),
                "stream": "YELLOW/WHITE STREAM — CBWTF Incineration & Autoclaving",
                "color": "#ef4444",
                "bg_color": "#b91c1c",
                "confidence": round(conf * 100.0, 1),
                "volumeLiters": vol_l,
                "weightGrams": wt_g,
                "box": box_xyxy,
                "normalizedBox": normalizedBox,
                "points": polygon_coords,
                "hasSegmentation": len(polygon_coords) >= 3,
                "isSharps": is_sharps,
                "source": "RoboflowSegmentation"
            })

        return {
            "success": True,
            "model_id": self.model_id,
            "total_items": len(detections),
            "detections": detections,
            "sharps_count": sharps_count,
            "total_volume_l": round(total_vol_l, 2),
            "total_weight_g": round(total_wt_g, 1),
            "segmentation_available": any(d.get("hasSegmentation") for d in detections),
            "latency_ms": latency_ms,
            "fallback_triggered": False
        }

    def status(self) -> Dict[str, Any]:
        """Returns the live integration and diagnostic state of the Roboflow client."""
        return {
            "configured": self.last_status["configured"],
            "model_id": self.model_id,
            "has_key": self.last_status["has_key"],
            "endpoint_available": self.last_status["endpoint_available"],
            "last_error": self.last_status["last_error"],
            "last_latency_ms": self.last_status["last_latency_ms"]
        }
