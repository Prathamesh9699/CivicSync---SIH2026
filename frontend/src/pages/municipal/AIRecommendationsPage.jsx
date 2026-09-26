import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useNotifications } from '../../context/NotificationContext';
import { useComplaints } from '../../context/ComplaintContext';
import { Sparkles, Check, Edit3, X, Info } from 'lucide-react';

const DEFAULT_STREAM_RECOMMENDATIONS = [
  {
    id: "REC-AI-01",
    complaintId: "STREAM-PLASTIC-REF",
    title: "Commercial Single-Use Plastic & Bottle Accumulation",
    ward: "Ward 12 - Shivaji Nagar",
    detectedWaste: "Plastic Waste (98.4% Confidence)",
    category: "Plastic Waste",
    condition: "High-density pavement obstruction",
    aiRecommendation: "Deploy Hydraulic Compactor with On-Site Baling & Segregation",
    recommendedSquad: "Squad Alpha (Plastic & Dry Waste Unit)",
    equipmentNeeded: ["Hydraulic Compactor (MH-12-QX-4012)", "Heavy Poly Bags", "Segregated Dry Bins"],
    slaDeadline: "4 Hours Max SLA",
    disposalRouting: "Authorized Dry Waste MRF & Material Recovery Facility",
    rationale: "High volume of recyclable PET/HDPE plastics requires compaction to minimize transport volume."
  },
  {
    id: "REC-AI-02",
    complaintId: "STREAM-MED-REF",
    title: "Clinical Gloves & Bio-Medical Packaging Dumping",
    ward: "Ward 07 - Station Area",
    detectedWaste: "Medical Waste (99.1% Confidence)",
    category: "Medical Waste",
    condition: "High Biological Contamination Risk",
    aiRecommendation: "Level-B Bio-Hazard Isolation & Sodium Hypochlorite Sanitization",
    recommendedSquad: "Squad Bravo (Medical Waste Unit)",
    equipmentNeeded: ["Bio-Hazard Isolation Van (MH-12-BH-1009)", "Level B PPE Kits", "Puncture-Proof Sharps Bins", "Chemical Sprayer"],
    slaDeadline: "2 Hours Urgent SLA",
    disposalRouting: "Authorized PMC Common Biomedical Incineration Facility",
    rationale: "Direct pathogen risk to sanitation crew and pedestrians. Immediate disinfection and sealed transport mandatory."
  },
  {
    id: "REC-AI-03",
    complaintId: "STREAM-EW-REF",
    title: "Discarded Circuit Boards, Wires & Battery Scraps",
    ward: "Ward 15 - Hadapsar",
    detectedWaste: "E-Waste (97.8% Confidence)",
    category: "E-Waste",
    condition: "Lithium Heavy Metal Contamination",
    aiRecommendation: "Anti-Static Specialized Electronic Retrieval & Safe Dismantling",
    recommendedSquad: "Squad Charlie (E-Waste Recovery Unit)",
    equipmentNeeded: ["Electric Segregated Hopper (MH-12-EV-5502)", "Anti-Static Bins", "Lithium Battery Safety Enclosure"],
    slaDeadline: "8 Hours SLA",
    disposalRouting: "Authorized EPR Recycling & Safe Metal Extraction Center",
    rationale: "Toxic lead, mercury, and cadmium leaches into soil if compacted normally. Segregated retrieval required."
  }
];

