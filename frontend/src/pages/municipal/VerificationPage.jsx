import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../context/ComplaintContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { BeforeAfterSlider } from '../../components/complaints/BeforeAfterSlider';
import { CheckCircle2, RotateCcw, Sparkles, Truck, MapPin, Award, Check } from 'lucide-react';

export const VerificationPage = () => {
  const { complaints, updateComplaintStatus } = useComplaints();
  const { showToast, addNotification, dispatchResolutionSms } = useNotifications();

  const [activeTab, setActiveTab] = useState('awaiting'); // 'awaiting' | 'active'
  const [verifiedList, setVerifiedList] = useState([]);

  const awaiting = complaints.filter(c => c.status === "Awaiting Verification");
  const inProgress = complaints.filter(c => c.status === "In Progress" || c.status === "Assigned" || c.status === "AI Analyzed" || c.status === "Under Review");

  const handleApprove = (id) => {
    const item = complaints.find(c => c.id === id || c.complaintId === id);

    updateComplaintStatus(id, "Resolved", {
      isVerifiedByMunicipal: true,
      isVerifiedByCitizen: true,
      resolvedAt: new Date().toISOString(),
      officerNote: "Municipal officer verified before/after photographic proof and resolved complaint."
    });
    setVerifiedList(prev => [...prev, id]);

    showToast({
      title: `Complaint #${id} Verified & Resolved!`,
      message: "Cleanup proof approved. Incident marked Resolved and +50 Green Points credited.",
      type: "success"
    });

    // 1. Dispatch in-app notification to the citizen
    addNotification({
      userId: item?.citizenId,
      targetRole: 'citizen',
      title: `🎉 Complaint #${id} Verified & Resolved!`,
      message: `Municipal officer validated cleanup for #${id} at ${item?.ward || 'your reported location'}. Ticket is now Resolved and +50 Green Points credited! 🌱`,
      type: "success",
      ticketId: id,
      link: `/citizen/complaints/${id}`
    });

    // 2. Dispatch SMS directly to the citizen's phone number
    const citizenPhone = item?.citizenPhone || '+91 98230 11452';
    dispatchResolutionSms({
      phone: citizenPhone,
      complaintId: id,
      ward: item?.ward || 'Civic Area',
      category: item?.aiCategory || 'Waste',
      citizenName: item?.citizenName || 'Citizen',
      pointsEarned: 50,
      officerName: item?.assignedTeamName || 'Municipal Sanitation Squad'
    });
  };

  const handleReClean = (id) => {
    const reason = window.prompt("Please state the reason for requesting re-cleanup (e.g., residual trash on sidewalk):", "Peripheral debris remains at location.");
    if (!reason || !reason.trim()) {
      showToast({
        title: "Action Cancelled",
        message: "A specific reason is required to dispatch a squad for re-cleanup.",
        type: "alert"
      });
      return;
    }

    updateComplaintStatus(id, "In Progress", {
      officerNote: `Officer requested re-clean: ${reason.trim()}`
    });
    showToast({
      title: "Re-Cleanup Dispatched",
      message: `Sanitation squad notified to revisit incident site #${id}.`,
      type: "alert"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Before & After Cleanup Verification"
        subtitle="AI visual difference matching scores post-cleanup photographs before closing tickets and rewarding Green Points."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Verification" }]}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('awaiting')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'awaiting'
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Awaiting Citizen & Officer Verification ({awaiting.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'active'
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Dispatched Squads • Awaiting Worker Proof ({inProgress.length})
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p>
                <strong>Worker Direct Proof Pipeline:</strong> Sanitation field workers take photos on-site using the <strong>Worker Panel</strong> after finishing cleanup. Submitted photos instantly route to the <em>Awaiting Verification</em> tab for your review.
              </p>
            </div>
          </div>

          {inProgress.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgress.map(item => (
                <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {item.id}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.id} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    <div className="text-xs space-y-0.5">
                      <h4 className="font-bold text-slate-800 line-clamp-1">{item.title || item.aiCategory}</h4>
                      <p className="text-slate-500">{item.ward} • {item.landmark}</p>
                      <p className="text-amber-700 font-bold">Squad: {item.assignedTeamName || "Squad Alpha"}</p>
                      <p className="text-slate-600 font-medium">Worker Lead: {item.assignedWorkerName || "Ramesh Shinde"}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/municipal/complaints/${item.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Inspect Task Details
                    </Link>

                    <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                      Awaiting Worker Photo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Active Cleanups In Progress</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All assigned cleanups have been completed.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'awaiting' && (
      <div className="space-y-8">
        {awaiting.length > 0 ? (
          awaiting.map((item) => {
          const isDone = verifiedList.includes(item.id) || item.status === "Citizen Verified" || item.status === "Resolved";
          const evidence = item.workerEvidence || {};

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-6 sm:p-8 border-2 shadow-xs space-y-6 transition-all ${
                isDone ? "border-emerald-300 bg-emerald-50/10" : "border-slate-200"
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {item.id}
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.ward} • {item.landmark}</p>
                </div>

                <span className="bg-purple-50 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
                  Awaiting Final Closure
                </span>
              </div>

              {/* Direct Field Worker Proof Attestation Banner */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Evidence Photo Submitted Directly by Field Worker
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    ID: {evidence.workerId || item.assignedWorkerId || 'WRK-2026-00001'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Worker Submitter</span>
                    <p className="font-extrabold text-slate-900">{evidence.workerName || item.assignedWorkerName || 'Ramesh Shinde (Squad Alpha)'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Estimated Waste Diverted</span>
                    <p className="font-extrabold text-amber-900">{evidence.wasteVolumeCollected || '140 kg (Estimated)'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Equipment Deployed</span>
                    <p className="font-bold text-slate-800 truncate">
                      {Array.isArray(evidence.equipmentUsed) ? evidence.equipmentUsed.join(', ') : (evidence.equipmentUsed || 'Compactor, Heavy Shovel, Safety Gloves')}
                    </p>
                  </div>
                </div>

                {evidence.notes && (
                  <div className="pt-1.5 text-xs text-slate-700 italic border-t border-amber-200/50">
                    <strong>Worker On-Site Report:</strong> "{evidence.notes}"
                  </div>
                )}
              </div>

              {/* Interactive Before & After Slider */}
              <BeforeAfterSlider
                beforeUrl={item.beforeImageUrl || item.imageUrl}
                afterUrl={item.afterImageUrl || evidence.photoUrl || "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80"}
                visualImprovement={92}
              />

              {/* AI Verification Telemetry Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-slate-400 font-medium">Visual Clearance Score</span>
                  <p className="text-emerald-700 font-extrabold text-base">92% Clear</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-slate-400 font-medium">Completed By Squad</span>
                  <p className="font-bold text-slate-900">{item.assignedTeamName || "Squad Alpha"}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-slate-400 font-medium">Citizen Green Points Stake</span>
                  <p className="font-bold text-amber-600">+50 Points Ready</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span>Reporting Citizen: <strong>{item.citizenName}</strong></span>
                </div>

                <div className="flex items-center gap-3">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs">
                      <Check className="w-4 h-4" />
                      <span>Verified & Resolved ✓</span>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReClean(item.id)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Request Re-Cleanup</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Resolve Complaint (+50 Points)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">No Cleanups Awaiting Verification</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All municipal cleanups have been reviewed or no field squads have submitted before/after photos yet.
          </p>
        </div>
      )}
      </div>
      )}
    </div>
  );
};
