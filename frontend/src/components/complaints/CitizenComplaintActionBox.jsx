import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Camera, 
  MessageSquare, 
  Award,
  Send,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

export const CitizenComplaintActionBox = ({ complaint, onActionCompleted }) => {
  const { updateComplaintStatus } = useComplaints();
  const { currentUser, addGreenPoints } = useAuth();
  const { showToast, addNotification, dispatchResolutionSms } = useNotifications();

  const [activeModal, setActiveModal] = useState(null); // 'resolve' | 'reopen' | 'withdraw' | 'escalate'
  const [citizenNote, setCitizenNote] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!complaint) return null;

  const isAlreadyResolved = complaint.status === "Citizen Verified" || complaint.status === "Resolved";
  const isWithdrawn = complaint.status === "Withdrawn" || complaint.status === "Cancelled";

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Citizen Marks as Cleaned / Resolved in Any Condition
  const handleMarkResolved = () => {
    setIsProcessing(true);

    const afterImg = proofImage || complaint.afterImageUrl || "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80";
    const note = citizenNote.trim() || "Citizen verified location clean and marked complaint as Resolved.";

    updateComplaintStatus(complaint.id, "Resolved", {
      isVerifiedByCitizen: true,
      afterImageUrl: afterImg,
      citizenResolutionNote: note,
      officerNote: `Citizen confirmed issue resolved. Cleanliness verified.`
    });

    addGreenPoints(50);

    // 1. In-app notification to the citizen
    addNotification({
      userId: complaint.citizenId || currentUser?.id || currentUser?.userId,
      targetRole: 'citizen',
      title: `Complaint #${complaint.id} Marked Resolved`,
      message: `You marked Ticket #${complaint.id} at ${complaint.ward} as resolved. +50 Green Points credited! Status updated across municipal registry.`,
      type: "success",
      ticketId: complaint.id,
      link: `/citizen/complaints/${complaint.id}`
    });

    // 2. Dispatch SMS confirmation to citizen's phone number
    const targetPhone = complaint.citizenPhone || (currentUser?.phone) || '+91 98230 11452';
    dispatchResolutionSms({
      phone: targetPhone,
      complaintId: complaint.id,
      ward: complaint.ward || 'Civic Area',
      category: complaint.aiCategory || 'Waste',
      citizenName: complaint.citizenName || currentUser?.name || 'Citizen',
      pointsEarned: 50,
      officerName: 'Self-Verified via Civic Portal'
    });


    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#06b6d4', '#f59e0b']
    });

    setIsProcessing(false);
    setActiveModal(null);
    setCitizenNote('');
    setProofImage('');
    if (onActionCompleted) onActionCompleted();
  };

  // 2. Citizen Evokes / Reopens Complaint in Any Condition
  const handleEvokeReopen = () => {
    if (!citizenNote.trim()) {
      showToast({
        title: "Reason Required",
        message: "Please enter a brief explanation for reopening/evoking this complaint.",
        type: "alert"
      });
      return;
    }

    setIsProcessing(true);

    const note = citizenNote.trim();

    updateComplaintStatus(complaint.id, "Under Review", {
      status: "Under Review",
      isReopenedByCitizen: true,
      reopenedAt: new Date().toISOString(),
      reopenReason: note,
      officerNote: `URGENT: Citizen evoked/reopened ticket: ${note}`,
      severity: "High",
      aiPriorityScore: Math.max(75, (complaint.aiPriorityScore || 50) + 15)
    });

    addNotification({
      userId: complaint.citizenId || currentUser?.id || currentUser?.userId,
      targetRole: 'citizen',
      title: `Complaint #${complaint.id} Evoked & Reopened`,
      message: `Your complaint #${complaint.id} has been reopened with high priority. Municipal dispatch team has been notified.`,
      type: "alert",
      ticketId: complaint.id,
      link: `/citizen/complaints/${complaint.id}`
    });

    showToast({
      title: "Complaint Evoked & Reopened",
      message: `Complaint #${complaint.id} status sent to Municipality as Under Review (High Priority).`,
      type: "info"
    });

    setIsProcessing(false);
    setActiveModal(null);
    setCitizenNote('');
    if (onActionCompleted) onActionCompleted();
  };

  // 3. Citizen Withdraws / Cancels Complaint
  const handleWithdrawComplaint = () => {
    setIsProcessing(true);

    const note = citizenNote.trim() || "Citizen voluntarily withdrew the civic complaint.";

    updateComplaintStatus(complaint.id, "Withdrawn", {
      status: "Withdrawn",
      isWithdrawnByCitizen: true,
      withdrawnAt: new Date().toISOString(),
      officerNote: `Citizen withdrew report: ${note}`
    });

    addNotification({
      userId: complaint.citizenId || currentUser?.id || currentUser?.userId,
      targetRole: 'citizen',
      title: `Complaint #${complaint.id} Withdrawn`,
      message: `Complaint #${complaint.id} has been withdrawn and closed in municipal dispatch queue.`,
      type: "info",
      ticketId: complaint.id,
      link: `/citizen/complaints/${complaint.id}`
    });

    showToast({
      title: "Complaint Withdrawn",
      message: `Ticket #${complaint.id} marked as Withdrawn.`,
      type: "info"
    });

    setIsProcessing(false);
    setActiveModal(null);
    setCitizenNote('');
    if (onActionCompleted) onActionCompleted();
  };

  // 4. Request Urgent Municipal Follow-up
  const handleUrgentFollowUp = () => {
    setIsProcessing(true);

    updateComplaintStatus(complaint.id, complaint.status || "In Progress", {
      isEscalatedByCitizen: true,
      lastCitizenPingAt: new Date().toISOString(),
      officerNote: `CITIZEN PRIORITY PING: Reporting citizen requested urgent cleanup status update.`
    });

    addNotification({
      userId: complaint.citizenId || currentUser?.id || currentUser?.userId,
      targetRole: 'citizen',
      title: `Urgent Ping Sent for #${complaint.id}`,
      message: `High-priority dispatch reminder sent to the zonal municipal officer for ${complaint.ward}.`,
      type: "alert",
      ticketId: complaint.id,
      link: `/citizen/complaints/${complaint.id}`
    });

    showToast({
      title: "Urgent Ping Dispatched",
      message: `Municipal squad notified of citizen priority follow-up for #${complaint.id}.`,
      type: "success"
    });

    setIsProcessing(false);
    setActiveModal(null);
    if (onActionCompleted) onActionCompleted();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                Citizen Complaint Control & Feedback Box
              </h4>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-500/30">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Update, resolve, or evoke this complaint in any state to instantly synchronize with the municipality.
            </p>
          </div>
        </div>

        {/* Current State Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono">
          <span className="text-slate-400">Current Status:</span>
          <span className={`font-bold ${isAlreadyResolved ? 'text-emerald-400' : isWithdrawn ? 'text-slate-400' : 'text-amber-400'}`}>
            {complaint.status || "Reported"}
          </span>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* 1. Mark Resolved / Cleaned */}
        <button
          type="button"
          onClick={() => setActiveModal('resolve')}
          className="p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="text-[10px] text-emerald-300 font-bold font-mono">+50 pts</span>
          </div>
          <div>
            <strong className="text-xs text-white block group-hover:text-emerald-300 transition-colors">
              Mark as Resolved
            </strong>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              Waste is cleared or clean. Notify municipality to close ticket.
            </span>
          </div>
        </button>

        {/* 2. Evoke / Reopen Complaint */}
        <button
          type="button"
          onClick={() => setActiveModal('reopen')}
          className="p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-amber-300 font-bold font-mono">Urgent</span>
          </div>
          <div>
            <strong className="text-xs text-white block group-hover:text-amber-300 transition-colors">
              Evoke / Reopen
            </strong>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              Debris still remains or fresh waste dumped. Re-escalate to squad.
            </span>
          </div>
        </button>

        {/* 3. Request Urgent Follow-Up */}
        <button
          type="button"
          onClick={() => setActiveModal('escalate')}
          className="p-3.5 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-blue-300 font-bold font-mono">SLA Alert</span>
          </div>
          <div>
            <strong className="text-xs text-white block group-hover:text-blue-300 transition-colors">
              Urgent Follow-Up
            </strong>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              Send high-priority reminder ping to zonal municipal officer.
            </span>
          </div>
        </button>

        {/* 4. Cancel / Withdraw */}
        <button
          type="button"
          onClick={() => setActiveModal('withdraw')}
          className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <XCircle className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-rose-300 font-bold font-mono">Withdraw</span>
          </div>
          <div>
            <strong className="text-xs text-white block group-hover:text-rose-300 transition-colors">
              Withdraw Report
            </strong>
            <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              Cancel ticket if reported by mistake or no longer needed.
            </span>
          </div>
        </button>
      </div>

      {/* MODAL DIALOGS FOR EXPLICIT ACTIONS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-100 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  activeModal === 'resolve' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  activeModal === 'reopen' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  activeModal === 'escalate' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {activeModal === 'resolve' && <CheckCircle2 className="w-5 h-5" />}
                  {activeModal === 'reopen' && <RotateCcw className="w-5 h-5" />}
                  {activeModal === 'escalate' && <Clock className="w-5 h-5" />}
                  {activeModal === 'withdraw' && <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {activeModal === 'resolve' && "Mark Complaint as Resolved"}
                    {activeModal === 'reopen' && "Evoke / Reopen Civic Complaint"}
                    {activeModal === 'escalate' && "Request Priority Follow-Up"}
                    {activeModal === 'withdraw' && "Withdraw Civic Complaint"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Complaint ID: <span className="font-mono text-emerald-400 font-bold">{complaint.id}</span> • {complaint.ward}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {activeModal === 'resolve' && (
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <Award className="w-4 h-4" />
                    <span>Instant Resolution & Green Points Release</span>
                  </div>
                  <p className="text-slate-300">
                    By clicking resolve, you verify that the reported waste at <strong>{complaint.landmark || complaint.ward}</strong> has been cleared. This ticket will be recorded as resolved in the municipal dashboard.
                  </p>
                </div>
              )}

              {activeModal === 'reopen' && (
                <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>High-Priority Re-Escalation to Sanitation Squad</span>
                  </div>
                  <p className="text-slate-300">
                    If waste was not properly cleared or new garbage was dumped at the exact spot, evoking this complaint moves it back to <strong>Under Review (High Priority)</strong> for immediate team re-assignment.
                  </p>
                </div>
              )}

              {activeModal === 'escalate' && (
                <div className="bg-blue-950/40 p-4 rounded-2xl border border-blue-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-300 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Zonal SLA Expedited Reminder</span>
                  </div>
                  <p className="text-slate-300">
                    This will send a high-priority dispatch reminder to the municipal sanitation team overseeing <strong>{complaint.ward}</strong>.
                  </p>
                </div>
              )}

              {activeModal === 'withdraw' && (
                <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>Voluntary Complaint Withdrawal</span>
                  </div>
                  <p className="text-slate-300">
                    Are you sure you want to withdraw this complaint? It will be marked as Withdrawn and removed from active municipal dispatch queues.
                  </p>
                </div>
              )}

              {/* Citizen Note / Feedback Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  {activeModal === 'reopen' ? 'Reason for Reopening *' : 'Citizen Notes / Description (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={citizenNote}
                  onChange={(e) => setCitizenNote(e.target.value)}
                  placeholder={
                    activeModal === 'resolve' ? "e.g. Street cleaned thoroughly by municipal sweepers this morning." :
                    activeModal === 'reopen' ? "e.g. Leftover construction debris and plastic packets are still blocking the curb." :
                    activeModal === 'withdraw' ? "e.g. Reported by mistake or neighbor cleaned up." :
                    "e.g. Please expedite dispatch before evening rain."
                  }
                  className="w-full text-xs sm:text-sm border border-slate-700 rounded-xl p-3 bg-slate-950 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Optional Photo Proof Upload (For Resolve) */}
              {activeModal === 'resolve' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Optional: Upload Clean Location Photo Proof
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />
                  {proofImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={proofImage} alt="Proof Preview" className="w-12 h-12 rounded-lg object-cover border border-emerald-500" />
                      <span className="text-xs text-emerald-400 font-bold">Clearance Photo Attached</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Cancel
              </button>

              {activeModal === 'resolve' && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleMarkResolved}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? "Updating Status..." : "Confirm & Mark Resolved (+50 pts)"}</span>
                </button>
              )}

              {activeModal === 'reopen' && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleEvokeReopen}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isProcessing ? "Re-Escalating..." : "Evoke & Reopen Ticket"}</span>
                </button>
              )}

              {activeModal === 'escalate' && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleUrgentFollowUp}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isProcessing ? "Sending..." : "Dispatch Priority Ping"}</span>
                </button>
              )}

              {activeModal === 'withdraw' && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleWithdrawComplaint}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isProcessing ? "Withdrawing..." : "Confirm Withdrawal"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
