import React, { useState } from 'react';
import { X, Camera, Upload, CheckCircle2, Sparkles, AlertCircle, Truck, FileText, Check, ArrowRight } from 'lucide-react';
import { BeforeAfterSlider } from '../complaints/BeforeAfterSlider';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';

const EVIDENCE_PRESETS = [
  {
    name: "Cleared Street Corridor",
    url: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80",
    desc: "Complete roadside sweeping and debris extraction"
  },
  {
    name: "Sanitized Sidewalk",
    url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80",
    desc: "Pavement cleared with disinfectant wash"
  },
  {
    name: "Civic Public Area",
    url: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80",
    desc: "Plaza curb cleared and waste loaded to compactor"
  }
];

export const WorkerEvidenceModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const { submitWorkerEvidence } = useComplaints();
  const { currentUser } = useAuth();
  const { showToast, addNotification, dispatchResolutionSms } = useNotifications();

  const [afterImage, setAfterImage] = useState(
    complaint?.afterImageUrl || EVIDENCE_PRESETS[0].url
  );
  const [workerNotes, setWorkerNotes] = useState(
    'Site fully swept and cleared of roadside waste piles. 4 poly sacks loaded into compactor truck MH-12-QX-4012. Area sanitized.'
  );
  const [wasteVolume, setWasteVolume] = useState('4 Bags (Approx. 85 kg)');
  const [selectedTools, setSelectedTools] = useState([
    'Hydraulic Compactor',
    'High-Density Poly Sacks',
    'Litter Grabbers'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !complaint) return null;

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAfterImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTool = (tool) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!afterImage) {
      setError('Please provide a post-cleanup evidence photo.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const evidencePayload = {
        afterImageUrl: afterImage,
        notes: workerNotes.trim(),
        wasteVolumeCollected: wasteVolume,
        equipmentUsed: selectedTools,
        workerName: currentUser?.name || 'Ramesh Shinde (Squad Lead)',
        workerId: currentUser?.userId || 'WRK-2026-00001'
      };

      await submitWorkerEvidence(complaint.id || complaint.complaintId, evidencePayload);

      // Notification to reporting citizen that worker completed cleaning
      if (complaint.citizenId) {
        addNotification({
          userId: complaint.citizenId,
          targetRole: 'citizen',
          title: `Cleanup Evidence Submitted: #${complaint.id}`,
          message: `${currentUser?.name || 'Sanitation Worker'} has completed cleanup at ${complaint.ward || 'your reported location'} and uploaded evidence photo. Ticket sent to municipal authority for verification.`,
          type: "info",
          ticketId: complaint.id,
          link: `/citizen/complaints/${complaint.id}`
        });
      }

      // Notification to Municipal Squad Officer
      addNotification({
        targetRole: 'municipal_staff',
        title: `Cleanup Proof Submitted: #${complaint.id}`,
        message: `Field worker ${currentUser?.name || 'Ramesh Shinde'} uploaded cleanup evidence photo for #${complaint.id} at ${complaint.ward}. Awaiting your verification to resolve ticket.`,
        type: "info",
        ticketId: complaint.id,
        link: `/municipal/verification`
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast({
        title: "Cleanup Photo Submitted!",
        message: `Evidence uploaded. Ticket #${complaint.id} submitted for municipal verification.`,
        type: "success"
      });

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError('Failed to submit evidence photo. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Camera className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Submit Cleanup Evidence Photo</h3>
              <p className="text-xs text-amber-100">
                Ticket #{complaint.id} • {complaint.ward}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Context Banner: Field Worker Direct Submission */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Truck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-900">Direct Field Worker Evidence Proof</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                As the sanitation worker on-site, upload the completion photo directly from the field. This proof will be reviewed by the municipal supervisor and validated by the citizen.
              </p>
            </div>
          </div>

          {/* 1. BEFORE & AFTER INTERACTIVE SLIDER PREVIEW */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Before vs. After Visual Comparison Preview
            </label>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
              <BeforeAfterSlider
                beforeUrl={complaint.imageUrl || complaint.beforeImageUrl}
                afterUrl={afterImage}
                visualImprovement={94}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1.5 px-1">
              <span>Left: Original Citizen Report</span>
              <span className="text-emerald-600 font-bold">Right: Your Clean Clearance Photo</span>
            </div>
          </div>

          {/* 2. UPLOAD AFTER PHOTO CONTROLS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Provide Post-Cleanup Evidence Photo <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                id="worker-photo-input"
                accept="image/*"
                capture="environment"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <label
                htmlFor="worker-photo-input"
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo / Upload from Device</span>
              </label>

              <span className="text-xs text-slate-400">or select quick test photo:</span>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {EVIDENCE_PRESETS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAfterImage(p.url)}
                  className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    afterImage === p.url
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <img src={p.url} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                  <div className="overflow-hidden">
                    <p className="font-bold truncate text-[11px]">{p.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. WORKER COMPLETION DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Waste Volume Collected & Dispatched
              </label>
              <input
                type="text"
                value={wasteVolume}
                onChange={(e) => setWasteVolume(e.target.value)}
                placeholder="e.g. 4 Sacks (Approx. 85 kg)"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Squad Vehicle
              </label>
              <input
                type="text"
                disabled
                value={currentUser?.vehicleAssigned || 'MH-12-QX-4012 (Hydraulic Compactor)'}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-600 font-mono"
              />
            </div>
          </div>

          {/* 4. WORKER FIELD NOTES */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Field Completion Notes & Observations
            </label>
            <textarea
              rows={2}
              value={workerNotes}
              onChange={(e) => setWorkerNotes(e.target.value)}
              placeholder="State clearance actions performed, disinfection applied, or residual notes..."
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* 5. TOOLS & GEAR CHECKLIST */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Sanitation Equipment & Protective Gear Used
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Hydraulic Compactor',
                'High-Density Poly Sacks',
                'Litter Grabbers',
                'Pressure Jet Wash',
                'Bleaching & Lime Powder',
                'Biohazard Sharps Bin',
                'Level B Safety PPE'
              ].map((tool, idx) => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleTool(tool)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-amber-700" />}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:bg-slate-400"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Uploading Evidence...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Evidence for Municipal Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
