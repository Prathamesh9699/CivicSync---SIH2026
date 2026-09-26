import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, SeverityBadge } from '../../components/common/Badges';
import { AIAnalysisCard } from '../../components/ai/AIAnalysisCard';
import { ComplaintTimeline } from '../../components/complaints/ComplaintTimeline';
import { BeforeAfterSlider } from '../../components/complaints/BeforeAfterSlider';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Calendar, 
  Truck, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Sparkles,
  ShieldCheck,
  Camera,
  Play,
  RotateCcw
} from 'lucide-react';
import { CitizenComplaintActionBox } from '../../components/complaints/CitizenComplaintActionBox';
import { WorkerEvidenceModal } from '../../components/worker/WorkerEvidenceModal';

const pinIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color: #16a34a; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [22, 22]
});

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { complaints, loading, fetchComplaintById, updateComplaintStatus, verifyCleanup, startTask } = useComplaints();
  const { currentUser, role, addGreenPoints } = useAuth();
  const { showToast, addNotification, dispatchResolutionSms } = useNotifications();

  const [directComplaint, setDirectComplaint] = useState(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const cleanId = String(id || '').trim();
    if (!cleanId || cleanId === 'undefined') return;

    const existing = complaints.find(c => c && (c.id === cleanId || c.complaintId === cleanId || String(c._id) === cleanId));
    if (existing) {
      setDirectComplaint(existing);
      setIsFetchingDirect(false);
    } else {
      setIsFetchingDirect(true);
      fetchComplaintById(cleanId).then(item => {
        if (isMounted) {
          setDirectComplaint(item);
          setIsFetchingDirect(false);
        }
      }).catch(() => {
        if (isMounted) setIsFetchingDirect(false);
      });
    }
    return () => { isMounted = false; };
  }, [id, complaints]);

  const complaint = directComplaint || complaints.find(c => c && (c.id === id || c.complaintId === id || String(c._id) === id));

  if (loading || isFetchingDirect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">Loading Complaint #{id}...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving AI classification, field status, and location telemetry.</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    const fallbackPath = role === 'municipal_staff' ? '/municipal/complaints' : role === 'admin' ? '/admin/dashboard' : '/citizen/complaints';
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Complaint #{id} Not Found</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            This complaint could not be located in the municipal records. The ticket may have been merged, deleted, or the ID is incorrect.
          </p>
        </div>
        <Link 
          to={fallbackPath} 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const isWorker = role === 'worker';
  const isMunicipal = role === 'municipal_staff';
  const isAdmin = role === 'admin' || role === 'administrator';
  const isStaffOrAdmin = isMunicipal || isAdmin;
  const isResolved = complaint.status === "Citizen Verified" || complaint.status === "Resolved";

  const backLink = isWorker
    ? '/worker/tasks'
    : isAdmin
    ? '/admin/dashboard'
    : isMunicipal
    ? '/municipal/complaints'
    : '/citizen/complaints';

  const breadcrumbs = isWorker
    ? [{ label: "Worker Portal", path: "/worker/dashboard" }, { label: "Field Tasks", path: "/worker/tasks" }, { label: complaint.id }]
    : isAdmin
    ? [{ label: "Admin Console", path: "/admin/dashboard" }, { label: complaint.id }]
    : isMunicipal
    ? [{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Priority Queue", path: "/municipal/complaints" }, { label: complaint.id }]
    : [{ label: "Dashboard", path: "/citizen/dashboard" }, { label: "My Complaints", path: "/citizen/complaints" }, { label: complaint.id }];

  const handleStartCleanup = async () => {
    await startTask(complaint.id, {
      workerName: currentUser?.name || 'Ramesh Shinde',
      workerId: currentUser?.userId || 'WRK-2026-00001'
    });
    showToast({
      title: "Cleanup Started",
      message: `Work order #${complaint.id} status changed to In Progress.`,
      type: "info"
    });
  };

  const handleReClean = () => {
    const reason = window.prompt("Reason for re-cleanup request to squad:", "Residual trash remains on sidewalk.");
    if (!reason || !reason.trim()) return;
    updateComplaintStatus(complaint.id, "In Progress", {
      officerNote: `Officer requested re-clean: ${reason.trim()}`
    });
    showToast({
      title: "Re-Cleanup Dispatched",
      message: `Sanitation squad alerted to revisit incident site #${complaint.id}.`,
      type: "alert"
    });
  };

  const handleDirectResolve = () => {
    updateComplaintStatus(complaint.id, "Resolved", {
      isVerifiedByCitizen: true,
      isVerifiedByMunicipal: true,
      resolvedAt: new Date().toISOString(),
      officerNote: "Municipal officer verified worker cleanup proof and resolved complaint."
    });

    showToast({
      title: `Complaint #${complaint.id} Verified & Resolved!`,
      message: "Worker cleanup proof approved. Ticket marked Resolved.",
      type: "success"
    });

    // 1. In-app notification to reporting citizen
    addNotification({
      userId: complaint.citizenId,
      targetRole: 'citizen',
      title: `Complaint #${complaint.id} Resolved Successfully!`,
      message: `Ticket #${complaint.id} at ${complaint.ward} has been cleared and verified by the municipality. Closed in registry with +50 Green Points credited!`,
      type: "success",
      ticketId: complaint.id,
      link: `/citizen/complaints/${complaint.id}`
    });

    // 2. Dispatch SMS to Citizen's Phone Number
    const targetPhone = complaint.citizenPhone || '+91 98230 11452';
    dispatchResolutionSms({
      phone: targetPhone,
      complaintId: complaint.id,
      ward: complaint.ward || 'Civic Area',
      category: complaint.aiCategory || 'Waste',
      citizenName: complaint.citizenName || 'Citizen',
      pointsEarned: 50,
      officerName: complaint.assignedTeamName || 'Municipal Sanitation Squad'
    });
  };

  const handleCitizenVerification = (isClean) => {
    setFeedbackGiven(true);
    verifyCleanup(complaint.id, isClean, isClean ? "Confirmed clean by citizen" : "Citizen reported remaining debris");

    if (isClean) {
      addGreenPoints(50);
      addNotification({
        userId: complaint.citizenId,
        targetRole: 'citizen',
        title: `Complaint #${complaint.id} Verified Clean!`,
        message: `Thank you for validating Ticket #${complaint.id}! +50 Green Points credited to your civic wallet.`,
        type: "success",
        ticketId: complaint.id,
        link: `/citizen/complaints/${complaint.id}`
      });

      // Dispatch SMS confirmation to citizen phone
      const targetPhone = complaint.citizenPhone || (currentUser?.phone) || '+91 98230 11452';
      dispatchResolutionSms({
        phone: targetPhone,
        complaintId: complaint.id,
        ward: complaint.ward || 'Civic Area',
        category: complaint.aiCategory || 'Waste',
        citizenName: complaint.citizenName || currentUser?.name || 'Citizen',
        pointsEarned: 50,
        officerName: complaint.assignedTeamName || 'Municipal Sanitation Squad'
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#f59e0b', '#06b6d4']
      });
    } else {
      addNotification({
        targetRole: 'municipal_staff',
        title: `Re-Cleanup Dispatched for #${complaint.id}`,
        message: `Sanitation squad has been alerted to revisit and clear residual debris at ${complaint.ward}.`,
        type: "alert",
        ticketId: complaint.id,
        link: `/municipal/complaints/${complaint.id}`
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <PageHeader
        title={`Complaint #${complaint.id}`}
        subtitle={complaint.title || `${complaint.aiCategory} at ${complaint.ward}`}
        breadcrumbs={breadcrumbs}
        badge={<StatusBadge status={complaint.status} />}
        actions={
          <Link
            to={backLink}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isStaffOrAdmin ? "Back to Queue" : "All Complaints"}</span>
          </Link>
        }
      />

      {/* 1. FIELD WORKER ACTION PANEL (For assigned sanitation workers) */}
      {isWorker && !isResolved && (
        <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/30 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Field Worker Cleanup Operation & Direct Proof</h3>
                <p className="text-xs text-amber-200 mt-0.5">
                  Execute on-ground cleaning and submit post-cleanup photographic evidence directly from the site.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-500/30 rounded-xl border border-amber-400/30 text-amber-200 self-start sm:self-auto">
              Status: {complaint.status}
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">
                {complaint.status === "Assigned" && "📍 Incident dispatched to your squad. Start cleanup when on site."}
                {complaint.status === "In Progress" && "🧹 Cleanup currently in progress. Take a photo of the cleared area when complete."}
                {complaint.status === "Awaiting Verification" && "📷 Photographic proof submitted! Awaiting municipal review and citizen confirmation."}
              </p>
              <p className="text-amber-200/80 text-[11px]">
                Assigned Squad: <strong>{complaint.assignedTeamName || 'Squad Alpha'}</strong> • Worker Lead: <strong>{currentUser?.name || 'Ramesh Shinde'}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {complaint.status === "Assigned" && (
                <button
                  type="button"
                  onClick={handleStartCleanup}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Cleanup</span>
                </button>
              )}

              {(complaint.status === "Assigned" || complaint.status === "In Progress") && (
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Submit Evidence Photo</span>
                </button>
              )}

              {complaint.status === "Awaiting Verification" && (
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(true)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Update Evidence Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MUNICIPAL & ADMIN SUPERVISORY ACTION PANEL */}
      {isStaffOrAdmin && !isResolved && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-500/30 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Municipal Field Verification & Squad Oversight</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Review photographic evidence submitted directly by field worker before releasing citizen Green Points.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-500/30 rounded-xl border border-blue-400/30 text-blue-200 self-start sm:self-auto">
              Status: {complaint.status}
            </span>
          </div>

          {complaint.status === "Awaiting Verification" ? (
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                    Evidence Photo Submitted Directly by Field Worker
                  </span>
                </div>
                <span className="text-[11px] font-mono text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Submitter: {complaint.workerEvidence?.workerName || complaint.assignedWorkerName || 'Ramesh Shinde (Squad Alpha)'} ({complaint.workerEvidence?.workerId || 'WRK-2026-00001'})
                </span>
              </div>

              {complaint.workerEvidence?.notes && (
                <p className="text-xs text-slate-200 italic bg-black/20 p-3 rounded-xl border border-white/10">
                  <strong>Worker Notes:</strong> "{complaint.workerEvidence.notes}"
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="text-xs text-slate-300">
                  <span>Waste Volume: <strong>{complaint.workerEvidence?.wasteVolumeCollected || '140 kg'}</strong> • Equipment: <strong>{Array.isArray(complaint.workerEvidence?.equipmentUsed) ? complaint.workerEvidence.equipmentUsed.join(', ') : (complaint.workerEvidence?.equipmentUsed || 'Compactor')}</strong></span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleReClean}
                    className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Re-Cleanup</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectResolve}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Resolve Complaint (+50 Points)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-white">
                  Assigned Squad: {complaint.assignedTeamName || 'Squad Alpha'} • Worker Lead: {complaint.assignedWorkerName || 'Ramesh Shinde'}
                </p>
                <p className="text-blue-200/80 text-[11px]">
                  Awaiting on-site cleanup and photographic evidence upload by assigned field worker. Once uploaded, complaint will route here and to Verification Hub for municipal verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Worker Clearance Pending
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CITIZEN COMPLAINT CONTROL & EVOCATION BOX (In Any State/Condition) */}
      {!isStaffOrAdmin && !isWorker && (
        <CitizenComplaintActionBox complaint={complaint} />
      )}

      {/* 4. CITIZEN VERIFICATION CALLOUT BANNER (When Awaiting Verification or Resolved) */}
      {!isStaffOrAdmin && !isWorker && (complaint.status === "Awaiting Verification" || complaint.status === "Resolved") && !complaint.isVerifiedByCitizen && !feedbackGiven && (
        <div className="bg-gradient-to-r from-emerald-800 to-forest-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/40 space-y-4 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">Has this location been cleaned?</h3>
              <p className="text-xs text-emerald-200">
                Squad {complaint.assignedTeamName || 'Alpha'} (Worker: {complaint.workerEvidence?.workerName || complaint.assignedWorkerName || 'Ramesh Shinde'}) has completed the cleanup and uploaded post-action proof. Confirm to release your <strong>+50 Green Points</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleCitizenVerification(true)}
              className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Yes, Location Cleaned (+50 Green Points)</span>
            </button>
            <button
              onClick={() => handleCitizenVerification(false)}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              Still Needs Attention
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Timeline & Verification; Right AI & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visuals & Timeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Before & After Comparison Viewer */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">Cleanup Visual Verification</h3>
              {(complaint.workerEvidence || complaint.afterImageUrl) && (
                <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>On-Ground Proof by Worker: <strong>{complaint.workerEvidence?.workerName || complaint.assignedWorkerName || 'Ramesh Shinde'}</strong></span>
                </span>
              )}
            </div>
            <BeforeAfterSlider
              beforeUrl={complaint.beforeImageUrl || complaint.imageUrl}
              afterUrl={complaint.afterImageUrl || complaint.workerEvidence?.photoUrl || "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80"}
              visualImprovement={92}
            />
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Live Closed-Loop Tracking Timeline
            </h3>
            <ComplaintTimeline timeline={complaint.timeline} />
          </div>
        </div>

        {/* Right Column: AI Analysis & Location Map */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Analysis Card */}
          <AIAnalysisCard analysis={complaint} />

          {/* Incident Mini Map */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Incident Location</h4>
              <span className="text-xs text-slate-500 font-mono">{complaint.latitude}, {complaint.longitude}</span>
            </div>

            <div className="h-48 rounded-2xl overflow-hidden border border-slate-200">
              <MapContainer
                center={[complaint.latitude || 18.5314, complaint.longitude || 73.8446]}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[complaint.latitude || 18.5314, complaint.longitude || 73.8446]} icon={pinIcon} />
              </MapContainer>
            </div>

            <div className="text-xs text-slate-600 pt-1">
              <p className="font-semibold text-slate-800">{complaint.landmark || "Shivaji Chowk Junction"}</p>
              <p className="text-slate-500">{complaint.ward}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Field Worker Evidence Submission Modal */}
      {showWorkerModal && (
        <WorkerEvidenceModal
          isOpen={showWorkerModal}
          complaint={complaint}
          onClose={() => setShowWorkerModal(false)}
          onSuccess={() => setShowWorkerModal(false)}
        />
      )}
    </div>
  );
};
