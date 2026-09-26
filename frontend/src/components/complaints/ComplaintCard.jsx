import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Sparkles, Truck, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import { StatusBadge, SeverityBadge, ConditionBadge } from '../common/Badges';

export const ComplaintCard = ({ complaint, basePath = "/citizen/complaints" }) => {
  if (!complaint) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group">
      {/* Image with Badges */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
        <img
          src={complaint.imageUrl || "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80"}
          alt={complaint.title || complaint.aiCategory}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <SeverityBadge severity={complaint.severity || "High"} />
          {complaint.aiConfidence && (
            <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {complaint.aiConfidence}% AI
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3">
          <StatusBadge status={complaint.status || "Reported"} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="font-bold text-brand-700">{complaint.id}</span>
            <span>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}</span>
          </div>

          <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-1">
            {complaint.title || `${typeof complaint.aiCategory === 'object' && complaint.aiCategory !== null ? (complaint.aiCategory.name || 'Waste') : (complaint.aiCategory || 'Waste')} Accumulation`}
          </h3>

          <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{complaint.landmark || complaint.ward}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
              {typeof complaint.aiCategory === 'object' && complaint.aiCategory !== null
                ? (complaint.aiCategory.name || complaint.aiCategory.label || 'Waste')
                : (complaint.aiCategory || 'Waste')}
            </span>
            {complaint.aiCondition && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 font-medium">
                {typeof complaint.aiCondition === 'object' && complaint.aiCondition !== null
                  ? (complaint.aiCondition.conditionLabel || complaint.aiCondition.conditionType || complaint.aiCondition.description || "Roadside dumping")
                  : String(complaint.aiCondition)}
              </span>
            )}
          </div>
        </div>

        {/* Footer & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {complaint.assignedTeamName ? (
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>{complaint.assignedTeamName}</span>
              </span>
            ) : (
              <span className="italic text-slate-400">Squad unassigned</span>
            )}
          </div>

          <Link
            to={`${basePath}/${complaint.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-extrabold transition-all group-hover:shadow-xs"
          >
            <span>Manage / View</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
