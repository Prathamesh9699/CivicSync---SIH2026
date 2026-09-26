import os
import sys
import json
import base64
import io
import urllib.request
from PIL import Image, ImageDraw, ImageFont

try:
    from ultralytics import YOLO
except ImportError:
    print(json.dumps({"success": False, "error": "ultralytics package not installed"}))
    sys.exit(1)

# 1. PHYSICAL UNIT METRICS MAP (Volume in Liters, Weight in Grams per item)
PHYSICAL_UNIT_MAP = {
    # Plastic & Recyclables
    'pet': {'volume_l': 0.80, 'weight_g': 38.0, 'name': 'PET Plastic Bottle (~750ml-1L)'},
    'pead': {'volume_l': 1.60, 'weight_g': 95.0, 'name': 'HDPE Rigid Container (~1.5L)'},
    'mixed_plastic_soft': {'volume_l': 0.35, 'weight_g': 18.0, 'name': 'Soft Plastic Packaging & Film (~350ml)'},
    'mixed_plastic_rigid': {'volume_l': 1.20, 'weight_g': 110.0, 'name': 'Rigid Polymer Object (~1.2L)'},
    'pet_oleo': {'volume_l': 0.90, 'weight_g': 45.0, 'name': 'Oil / Colored PET Bottle (~1L)'},
    'ecal': {'volume_l': 0.60, 'weight_g': 32.0, 'name': 'Tetra Pak Composite Carton (~500-1000ml)'},
    'metal': {'volume_l': 0.35, 'weight_g': 22.0, 'name': 'Aluminium / Steel Beverage Can (~330ml)'},
    'cardboard': {'volume_l': 2.50, 'weight_g': 140.0, 'name': 'Cardboard Packaging Box'},

    # Biomedical Biohazards
    'Syringe': {'volume_l': 0.08, 'weight_g': 14.0, 'name': 'Clinical Syringe (10-20ml)'},
    'Needle': {'volume_l': 0.015, 'weight_g': 3.5, 'name': 'Hypodermic Needle'},
    'Needle Cap': {'volume_l': 0.02, 'weight_g': 3.0, 'name': 'Needle Protective Cap'},
    'Face Mask': {'volume_l': 0.12, 'weight_g': 7.0, 'name': 'Medical Surgical Face Mask'},
    'Medical/Surgical Glove': {'volume_l': 0.20, 'weight_g': 11.0, 'name': 'Latex / Nitrile Medical Glove'},
    'Bandage': {'volume_l': 0.25, 'weight_g': 25.0, 'name': 'Soiled Medical Bandage Roll'},
    'Gauze': {'volume_l': 0.15, 'weight_g': 15.0, 'name': 'Sterile Gauze Swab'},
    'Cotton / Medical Cotton': {'volume_l': 0.18, 'weight_g': 18.0, 'name': 'Contaminated Medical Cotton'},
    'IV/Infusion Tube': {'volume_l': 0.45, 'weight_g': 60.0, 'name': 'IV Infusion Tubing Set'},
    'IV/Fluid Bottle': {'volume_l': 0.90, 'weight_g': 75.0, 'name': 'IV Saline / Infusion Bottle (~500-1000ml)'},
    'Test Tube': {'volume_l': 0.06, 'weight_g': 28.0, 'name': 'Clinical Blood Vacutainer / Test Tube'},
    'Medical Bottle / Vial': {'volume_l': 0.08, 'weight_g': 40.0, 'name': 'Medicine Glass Ampoule / Vial'},
    'Medicine Packaging': {'volume_l': 0.08, 'weight_g': 8.0, 'name': 'Pharmaceutical Blister Pack'},
    'Medical Packaging': {'volume_l': 0.30, 'weight_g': 16.0, 'name': 'Sterile Medical Supply Packaging'},
    'Sanitary Waste': {'volume_l': 0.40, 'weight_g': 45.0, 'name': 'Sanitary / Hygiene Waste'},
    'Medical Disposable': {'volume_l': 0.30, 'weight_g': 35.0, 'name': 'Single-Use Medical Disposable'},
    'Other Biomedical-looking Waste': {'volume_l': 0.50, 'weight_g': 50.0, 'name': 'Clinical Biohazard Waste Composite'}
}

