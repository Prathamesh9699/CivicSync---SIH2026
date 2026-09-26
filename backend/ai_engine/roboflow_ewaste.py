"""
CleanTrack AI - Roboflow E-Waste Detection & Instance Segmentation Client
========================================================================
Connects to Roboflow Inference API for E-Waste detection and segmentation.
Model: bushra-shaikh-iwhsk/balanced-e-waste-dataset-6hokd-ck7ga-1-yolo26n-t1
API Key: rf_863wPktYk7ghoaoNJzPPhgOd1CQ2

Features:
  - Supports Roboflow cloud detection/segmentation endpoint
  - Supports self-hosted / local Docker inference container (http://localhost:9001/)
  - Extracts bounding boxes, class labels, and confidence scores
  - Maps detected instances to CleanTrack master taxonomy (Class 6: E-Waste / Hazardous Electronics)
  - Identifies hazardous electronic components (batteries, fluorescent tubes, CRT/PCB)
  - Computes physical unit metrics (Volume in Liters, Weight in Grams)
  - Zero-downtime graceful fallback: if serverless inference returns 401 or times out,
    safely logs diagnostic status and allows local 37-class YOLO11 e-waste model to take over.
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


# CPCB & E-Waste Management Rules 2022 Physical Calibration Map (37 classes)
ROBOFLOW_EWASTE_TAXONOMY_MAP = {
    'battery': {
        'class_id': 6,
        'label': 'Hazardous Battery Cell',
        'polymer': 'Lithium-Ion / Heavy Metal Acid',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 0.15,
        'weight_g': 80.0,
        'severity': 'Critical'
    },
    'blood-pressure-monitor': {
        'class_id': 6,
        'label': 'Digital BP Monitor',
        'polymer': 'ABS Plastic / Medical Sensor',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.80,
        'weight_g': 350.0,
        'severity': 'Medium'
    },
    'boiler': {
        'class_id': 6,
        'label': 'Electric Water Boiler',
        'polymer': 'Sheet Metal & Heating Element',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 15.0,
        'weight_g': 8000.0,
        'severity': 'Medium'
    },
    'clothes-iron': {
        'class_id': 6,
        'label': 'Electric Clothes Iron',
        'polymer': 'Thermostatic Plastic & Soleplate Metal',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 1.50,
        'weight_g': 1200.0,
        'severity': 'Medium'
    },
    'coffee-machine': {
        'class_id': 6,
        'label': 'Electric Coffee Machine',
        'polymer': 'Small Domestic Appliance Scrap',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 4.00,
        'weight_g': 2500.0,
        'severity': 'Medium'
    },
    'computer-keyboard': {
        'class_id': 6,
        'label': 'Computer Keyboard',
        'polymer': 'ABS Plastic & Membrane Circuitry',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 1.80,
        'weight_g': 650.0,
        'severity': 'Low'
    },
    'computer-mouse': {
        'class_id': 6,
        'label': 'Computer Mouse',
        'polymer': 'ABS Plastic & Micro-switch PCB',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.30,
        'weight_g': 110.0,
        'severity': 'Low'
    },
    'cooling-display': {
        'class_id': 6,
        'label': 'Cooling Display Unit',
        'polymer': 'Commercial Refrigeration Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 8.00,
        'weight_g': 4000.0,
        'severity': 'High'
    },
    'desktop-pc': {
        'class_id': 6,
        'label': 'Desktop Computer CPU Tower',
        'polymer': 'Sheet Metal, SMPS & Motherboard Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 18.0,
        'weight_g': 7500.0,
        'severity': 'High'
    },
    'digital-oscilloscope': {
        'class_id': 6,
        'label': 'Digital Oscilloscope / Lab Gear',
        'polymer': 'Industrial Test Electronic Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 5.00,
        'weight_g': 3000.0,
        'severity': 'High'
    },
    'drone': {
        'class_id': 6,
        'label': 'Drone / UAV Electronics',
        'polymer': 'Carbon Fiber & LiPo Battery Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 2.00,
        'weight_g': 800.0,
        'severity': 'High'
    },
    'electric-guitar': {
        'class_id': 6,
        'label': 'Electric Guitar / Audio Gear',
        'polymer': 'Wood, Wire & Transducer Electronics',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 6.00,
        'weight_g': 3500.0,
        'severity': 'Low'
    },
    'electronic-keyboard': {
        'class_id': 6,
        'label': 'Electronic Synthesizer Keyboard',
        'polymer': 'Consumer Audio Electronics',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 10.0,
        'weight_g': 4500.0,
        'severity': 'Medium'
    },
    'flashlight': {
        'class_id': 6,
        'label': 'Electric Torch / Flashlight',
        'polymer': 'Aluminium / LED Battery Device',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.40,
        'weight_g': 150.0,
        'severity': 'Low'
    },
    'flat-panel-monitor': {
        'class_id': 6,
        'label': 'Flat-Panel LCD/LED Monitor',
        'polymer': 'Display Panel & Inverter Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 8.00,
        'weight_g': 3500.0,
        'severity': 'High'
    },
    'flat-panel-tv': {
        'class_id': 6,
        'label': 'Flat-Panel Television',
        'polymer': 'Television Display E-Waste',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 15.0,
        'weight_g': 7000.0,
        'severity': 'High'
    },
    'glucose-meter': {
        'class_id': 6,
        'label': 'Digital Blood Glucose Meter',
        'polymer': 'Medical Diagnostic Electronic',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.20,
        'weight_g': 100.0,
        'severity': 'Medium'
    },
    'hdd': {
        'class_id': 6,
        'label': 'Hard Disk Drive (HDD Scrap)',
        'polymer': 'Cast Aluminium & Neodymium Magnet',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.40,
        'weight_g': 450.0,
        'severity': 'Medium'
    },
    'laptop': {
        'class_id': 6,
        'label': 'Laptop Computer',
        'polymer': 'Lithium-Ion & PCB Assembly',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 2.50,
        'weight_g': 1800.0,
        'severity': 'High'
    },
    'microwave': {
        'class_id': 6,
        'label': 'Microwave Oven Appliance',
        'polymer': 'Magnetron & Heavy Domestic Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 20.0,
        'weight_g': 12000.0,
        'severity': 'High'
    },
    'music-player': {
        'class_id': 6,
        'label': 'Portable Media / Audio Player',
        'polymer': 'Consumer Audio E-Waste',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.25,
        'weight_g': 120.0,
        'severity': 'Low'
    },
    'oven': {
        'class_id': 6,
        'label': 'Electric Oven Appliance',
        'polymer': 'Heavy Domestic Electrical White Goods',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 25.0,
        'weight_g': 15000.0,
        'severity': 'High'
    },
    'pcb': {
        'class_id': 6,
        'label': 'Printed Circuit Board (PCB Scrap)',
        'polymer': 'FR4 Fiberglass & Heavy Solder Metals',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 0.30,
        'weight_g': 120.0,
        'severity': 'Critical'
    },
    'photovoltaic-panel': {
        'class_id': 6,
        'label': 'Solar Photovoltaic Panel',
        'polymer': 'Silicon Solar Cell & Glass Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 15.0,
        'weight_g': 8000.0,
        'severity': 'High'
    },
    'projector': {
        'class_id': 6,
        'label': 'Optical Video Projector',
        'polymer': 'Optoelectronic Device & High-Pressure Lamp',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 4.00,
        'weight_g': 2800.0,
        'severity': 'High'
    },
    'refrigerator': {
        'class_id': 6,
        'label': 'Refrigerator / Cooling Appliance',
        'polymer': 'Refrigerant & Compressor Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 80.0,
        'weight_g': 35000.0,
        'severity': 'Critical'
    },
    'rotary-mower': {
        'class_id': 6,
        'label': 'Electric Rotary Lawn Mower',
        'polymer': 'Heavy Motor Domestic Machine',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 30.0,
        'weight_g': 15000.0,
        'severity': 'High'
    },
    'router': {
        'class_id': 6,
        'label': 'Wi-Fi Network Router',
        'polymer': 'Telecom Networking Hardware',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.80,
        'weight_g': 350.0,
        'severity': 'Low'
    },
    'server': {
        'class_id': 6,
        'label': 'Enterprise Rack Server',
        'polymer': 'High-Density Server Circuitry Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 20.0,
        'weight_g': 12000.0,
        'severity': 'Critical'
    },
    'smartphone': {
        'class_id': 6,
        'label': 'Discarded Smartphone / Mobile',
        'polymer': 'Gorilla Glass & Li-Ion Scrap',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 0.25,
        'weight_g': 180.0,
        'severity': 'Medium'
    },
    'smoke-detector': {
        'class_id': 6,
        'label': 'Smoke Detector Sensor',
        'polymer': 'Sensor / Ionic Electronic Waste',
        'is_sharps': False,
        'is_hazardous': True,
        'volume_l': 0.30,
        'weight_g': 140.0,
        'severity': 'High'
    },
    'straight-tube-fluorescent-lamp': {
        'class_id': 6,
        'label': 'Fluorescent Tube Lamp (Mercury Hazard)',
        'polymer': 'Glass Tube & Mercury Vapor Hazard',
        'is_sharps': True,
        'is_hazardous': True,
        'volume_l': 0.80,
        'weight_g': 200.0,
        'severity': 'Critical'
    },
    'street-lamp': {
        'class_id': 6,
        'label': 'Street Lighting Luminaire',
        'polymer': 'Municipal Luminaire Fixture',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 4.00,
        'weight_g': 2000.0,
        'severity': 'Medium'
    },
    'tv-remote-control': {
        'class_id': 6,
        'label': 'Infrared TV Remote Control',
        'polymer': 'ABS Plastic & Button Circuitry',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.20,
        'weight_g': 90.0,
        'severity': 'Low'
    },
    'telephone-set': {
        'class_id': 6,
        'label': 'Landline Telephone Set',
        'polymer': 'Telecom Hardware E-Waste',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.80,
        'weight_g': 450.0,
        'severity': 'Low'
    },
    'usb-flash-drive': {
        'class_id': 6,
        'label': 'USB Flash Drive / Thumb Drive',
        'polymer': 'Solid-State Memory Scrap',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 0.05,
        'weight_g': 20.0,
        'severity': 'Low'
    },
    'washing-machine': {
        'class_id': 6,
        'label': 'Automatic Washing Machine',
        'polymer': 'Major Domestic White Goods',
        'is_sharps': False,
        'is_hazardous': False,
        'volume_l': 60.0,
        'weight_g': 28000.0,
        'severity': 'High'
    }
}


class RoboflowEWasteDetector:
    """
    Production-ready Roboflow E-Waste Detection & Instance Segmentation Client.
    Connects to the Roboflow dataset:
      - Model ID: bushra-shaikh-iwhsk/balanced-e-waste-dataset-6hokd-ck7ga-1-yolo26n-t1
      - API Key:  rf_863wPktYk7ghoaoNJzPPhgOd1CQ2
    """

    def __init__(self,
                 model_id: Optional[str] = None,
                 api_key: Optional[str] = None,
                 local_url: Optional[str] = None,
                 confidence_threshold: float = 0.25):
        self.model_id = model_id or os.getenv(
            "ROBOFLOW_EWASTE_MODEL_ID",
            "bushra-shaikh-iwhsk/balanced-e-waste-dataset-6hokd-ck7ga-1-yolo26n-t1"
        )
        self.api_key = api_key or os.getenv(
            "ROBOFLOW_EWASTE_API_KEY",
            "rf_863wPktYk7ghoaoNJzPPhgOd1CQ2"
        )
        self.local_url = local_url or os.getenv("ROBOFLOW_LOCAL_INFERENCE_URL", "http://localhost:9001")
        self.confidence_threshold = confidence_threshold
        self.last_status = {
            "configured": bool(self.model_id and self.api_key),
            "last_latency_ms": 0.0,
            "last_endpoint_used": None,
            "last_error": None
        }

    def status(self) -> Dict[str, Any]:
        return {
            "model_id": self.model_id,
            "has_api_key": bool(self.api_key),
            "confidence_threshold": self.confidence_threshold,
            **self.last_status
        }

    def predict(self, image_input: Union[str, Image.Image]) -> Dict[str, Any]:
        start_time = time.time()

        if isinstance(image_input, str):
            if os.path.exists(image_input):
                img = Image.open(image_input).convert('RGB')
            else:
                return {"success": False, "error": f"Image file not found: {image_input}"}
        elif isinstance(image_input, Image.Image):
            img = image_input.convert('RGB')
        else:
            return {"success": False, "error": "Invalid image input"}

        img_w, img_h = img.size

        # Convert to Base64 JPEG
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        endpoints = []

        # 1. Local container if running
        if self.local_url:
            clean_local = self.local_url.rstrip('/')
            endpoints.append(f"{clean_local}/{self.model_id}?api_key={self.api_key}")

        # 2. Roboflow Cloud Detect API
        endpoints.append(f"https://detect.roboflow.com/{self.model_id}?api_key={self.api_key}")

        # 3. Roboflow Cloud Outline API (segmentation)
        endpoints.append(f"https://outline.roboflow.com/{self.model_id}?api_key={self.api_key}")

        response_data = None
        used_endpoint = None
        last_error = None

        for url in endpoints:
            try:
                req = urllib.request.Request(
                    url,
                    data=img_b64.encode('utf-8'),
                    headers={'Content-Type': 'application/x-www-form-urlencoded'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    raw_body = response.read().decode('utf-8')
                    response_data = json.loads(raw_body)
                    used_endpoint = url
                    break
            except urllib.error.HTTPError as he:
                last_error = f"HTTP {he.code} on {url.split('?')[0]}"
            except Exception as e:
                last_error = str(e)

        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        self.last_status["last_latency_ms"] = latency_ms
        self.last_status["last_endpoint_used"] = used_endpoint.split('?')[0] if used_endpoint else None
        self.last_status["last_error"] = last_error

        if not response_data or "predictions" not in response_data:
            return {
                "success": False,
                "error": last_error or "No predictions returned from Roboflow E-Waste inference",
                "latency_ms": latency_ms,
                "detections": []
            }

        parsed_detections = []
        for pred in response_data.get("predictions", []):
            conf = float(pred.get("confidence", 0.0))
            if conf < self.confidence_threshold:
                continue

            raw_class = str(pred.get("class", "e-waste")).lower().replace('_', '-')

            # Normalized / pixel bounding box
            x = float(pred.get("x", 0.0))
            y = float(pred.get("y", 0.0))
            w = float(pred.get("width", 0.0))
            h = float(pred.get("height", 0.0))

            x1 = round(max(0.0, x - w / 2.0), 1)
            y1 = round(max(0.0, y - h / 2.0), 1)
            x2 = round(min(float(img_w), x + w / 2.0), 1)
            y2 = round(min(float(img_h), y + h / 2.0), 1)

            xyxy = [x1, y1, x2, y2]
            xyxyn = [
                round(x1 / float(img_w), 4),
                round(y1 / float(img_h), 4),
                round(x2 / float(img_w), 4),
                round(y2 / float(img_h), 4)
            ]

            # Polygon segmentation coordinates if provided
            points = pred.get("points")
            polygon_list = []
            if points and isinstance(points, list):
                for pt in points:
                    if isinstance(pt, dict) and "x" in pt and "y" in pt:
                        polygon_list.append([round(float(pt["x"]), 1), round(float(pt["y"]), 1)])
                    elif isinstance(pt, (list, tuple)) and len(pt) >= 2:
                        polygon_list.append([round(float(pt[0]), 1), round(float(pt[1]), 1)])

            meta = ROBOFLOW_EWASTE_TAXONOMY_MAP.get(raw_class, {
                'class_id': 6,
                'label': raw_class.replace('-', ' ').title(),
                'polymer': 'Electronic Scrap & Circuitry',
                'is_sharps': any(s in raw_class for s in ['lamp', 'tube', 'screen', 'glass']),
                'is_hazardous': any(s in raw_class for s in ['battery', 'pcb', 'refrigerator', 'server', 'mercury']),
                'volume_l': 1.00,
                'weight_g': 400.0,
                'severity': 'High'
            })

            parsed_detections.append({
                "classId": meta['class_id'],
                "categoryKey": "ewaste",
                "category": "E-Waste / Hazardous Electronics",
                "rawClass": raw_class,
                "label": meta['label'],
                "polymer": meta['polymer'],
                "stream": "PURPLE STREAM — Authorized E-Waste Dismantler / CPCB Recycler",
                "color": "#9333ea",
                "bg_color": "#7e22ce",
                "confidence": round(conf * 100.0, 1),
                "volumeLiters": meta['volume_l'],
                "weightGrams": meta['weight_g'],
                "box": xyxy,
                "normalizedBox": xyxyn,
                "polygon": polygon_list if polygon_list else None,
                "isSharps": meta.get('is_sharps', False),
                "isHazardous": meta.get('is_hazardous', False),
                "source": "RoboflowEWasteInstanceSegmentation"
            })

        return {
            "success": True,
            "latency_ms": latency_ms,
            "detections": parsed_detections,
            "totalDetected": len(parsed_detections),
            "model": f"Roboflow E-Waste ({self.model_id})",
            "endpoint": used_endpoint.split('?')[0] if used_endpoint else None
        }
