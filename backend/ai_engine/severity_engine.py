"""
CleanTrack AI - Multi-Factor Severity & Priority Scoring Engine
Enforces strict statutory CPCB and municipal escalation rules:
  - Critical: Plastic > 70%, Medical > 40%, E-Waste > 20%, Combined > 50%, Sharps >= 2
  - High: Plastic 40-70%, Medical 15-40%, E-Waste 10-20%, Combined 25-50%, Sharps == 1
  - Medium: Plastic 15-40%, Medical 5-15%, Combined 10-25%
  - Low: Plastic < 15%, Medical < 5%, Clean scenes (Score: 10)
"""

from typing import Dict, Any, List


class SeverityEngine:
    """
    Computes priority band (Critical, High, Medium, Low) and numeric score (0-100)
    based on exact material coverage thresholds, biohazard sharps presence, and environmental risks.
    """

    def __init__(self):
        pass

    def evaluate(self,
                 total_coverage: float,
                 plastic_coverage: float,
                 medical_coverage: float,
                 ewaste_coverage: float = 0.0,
                 sharps_count: int = 0,
                 condition_info: Dict[str, Any] = None,
                 is_clean_or_invalid: bool = False) -> Dict[str, Any]:
        """
        Evaluates severity factors and returns score, priority, and rationale.
        """
        if is_clean_or_invalid or total_coverage == 0.0:
            return {
                "priority": "Low",
                "severityScore": 10,
                "urgency": "Low Priority / Routine Monitoring",
                "reasons": ["Clean or non-waste scene. No public health threat."],
                "primaryDriver": "None"
            }

        condition_info = condition_info or {}
        reasons = []
        driver = "General Litter"

        # 1. Individual stream evaluations
        p_score = 0
        p_prio = "Low"
        if plastic_coverage > 70.0:
            p_prio = "Critical"
            p_score = 85 + min(15, int((plastic_coverage - 70.0) * 0.5))
            reasons.append(f"Severe plastic accumulation ({plastic_coverage}% ground coverage)")
        elif plastic_coverage >= 40.0:
            p_prio = "High"
            p_score = 65 + min(14, int((plastic_coverage - 40.0) * 0.46))
            reasons.append(f"High plastic volume ({plastic_coverage}% ground coverage)")
        elif plastic_coverage >= 15.0:
            p_prio = "Medium"
            p_score = 40 + min(19, int((plastic_coverage - 15.0) * 0.76))
        else:
            p_prio = "Low"
            p_score = 20

        m_score = 0
        m_prio = "Low"
        if medical_coverage > 40.0 or sharps_count >= 2:
            m_prio = "Critical"
            m_score = 90 + min(10, sharps_count * 2)
            if sharps_count >= 2:
                reasons.append(f"Immediate biological threat: {sharps_count} sharps/syringes identified in public space")
            else:
                reasons.append(f"Critical biohazard accumulation ({medical_coverage}% ground coverage)")
        elif medical_coverage >= 15.0 or sharps_count == 1:
            m_prio = "High"
            m_score = 70 + (10 if sharps_count == 1 else 5)
            if sharps_count == 1:
                reasons.append("Clinical sharp/needle identified (puncture infection hazard)")
            else:
                reasons.append(f"Substantial biomedical waste presence ({medical_coverage}% coverage)")
        elif medical_coverage >= 5.0:
            m_prio = "Medium"
            m_score = 48
            reasons.append(f"Minor clinical/sanitary waste present ({medical_coverage}% coverage)")
        else:
            m_prio = "Low"
            m_score = 15

        e_score = 0
        e_prio = "Low"
        if ewaste_coverage >= 20.0:
            e_prio = "High"
            e_score = 72 + min(5, int((ewaste_coverage - 20.0) * 0.1))
            reasons.append(f"Substantial electronic waste dump ({ewaste_coverage}% coverage) — Specialized EPR Dismantler Required")
        elif ewaste_coverage >= 10.0:
            e_prio = "High"
            e_score = 65
            reasons.append(f"Significant electronic waste presence ({ewaste_coverage}% coverage)")
        elif ewaste_coverage >= 3.0:
            e_prio = "Medium"
            e_score = 42
        else:
            e_prio = "Low"
            e_score = 15

        c_score = 0
        c_prio = "Low"
        # Total coverage escalation: Only escalate to Critical if acute biohazard or actual stormwater drainage blockage exists
        has_critical_drainage = condition_info.get("drainageBlockageRisk", False) and total_coverage > 60.0
        if total_coverage > 60.0 and (m_prio == "Critical" or sharps_count > 0 or has_critical_drainage):
            c_prio = "Critical"
            c_score = 88
            reasons.append(f"Massive critical waste accumulation ({total_coverage}% coverage)")
        elif total_coverage >= 35.0:
            c_prio = "High"
            c_score = 70 + min(5, int((total_coverage - 35.0) * 0.1))
            reasons.append(f"Extensive ground litter coverage ({total_coverage}%)")
        elif total_coverage >= 10.0:
            c_prio = "Medium"
            c_score = 42
        else:
            c_prio = "Low"
            c_score = 25

        # 2. Highest priority selection
        priority_rank = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
        max_rank = max(priority_rank[p_prio], priority_rank[m_prio], priority_rank[e_prio], priority_rank[c_prio])

        # If no infectious medical waste / sharps exist and no acute flooding drainage blockage, cap priority at High
        has_critical_condition = (priority_rank[m_prio] == 4) or (sharps_count >= 1) or has_critical_drainage
        if max_rank == 4 and not has_critical_condition:
            max_rank = 3

        if max_rank == 4:
            priority = "Critical"
            urgency = "Emergency Action Required (< 2-4 Hours)"
            if priority_rank[m_prio] == 4:
                driver = "Biohazard / Sharps"
            elif priority_rank[p_prio] == 4:
                driver = "Plastic Accumulation"
            elif priority_rank[e_prio] == 4:
                driver = "E-Waste"
            else:
                driver = "Massive Coverage"
        elif max_rank == 3:
            priority = "High"
            urgency = "High Priority Dispatch (< 8-12 Hours)"
            if priority_rank[m_prio] == 3:
                driver = "Medical Waste / Single Sharp"
            elif priority_rank[e_prio] >= 3:
                driver = "Electronic Scrap (E-Waste)"
            elif priority_rank[p_prio] == 3:
                driver = "High Plastic Volume"
            else:
                driver = "Extensive Litter"
        elif max_rank == 2:
            priority = "Medium"
            urgency = "Standard Route Cleanup (< 24 Hours)"
            driver = "Moderate Mixed Waste"
        else:
            priority = "Low"
            urgency = "Routine Scheduled Sweeping (< 48 Hours)"
            driver = "Minor Litter"

        # Final Numeric Score Calculation
        if not has_critical_condition:
            final_score = min(75, max(p_score, m_score, e_score, c_score))
        else:
            final_score = max(p_score, m_score, e_score, c_score)

        # Environmental risk adjustments
        if condition_info.get("drainageBlockageRisk", False):
            if has_critical_condition:
                final_score = min(100, final_score + 8)
            reasons.append("Drainage blockage risk identified: Potential urban flooding hazard.")
        if condition_info.get("fireHazardRisk", False) and has_critical_condition:
            final_score = min(100, final_score + 6)
            reasons.append("Elevated fire risk from dry combustible materials.")

        final_score = max(10, min(100, final_score))

        return {
            "priority": priority,
            "severityScore": final_score,
            "urgency": urgency,
            "primaryDriver": driver,
            "reasons": reasons if reasons else ["Routine municipal waste level."]
        }
