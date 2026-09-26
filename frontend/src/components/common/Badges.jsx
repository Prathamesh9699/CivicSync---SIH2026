import React from 'react';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, Sparkles, RefreshCw, Layers } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const statusStyles = {
    "Reported": "bg-slate-100 text-slate-700 border-slate-300",
    "AI Analyzed": "bg-cyan-50 text-cyan-700 border-cyan-300",
    "Under Review": "bg-amber-50 text-amber-700 border-amber-300",
    "Assigned": "bg-indigo-50 text-indigo-700 border-indigo-300",
    "In Progress": "bg-blue-50 text-blue-700 border-blue-300",
    "Awaiting Verification": "bg-purple-50 text-purple-700 border-purple-300",
    "Citizen Verified": "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold",
    "Resolved": "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold",
    "Withdrawn": "bg-slate-100 text-slate-600 border-slate-300",
    "Cancelled": "bg-slate-100 text-slate-600 border-slate-300",
    "Reopened": "bg-amber-100 text-amber-900 border-amber-400 font-bold",
    "Rejected": "bg-rose-50 text-rose-700 border-rose-300"
  };

  const style = statusStyles[status] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export const SeverityBadge = ({ severity }) => {
  const severityStyles = {
    "Critical": "bg-rose-500 text-white shadow-sm shadow-rose-200",
    "High": "bg-amber-500 text-white shadow-sm shadow-amber-200",
    "Medium": "bg-amber-100 text-amber-900 border border-amber-300 font-bold",
    "Normal": "bg-emerald-500 text-white",
    "Low": "bg-emerald-500 text-white",
    "Resolved": "bg-emerald-600 text-white"
  };

  const style = severityStyles[severity] || "bg-slate-700 text-white";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${style}`}>
      {severity === "Critical" && <ShieldAlert className="w-3 h-3" />}
      {severity} Priority
    </span>
  );
};

export const AIConfidenceBadge = ({ confidence }) => {
  const confNum = confidence !== undefined && confidence !== null ? Number(confidence) : 0;
  const isHigh = confNum >= 90;
  const isMedium = confNum >= 70 && confNum < 90;
  const isZero = confNum === 0;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isZero ? "bg-slate-800 text-slate-300 border-slate-700" :
      isHigh ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
      isMedium ? "bg-blue-50 text-blue-800 border-blue-200" :
      "bg-amber-50 text-amber-800 border-amber-200"
    }`}>
      <Sparkles className="w-3 h-3 text-brand-600" />
      AI Confidence: <strong className="font-semibold">{confNum}%</strong>
    </span>
  );
};

export const ConditionBadge = ({ condition }) => {
  const label = typeof condition === 'object' && condition !== null
    ? (condition.conditionLabel || condition.label || condition.conditionType || "Roadside dumping")
    : (condition || "Roadside dumping");

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      <Layers className="w-3 h-3 text-slate-500" />
      {label}
    </span>
  );
};