# 2. PLASTIC CLASSES MAPPING
PLASTIC_CLASS_MAP = {
    'pet': {
        'name': 'PET Plastic Bottle',
        'category': 'Plastic Waste',
        'polymer': 'PET (Polyethylene Terephthalate #1)',
        'stream': 'Dry Waste → Plastic Recycling',
        'color': '#0284c7',
        'bg_color': '#0284c7'
    },
    'pead': {
        'name': 'HDPE Rigid Container',
        'category': 'Plastic Waste',
        'polymer': 'HDPE (High-Density Polyethylene #2)',
        'stream': 'Dry Waste → Plastic Recycling',
        'color': '#0369a1',
        'bg_color': '#0369a1'
    },
    'mixed_plastic_soft': {
        'name': 'Soft Plastic Packaging & Film',
        'category': 'Plastic Waste',
        'polymer': 'LDPE / Flexible Film #4',
        'stream': 'Dry Waste → Plastic Polymer Recycling',
        'color': '#0ea5e9',
        'bg_color': '#0ea5e9'
    },
    'mixed_plastic_rigid': {
        'name': 'Rigid Plastic Polymer Waste',
        'category': 'Plastic Waste',
        'polymer': 'PP / Mixed Rigid Polymers #5',
        'stream': 'Dry Waste → Plastic Recycling',
        'color': '#38bdf8',
        'bg_color': '#0284c7'
    },
    'pet_oleo': {
        'name': 'Colored / Oil PET Bottle',
        'category': 'Plastic Waste',
        'polymer': 'PET-O (Colored PET)',
        'stream': 'Dry Waste → Plastic Recycling',
        'color': '#0284c7',
        'bg_color': '#0284c7'
    },
    'ecal': {
        'name': 'Tetra Pak / Composite Carton',
        'category': 'Plastic Waste',
        'polymer': 'Paper / Polyethylene / Aluminium Laminate',
        'stream': 'Dry Waste → Fiber & Polymer Recovery',
        'color': '#14b8a6',
        'bg_color': '#0f766e'
    },
    'metal': {
        'name': 'Metal & Aluminium Can',
        'category': 'Plastic Waste',
        'polymer': 'Aluminium / Steel',
        'stream': 'Dry Waste → Metal Foundry Recycling',
        'color': '#64748b',
        'bg_color': '#475569'
    },
    'cardboard': {
        'name': 'Cardboard & Paper Packaging',
        'category': 'Plastic Waste',
        'polymer': 'Cellulose Fiber',
        'stream': 'Dry Waste → Paper Mill Pulping',
        'color': '#d97706',
        'bg_color': '#b45309'
    }
}

# 3. BIOMEDICAL CLASSES MAPPING (WHO & CPCB Guidelines)
BIOMEDICAL_CLASS_MAP = {
    'Syringe': {
        'name': 'Clinical Syringe (Biohazard / Sharps)',
        'category': 'Medical Waste',
        'polymer': 'Contaminated Polypropylene / Steel Needle',
        'stream': 'YELLOW/WHITE STREAM — Sharps Incineration & Encapsulation',
        'color': '#f59e0b',
        'bg_color': '#b45309',
        'severity': 'Critical'
    },
    'Needle': {
        'name': 'Hypodermic Needle (Sharps Hazard)',
        'category': 'Medical Waste',
        'polymer': 'Surgical Steel / Puncture Hazard',
        'stream': 'WHITE STREAM — Puncture-Proof Sharps Pit',
        'color': '#ef4444',
        'bg_color': '#b91c1c',
        'severity': 'Critical'
    },
    'Needle Cap': {
        'name': 'Needle Protective Cap',
        'category': 'Medical Waste',
        'polymer': 'Rigid Polypropylene (Medical Plastic)',
        'stream': 'RED STREAM — Autoclave & Recyclable Plastic',
        'color': '#f43f5e',
        'bg_color': '#be123c',
        'severity': 'Medium'
    },
    'Face Mask': {
        'name': 'Medical / Surgical Face Mask',
        'category': 'Medical Waste',
        'polymer': 'Non-Woven Polypropylene / Meltblown Filter',
        'stream': 'YELLOW STREAM — High-Temperature Incineration',
        'color': '#f59e0b',
        'bg_color': '#d97706',
        'severity': 'High'
    },
    'Medical/Surgical Glove': {
        'name': 'Medical / Surgical Latex Glove',
        'category': 'Medical Waste',
        'polymer': 'Nitrile / Latex Elastomer',
        'stream': 'RED STREAM — Autoclaving / Chemical Disinfection',
        'color': '#e11d48',
        'bg_color': '#9f1239',
        'severity': 'High'
    },
    'Bandage': {
        'name': 'Soiled Medical Bandage',
        'category': 'Medical Waste',
        'polymer': 'Cotton / Adhesive Fabric',
        'stream': 'YELLOW STREAM — Incineration / Deep Burial',
        'color': '#ea580c',
        'bg_color': '#9a3412',
        'severity': 'High'
    },
    'Gauze': {
        'name': 'Surgical Gauze & Swab',
        'category': 'Medical Waste',
        'polymer': 'Woven Absorbent Cotton',
        'stream': 'YELLOW STREAM — Incineration / Deep Burial',
        'color': '#ea580c',
        'bg_color': '#9a3412',
        'severity': 'High'
    },
    'Cotton / Medical Cotton': {
        'name': 'Contaminated Medical Cotton',
        'category': 'Medical Waste',
        'polymer': 'Absorbent Cellulose',
        'stream': 'YELLOW STREAM — Incineration',
        'color': '#ea580c',
        'bg_color': '#9a3412',
        'severity': 'High'
    },
    'IV/Infusion Tube': {
        'name': 'IV Infusion Tubing Set',
        'category': 'Medical Waste',
        'polymer': 'Medical-grade Plasticized PVC',
        'stream': 'RED STREAM — Chemical Disinfection & Shredding',
        'color': '#e11d48',
        'bg_color': '#9f1239',
        'severity': 'High'
    },
    'IV/Fluid Bottle': {
        'name': 'IV Saline / Fluid Infusion Bottle',
        'category': 'Medical Waste',
        'polymer': 'Blow-molded Polyethylene (LDPE/HDPE)',
        'stream': 'RED STREAM — Autoclave / Plastic Recycling Stream',
        'color': '#e11d48',
        'bg_color': '#9f1239',
        'severity': 'Medium'
    },
    'Test Tube': {
        'name': 'Clinical Blood / Diagnostic Test Tube',
        'category': 'Medical Waste',
        'polymer': 'Borosilicate Glass / PET Vacutainer',
        'stream': 'BLUE STREAM — Glassware Disinfection & Neutralization',
        'color': '#2563eb',
        'bg_color': '#1d4ed8',
        'severity': 'Critical'
    },
    'Medical Bottle / Vial': {
        'name': 'Medicine Vial / Glass Ampoule',
        'category': 'Medical Waste',
        'polymer': 'Type I / II Pharmaceutical Glass',
        'stream': 'BLUE STREAM — Glass Disinfection & Crushing',
        'color': '#2563eb',
        'bg_color': '#1d4ed8',
        'severity': 'High'
    },
    'Medicine Packaging': {
        'name': 'Pharmaceutical Blister Pack',
        'category': 'Medical Waste',
        'polymer': 'Aluminium / PVC Blister Foil',
        'stream': 'PHARMACEUTICAL STREAM — Incineration / EPR Recycling',
        'color': '#059669',
        'bg_color': '#047857',
        'severity': 'Medium'
    },
    'Medical Packaging': {
        'name': 'Sterile Medical Supply Packaging',
        'category': 'Medical Waste',
        'polymer': 'Tyvek / Polyethylene Film',
        'stream': 'RED STREAM — Disinfection / Plastic Segregation',
        'color': '#e11d48',
        'bg_color': '#9f1239',
        'severity': 'Medium'
    },
    'Sanitary Waste': {
        'name': 'Sanitary / Hygiene Waste',
        'category': 'Medical Waste',
        'polymer': 'Cellulose Fluff Pulp & Superabsorbent Polymer',
        'stream': 'YELLOW STREAM — Sanitary Incineration',
        'color': '#d97706',
        'bg_color': '#b45309',
        'severity': 'High'
    },
    'Medical Disposable': {
        'name': 'Medical Disposable Item',
        'category': 'Medical Waste',
        'polymer': 'Single-Use Medical Polymers',
        'stream': 'RED STREAM — Autoclaving / Shredding',
        'color': '#e11d48',
        'bg_color': '#9f1239',
        'severity': 'High'
    },
    'Other Biomedical-looking Waste': {
        'name': 'Unspecified Biomedical Waste',
        'category': 'Medical Waste',
        'polymer': 'Clinical Waste Composite',
        'stream': 'YELLOW STREAM — Biohazard Special Handling',
        'color': '#d97706',
        'bg_color': '#b45309',
        'severity': 'High'
    }
}

