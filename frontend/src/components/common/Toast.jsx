import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, Info, Smartphone, X, Check } from 'lucide-react';

export const Toast = () => {
  const { activeToast } = useNotifications();

  if (!activeToast) return null;

  const isSms = activeToast.type === 'sms';

  const typeConfig = {
    success: {
      bg: "bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-950/50",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    alert: {
      bg: "bg-rose-950/95 border-rose-500/60 text-white shadow-rose-950/50",
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />
    },
    info: {
      bg: "bg-slate-950/95 border-slate-700 text-white shadow-slate-950/50",
      icon: <Info className="w-5 h-5 text-cyan-400" />
    },
    sms: {
      bg: "bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border-emerald-400/60 text-white shadow-emerald-500/20",
      icon: <Smartphone className="w-5 h-5 text-emerald-400 animate-bounce" />
    }
  };

  const config = typeConfig[activeToast.type] || typeConfig.success;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slideUp px-4 sm:px-0">
      <div className={`p-4 rounded-3xl border shadow-2xl flex items-start gap-3.5 backdrop-blur-xl ${config.bg}`}>
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/15">
          {config.icon}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h5 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              {activeToast.title}
            </h5>
            {isSms && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>DELIVERED</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {activeToast.message}
          </p>

          {isSms && activeToast.smsData && (
            <div className="pt-1.5 mt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300/80 font-mono">
              <span>Carrier: {activeToast.smsData.gateway || 'Gov PMC SMS'}</span>
              <span>Ref: {activeToast.smsData.trackingId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
