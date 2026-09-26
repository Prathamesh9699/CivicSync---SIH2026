"""
CleanTrack AI - Municipal Action Recommendation Engine
Generates actionable, compliant operational guidelines for municipal field sanitation workers:
  - Target Response SLA
  - Required Crew Composition
  - Mandatory Personal Protective Equipment (PPE)
  - Specialized Tools & Equipment
  - Target Disposal Facility Route (CPCB & Swachh Bharat Norms)
"""

from typing import Dict, Any, List


class MunicipalActionEngine:
    """
    Generates structured municipal action recommendations according to waste category,
    severity priority, and environmental hazard.
    """

    def __init__(self):
        pass

    def recommend(self,
                  priority: str,
                  class_breakdown: Dict[int, Dict[str, Any]],
                  sharps_count: int,
                  condition_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Synthesizes detection results and generates actionable municipal response directives.
        """
        condition_info = condition_info or {}
        has_biomedical = 8 in class_breakdown or sharps_count > 0
        has_plastic = 1 in class_breakdown
        has_ewaste = 6 in class_breakdown

        ppe = []
        tools = []
        facilities = []

        # 1. PPE & Equipment Determination
        if has_biomedical:
            ppe.extend([
                "Puncture-Proof Heavy Nitrile / Kevlar Gloves (EN 388 4X44)",
                "Fluid-Resistant Biohazard Apron / Protective Coverall",
                "N95 / FFP2 Particulate Respirator Mask",
                "Steel-Toe Boots with Puncture-Proof Midsole",
                "Protective Eye Goggles / Face Shield"
            ])
            tools.extend([
                "Puncture-Proof Rigid Sharps Box (WHO/CPCB Yellow/White Compliant)",
                "Long-Reach Mechanical Grabber Tongs (Never pick sharps by hand)",
                "1% Sodium Hypochlorite Disinfectant Spray & Bleaching Powder",
                "Biohazard Yellow Bags with Biohazard Symbol"
            ])
            facilities.append("Common Bio-medical Waste Treatment Facility (CBWTF) — High-Temp Incineration")
        else:
            ppe.extend([
                "Standard Heavy Duty Sanitation Rubber Gloves",
                "Hi-Visibility Reflective Safety Vest",
                "Dust Mask",
                "Sturdy Safety Work Boots"
            ])
            tools.extend([
                "Heavy Duty Brooms and Metal Dustpan",
                "Mechanical Trash Grabbers",
                "Heavy-Duty Recyclable Garbage Bags (Blue/Green)"
            ])

        has_biodegradable = 0 in class_breakdown
        has_paper = 2 in class_breakdown
        has_glass = 4 in class_breakdown
        has_metal = 3 in class_breakdown

        if has_biodegradable:
            facilities.append("Decentralized Aerobic Composting Facility / Anaerobic Bio-Methanation Plant (Biogas)")

        if has_paper:
            facilities.append("Authorized Paper Mill & Fiber Recovery Center")

        if has_glass:
            facilities.append("Glass Bottle Sterilization & Cullet Processing Unit")

        if has_metal:
            facilities.append("Ferrous / Non-Ferrous Metal Scrap Foundry")

        if has_plastic:
            facilities.append("Authorized Material Recovery Facility (MRF) / Polymer Baler")

        if has_ewaste:
            facilities.append("State Pollution Control Board (SPCB) Authorized E-Waste Recycler")

        if not facilities:
            facilities.append("Designated Municipal Solid Waste Processing Plant")

        # 2. Circular Economy Action & Disposal Classification
        if has_biomedical:
            primary_circular_action = "SAFE_INCINERATION"
            disposal_stream = "Hazardous / Biomedical Stream"
            decomposition_timeline = "Inactivated via 1050°C Incineration / Autoclaving"
            landfill_diversion = "0% (Strictly isolated from municipal landfills)"
            carbon_avoidance = "Infection barrier & safe ash encapsulation"
        elif has_biodegradable and (not has_plastic or class_breakdown.get(0, {}).get("count", 0) >= class_breakdown.get(1, {}).get("count", 0)):
            primary_circular_action = "COMPOST"
            disposal_stream = "Green Stream — 100% Biodegradable Organic Matter"
            decomposition_timeline = "2 to 4 Weeks (Rapid natural decomposition into organic manure)"
            landfill_diversion = "95% (High compost & biogas conversion yield)"
            carbon_avoidance = "~1.8 kg CO2e avoided per kg diverted from open dumpsite"
        elif has_glass:
            primary_circular_action = "REUSE"
            disposal_stream = "Dry Recyclable / Direct Reuse Glass Stream"
            decomposition_timeline = "Indefinite / >1 Million Years (Infinite circular reuse without degradation)"
            landfill_diversion = "100% (Sterilization for beverage reuse or cullet remelting)"
            carbon_avoidance = "315 kg CO2 avoided per ton of recycled cullet"
        else:
            primary_circular_action = "RECYCLE"
            disposal_stream = "Blue Stream — Dry Non-Biodegradable Recyclable"
            decomposition_timeline = "100 to 450 Years (Persistent non-biodegradable synthetic polymers)"
            landfill_diversion = "85% (Mechanical pelletizing, baling, or Pyrolysis RDF)"
            carbon_avoidance = "Up to 1.5 tons CO2e avoided per ton of recycled plastic/metal"

        # 3. SLA, Crew, and Dispatch Directives by Priority
        if priority == "Critical":
            sla = "Immediate: Within 2 Hours"
            crew = "Emergency Hazmat / Specialized Biohazard Unit (2 Trained Handlers)" if has_biomedical else "Priority Fast-Response Sanitation Squad (3 Workers + Tipper Truck)"
            action_summary = "Emergency dispatch required immediately. Public exposure risk requires rapid containment, cordoning, and sanitization."
        elif priority == "High":
            sla = "Urgent: Within 6 to 8 Hours"
            crew = "Dedicated Sanitation Patrol (2 Sanitation Workers + Mini Tipper)"
            action_summary = "High priority cleanup scheduled for same-shift clearance to prevent environmental spread and pest attraction."
        elif priority == "Medium":
            sla = "Standard: Within 24 Hours"
            crew = "Beat Sanitation Worker (1 Worker with Cart / Tri-Wheeler)"
            action_summary = "Standard municipal route clearance within current daily operational cycle."
        else:
            sla = "Routine: Within 48 Hours"
            crew = "Routine Ward Sweeper (1 Worker)"
            action_summary = "Incorporate into routine ward sweeping and maintenance cycle."

        return {
            "targetSLA": sla,
            "crewRecommendation": crew,
            "mandatoryPPE": ppe,
            "requiredEquipment": tools,
            "disposalFacility": list(set(facilities)),
            "actionSummary": action_summary,
            "circularEconomy": {
                "action": primary_circular_action,
                "disposalStream": disposal_stream,
                "decompositionTimeline": decomposition_timeline,
                "landfillDiversionRate": landfill_diversion,
                "carbonAvoidance": carbon_avoidance,
                "isBiodegradable": has_biodegradable,
                "canRecycle": has_plastic or has_metal or has_paper or has_ewaste,
                "canReuse": has_glass or has_metal
            }
        }