def find_plastic_model():
    candidates = [
        os.path.join(os.getcwd(), 'backend', 'models', 'plastic_best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'plastic_best.pt'),
        os.path.join(os.getcwd(), 'backup', 'original_model', 'best.pt'),
        os.path.join(os.getcwd(), 'best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'best.pt'),
        'c:/Users/hadol/projects/SIH_website/backend/models/plastic_best.pt'
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def find_biomedical_model():
    candidates = [
        os.path.join(os.getcwd(), 'backend', 'models', 'biomedical_best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'biomedical_best.pt'),
        os.path.join(os.getcwd(), 'Medical waste detection', 'CleanTrack_Image_Scanner', 'models', 'best.pt'),
        os.path.join(os.getcwd(), 'Biomedical_Waste_Detector', 'Biomedical_Waste_Detector', 'models', 'best.pt'),
        os.path.join(os.getcwd(), 'Biomedical_Waste_Detector', 'models', 'best.pt'),
        'c:/Users/hadol/projects/SIH_website/backend/models/biomedical_best.pt'
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def find_ewaste_model():
    candidates = [
        os.path.join(os.getcwd(), 'Ewaste new model', 'CleanTrack_ewaste_best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'Ewaste new model', 'CleanTrack_ewaste_best.pt'),
        os.path.join(os.getcwd(), 'backend', 'models', 'ewaste_best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'ewaste_best.pt'),
        os.path.join(os.getcwd(), 'Ewaste_Model', 'CleanTrack_ewaste_best.pt'),
        'c:/Users/hadol/projects/SIH_website/Ewaste new model/CleanTrack_ewaste_best.pt',
        'c:/Users/hadol/projects/SIH_website/backend/models/ewaste_best.pt'
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def find_medical_classifier():
    candidates = [
        os.path.join(os.getcwd(), 'Medical Waste New Model', 'best_medical_classifier.pth'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'best_medical_classifier.pth'),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'Medical Waste New Model', 'best_medical_classifier.pth'),
        os.path.join(os.getcwd(), 'backend', 'models', 'best_medical_classifier.pth'),
        'c:/Users/hadol/projects/SIH_website/Medical Waste New Model/best_medical_classifier.pth',
        'c:/Users/hadol/projects/SIH_website/backend/models/best_medical_classifier.pth'
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def find_degradable_model():
    candidates = [
        os.path.join(os.getcwd(), 'Degradable or Biodegradable', 'best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Degradable or Biodegradable', 'best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'Degradable or Biodegradable', 'best.pt'),
        os.path.join(os.getcwd(), 'backend', 'models', 'degradable_best.pt'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'degradable_best.pt'),
        'c:/Users/hadol/projects/SIH_website/Degradable or Biodegradable/best.pt',
        'c:/Users/hadol/projects/SIH_website/backend/models/degradable_best.pt'
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def find_general_model():
    candidates = [
        os.path.join(os.getcwd(), 'yolov8n.pt'),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'yolov8n.pt'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'yolov8n.pt'),
        os.path.join(os.path.dirname(__file__), 'yolov8n.pt'),
        'c:/Users/hadol/projects/SIH_website/yolov8n.pt'
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def compute_box_union_coverage(boxes, img_w, img_h):
    """Computes exact non-overlapping coverage percentage using a 100x100 spatial grid"""
    if not boxes or img_w <= 0 or img_h <= 0:
        return 0.0
    grid = [[False] * 100 for _ in range(100)]
    for box in boxes:
        x1 = max(0, min(100, int((box[0] / img_w) * 100)))
        y1 = max(0, min(100, int((box[1] / img_h) * 100)))
        x2 = max(0, min(100, int((box[2] / img_w) * 100)))
        y2 = max(0, min(100, int((box[3] / img_h) * 100)))
        for y in range(y1, y2):
            for x in range(x1, x2):
                grid[y][x] = True
    covered = sum(row.count(True) for row in grid)
    return round((covered / 10000.0) * 100.0, 1)

def draw_combined_boxes(base_img, detections):
    """Draws clean, professional multi-color bounding boxes for all detected waste items"""
    if not detections:
        return base_img
    annotated = base_img.copy()
    draw = ImageDraw.Draw(annotated)
    img_w, img_h = base_img.size

    for det in detections:
        box = det.get('box', [])
        if len(box) < 4:
            continue
        x1, y1, x2, y2 = [int(v) for v in box]
        x1 = max(0, min(img_w - 1, x1))
        y1 = max(0, min(img_h - 1, y1))
        x2 = max(0, min(img_w - 1, x2))
        y2 = max(0, min(img_h - 1, y2))

        border_color = det.get('color', '#0ea5e9')
        bg_color = det.get('bg_color', border_color)
        label_text = f"{det['label']} {det['confidence']}%"

        # Draw box outline
        draw.rectangle([x1, y1, x2, y2], outline=border_color, width=3)

        # Estimate text badge dimensions
        text_w = min(img_w - x1, max(70, len(label_text) * 7 + 10))
        text_h = 16
        badge_y1 = max(0, y1 - text_h)
        badge_y2 = badge_y1 + text_h

        # Draw label background badge
        draw.rectangle([x1, badge_y1, x1 + text_w, badge_y2], fill=bg_color)
        draw.text((x1 + 4, badge_y1 + 2), label_text, fill='#ffffff')

_PIPELINE = None

def get_pipeline():
    global _PIPELINE
    if _PIPELINE is None:
        try:
            from backend.ai_engine.pipeline import CleanTrackPipeline
        except ImportError:
            try:
                from pipeline import CleanTrackPipeline
            except ImportError:
                cur_dir = os.path.dirname(os.path.abspath(__file__))
                sys.path.insert(0, cur_dir)
                sys.path.insert(0, os.path.dirname(os.path.dirname(cur_dir)))
                from pipeline import CleanTrackPipeline
        degradable_path = find_degradable_model()
        _PIPELINE = CleanTrackPipeline(degradable_weights=degradable_path)
    return _PIPELINE

def analyze_image(image_input):
    try:
        pipeline = get_pipeline()
        return pipeline.process_image(image_input)
    except Exception as e:
        print(f"[Pipeline Error, falling back to standalone] {e}", file=sys.stderr)

    plastic_path = find_plastic_model()
    bio_path = find_biomedical_model()

    if not plastic_path and not bio_path:
        return {"success": False, "error": "No trained YOLO models found"}

    img = None
    temp_file = None
    try:
        if isinstance(image_input, str):
            image_input = image_input.strip()
            if image_input.startswith(('http://', 'https://')):
                temp_file = os.path.join(os.path.dirname(__file__), f"temp_input_{os.getpid()}.jpg")
                req = urllib.request.Request(image_input, headers={'User-Agent': 'CleanTrack-AI/1.0'})
                with urllib.request.urlopen(req, timeout=10) as response, open(temp_file, 'wb') as out_file:
                    out_file.write(response.read())
                img = Image.open(temp_file).convert('RGB')
            elif image_input.startswith('data:image'):
                header, encoded = image_input.split(',', 1)
                data = base64.b64decode(encoded)
                img = Image.open(io.BytesIO(data)).convert('RGB')
            else:
                # Check absolute or relative paths
                actual_path = None
                candidates = [
                    image_input,
                    os.path.abspath(image_input),
                    os.path.join(os.getcwd(), image_input.lstrip('/\\')),
                    os.path.join(os.path.dirname(os.path.dirname(__file__)), image_input.lstrip('/\\')),
                    os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', os.path.basename(image_input)),
                    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), image_input.lstrip('/\\')),
                    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'public', image_input.lstrip('/\\'))
                ]
                for c in candidates:
                    if os.path.exists(c) and os.path.isfile(c):
                        actual_path = c
                        break

                if actual_path:
                    img = Image.open(actual_path).convert('RGB')
                else:
                    try:
                        data = base64.b64decode(image_input)
                        img = Image.open(io.BytesIO(data)).convert('RGB')
                    except Exception:
                        return {"success": False, "error": f"Image file not found: {image_input}"}
        else:
            return {"success": False, "error": "No image input provided"}

        img_w, img_h = img.size
        total_img_area = max(1, img_w * img_h)

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

        # 0. Check General Scene Context (detect dominant person / bedroom / indoor furniture)
        general_path = find_general_model()
        is_personal_indoor_scene = False
        indoor_elements = []
        if general_path and os.path.exists(general_path):
            try:
                g_model = YOLO(general_path)
                g_res = g_model(img, conf=0.35, verbose=False)[0]
                person_boxes = []
                indoor_boxes = []
                for gb in g_res.boxes:
                    g_cls = g_model.names[int(gb.cls[0])]
                    g_conf = float(gb.conf[0])
                    g_xy = [float(x) for x in gb.xyxy[0].tolist()]
                    g_area_pct = ((g_xy[2] - g_xy[0]) * (g_xy[3] - g_xy[1]) / float(total_img_area)) * 100.0
                    if g_cls == 'person':
                        person_boxes.append((g_conf, g_area_pct))
                    elif g_cls in ['bench', 'chair', 'bed', 'couch', 'sofa', 'dining table']:
                        indoor_boxes.append((g_conf, g_area_pct, g_cls))

                has_person = any(c >= 0.50 and a >= 8.0 for c, a in person_boxes)
                has_indoor = any(c >= 0.35 and a >= 8.0 for c, a, _ in indoor_boxes)
                if has_person or has_indoor:
                    is_personal_indoor_scene = True
                    if has_person:
                        indoor_elements.append("person")
                    if has_indoor:
                        indoor_elements.extend([item[2] for item in indoor_boxes if item[0] >= 0.50])
            except Exception as ge:
                print(f"[Scene Model Warning] {ge}", file=sys.stderr)

        # 1. Run Biomedical Model (conf=0.28 for true biohazard & sharps capture)
        bio_detections = []
        bio_confidences = []
        bio_volume_l = 0.0
        bio_weight_g = 0.0

        if bio_path and os.path.exists(bio_path):
            try:
                b_model = YOLO(bio_path)
                b_res = b_model(img, conf=0.28, verbose=False)[0]

                for box in b_res.boxes:
                    cls_idx = int(box.cls[0])
                    raw_name = b_model.names.get(cls_idx, f"class_{cls_idx}")
                    conf = float(box.conf[0])
                    xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
                    xyxyn = [round(x, 4) for x in box.xyxyn[0].tolist()] if hasattr(box, 'xyxyn') else [0,0,0,0]

                    # NMS Suppression of duplicate boxes on same location
                    if any(compute_iou(xyxy, b['box']) > 0.40 for b in bio_detections):
                        continue

                    # Physical volume and weight metrics per detected item
                    unit_info = PHYSICAL_UNIT_MAP.get(raw_name, {'volume_l': 0.20, 'weight_g': 20.0})
                    bio_volume_l += unit_info['volume_l']
                    bio_weight_g += unit_info['weight_g']

                    meta = BIOMEDICAL_CLASS_MAP.get(raw_name, {
                        'name': raw_name,
                        'category': 'Medical Waste',
                        'polymer': 'Clinical Biohazard Polymer',
                        'stream': 'YELLOW STREAM — Biohazard Special Handling',
                        'color': '#f59e0b',
                        'bg_color': '#b45309',
                        'severity': 'High'
                    })

                    # Realistic un-inflated confidence percentage
                    conf_pct = round(conf * 100.0, 1)
                    bio_confidences.append(conf_pct)
                    bio_detections.append({
                        "classId": cls_idx,
                        "rawClass": raw_name,
                        "label": meta['name'],
                        "category": meta['category'],
                        "polymer": meta['polymer'],
                        "stream": meta['stream'],
                        "color": meta['color'],
                        "bg_color": meta.get('bg_color', '#b45309'),
                        "severity": meta.get('severity', 'High'),
                        "confidence": conf_pct,
                        "volumeLiters": unit_info['volume_l'],
                        "weightGrams": unit_info['weight_g'],
                        "box": xyxy,
                        "normalizedBox": xyxyn
                    })
            except Exception as be:
                print(f"[Biomedical Model Warning] {be}", file=sys.stderr)

        # 2. Run Plastic Model & De-Overlap (conf=0.35 for clean plastic capture)
        plastic_detections = []
        plastic_confidences = []
        plastic_volume_l = 0.0
        plastic_weight_g = 0.0

        if plastic_path and os.path.exists(plastic_path):
            try:
                p_model = YOLO(plastic_path)
                p_res = p_model(img, conf=0.35, verbose=False)[0]

                for box in p_res.boxes:
                    cls_idx = int(box.cls[0])
                    raw_name = p_model.names.get(cls_idx, f"class_{cls_idx}")
                    conf = float(box.conf[0])
                    xyxy = [round(x, 1) for x in box.xyxy[0].tolist()]
                    xyxyn = [round(x, 4) for x in box.xyxyn[0].tolist()] if hasattr(box, 'xyxyn') else [0,0,0,0]

                    # If this plastic box overlaps with a verified biohazard (e.g. syringe, glove), biohazard takes precedence
                    if any(compute_iou(xyxy, b['box']) > 0.25 for b in bio_detections):
                        continue

                    # NMS Suppression of duplicate boxes within plastic model
                    if any(compute_iou(xyxy, p['box']) > 0.40 for p in plastic_detections):
                        continue

                    # Physical volume and weight metrics per detected item
                    unit_info = PHYSICAL_UNIT_MAP.get(raw_name, {'volume_l': 0.60, 'weight_g': 40.0})
                    plastic_volume_l += unit_info['volume_l']
                    plastic_weight_g += unit_info['weight_g']

                    meta = PLASTIC_CLASS_MAP.get(raw_name, {
                        'name': raw_name.replace('_', ' ').title(),
                        'category': 'Plastic Waste',
                        'polymer': 'Polymer Composite',
                        'stream': 'Dry Waste → Plastic Recycling',
                        'color': '#0284c7',
                        'bg_color': '#0284c7'
                    })

                    # Realistic un-inflated confidence percentage
                    conf_percent = round(conf * 100.0, 1)
                    plastic_confidences.append(conf_percent)
                    plastic_detections.append({
                        "classId": cls_idx,
                        "rawClass": raw_name,
                        "label": meta['name'],
                        "category": meta['category'],
                        "polymer": meta['polymer'],
                        "stream": meta['stream'],
                        "color": meta['color'],
                        "bg_color": meta.get('bg_color', '#0284c7'),
                        "confidence": conf_percent,
                        "volumeLiters": unit_info['volume_l'],
                        "weightGrams": unit_info['weight_g'],
                        "box": xyxy,
                        "normalizedBox": xyxyn
                    })
            except Exception as pe:
                print(f"[Plastic Model Warning] {pe}", file=sys.stderr)

        # Verify genuine waste vs indoor/personal scene false positives
        has_confirmed_sharps = any(d['confidence'] >= 60.0 and any(s in d['label'] for s in ['Syringe', 'Needle', 'Glove']) for d in bio_detections)
        has_confirmed_plastic = any(d['confidence'] >= 65.0 for d in plastic_detections) or (len(plastic_detections) >= 5 and sum(d['confidence'] for d in plastic_detections)/len(plastic_detections) >= 50.0)

        is_flagged_invalid = False
        invalid_reason = ""
        if is_personal_indoor_scene and not has_confirmed_sharps and not has_confirmed_plastic:
            # Indoor/personal scene with no confirmed civic garbage: reject false positive noise!
            bio_detections = []
            bio_confidences = []
            plastic_detections = []
            plastic_confidences = []
            bio_volume_l = 0.0
            bio_weight_g = 0.0
            plastic_volume_l = 0.0
            plastic_weight_g = 0.0
            is_flagged_invalid = True
            invalid_reason = f"Image appears to be an indoor/personal photo ({', '.join(set(indoor_elements)) if indoor_elements else 'indoor scene'}). No municipal or biomedical waste detected."

        # 3. MERGE ALL DETECTIONS & COMPUTE PHYSICAL PINPOINTED AMOUNTS
        all_detections = bio_detections + plastic_detections
        all_confidences = bio_confidences + plastic_confidences
        total_items = len(all_detections)

        bio_boxes = [d['box'] for d in bio_detections]
        plastic_boxes = [d['box'] for d in plastic_detections]
        all_boxes = bio_boxes + plastic_boxes

        bio_box_coverage = compute_box_union_coverage(bio_boxes, img_w, img_h)
        plastic_box_coverage = compute_box_union_coverage(plastic_boxes, img_w, img_h)
        ewaste_box_coverage = 0.0 # Standard e-waste coverage when applicable
        total_coverage_percent = compute_box_union_coverage(all_boxes, img_w, img_h)

        # Accurate physical volume and weight totals
        total_volume_liters = round(plastic_volume_l + bio_volume_l, 2)
        total_volume_m3 = round(total_volume_liters / 1000.0, 4)
        total_weight_kg = round((plastic_weight_g + bio_weight_g) / 1000.0, 2)
        total_weight_grams = round(plastic_weight_g + bio_weight_g, 1)

        # Sizing recommendations for collection logistics
        if total_volume_liters <= 0:
            container_req = "No container required (Zero waste detected)"
            human_volume = "0.0 Liters (0 grams)"
        elif total_volume_liters < 5.0:
            container_req = f"Small civic basket / 0.5× 10L bag ({total_volume_liters}L)"
            human_volume = f"{total_volume_liters} Liters (~{int(total_weight_grams)}g)"
        elif total_volume_liters < 25.0:
            bags = max(1, round(total_volume_liters / 10.0, 1))
            container_req = f"{bags}× Standard 10L Civic Collection Bags"
            human_volume = f"{total_volume_liters} Liters (~{total_weight_kg} kg)"
        elif total_volume_liters < 100.0:
            sacks = max(1, round(total_volume_liters / 50.0, 1))
            container_req = f"{sacks}× 50L Heavy-Duty Municipal Sacks"
            human_volume = f"{total_volume_liters} Liters (~{total_weight_kg} kg)"
        else:
            bins = max(1, round(total_volume_liters / 120.0, 1))
            container_req = f"{bins}× 120L Hydraulic Compactor Bins"
            human_volume = f"{total_volume_liters} Liters / {total_volume_m3} m³ (~{total_weight_kg} kg)"

        plastic_count = len(plastic_detections)
        bio_count = len(bio_detections)

        # Counts by class
        plastic_counts_by_class = {}
        for d in plastic_detections:
            plastic_counts_by_class[d['label']] = plastic_counts_by_class.get(d['label'], 0) + 1

        bio_counts_by_class = {}
        for d in bio_detections:
            bio_counts_by_class[d['label']] = bio_counts_by_class.get(d['label'], 0) + 1

        total_counts_by_class = {**plastic_counts_by_class, **bio_counts_by_class}

        # 4. Draw Combined Annotated Image with ALL Bounding Boxes
        annotated_b64 = None
        if total_items > 0:
            try:
                annotated_img = draw_combined_boxes(img, all_detections)
                buffered = io.BytesIO()
                annotated_img.save(buffered, format="JPEG", quality=85)
                annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode('utf-8')
            except Exception as plot_err:
                print(f"[Plot Warning] {plot_err}", file=sys.stderr)

        # 5. Waste Classification & Multi-Stream Resolution
        has_sharps = any('Sharps' in d['label'] or 'Needle' in d['label'] or 'Syringe' in d['label'] for d in bio_detections)
        
        if bio_count > 0:
            # If medical items are prominent or include hazardous clinical sharps
            if plastic_count == 0 or bio_count >= 2 or has_sharps or bio_box_coverage >= (plastic_box_coverage * 0.20):
                primary_category = "Medical Waste"
                primary_categoryId = "02"
                active_model = "YOLOv8 Biomedical Waste Detector (best.pt)"
                segregation_stream = bio_detections[0]['stream'] if bio_detections else "YELLOW STREAM — Biohazard Sharps Incineration & Special Handling"
                recommended_team = "Squad Bravo (Biohazard & Medical Waste Unit)"
                recommended_action = f"Deploy sealed puncture-proof containers for {round(bio_volume_l, 2)}L ({round(bio_weight_g, 1)}g) of biohazard waste."
                condition = "Biohazardous medical waste accumulation" if has_sharps else "Clinical medical waste dumping"
            else:
                primary_category = "Mixed Municipal Waste (Plastic & Biomedical)"
                primary_categoryId = "05"
                active_model = "CleanTrack Multi-Vision Ensemble (Plastic best.pt + Biomedical best.pt)"
                segregation_stream = "DUAL STREAM — Dry Waste (Recycling) + Red/Yellow (Biohazard Incineration)"
                recommended_team = "Squad Alpha (Compactor) & Squad Bravo (Biohazard Sharps Unit)"
                recommended_action = f"Execute dual-team dispatch: Priority biohazard sterilization ({round(bio_volume_l, 1)}L) followed by compactor dry plastic recovery ({round(plastic_volume_l, 1)}L)."
                condition = "Mixed municipal garbage dump with hazardous clinical waste"
        elif plastic_count > 0:
            primary_category = "Plastic Waste"
            primary_categoryId = "01"
            active_model = "YOLOv8 Plastic Waste Detection (best.pt)"
            segregation_stream = "Dry Waste → Plastic Polymer Recycling"
            recommended_team = "Squad Alpha (Plastic & Dry Waste Compactor)"
            recommended_action = f"Deploy Hydraulic Compactor unit for {round(plastic_volume_l, 2)}L (~{round(plastic_weight_g/1000.0, 2)} kg) segregated dry plastic recovery."
            condition = "Large roadside plastic accumulation" if plastic_count >= 8 else ("Moderate roadside plastic litter" if plastic_count >= 3 else "Isolated plastic litter")
        else:
            primary_category = "Clean / No Waste Detected"
            primary_categoryId = "00"
            active_model = "CleanTrack Dual Vision Guard"
            segregation_stream = "Standard Area — No Action Required"
            recommended_team = "General Sanitation Route (Routine Check)"
            recommended_action = "No prominent plastic or medical waste detected. Image appears clean or unrelated to civic garbage."
            condition = "No significant waste accumulation detected"

        # 6. EXACT USER-SPECIFIED SEVERITY CRITERIA:
        # - CRITICAL: Plastic > 70% | Medical > 40% (or clinical sharps >= 2) | E-Waste > 20% | (Plastic + Medical) > 50% | (Plastic + Medical + E-Waste) > 50%
        # Count clinical sharps specifically (Syringe, Needle, Test Tube)
        sharps_count = sum(1 for d in bio_detections if any(s in d['label'] for s in ['Syringe', 'Needle', 'Test Tube']))

        if total_items > 0:
            top1_conf = max(all_confidences)
            overall_confidence = round(top1_conf, 1)
            avg_conf = round(sum(all_confidences) / len(all_confidences), 1)

            # 1. CRITICAL Priority (Immediate Siren Dispatch)
            # - Plastic > 70% | Medical > 40% (or clinical sharps >= 2) | E-Waste > 20% | (Plastic + Medical) > 50% | (Plastic + Medical + E-Waste) > 50%
            is_critical = (
                plastic_box_coverage > 70.0 or
                bio_box_coverage > 40.0 or
                sharps_count >= 2 or
                ewaste_box_coverage > 20.0 or
                (plastic_box_coverage + bio_box_coverage) > 50.0 or
                total_coverage_percent > 50.0
            )

            # 2. HIGH Priority (Within 4 Hours)
            # - Plastic: > 40% (and <= 70%) | Medical: > 20% (and <= 40%) | E-Waste: > 10% (and <= 20%) | Total Combined: > 30% (and <= 50%) | (or clinical sharps == 1)
            is_high = not is_critical and (
                (plastic_box_coverage > 40.0 and plastic_box_coverage <= 70.0) or
                (bio_box_coverage > 20.0 and bio_box_coverage <= 40.0) or
                (ewaste_box_coverage > 10.0 and ewaste_box_coverage <= 20.0) or
                (total_coverage_percent > 30.0 and total_coverage_percent <= 50.0) or
                sharps_count == 1 or
                total_items >= 8
            )

            # 3. MEDIUM Priority (Standard Shift Route)
            # - Plastic: > 15% (and <= 40%) | Medical: > 5% (and <= 20%) | E-Waste: > 5% (and <= 10%) | Total Combined: > 10% (or 3 to 7 roadside items, like small litter piles)
            is_medium = not is_critical and not is_high and (
                (plastic_box_coverage > 15.0 and plastic_box_coverage <= 40.0) or
                (bio_box_coverage > 5.0 and bio_box_coverage <= 20.0) or
                (ewaste_box_coverage > 5.0 and ewaste_box_coverage <= 10.0) or
                (total_coverage_percent > 10.0 and total_coverage_percent <= 30.0) or
                (total_items >= 3 and total_items <= 7)
            )

            if is_critical:
                severity = "Critical"
                waste_type_score = 30
                visual_extent_score = min(30, int(15 + total_coverage_percent * 0.25))
                location_score = 25
                recurrence_score = 15
                time_score = 5
                priority_score = min(98, waste_type_score + visual_extent_score + location_score + recurrence_score + time_score)
            elif is_high:
                severity = "High"
                waste_type_score = 22 if bio_count > 0 else 18
                visual_extent_score = min(25, int(10 + total_coverage_percent * 0.35))
                location_score = 20
                recurrence_score = 12
                time_score = 5
                priority_score = min(79, waste_type_score + visual_extent_score + location_score + recurrence_score + time_score)
            elif is_medium:
                severity = "Medium"
                waste_type_score = 12
                visual_extent_score = min(18, int(6 + total_coverage_percent * 0.40))
                location_score = 15
                recurrence_score = 10
                time_score = 5
                priority_score = min(62, waste_type_score + visual_extent_score + location_score + recurrence_score + time_score)
            else:
                severity = "Low"
                waste_type_score = 8
                visual_extent_score = min(10, int(3 + total_coverage_percent * 0.50))
                location_score = 10
                recurrence_score = 5
                time_score = 5
                priority_score = min(38, waste_type_score + visual_extent_score + location_score + recurrence_score + time_score)

            subtype_parts = []
            if plastic_count > 0:
                top_p = ", ".join([f"{count}x {name}" for name, count in list(plastic_counts_by_class.items())[:2]])
                subtype_parts.append(f"{plastic_count} Plastic ({top_p} • {round(plastic_volume_l, 1)}L)")
            if bio_count > 0:
                top_b = ", ".join([f"{count}x {name}" for name, count in list(bio_counts_by_class.items())[:2]])
                subtype_parts.append(f"{bio_count} Medical ({top_b} • {round(bio_volume_l, 2)}L)")
            subtype_summary = " | ".join(subtype_parts) if subtype_parts else "Waste items identified"
        else:
            overall_confidence = 0.0
            avg_conf = 0.0
            priority_score = 10
            severity = "Low"
            waste_type_score = 0
            visual_extent_score = 0
            location_score = 5
            recurrence_score = 3
            time_score = 2
            subtype_summary = "No plastic or medical waste objects detected in frame"

        return {
            "success": True,
            "model": active_model,
            "category": primary_category,
            "categoryId": primary_categoryId,
            "subtype": subtype_summary,
            "confidence": overall_confidence,
            "averageConfidence": avg_conf,
            
            # Pinpointed Physical Volume & Weight Metrics
            "estimatedVolumeLiters": total_volume_liters,
            "estimatedVolumeM3": total_volume_m3,
            "estimatedWeightKg": total_weight_kg,
            "estimatedWeightGrams": total_weight_grams,
            "plasticVolumeLiters": round(plastic_volume_l, 2),
            "plasticWeightKg": round(plastic_weight_g / 1000.0, 2),
            "medicalVolumeLiters": round(bio_volume_l, 2),
            "medicalWeightKg": round(bio_weight_g / 1000.0, 2),
            "ewasteVolumeLiters": 0.0,
            "ewasteWeightKg": 0.0,
            "containerRequirement": container_req,
            "humanReadableVolume": human_volume,

            # Percentage coverage metrics
            "wasteCoveragePercent": total_coverage_percent,
            "plasticCoveragePercent": plastic_box_coverage,
            "medicalCoveragePercent": bio_box_coverage,
            "ewasteCoveragePercent": ewaste_box_coverage,
            
            "totalItemsDetected": total_items,
            "detections": all_detections,
            "plasticDetectionsCount": plastic_count,
            "biomedicalDetectionsCount": bio_count,
            "plasticCountsByClass": plastic_counts_by_class,
            "biomedicalCountsByClass": bio_counts_by_class,
            "countsByClass": total_counts_by_class,
            "annotatedImage": annotated_b64,
            "condition": condition,
            "conditionId": "mixed_waste_dumping" if (bio_count > 0 and plastic_count > 0) else ("biohazard_dumping" if bio_count > 0 else "roadside_dumping"),
            "segregationStream": segregation_stream,
            "severity": severity,
            "aiPriorityScore": priority_score,
            "severityBreakdown": {
                "wasteTypeScore": waste_type_score,
                "visualExtentScore": visual_extent_score,
                "locationSensitivityScore": location_score,
                "recurrenceScore": recurrence_score,
                "timeFactorScore": time_score
            },
            "isFlaggedInvalid": is_flagged_invalid,
            "invalidReason": invalid_reason,
            "recommendation": {
                "action": recommended_action,
                "recommendedTeam": recommended_team,
                "disclaimer": "Real-time dual neural vision inference by CleanTrack (YOLOv8 Plastic + Biomedical Models)."
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:
                pass

if __name__ == '__main__':
    if len(sys.argv) > 1:
        input_data = sys.argv[1]
        result = analyze_image(input_data)
        print(json.dumps(result))
    else:
        raw = sys.stdin.read().strip()
        if raw:
            img = raw
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, dict):
                    img = parsed.get('image') or parsed.get('imageUrl') or parsed.get('imageFile') or raw
            except Exception:
                img = raw
            res = analyze_image(img)
            print(json.dumps(res))
        else:
            print(json.dumps({"success": False, "error": "No image input provided"}))
