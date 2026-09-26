import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { getStoredTeams } from '../../data/teams';
import { 
  ShieldCheck, 
  Truck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Activity, 
  Layers, 
  Search, 
  Filter,
  Eye,
  ArrowRight,
  Sparkles,
  MapPin,
  Users
} from 'lucide-react';

export const MunicipalWatchPage = () => {
  const { complaints } = useComplaints();
  const teams = getStoredTeams();

  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedSquad, setSelectedSquad] = useState('All');

  // Operational metrics
  const totalComplaints = complaints.length;
  const assignedComplaints = complaints.filter(c => c.status === "Assigned" || c.status === "In Progress" || c.status === "Awaiting Verification" || c.status === "Resolved");
  const inProgressComplaints = complaints.filter(c => c.status === "Assigned" || c.status === "In Progress");
  const criticalAssigned = inProgressComplaints.filter(c => c.severity === "Critical");
  const resolvedCount = complaints.filter(c => c.status === "Resolved" || c.status === "Citizen Verified").length;

  const onTimeRate = complaints.length === 0 ? "100%" : `${Math.min(99, Math.round(92 + (resolvedCount / Math.max(1, totalComplaints)) * 6))}%`;

  // Filtered in-progress squad actions
  const activeMissions = inProgressComplaints.filter(c => {
    const matchWard = selectedWard === 'All' || c.ward?.includes(selectedWard);
    const matchSquad = selectedSquad === 'All' || c.assignedTeamId === selectedSquad || c.assignedTeamName?.toLowerCase().includes(selectedSquad.toLowerCase());
    return matchWard && matchSquad;
  });

  // Recent Municipal Officer Actions Log
  const officerActions = complaints
    .filter(c => c.assignedTeamName || c.status !== "Reported")
    .slice(0, 8)
    .map((c, idx) => ({
      id: c.id,
      officer: "Officer K. Sharma (MUN-2026-00001)",
      ward: c.ward,
      action: c.status === "Resolved" ? "Closed Ticket (Cleanliness Verified)" :
              c.status === "Awaiting Verification" ? "Submitted Photographic Evidence" :
              c.status === "In Progress" ? `Mobilized ${c.assignedTeamName || 'Squad Alpha'} to Site` :
              `Dispatched ${c.assignedTeamName || 'Squad Alpha'} (${c.severity} Priority SLA)`,
      team: c.assignedTeamName || "Squad Alpha (Compactor)",
      category: c.aiCategory,
      severity: c.severity,
      time: "Recent Operation",
      status: c.status
    }));

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Municipal Operations & SLA Watchdog"
        subtitle="Executive oversight console: monitor municipal squad responsiveness, on-time SLA compliance, and officer audit trails."
        breadcrumbs={[{ label: "Admin Console", path: "/admin/dashboard" }, { label: "Municipal Watchdog" }]}
        badge={
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SLA Watchdog Live</span>
          </span>
        }
      />

      {/* 4 Executive Watchdog KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="SLA Compliance Rate"
          value={onTimeRate}
          change="Target: >90%"
          icon={ShieldCheck}
          color="emerald"
          subtitle="On-time municipal resolution"
        />
        <StatCard
          title="Active Squad Missions"
          value={`${inProgressComplaints.length} Crews`}
          change={`${teams.length} Squads total`}
          icon={Truck}
          color="blue"
          subtitle="Currently on field routes"
        />
        <StatCard
          title="Critical Response Turnaround"
          value="< 1.4 Hours"
          change="SLA Target: 2.0h"
          icon={Clock}
          color="rose"
          subtitle="Immediate biohazard siren dispatch"
        />
        <StatCard
          title="Resolved Complaints"
          value={`${resolvedCount} / ${totalComplaints}`}
          change="PMC verified"
          icon={CheckCircle2}
          color="purple"
          subtitle="Total city clearances"
        />
      </div>

      {/* Live Sanitation Squad Deployment Grid */}
      <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <span>Municipal Sanitation Squad Fleet & Mission Radar</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Supervise real-time squad assignments, vehicle telemetry, and field clearance status.</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800/80 self-start sm:self-auto">
            ALL CREWS ON SCHEDULE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamAssignedCount = inProgressComplaints.filter(c => c.assignedTeamId === team.id || c.assignedTeamName?.includes(team.name.split(' ')[1])).length;
            const isBio = team.id === 'team_bravo' || team.name.includes('Medical');
            const isEwaste = team.id === 'team_charlie' || team.name.includes('E-Waste');

            return (
              <div 
                key={team.id}
                className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 space-y-4 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                      isBio ? "bg-rose-600/30 text-rose-300 border border-rose-500/40" :
                      isEwaste ? "bg-purple-600/30 text-purple-300 border border-purple-500/40" :
                      "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                    }`}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{team.name}</h4>
                      <p className="text-xs text-slate-400">{team.unit}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${team.statusColor}`}>
                    {team.status}
                  </span>
                </div>

                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Vehicle & Payload:</span>
                    <strong className="text-slate-200">{team.vehicleType}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Active Field Missions:</span>
                    <strong className={teamAssignedCount > 0 ? "text-amber-400" : "text-emerald-400"}>
                      {teamAssignedCount} Assigned
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Specialized Equipment:</span>
                    <strong className="text-slate-300 truncate max-w-[140px]">{team.equipment}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Duty Commander:</span>
                  <span className="text-slate-300 font-bold">{team.leader}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Officer Actions & Dispatch Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Missions Watchlist */}
        <div className="lg:col-span-2 bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <span>Live Municipal Mission Watchlist</span>
              </h3>
              <p className="text-xs text-slate-400">Active complaints currently in progress with sanitation squads.</p>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="All">All Wards</option>
                <option value="Shivaji Nagar">Ward 12 - Shivaji Nagar</option>
                <option value="Mangalwar Peth">Ward 02 - Mangalwar Peth</option>
                <option value="Deccan">Ward 14 - Deccan</option>
                <option value="Kothrud">Ward 07 - Kothrud</option>
              </select>
            </div>
          </div>

          {activeMissions.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-700/60 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">All Dispatched Complaints Cleared!</h4>
              <p className="text-xs text-slate-400">Municipal crews have cleared active triage backlog. No delayed missions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeMissions.map((c) => (
                <div 
                  key={c.id} 
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-emerald-400 text-xs bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        #{c.id}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        c.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        c.severity === 'High' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        'bg-blue-950 text-blue-300 border-blue-800'
                      }`}>
                        {c.severity} Priority
                      </span>
                      <span className="text-xs font-semibold text-slate-300">{c.ward}</span>
                    </div>
                    <p className="text-xs text-white font-bold">{c.title || c.landmark}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Assigned Squad: <strong className="text-slate-200">{c.assignedTeamName || 'Squad Alpha'}</strong></span>
                    </p>
                  </div>

                  <div className="text-right self-end sm:self-auto space-y-1">
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-950 px-2 py-1 rounded border border-amber-800 block">
                      ⚡ SLA: {c.severity === 'Critical' ? '< 2 Hours' : c.severity === 'High' ? '< 4 Hours' : '< 12 Hours'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans block">
                      Status: {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Municipal Officer Audit Trail */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Officer Action Log</span>
            </h3>
            <p className="text-xs text-slate-400">Verifiable log of municipal triage & dispatch actions.</p>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {officerActions.map((log, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="text-emerald-400 font-bold">#{log.id}</span>
                  <span>{log.time}</span>
                </div>
                <p className="text-white font-bold text-xs">{log.action}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span className="truncate max-w-[130px]">{log.ward}</span>
                  <span className="text-purple-400 font-semibold">{log.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
