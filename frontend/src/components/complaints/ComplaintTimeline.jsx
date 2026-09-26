import React from 'react';
import { CheckCircle2, Clock, CircleDot, AlertCircle } from 'lucide-react';

export const ComplaintTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="py-2">
      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
        {timeline.map((item, index) => {
          const isCompleted = item.status === "completed";
          const isCurrent = item.status === "current";
          const isPending = item.status === "pending";

          return (
            <div key={index} className="relative pl-6">
              {/* Icon Marker */}
              <div className="absolute -left-[17px] top-0.5">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-200 ring-4 ring-brand-100 animate-pulse">
                    <CircleDot className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h4 className={`text-sm font-bold ${
                    isCompleted ? "text-slate-900" : isCurrent ? "text-brand-700" : "text-slate-500"
                  }`}>
                    {item.step}
                  </h4>
                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
