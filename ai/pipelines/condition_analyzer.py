"""
CleanTrack AI - Waste Condition & Environmental Context Analyzer
Analyzes the spatial distribution, physical clustering, and environmental setting
of detected waste to classify conditions:
  - single_object
  - scattered_litter
  - overflowing_bin
  - roadside_dump
  - waterbody_dump
  - open_burn_risk
"""

from typing import Dict, Any, List


class ConditionAnalyzer:
    """
    Analyzes spatial dispersion, density, and hazards to classify environmental waste conditions.
    """

    def __init__(self):
        pass

    def analyze(self,
                detections: List[Dict[str, Any]],
                total_coverage_percent: float,
                img_width: int,
                img_height: int,
                scene_tags: List[str] = None) -> Dict[str, Any]:
        """
        Analyzes detected items and spatial layout to determine environmental waste condition.
        """
        item_count = len(detections)
        scene_tags = scene_tags or []

        if item_count == 0:
            return {
                "conditionType": "clean_area",
                "conditionLabel": "Clean / No Litter Present",
                "densityIndex": 0.0,
                "spatialSpread": "none",
                "drainageBlockageRisk": False,
                "fireHazardRisk": False,
                "description": "Environment appears clean with no municipal waste accumulations."
            }

        # Calculate bounding box centers to determine clustering & spread
        centers = []
        for d in detections:
            box = d.get('box', [0, 0, 0, 0])
            cx = (box[0] + box[2]) / 2.0
            cy = (box[1] + box[3]) / 2.0
            centers.append((cx, cy))

        # Spatial spread estimation
        if item_count == 1:
            spread = "isolated"
            density_index = round(min(1.0, total_coverage_percent / 20.0), 2)
        else:
            # Measure bounding span across canvas
            xs = [c[0] for c in centers]
            ys = [c[1] for c in centers]
            span_x = (max(xs) - min(xs)) / max(1.0, float(img_width))
            span_y = (max(ys) - min(ys)) / max(1.0, float(img_height))
            span_area = span_x * span_y

            if span_area < 0.20:
                spread = "concentrated"
                density_index = round(min(1.0, 0.40 + (item_count * 0.08)), 2)
            else:
                spread = "scattered"
                density_index = round(min(1.0, 0.20 + (item_count * 0.05)), 2)

        # Hazardous / Combustible content checks
        combustible_count = sum(1 for d in detections if d.get('classId') in [1, 2, 5])  # plastic, paper, textile
        has_sharps = any(d.get('isSharps', False) for d in detections)
        fire_hazard = combustible_count >= 5 and total_coverage_percent >= 25.0

        # Drainage blockage is only plausible if scene context indicates outdoor storm drain/waterway/street
        # AND high coverage of lightweight choking debris (plastics/bags)
        has_drain_context = any(t in scene_tags for t in ['drain', 'gutter', 'culvert', 'sewer', 'canal', 'water', 'street', 'road'])
        plastic_count = sum(1 for d in detections if d.get('classId') == 1)
        drainage_risk = has_drain_context and (plastic_count >= 3 or total_coverage_percent >= 45.0)

        # Condition Type Classification
        if total_coverage_percent >= 30.0 or item_count >= 10:
            condition_type = "roadside_dump"
            condition_label = "Heavy Roadside / Open Dumping"
            description = f"Significant open accumulation ({item_count} items, {total_coverage_percent}% coverage) obstructing public space."
        elif "bin" in scene_tags or "trash_can" in scene_tags or (spread == "concentrated" and item_count >= 4):
            condition_type = "overflowing_bin"
            condition_label = "Overflowing Public Bin / Dumpster"
            description = f"Waste accumulating around public repository ({item_count} items concentrated)."
        elif item_count > 1:
            condition_type = "scattered_litter"
            condition_label = "Scattered Surface Litter"
            description = f"Dispersed litter across survey area ({item_count} items, {total_coverage_percent}% ground coverage)."
        else:
            condition_type = "single_object"
            condition_label = "Isolated Single Discard"
            description = f"Single isolated waste item ({detections[0].get('label', 'Item')})."

        return {
            "conditionType": condition_type,
            "conditionLabel": condition_label,
            "densityIndex": density_index,
            "spatialSpread": spread,
            "drainageBlockageRisk": drainage_risk,
            "fireHazardRisk": fire_hazard,
            "hasSharps": has_sharps,
            "description": description
        }