export const AIRecommendationsPage = () => {
  const { complaints } = useComplaints();
  const { showToast, addNotification } = useNotifications();
  const [decisions, setDecisions] = useState({});

  const getStreamStrategy = (c, idx) => {
    const category = c.aiCategory || "Plastic Waste";
    if (category === "Medical Waste") {
      return {
        id: `REC-${String(idx + 1).padStart(2, '0')}`,
        complaintId: c.id,
        title: c.title || `Medical Waste Incident at ${c.ward}`,
        ward: c.ward,
        detectedWaste: `Medical Waste (${c.aiConfidence || 98}% Confidence)`,
        category: "Medical Waste",
        condition: "High Biological Risk",
        aiRecommendation: "Level-B Bio-Hazard Containment & Chemical Sanitization Protocol",
        recommendedSquad: "Squad Bravo (Medical Waste Unit)",
        equipmentNeeded: ["Bio-Hazard Van (MH-12-BH-1009)", "Level B PPE", "Sharps Container", "0.5% Hypochlorite"],
        slaDeadline: "2 Hours SLA",
        disposalRouting: "Authorized Biomedical Incineration Plant",
        rationale: "Potential bio-contamination requiring specialized sealed isolation and disinfectant sweep."
      };
    } else if (category === "E-Waste") {
      return {
        id: `REC-${String(idx + 1).padStart(2, '0')}`,
        complaintId: c.id,
        title: c.title || `E-Waste Incident at ${c.ward}`,
        ward: c.ward,
        detectedWaste: `E-Waste (${c.aiConfidence || 96}% Confidence)`,
        category: "E-Waste",
        condition: "Heavy Metal Toxicity Risk",
        aiRecommendation: "Anti-Static Heavy Electronics Retrieval & Battery Isolation",
        recommendedSquad: "Squad Charlie (E-Waste Recovery Unit)",
        equipmentNeeded: ["Electric Hopper (MH-12-EV-5502)", "Anti-Static Sacks", "Battery Safety Box"],
        slaDeadline: "8 Hours SLA",
        disposalRouting: "Authorized EPR E-Waste Processing Facility",
        rationale: "Electronic waste requires non-destructive retrieval for certified safe component extraction."
      };
    } else {
      return {
        id: `REC-${String(idx + 1).padStart(2, '0')}`,
        complaintId: c.id,
        title: c.title || `Plastic Waste Accumulation at ${c.ward}`,
        ward: c.ward,
        detectedWaste: `Plastic Waste (${c.aiConfidence || 97}% Confidence)`,
        category: "Plastic Waste",
        condition: "Pedestrian / Storm Drain Obstruction",
        aiRecommendation: "Hydraulic Compactor Collection & Dry Waste Baling",
        recommendedSquad: "Squad Alpha (Plastic & Dry Waste Unit)",
        equipmentNeeded: ["Hydraulic Compactor (MH-12-QX-4012)", "Heavy Duty Poly Bags", "Litter Grabbers"],
        slaDeadline: "4 Hours SLA",
        disposalRouting: "Central Material Recovery Facility (MRF)",
        rationale: "High bulk density requires mechanical compaction to optimize vehicle payload."
      };
    }
  };

  const recommendations = complaints.length > 0
    ? complaints.map(getStreamStrategy)
    : DEFAULT_STREAM_RECOMMENDATIONS;

  const handleDecision = (recId, action, rec) => {
    setDecisions(prev => ({ ...prev, [recId]: action }));

    if (action === 'approved') {
      addNotification({
        title: `AI Recommendation Approved: #${rec.complaintId}`,
        message: `${rec.recommendedSquad} dispatched with ${rec.equipmentNeeded[0]} to ${rec.ward}.`,
        type: "success",
        ticketId: rec.complaintId
      });
    }

    showToast({
      title: `Officer Decision Logged: ${action.toUpperCase()}`,
      message: `Operational strategy for ${rec.complaintId} confirmed in dispatch logs.`,
      type: "success"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="AI Operational Recommendations"
        subtitle="High-precision decision support providing equipment, squad assignments, and disposal routing for Plastic, Medical, and E-Waste streams."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "AI Recommendations" }]}
      />

      {/* Governance Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-emerald-950">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-emerald-900 text-sm block">Human-in-the-Loop Municipal Governance</strong>
          <p className="mt-0.5">
            The CleanTrack AI engine provides automated recommendations based on waste taxonomy, volume, and location sensitivity. Municipal officers retain ultimate authority to approve, modify, or override any action.
          </p>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-6">
        {recommendations.map((rec) => {
          const decision = decisions[rec.id];

          return (
            <div
              key={rec.id}
              className={`bg-white rounded-3xl p-6 sm:p-8 border-2 shadow-xs space-y-6 transition-all ${
                decision === 'approved' ? "border-emerald-500 bg-emerald-50/20" :
                decision === 'rejected' ? "border-rose-300 opacity-60" :
                "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {rec.complaintId}
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900">{rec.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.ward} • Priority SLA: <strong>{rec.slaDeadline}</strong></p>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                  rec.category === "Medical Waste" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                  rec.category === "E-Waste" ? "bg-purple-100 text-purple-800 border border-purple-300" :
                  "bg-blue-100 text-blue-800 border border-blue-300"
                }`}>
                  {rec.category}
                </span>
              </div>

              {/* Core Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Detected Material</span>
                  <p className="font-bold text-slate-900">{rec.detectedWaste}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Recommended Squad</span>
                  <p className="font-bold text-blue-700">{rec.recommendedSquad}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">Required Equipment</span>
                  <p className="font-bold text-slate-800">{rec.equipmentNeeded.join(", ")}</p>
                </div>
              </div>

              {/* Recommendation Rationale */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 block">AI Recommended Strategy:</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    Routing: {rec.disposalRouting}
                  </span>
                </div>
                <p className="font-bold text-emerald-950 text-sm">{rec.aiRecommendation}</p>
                <p className="text-emerald-800 text-[11px]"><strong>Diagnostic Rationale:</strong> {rec.rationale}</p>
              </div>

              {/* Officer Decision Toolbar */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-700">Municipal Officer Decision:</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision(rec.id, 'approved', rec)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      decision === 'approved'
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Strategy</span>
                  </button>

                  <button
                    onClick={() => handleDecision(rec.id, 'modified', rec)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modify Strategy</span>
                  </button>

                  <button
                    onClick={() => handleDecision(rec.id, 'rejected', rec)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Override</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
