import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useComplaints } from '../../context/ComplaintContext';
import { useNotifications } from '../../context/NotificationContext';
import { Flame, AlertTriangle, CheckCircle2, MapPin, Clock } from 'lucide-react';

const CHRONIC_HOTSPOTS_PRESETS = [
  {
    id: "HS-REC-01",
    name: "Shivaji Nagar Station Road Corridor",
    ward: "Ward 12 - Shivaji Nagar",
    latitude: 18.5314,
    longitude: 73.8446,
    wasteType: "Plastic Waste & Disposables",
    recurrenceRate: "Critical Spikes",
    color: "#dc2626",
    totalComplaints: 28,
    lastCleanedDaysAgo: 1,
    aiRootCause: "Commercial tea stalls and transit pedestrian footfall lacking segregated dry bins. 1x daily pickup overwhelmed during peak evening commute hours.",
    recommendedAction: "Deploy dual 240L segregated dry bins and increase pickup frequency to 2x daily (08:00 & 18:00) with baner compactor routing.",
    timeline: [
      { date: "Cycle 1 (60 days ago)", desc: "14 Plastic bottle reports logged → Cleared by Squad Alpha." },
      { date: "Cycle 2 (35 days ago)", desc: "18 Plastic container reports re-accumulated within 3 weeks of clearance." },
      { date: "Cycle 3 (12 days ago)", desc: "22 incidents logged → High accumulation spilling onto pedestrian walkway." },
      { date: "Current Cycle (Active)", desc: "28 total cumulative reports. AI Chronic Hotspot recurrence alert triggered." }
    ]
  },
  {
    id: "HS-REC-02",
    name: "Sassoon Clinic & Hospital Perimeter",
    ward: "Ward 07 - Station Area",
    latitude: 18.5255,
    longitude: 73.8712,
    wasteType: "Medical Waste & Clinical Disposables",
    recurrenceRate: "High Risk",
    color: "#e11d48",
    totalComplaints: 19,
    lastCleanedDaysAgo: 2,
    aiRootCause: "Informal disposal of masks, gloves, and clinical packaging from outpatient clinics outside regular Bio-Medical collection hours.",
    recommendedAction: "Issue mandatory compliance notice to adjacent polyclinics; deploy sealed puncture-proof Bio-Hazard collection container with Squad Bravo.",
    timeline: [
      { date: "Cycle 1 (45 days ago)", desc: "8 Clinical disposable reports logged → Sanitized and cleared by Bio-Unit." },
      { date: "Cycle 2 (20 days ago)", desc: "12 Mask and syringe reports logged outside hospital perimeter gate." },
      { date: "Current Cycle (Active)", desc: "19 cumulative reports. Urgent Bio-Safety sanitation sweep required." }
    ]
  },
  {
    id: "HS-REC-03",
    name: "Hadapsar Industrial & Electronics Hub",
    ward: "Ward 15 - Hadapsar",
    latitude: 18.5089,
    longitude: 73.9259,
    wasteType: "E-Waste & Electronic Packaging",
    recurrenceRate: "Moderate Recurring",
    color: "#8b5cf6",
    totalComplaints: 14,
    lastCleanedDaysAgo: 3,
    aiRootCause: "Small repair shops dumping discarded circuit boards, batteries, and wires on open corner lots instead of authorized EPR drop-off.",
    recommendedAction: "Establish neighborhood E-Waste Drop Box; route Squad Charlie for monthly electronic waste retrieval drives.",
    timeline: [
      { date: "Cycle 1 (50 days ago)", desc: "6 E-waste dumping incidents logged → Collected for EPR dismantling." },
      { date: "Cycle 2 (25 days ago)", desc: "10 Cable and battery reports logged at intersection." },
      { date: "Current Cycle (Active)", desc: "14 cumulative reports. Weekly electronics collection scheduled." }
    ]
  }
];

export const RecurringWastePage = () => {
  const { complaints } = useComplaints();
  const { showToast, addNotification } = useNotifications();

  const [hotspotsList, setHotspotsList] = useState(CHRONIC_HOTSPOTS_PRESETS);
  const [selectedHotspot, setSelectedHotspot] = useState(CHRONIC_HOTSPOTS_PRESETS[0]);

  const handleScheduleDrive = (hotspot) => {
    addNotification({
      title: `Targeted Cleanup Drive Scheduled: ${hotspot.ward}`,
      message: `Squad Alpha dispatched for chronic recurrence remediation at ${hotspot.name}. Permanent bins scheduled.`,
      type: "success"
    });
    showToast({
      title: "Intervention Drive Scheduled",
      message: `Sanitation squad assigned to chronic zone: ${hotspot.name}.`,
      type: "success"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Chronic Recurring Waste Hotspots"
        subtitle="AI diagnostics detecting repeat dumping patterns, frequency spikes, and root causes across municipal zones."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Recurring Waste" }]}
      />

      {/* Hotspots Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {hotspotsList.map((hs) => {
          const isSelected = selectedHotspot?.id === hs.id;
          return (
            <div
              key={hs.id}
              onClick={() => setSelectedHotspot(hs)}
              className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? "border-brand-600 bg-brand-50/40 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{hs.ward}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: hs.color }}>
                  {hs.recurrenceRate}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{hs.name}</h4>
              <p className="text-xs text-slate-500 mt-1">
                <strong>{hs.totalComplaints}</strong> Incidents Logged • Last Cleaned: {hs.lastCleanedDaysAgo} day(s) ago
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Chronic Hotspot Deep-Dive */}
      {selectedHotspot && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4" />
                <span>High Frequency Recurrence Zone</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">{selectedHotspot.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedHotspot.ward} • Primary Stream: <strong>{selectedHotspot.wasteType}</strong></p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Recurrences</span>
                <p className="text-xl font-extrabold text-slate-900">{selectedHotspot.totalComplaints}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cleaned Rate</span>
                <p className="text-xl font-extrabold text-emerald-600">89.5%</p>
              </div>
            </div>
          </div>

          {/* Historical Recurrence Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Chronic Dump & Clean Recurrence Timeline
            </h4>
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-4">
              {selectedHotspot.timeline.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full ${
                    idx === selectedHotspot.timeline.length - 1 ? "bg-rose-600 animate-ping" : "bg-rose-500 ring-4 ring-rose-100"
                  }`}></div>
                  <div className={`p-3 rounded-xl border text-xs ${
                    idx === selectedHotspot.timeline.length - 1 ? "bg-rose-50 border-rose-200 text-rose-900 font-medium" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <span className="font-bold text-slate-900">{step.date}:</span> {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Root-Cause Analysis & Action Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>AI Root-Cause Inferences</span>
              </h4>
              <p className="text-amber-900 leading-relaxed">{selectedHotspot.aiRootCause}</p>
              <ul className="list-disc list-inside space-y-1 text-amber-800 pt-1">
                <li>High density transit corridor requiring secondary collection sweep.</li>
                <li>Commercial outlets lacking dedicated source-segregation bins.</li>
                <li>Collection route optimization required in municipal morning dispatch.</li>
              </ul>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recommended Permanent Intervention</span>
              </h4>
              <p className="text-emerald-900 leading-relaxed">{selectedHotspot.recommendedAction}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleScheduleDrive(selectedHotspot)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Schedule Targeted Remediation Drive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
