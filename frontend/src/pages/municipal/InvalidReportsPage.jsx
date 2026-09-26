import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useNotifications } from '../../context/NotificationContext';
import { useComplaints } from '../../context/ComplaintContext';
import { ShieldAlert, Check, X, HelpCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';

export const InvalidReportsPage = () => {
  const { complaints } = useComplaints();
  const { showToast } = useNotifications();
  const [reviews, setReviews] = useState({});

  const invalidQueue = complaints.filter(c => (c.aiConfidence && c.aiConfidence < 35) || c.status === "Rejected");

  const handleAction = (id, action) => {
    setReviews(prev => ({ ...prev, [id]: action }));
    showToast({
      title: `Report #${id} Updated`,
      message: `Action recorded: ${action.toUpperCase()}. Citizen notified respectfully.`,
      type: "info"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="AI Validity & Non-Waste Report Filter"
        subtitle="Automated image verification detects accidental uploads, non-waste imagery, and duplicate photos without penalizing citizens."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Invalid Filter" }]}
      />

      {/* Fairness & Ethics Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-amber-950">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-900 text-sm block">Civic Trust Principle</strong>
          <p className="mt-0.5">
            The AI validity filter flags reports with low confidence (&lt;35%) to protect municipal crews from accidental calls. Reports are never automatically dismissed with accusations of fraud; friendly clarification guidance is provided instead.
          </p>
        </div>
      </div>

      {invalidQueue.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {invalidQueue.map((item) => {
          const action = reviews[item.id];

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-6 sm:p-8 border-2 shadow-xs space-y-5 transition-all ${
                action ? "border-slate-300 opacity-60 bg-slate-50" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-mono font-bold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  {item.id}
                </span>
                <span className="bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded border border-rose-200">
                  {item.aiConfidence}% AI Confidence
                </span>
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <img src={item.imageUrl} alt={item.id} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-2 text-xs">
                <p><strong>Citizen:</strong> {item.citizenName}</p>
                <p><strong>Location:</strong> {item.ward}</p>
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-900">
                  <strong>Flag Reason:</strong> {item.flagReason}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {action ? (
                  <span className="text-xs font-bold text-slate-700 font-mono">Action: {action.toUpperCase()}</span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction(item.id, 'rejected')}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Dismiss (Accidental)
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'clarification')}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Request Re-Upload
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'approved')}
                      className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Approve Override
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">No Flagged or Invalid Reports</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All submitted reports meet AI image verification confidence standards (&gt;35%). Zero non-waste reports detected.
          </p>
        </div>
      )}
    </div>
  );
};
