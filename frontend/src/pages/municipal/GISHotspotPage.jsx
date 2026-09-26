import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { LeafletHotspotMap } from '../../components/maps/LeafletHotspotMap';
import { GIS_HOTSPOTS } from '../../data/hotspots';
import { Flame, Filter, MapPin, Truck, Sparkles, X, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const GISHotspotPage = () => {
  const [selectedHotspot, setSelectedHotspot] = useState(GIS_HOTSPOTS[0]);
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterWard, setFilterWard] = useState('All');

  const filteredHotspots = GIS_HOTSPOTS.filter(h => {
    const matchSev = filterSeverity === 'All' || h.severity === filterSeverity;
    const matchWard = filterWard === 'All' || h.ward.includes(filterWard);
    return matchSev && matchWard;
  });

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="GIS Hotspot Command Center"
        subtitle="Real-time spatio-temporal GIS tracking chronic dump sites, severity radiuses, and sanitation routes."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "GIS Hotspots" }]}
      />

      {/* Filter Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Map Layer Filters:</span>
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none"
          >
            <option value="All">All Severities</option>
            <option value="Critical">🔴 Critical Hotspots</option>
            <option value="High">🟠 High Priority</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Resolved / Low</option>
          </select>

          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none"
          >
            <option value="All">All Municipal Wards</option>
            <option value="Ward 12">Ward 12 (Shivaji Nagar)</option>
            <option value="Ward 14">Ward 14 (Deccan)</option>
            <option value="Ward 07">Ward 07 (Kothrud)</option>
            <option value="Ward 09">Ward 09 (Hadapsar)</option>
            <option value="Ward 05">Ward 05 (Baner)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 font-mono text-slate-500">
          <span>Active GIS Nodes: <strong className="text-slate-900">{filteredHotspots.length}</strong></span>
        </div>
      </div>

      {/* Main Map + Right Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Full Interactive Leaflet Map */}
        <div className="lg:col-span-8">
          <LeafletHotspotMap
            hotspots={filteredHotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
            height="560px"
          />
        </div>

        {/* Right Details Drawer */}
        <div className="lg:col-span-4 space-y-4">
          {selectedHotspot ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  NODE #{selectedHotspot.id}
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: selectedHotspot.color || '#dc2626' }}
                >
                  {selectedHotspot.severity} Priority
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedHotspot.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedHotspot.ward}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Total Complaints</span>
                  <strong className="text-slate-900 text-sm">{selectedHotspot.totalComplaints}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Recurrence Rate</span>
                  <strong className="text-amber-600 text-sm">{selectedHotspot.recurrenceRate}</strong>
                </div>
              </div>

              <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <p><strong className="text-slate-800">Primary Material:</strong> {selectedHotspot.primaryWasteType}</p>
                <p><strong className="text-slate-800">Waste Pattern:</strong> {selectedHotspot.condition}</p>
                <p><strong className="text-slate-800">Last Sanitation Sweep:</strong> {selectedHotspot.lastCleanedDaysAgo} days ago</p>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-bold text-emerald-900 block">AI Recommended Intervention:</span>
                <p>{selectedHotspot.recommendedAction}</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/municipal/complaints"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md text-center transition-all"
                >
                  View Complaints at this Hotspot
                </Link>
                <Link
                  to="/municipal/recurring"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs text-center transition-colors"
                >
                  View Historical Recurrence
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-500 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Active GIS Hotspots</h4>
              <p className="text-xs text-slate-500">
                0 chronic waste accumulations detected. Spatial DBSCAN algorithm continuously monitors incoming reports.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
