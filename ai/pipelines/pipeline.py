"""
CleanTrack AI - Hierarchical Two-Stage Waste Analysis Pipeline
Unifies:
  Stage 1: Fast Scene Gatekeeper (MobileNetV3 / Scene Context heuristics)
  Stage 2: Multi-Object Waste Detector (11 CleanTrack classes + Soft-NMS)
  Stage 3: Waste Condition & Environmental Context Analyzer
  Stage 4: Multi-Factor Severity & Priority Scoring Engine
  Stage 5: Municipal Action & Worker Safety Recommendation Engine
"""

import os
import sys
import time
import base64
import io
import urllib.request
from typing import Dict, Any, Optional, Union
from PIL import Image, ImageDraw, ImageFont

from backend.ai_engine.stage1_gatekeeper import Stage1Gatekeeper
from backend.ai_engine.stage2_detector import Stage2Detector, compute_box_union_coverage
from backend.ai_engine.condition_analyzer import ConditionAnalyzer
from backend.ai_engine.severity_engine import SeverityEngine
from backend.ai_engine.municipal_action import MunicipalActionEngine


def draw_annotated_canvas(base_img: Image.Image, detections: list) -> Image.Image:
    """Draws clear, non-overlapping bounding boxes, segmentation masks, and labeled category tags."""
    if not detections:
        return base_img
    annotated = base_img.convert("RGBA")
    overlay = Image.new("RGBA", annotated.size, (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw = ImageDraw.Draw(annotated)
    img_w, img_h = base_img.size

    for det in detections:
        border_color = det.get('color', '#0ea5e9')
        bg_color = det.get('bg_color', border_color)

        # 1. Draw segmentation polygon if available (from Roboflow instance segmentation)
        points = det.get('points') or det.get('polygon')
        if points and isinstance(points, list) and len(points) >= 3:
            poly_tuples = [(int(p[0]), int(p[1])) for p in points if len(p) >= 2]
            if len(poly_tuples) >= 3:
                try:
                    h = border_color.lstrip('#')
                    rgb = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
                    fill_rgba = (rgb[0], rgb[1], rgb[2], 75)
                    outline_rgba = (rgb[0], rgb[1], rgb[2], 230)
                    draw_overlay.polygon(poly_tuples, fill=fill_rgba, outline=outline_rgba)
                except Exception:
                    pass

        # 2. Draw bounding box and label tag badge
        box = det.get('box', [])
        if len(box) < 4:
            continue
        x1, y1, x2, y2 = [int(v) for v in box]
        x1 = max(0, min(img_w - 1, x1))
        y1 = max(0, min(img_h - 1, y1))
        x2 = max(0, min(img_w - 1, x2))
        y2 = max(0, min(img_h - 1, y2))

        label_text = f"{det.get('label', 'Waste')} {det.get('confidence', 0)}%"

        # Box outline
        draw.rectangle([x1, y1, x2, y2], outline=border_color, width=3)

        # Label tag badge
        text_w = min(img_w - x1, max(80, len(label_text) * 7 + 10))
        text_h = 16
        badge_y1 = max(0, y1 - text_h)
        badge_y2 = badge_y1 + text_h

        draw.rectangle([x1, badge_y1, x1 + text_w, badge_y2], fill=bg_color)
        draw.text((x1 + 4, badge_y1 + 2), label_text, fill='#ffffff')

    # Composite alpha overlay for smooth segmentation masks
    final_img = Image.alpha_composite(annotated, overlay).convert("RGB")
    return final_img



def image_to_base64_jpeg(img: Image.Image, quality: int = 85) -> str:
    """Encodes PIL image to Base64 JPEG data URL."""
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG", quality=quality)
    img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return f"data:image/jpeg;base64,{img_b64}"


class CleanTrackPipeline:
    """
    Main Hierarchical Pipeline Orchestrator.
    """

    def __init__(self,
                 stage1_weights: Optional[str] = None,
                 biomedical_weights: Optional[str] = None,
                 plastic_weights: Optional[str] = None,
                 ewaste_weights: Optional[str] = None,
                 degradable_weights: Optional[str] = None,
                 general_weights: Optional[str] = None,
                 roboflow_model_id: Optional[str] = None,
                 roboflow_api_key: Optional[str] = None,
                 roboflow_ewaste_model_id: Optional[str] = None,
                 roboflow_ewaste_api_key: Optional[str] = None):
        self.stage1_gatekeeper = Stage1Gatekeeper(weights_path=stage1_weights, general_yolo_path=general_weights)
        self.stage2_detector = Stage2Detector(
            biomedical_model_path=biomedical_weights,
            plastic_model_path=plastic_weights,
            ewaste_model_path=ewaste_weights,
            degradable_model_path=degradable_weights,
            general_model_path=general_weights,
            roboflow_model_id=roboflow_model_id,
            roboflow_api_key=roboflow_api_key,
            roboflow_ewaste_model_id=roboflow_ewaste_model_id,
            roboflow_ewaste_api_key=roboflow_ewaste_api_key
        )
        self.condition_analyzer = ConditionAnalyzer()
        self.severity_engine = SeverityEngine()
        self.municipal_action_engine = MunicipalActionEngine()

    def process_image(self, image_input: Union[str, Image.Image]) -> Dict[str, Any]:
        """
        Processes an image through the full two-stage hierarchical pipeline.
        """
        pipeline_start = time.time()

        # 1. Load image
        img = None
        if isinstance(image_input, Image.Image):
            img = image_input.convert('RGB')
        elif isinstance(image_input, str):
            image_input = image_input.strip()
            if image_input.startswith(('http://', 'https://')):
                req = urllib.request.Request(image_input, headers={'User-Agent': 'CleanTrack-AI/2.0'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    img = Image.open(io.BytesIO(response.read())).convert('RGB')
            elif image_input.startswith('data:image'):
                _, encoded = image_input.split(',', 1)
                img = Image.open(io.BytesIO(base64.b64decode(encoded))).convert('RGB')
            else:
                candidates = [
                    image_input,
                    os.path.abspath(image_input),
                    os.path.join(os.getcwd(), image_input.lstrip('/\\')),
                    os.path.join(os.path.dirname(os.path.dirname(__file__)), image_input.lstrip('/\\')),
                    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), image_input.lstrip('/\\')),
                    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'public', image_input.lstrip('/\\'))
                ]
                for c in candidates:
                    if os.path.exists(c) and os.path.isfile(c):
                        img = Image.open(c).convert('RGB')
                        break
                if not img:
                    try:
                        img = Image.open(io.BytesIO(base64.b64decode(image_input))).convert('RGB')
                    except Exception:
                        return {"success": False, "error": f"Image file not found: {image_input}"}

        if not img:
            return {"success": False, "error": "Unable to read input image"}

        img_w, img_h = img.size

        # 2. STAGE 1: Fast Scene Gatekeeper
        s1_res = self.stage1_gatekeeper.evaluate(img)

        # If Stage 1 decides NO_WASTE (clean room, bed, desk, selfie), early-exit!
        if s1_res["should_exit_early"]:
            total_time_ms = round((time.time() - pipeline_start) * 1000.0, 2)
            annotated_b64 = image_to_base64_jpeg(img)
            return {
                "success": True,
                "model": "CleanTrack 2.0 Hierarchical Vision Pipeline",
                "pipelineVersion": "2.0-hierarchical",
                "stage1": s1_res,
                "stage2": {"skipped": True, "reason": "Stage 1 early exit on clean scene"},
                "wasteFound": False,
                "category": "Clean / No Waste Detected",
                "categoryKey": "clean_area",
                "subtype": "Clean Scene / Non-Waste",
                "confidence": 0.0,
                "averageConfidence": 0.0,
                "totalItemsDetected": 0,
                "countsByClass": {},
                "plasticCountsByClass": {},
                "biomedicalCountsByClass": {},
                "ewasteCountsByClass": {},
                "biodegradableCountsByClass": {},
                "degradableCountsByClass": {},
                "nonBiodegradableCountsByClass": {},
                "plasticDetectionsCount": 0,
                "biomedicalDetectionsCount": 0,
                "ewasteDetectionsCount": 0,
                "biodegradableDetectionsCount": 0,
                "degradableDetectionsCount": 0,
                "nonBiodegradableDetectionsCount": 0,
                "totalCoveragePercent": 0.0,
                "plasticCoveragePercent": 0.0,
                "medicalCoveragePercent": 0.0,
                "ewasteCoveragePercent": 0.0,
                "biodegradableCoveragePercent": 0.0,
                "biodegradabilityAnalysis": {
                    "isBiodegradable": False,
                    "isPureBiodegradable": False,
                    "isMixed": False,
                    "biodegradableCount": 0,
                    "nonBiodegradableCount": 0,
                    "biodegradableCoveragePercent": 0.0,
                    "streamVerdict": "None (Clean Scene)",
                    "decompositionTimeline": "N/A",
                    "primaryDisposal": "N/A",
                    "circularAction": "NONE"
                },
                "circularEconomy": {
                    "action": "NONE",
                    "disposalStream": "Clean Area",
                    "decompositionTimeline": "N/A",
                    "landfillDiversionRate": "100%",
                    "carbonAvoidance": "Zero Waste Area"
                },
                "totalVolumeLiters": 0.0,
                "estimatedVolumeLiters": 0.0,
                "totalVolumeM3": 0.0,
                "estimatedVolumeM3": 0.0,
                "totalWeightKg": 0.0,
                "estimatedWeightKg": 0.0,
                "estimatedWeightGrams": 0.0,
                "plasticVolumeLiters": 0.0,
                "plasticWeightKg": 0.0,
                "medicalVolumeLiters": 0.0,
                "medicalWeightKg": 0.0,
                "containerRequirement": "None required (Clean scene)",
                "segregationStream": "None (Clean Scene)",
                "priority": "Low",
                "severity": "Low",
                "severityScore": 10,
                "aiPriorityScore": 10,
                "urgency": "Low Priority / Routine Monitoring",
                "severityBreakdown": {
                    "wasteTypeScore": 0,
                    "visualExtentScore": 0,
                    "locationSensitivityScore": 5,
                    "recurrenceScore": 0,
                    "timeFactorScore": 5
                },
                "isFlaggedInvalid": True,
                "invalidReason": s1_res["reason"],
                "manualTriageFlag": False,
                "condition": {
                    "conditionType": "clean_area",
                    "conditionLabel": "Clean / No Litter Present",
                    "densityIndex": 0.0,
                    "spatialSpread": "none",
                    "drainageBlockageRisk": False,
                    "fireHazardRisk": False,
                    "description": s1_res["reason"]
                },
                "municipalAction": {
                    "targetSLA": "Routine: Within 48 Hours",
                    "crewRecommendation": "Routine Ward Sweeper (1 Worker)",
                    "mandatoryPPE": ["Standard Sanitation Gloves"],
                    "requiredEquipment": ["Standard Broom"],
                    "disposalFacility": ["N/A - Clean Area"],
                    "actionSummary": "No municipal waste cleanup action required. Photo verified clean."
                },
                "recommendation": {
                    "action": "No municipal cleanup required. Image identified as clean / personal setting.",
                    "recommendedTeam": "Routine Ward Sweeper (1 Worker)",
                    "mandatoryPPE": ["Standard Sanitation Gloves"],
                    "requiredEquipment": ["Standard Broom"],
                    "targetSLA": "Routine: Within 48 Hours",
                    "disposalFacility": ["N/A - Clean Area"],
                    "disclaimer": "CleanTrack 2.0 Hierarchical Pipeline (Stage 1 Scene Gatekeeper)."
                },
                "detections": [],
                "annotatedImage": annotated_b64,
                "totalPipelineLatencyMs": total_time_ms
            }

        # 3. STAGE 2: Multi-Object Waste Detector
        s2_res = self.stage2_detector.detect(img)

        # Context Double-Check: If Stage 1 flagged personal/indoor but didn't early exit,
        # verify if Stage 2 found any high-confidence verified waste.
        # If not, reject false alarm.
        has_verified_sharps = s2_res["sharpsCount"] > 0
        has_verified_medical = (
            s2_res.get("medicalCoveragePercent", 0) > 0 or 
            s2_res.get("medicalDetectionsCount", 0) > 0 or 
            (isinstance(s2_res.get("medicalClassifier"), dict) and s2_res["medicalClassifier"].get("is_medical", False) and s2_res["medicalClassifier"].get("confidence", 0) >= 55.0)
        )
        has_verified_ewaste = s2_res.get("ewasteCoveragePercent", 0) > 0 or s2_res.get("ewasteDetectionsCount", 0) > 0
        has_strong_plastic = any(d['confidence'] >= 65.0 and d.get('classId') == 1 for d in s2_res["detections"])
        is_spurious_indoor_alarm = (s1_res["is_personal_indoor"] and not has_verified_sharps and not has_verified_medical and not has_verified_ewaste and not has_strong_plastic)

        if is_spurious_indoor_alarm:
            total_time_ms = round((time.time() - pipeline_start) * 1000.0, 2)
            annotated_b64 = image_to_base64_jpeg(img)
            return {
                "success": True,
                "model": "CleanTrack 2.0 Hierarchical Vision Pipeline",
                "pipelineVersion": "2.0-hierarchical",
                "stage1": s1_res,
                "stage2": {"suppressed": True, "reason": "Indoor noise suppressed"},
                "wasteFound": False,
                "category": "Clean / No Waste Detected",
                "categoryKey": "clean_area",
                "subtype": "Clean Scene / Non-Waste",
                "confidence": 0.0,
                "averageConfidence": 0.0,
                "totalItemsDetected": 0,
                "countsByClass": {},
                "plasticCountsByClass": {},
                "biomedicalCountsByClass": {},
                "ewasteCountsByClass": {},
                "biodegradableCountsByClass": {},
                "degradableCountsByClass": {},
                "nonBiodegradableCountsByClass": {},
                "plasticDetectionsCount": 0,
                "biomedicalDetectionsCount": 0,
                "ewasteDetectionsCount": 0,
                "biodegradableDetectionsCount": 0,
                "degradableDetectionsCount": 0,
                "nonBiodegradableDetectionsCount": 0,
                "totalCoveragePercent": 0.0,
                "plasticCoveragePercent": 0.0,
                "medicalCoveragePercent": 0.0,
                "ewasteCoveragePercent": 0.0,
                "biodegradableCoveragePercent": 0.0,
                "biodegradabilityAnalysis": {
                    "isBiodegradable": False,
                    "isPureBiodegradable": False,
                    "isMixed": False,
                    "biodegradableCount": 0,
                    "nonBiodegradableCount": 0,
                    "biodegradableCoveragePercent": 0.0,
                    "streamVerdict": "None (Clean Scene)",
                    "decompositionTimeline": "N/A",
                    "primaryDisposal": "N/A",
                    "circularAction": "NONE"
                },
                "circularEconomy": {
                    "action": "NONE",
                    "disposalStream": "Clean Area",
                    "decompositionTimeline": "N/A",
                    "landfillDiversionRate": "100%",
                    "carbonAvoidance": "Zero Waste Area"
                },
                "totalVolumeLiters": 0.0,
                "estimatedVolumeLiters": 0.0,
                "totalVolumeM3": 0.0,
                "estimatedVolumeM3": 0.0,
                "totalWeightKg": 0.0,
                "estimatedWeightKg": 0.0,
                "estimatedWeightGrams": 0.0,
                "plasticVolumeLiters": 0.0,
                "plasticWeightKg": 0.0,
                "medicalVolumeLiters": 0.0,
                "medicalWeightKg": 0.0,
                "containerRequirement": "None required (Clean scene)",
                "segregationStream": "None (Clean Scene)",
                "priority": "Low",
                "severity": "Low",
                "severityScore": 10,
                "aiPriorityScore": 10,
                "urgency": "Low Priority / Routine Monitoring",
                "severityBreakdown": {
                    "wasteTypeScore": 0,
                    "visualExtentScore": 0,
                    "locationSensitivityScore": 5,
                    "recurrenceScore": 0,
                    "timeFactorScore": 5
                },
                "isFlaggedInvalid": True,
                "invalidReason": ("Clean civic park / public infrastructure detected (bench). No municipal waste accumulation." if 'bench' in s1_res.get('indoor_elements', []) else f"Image appears to be an indoor personal scene ({', '.join(s1_res['indoor_elements'])}). No civic waste detected."),
                "manualTriageFlag": False,
                "condition": {
                    "conditionType": "clean_area",
                    "conditionLabel": "Clean / No Litter Present",
                    "densityIndex": 0.0,
                    "spatialSpread": "none",
                    "drainageBlockageRisk": False,
                    "fireHazardRisk": False,
                    "description": "Clean indoor environment."
                },
                "municipalAction": {
                    "targetSLA": "Routine: Within 48 Hours",
                    "crewRecommendation": "Routine Ward Sweeper (1 Worker)",
                    "mandatoryPPE": ["Standard Gloves"],
                    "requiredEquipment": ["Standard Broom"],
                    "disposalFacility": ["N/A - Clean Area"],
                    "actionSummary": "No municipal waste cleanup action required."
                },
                "recommendation": {
                    "action": "No municipal cleanup required. Image identified as indoor setting.",
                    "recommendedTeam": "Routine Ward Sweeper (1 Worker)",
                    "mandatoryPPE": ["Standard Gloves"],
                    "requiredEquipment": ["Standard Broom"],
                    "targetSLA": "Routine: Within 48 Hours",
                    "disposalFacility": ["N/A - Clean Area"],
                    "disclaimer": "CleanTrack 2.0 Hierarchical Pipeline (Stage 1 Scene Gatekeeper)."
                },
                "detections": [],
                "annotatedImage": annotated_b64,
                "totalPipelineLatencyMs": total_time_ms
            }

        # 4. STAGE 3: Condition Analysis
        condition_info = self.condition_analyzer.analyze(
            detections=s2_res["detections"],
            total_coverage_percent=s2_res["totalCoveragePercent"],
            img_width=img_w,
            img_height=img_h,
            scene_tags=s1_res.get("scene_tags", [])
        )

        # 5. STAGE 4: Severity & Priority Scoring
        severity_info = self.severity_engine.evaluate(
            total_coverage=s2_res["totalCoveragePercent"],
            plastic_coverage=s2_res["plasticCoveragePercent"],
            medical_coverage=s2_res["medicalCoveragePercent"],
            ewaste_coverage=s2_res["ewasteCoveragePercent"],
            sharps_count=s2_res["sharpsCount"],
            condition_info=condition_info,
            is_clean_or_invalid=False
        )

        # 6. STAGE 5: Municipal Action Recommendations
        municipal_info = self.municipal_action_engine.recommend(
            priority=severity_info["priority"],
            class_breakdown=s2_res["classBreakdown"],
            sharps_count=s2_res["sharpsCount"],
            condition_info=condition_info
        )

        # 7. Class Breakdown & Physical Sizing
        counts_by_class = {}
        plastic_counts = {}
        bio_counts = {}
        ewaste_counts = {}
        biodegradable_counts = {}
        non_biodegradable_counts = {}
        plastic_vol = 0.0
        plastic_wt = 0.0
        bio_vol = 0.0
        bio_wt = 0.0
        ewaste_vol = 0.0
        ewaste_wt = 0.0

        for d in s2_res["detections"]:
            lbl = d["label"]
            cid = d["classId"]
            counts_by_class[lbl] = counts_by_class.get(lbl, 0) + 1

            if d.get("isBiodegradable") or cid in [0, 2]:
                biodegradable_counts[lbl] = biodegradable_counts.get(lbl, 0) + 1
            else:
                non_biodegradable_counts[lbl] = non_biodegradable_counts.get(lbl, 0) + 1

            if cid == 1:
                plastic_counts[lbl] = plastic_counts.get(lbl, 0) + 1
                plastic_vol += d["volumeLiters"]
                plastic_wt += d["weightGrams"] / 1000.0
            elif cid == 8:
                bio_counts[lbl] = bio_counts.get(lbl, 0) + 1
                bio_vol += d["volumeLiters"]
                bio_wt += d["weightGrams"] / 1000.0
            elif cid == 6:
                ewaste_counts[lbl] = ewaste_counts.get(lbl, 0) + 1
                ewaste_vol += d["volumeLiters"]
                ewaste_wt += d["weightGrams"] / 1000.0

        # Sizing / Container Requirement
        tot_vol = s2_res["totalVolumeLiters"]
        m_cov = s2_res.get("medicalCoveragePercent", 0.0)
        p_cov = s2_res.get("plasticCoveragePercent", 0.0)
        e_cov = s2_res.get("ewasteCoveragePercent", 0.0)
        b_cov = s2_res.get("biodegradableCoveragePercent", 0.0)
        has_medical = s2_res["sharpsCount"] > 0 or m_cov > 0 or len(bio_counts) > 0
        has_ewaste = e_cov > 0 or len(ewaste_counts) > 0
        has_plastic = p_cov > 0 or len(plastic_counts) > 0
        has_biodegradable = b_cov > 0 or len(biodegradable_counts) > 0

        if s2_res["sharpsCount"] > 0:
            container_req = "Puncture-Proof Rigid Sharps Box"
        elif has_medical and (m_cov >= 35.0 or m_cov >= p_cov):
            container_req = "Biohazard Yellow Bag / Autoclave Bin"
        elif tot_vol > 50.0:
            container_req = "Large Tipper Truck / Compactor (> 50L)"
        elif tot_vol > 15.0:
            container_req = "Wheelie Bin / Dual Cart (15-50L)"
        elif has_ewaste and (e_cov >= 15.0 or e_cov >= p_cov):
            container_req = "Anti-Static Heavy E-Waste Recycling Bin"
        elif has_biodegradable and sum(biodegradable_counts.values()) > sum(plastic_counts.values()):
            container_req = "Ventilated Green Organic Waste Bin (Composting)"
        elif tot_vol > 2.0:
            container_req = "Heavy Duty Sanitation Bag (2-15L)"
        else:
            container_req = "Standard Handheld Waste Bin (< 2L)"

        # Primary Segregation Stream & Category Label
        # Priority order: Medical Sharps/Bio -> E-Waste -> Biomedical -> Biodegradable/Organic -> Plastic -> Mixed
        ewaste_items_count = sum(ewaste_counts.values())
        plastic_items_count = sum(plastic_counts.values())
        bio_items_count = sum(bio_counts.values())
        biodegradable_items_count = sum(biodegradable_counts.values())

        has_real_sharps = s2_res["sharpsCount"] > 0 and any(
            d.get("isSharps", False) and any(s in d.get("rawClass", "").lower() or s in d.get("label", "").lower() for s in ["syringe", "needle", "ampoule", "vial"])
            for d in s2_res["detections"]
        )

        if has_real_sharps:
            category_label = "Medical Waste"
            category_key = "biomedical_sanitary"
            category_id = "02"
            segregation_stream = "YELLOW/WHITE STREAM — CBWTF Incineration & Autoclaving"
            subtype = "Clinical Sharps & Syringes (Critical Biohazard)"
        elif has_ewaste and (not has_medical or e_cov >= m_cov or ewaste_items_count >= bio_items_count or e_cov >= 15.0):
            category_label = "E-Waste"
            category_key = "ewaste"
            category_id = "03"
            segregation_stream = "GREY STREAM — Authorized E-Waste Dismantler (RoHS/EPR)"
            top_ew = list(ewaste_counts.keys())[0] if ewaste_counts else "Discarded Electronics"
            subtype = f"E-Waste Scrap ({top_ew})"
        elif has_medical and (m_cov >= 20.0 or m_cov >= p_cov or (not has_plastic) or bio_items_count >= plastic_items_count or any('Tissue' in k or 'Pathological' in k or 'Syringe' in k or 'Needle' in k or 'Gauze' in k for k in bio_counts)):
            category_label = "Medical Waste"
            category_key = "biomedical_sanitary"
            category_id = "02"
            segregation_stream = "YELLOW/WHITE STREAM — CBWTF Incineration & Autoclaving"
            top_bio = list(bio_counts.keys())[0] if bio_counts else "Clinical Waste"
            subtype = f"Biomedical Waste ({top_bio})" if not has_plastic else f"Mixed Waste with Clinical Refuse ({top_bio})"
        elif biodegradable_items_count > 0 and (biodegradable_items_count >= plastic_items_count or b_cov >= p_cov or not has_plastic):
            category_label = "Organic / Biodegradable Waste"
            category_key = "organic_wet"
            category_id = "04"
            segregation_stream = "GREEN STREAM — Composting / Biogas Digestion"
            top_bio = list(biodegradable_counts.keys())[0] if biodegradable_counts else "Organic Matter"
            subtype = f"Biodegradable Organic Matter ({top_bio})"
        elif has_plastic:
            category_label = "Plastic Waste"
            category_key = "plastic"
            category_id = "01"
            segregation_stream = "BLUE STREAM — Dry Waste Plastic Recycling (MRF)"
            top_p = list(plastic_counts.keys())[0] if plastic_counts else "Recyclable Polymer Containers"
            subtype = f"Recyclable Plastics ({top_p})"
        elif has_ewaste:
            category_label = "E-Waste"
            category_key = "ewaste"
            category_id = "03"
            segregation_stream = "GREY STREAM — Authorized E-Waste Dismantler (RoHS/EPR)"
            subtype = "Incidental Electronic Waste"
        elif has_medical:
            category_label = "Medical Waste"
            category_key = "biomedical_sanitary"
            category_id = "02"
            segregation_stream = "YELLOW/WHITE STREAM — CBWTF Incineration & Autoclaving"
            subtype = "Incidental Medical Waste"
        elif s2_res["totalItems"] > 0:
            top_det = s2_res["detections"][0]
            category_label = top_det.get("category", "Mixed Solid Waste")
            category_key = top_det.get("categoryKey", "residual_mixed")
            category_id = "05"
            segregation_stream = top_det.get("stream", "Dry Solid Waste Stream")
            subtype = top_det.get("label", "Mixed Municipal Litter")
        else:
            category_label = "Clean / No Waste Detected"
            category_key = "clean_area"
            category_id = "00"
            segregation_stream = "None (Clean Scene)"
            subtype = "Clean Scene"

        # Severity breakdown components for UI meter
        waste_type_score = 45 if s2_res["sharpsCount"] > 0 else (40 if len(bio_counts) > 0 else (35 if len(ewaste_counts) > 0 else (30 if s2_res["plasticCoveragePercent"] > 40 else 20)))
        visual_extent_score = min(30, int(s2_res["totalCoveragePercent"] * 0.6))
        location_score = 15
        recurrence_score = 10
        time_score = 5

        # 8. Biodegradability & Circular Economy Synthesis
        bio_cnt = sum(biodegradable_counts.values())
        non_bio_cnt = sum(non_biodegradable_counts.values())
        bio_cov = s2_res.get("biodegradableCoveragePercent", 0.0)

        if bio_cnt > 0 and non_bio_cnt == 0:
            stream_verdict = "100% Biodegradable & Organic Stream (Decentralized Composting / Biogas)"
            decomp_timeline = "2 to 6 Weeks (Rapid natural organic decomposition)"
            primary_disposal = "Municipal Aerobic Composting Pit / Bio-Methanation"
        elif bio_cnt > 0 and non_bio_cnt > 0:
            total_items = max(1, len(s2_res['detections']))
            bio_ratio = round((bio_cnt / total_items) * 100)
            non_bio_ratio = round((non_bio_cnt / total_items) * 100)
            stream_verdict = f"Mixed Stream ({bio_ratio}% Biodegradable / {non_bio_ratio}% Non-Biodegradable)"
            decomp_timeline = "Mixed (Organic decomposes in weeks; Non-biodegradable lasts centuries)"
            primary_disposal = "Segregation at Source / MRF Manual Sorting"
        elif non_bio_cnt > 0:
            stream_verdict = "100% Non-Biodegradable Synthetic Stream (Dry Waste MRF / High-Value Recycling)"
            decomp_timeline = "100 to 500+ Years if landfilled"
            primary_disposal = "Mechanical Recycling / Authorized Co-processing"
        else:
            stream_verdict = "Clean / No Solid Waste"
            decomp_timeline = "N/A"
            primary_disposal = "N/A"

        biodegradability_analysis = {
            "isBiodegradable": bio_cnt > 0,
            "isPureBiodegradable": bio_cnt > 0 and non_bio_cnt == 0,
            "isMixed": bio_cnt > 0 and non_bio_cnt > 0,
            "biodegradableCount": bio_cnt,
            "nonBiodegradableCount": non_bio_cnt,
            "biodegradableCoveragePercent": bio_cov,
            "streamVerdict": stream_verdict,
            "decompositionTimeline": decomp_timeline,
            "primaryDisposal": primary_disposal,
            "circularAction": municipal_info.get("circularEconomy", {}).get("action", "RECYCLE")
        }

        # 9. Render Annotated Canvas & Final Payload Assembly
        annotated_img = draw_annotated_canvas(img, s2_res["detections"])
        annotated_b64 = image_to_base64_jpeg(annotated_img)

        total_time_ms = round((time.time() - pipeline_start) * 1000.0, 2)

        # Determine category-specific confidence score
        if category_label == "Medical Waste":
            cat_confs = [d['confidence'] for d in s2_res["detections"] if d.get('classId') == 8]
        elif category_label == "E-Waste":
            cat_confs = [d['confidence'] for d in s2_res["detections"] if d.get('classId') == 6]
        elif category_label == "Plastic Waste":
            cat_confs = [d['confidence'] for d in s2_res["detections"] if d.get('classId') == 1]
        elif category_label == "Organic / Biodegradable Waste":
            cat_confs = [d['confidence'] for d in s2_res["detections"] if d.get('classId') in [0, 2] or d.get('isBiodegradable')]
        else:
            cat_confs = [d['confidence'] for d in s2_res["detections"]]

        category_confidence = max(cat_confs) if cat_confs else s2_res["maxConfidence"]

        return {
            "success": True,
            "model": "CleanTrack 2.0 Hierarchical Vision Pipeline",
            "pipelineVersion": "2.0-hierarchical",
            "stage1": s1_res,
            "stage2": {
                "skipped": False,
                "latency_ms": s2_res["latency_ms"],
                "totalItems": s2_res["totalItems"]
            },
            "wasteFound": s2_res["totalItems"] > 0,
            "category": category_label,
            "categoryKey": category_key,
            "categoryId": category_id,
            "subtype": subtype,
            "confidence": category_confidence,
            "averageConfidence": s2_res["averageConfidence"],
            "totalItemsDetected": s2_res["totalItems"],
            "countsByClass": counts_by_class,
            "plasticCountsByClass": plastic_counts,
            "biomedicalCountsByClass": bio_counts,
            "ewasteCountsByClass": ewaste_counts,
            "biodegradableCountsByClass": biodegradable_counts,
            "degradableCountsByClass": biodegradable_counts,
            "nonBiodegradableCountsByClass": non_biodegradable_counts,
            "plasticDetectionsCount": sum(plastic_counts.values()),
            "biomedicalDetectionsCount": sum(bio_counts.values()),
            "ewasteDetectionsCount": sum(ewaste_counts.values()),
            "biodegradableDetectionsCount": bio_cnt,
            "degradableDetectionsCount": bio_cnt,
            "nonBiodegradableDetectionsCount": non_bio_cnt,
            "totalCoveragePercent": s2_res["totalCoveragePercent"],
            "plasticCoveragePercent": s2_res["plasticCoveragePercent"],
            "medicalCoveragePercent": s2_res["medicalCoveragePercent"],
            "ewasteCoveragePercent": s2_res["ewasteCoveragePercent"],
            "biodegradableCoveragePercent": bio_cov,
            "biodegradabilityAnalysis": biodegradability_analysis,
            "circularEconomy": municipal_info.get("circularEconomy", {}),
            "sharpsCount": s2_res["sharpsCount"],
            "totalVolumeLiters": s2_res["totalVolumeLiters"],
            "estimatedVolumeLiters": s2_res["totalVolumeLiters"],
            "totalVolumeM3": s2_res["totalVolumeM3"],
            "estimatedVolumeM3": s2_res["totalVolumeM3"],
            "totalWeightKg": s2_res["totalWeightKg"],
            "estimatedWeightKg": s2_res["totalWeightKg"],
            "estimatedWeightGrams": round(s2_res["totalWeightKg"] * 1000.0, 1),
            "plasticVolumeLiters": round(plastic_vol, 2),
            "plasticWeightKg": round(plastic_wt, 2),
            "medicalVolumeLiters": round(bio_vol, 2),
            "medicalWeightKg": round(bio_wt, 2),
            "ewasteVolumeLiters": round(ewaste_vol, 2),
            "ewasteWeightKg": round(ewaste_wt, 2),
            "containerRequirement": container_req,
            "segregationStream": segregation_stream,
            "priority": severity_info["priority"],
            "severity": severity_info["priority"],
            "severityScore": severity_info["severityScore"],
            "aiPriorityScore": severity_info["severityScore"],
            "urgency": severity_info["urgency"],
            "severityReasons": severity_info["reasons"],
            "primaryDriver": severity_info["primaryDriver"],
            "severityBreakdown": {
                "wasteTypeScore": waste_type_score,
                "visualExtentScore": visual_extent_score,
                "locationSensitivityScore": location_score,
                "recurrenceScore": recurrence_score,
                "timeFactorScore": time_score
            },
            "condition": condition_info,
            "municipalAction": municipal_info,
            "recommendation": {
                "action": municipal_info["actionSummary"],
                "recommendedTeam": municipal_info["crewRecommendation"],
                "mandatoryPPE": municipal_info["mandatoryPPE"],
                "requiredEquipment": municipal_info["requiredEquipment"],
                "targetSLA": municipal_info["targetSLA"],
                "disposalFacility": municipal_info["disposalFacility"],
                "disclaimer": "CleanTrack 2.0 Hierarchical Pipeline (Stage 1 Scene Gatekeeper + Stage 2 Multi-Object Detector)."
            },
            "isFlaggedInvalid": False,
            "invalidReason": "",
            "manualTriageFlag": s1_res["manual_triage_flag"],
            "roboflowStatus": s2_res.get("roboflowStatus"),
            "roboflowResult": s2_res.get("roboflowResult"),
            "hasSegmentation": s2_res.get("hasSegmentation", False),
            "medicalClassifier": s2_res.get("medicalClassifier"),
            "detections": s2_res["detections"],
            "annotatedImage": annotated_b64,
            "totalPipelineLatencyMs": total_time_ms
        }
