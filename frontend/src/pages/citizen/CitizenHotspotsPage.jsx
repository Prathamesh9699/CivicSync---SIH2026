import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { LeafletHotspotMap } from '../../components/maps/LeafletHotspotMap';
import { GIS_HOTSPOTS } from '../../data/hotspots';
import { Flame, MapPin, PlusCircle, ArrowRight, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

export const CitizenHotspotsPage = () => {
  const [selectedHotspot, setSelectedHotspot] = useState(GIS_HOTSPOTS[0]);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Nearby Civic Waste Hotspots"
        subtitle="Explore active accumulation zones, recurrence levels, and municipal cleanup schedules in your ward."
        breadcrumbs={[{ label: "Dashboard", path: "/citizen/dashboard" }, { label: "Nearby Hotspots" }]}
        actions={
          <Link
            to="/citizen/report"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report at a Hotspot</span>
          </Link>
        }
      />

      {/* Main Map + Hotspot Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: GIS Map */}
        <div className="lg:col-span-8 space-y-4">
          <LeafletHotspotMap
            hotspots={GIS_HOTSPOTS}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
            height="480px"
          />
        </div>

        {/* Right: Selected Hotspot Details */}
        <div className="lg:col-span-4 space-y-4">
          {selectedHotspot ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{selectedHotspot.ward}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: selectedHotspot.color || '#dc2626' }}
                >
                  {selectedHotspot.severity} Priority
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-xl text-slate-900">{selectedHotspot.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chronic Waste Accumulation Zone</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Total Reports</span>
                  <strong className="text-slate-900 text-sm">{selectedHotspot.totalComplaints}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Active Issues</span>
                  <strong className="text-rose-600 text-sm">{selectedHotspot.activeComplaints}</strong>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80">
                <p>
                  <strong className="text-emerald-900">Primary Waste:</strong> {selectedHotspot.primaryWasteType}
                </p>
                <p>
                  <strong className="text-emerald-900">AI Root Cause:</strong> {selectedHotspot.aiRootCause}
                </p>
                <p>
                  <strong className="text-emerald-900">Municipal Action:</strong> {selectedHotspot.recommendedAction}
                </p>
              </div>

              <Link
                to="/citizen/report"
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Waste at this Location</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-500 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Active Hotspots Detected</h4>
              <p className="text-xs text-slate-500">
                All city wards are currently clear with zero chronic accumulation clusters. Spot an issue? Report it to start tracking.
              </p>
              <Link
                to="/citizen/report"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Waste Now</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
