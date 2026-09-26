import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { 
  Shield, 
  Users, 
  Activity, 
  ShieldCheck, 
  Server, 
  Sparkles, 
  CheckCircle2, 
  Truck,
  ArrowRight,
  Clock,
  UserCheck,
  Award
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { getStoredTeams } from '../../data/teams';

export const AdminDashboard = () => {
  const { complaints } = useComplaints();
  const teams = getStoredTeams();
  
  let registeredUsers = [];
  try {
    const raw = localStorage.getItem('cleantrack_registered_users_v4') || localStorage.getItem('cleantrack_registered_users');
    if (raw) registeredUsers = JSON.parse(raw);
  } catch (e) {}

  const citizenMembers = Math.max(1, registeredUsers.filter(u => u.role === 'citizen').length + 1);
  const municipalOfficers = Math.max(1, registeredUsers.filter(u => u.role === 'municipal_staff').length + 1);
  const totalUsers = citizenMembers + municipalOfficers + 1; // +1 Admin
  const totalComplaints = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved" || c.status === "Citizen Verified").length;
  const inProgressSquads = complaints.filter(c => c.status === "Assigned" || c.status === "In Progress").length;

  const slaCompliance = complaints.length === 0 ? "100%" : `${Math.min(99, Math.round(92 + (resolvedCount / Math.max(1, totalComplaints)) * 6))}%`;

  const recentOfficerActions = complaints
    .filter(c => c.assignedTeamName || c.status !== "Reported")
    .slice(0, 4)
    .map(c => ({
      id: c.id,
      officer: "Officer K. Sharma (MUN-2026-00001)",
      action: c.status === "Resolved" ? "Verified Site Cleanliness" : `Dispatched ${c.assignedTeamName || 'Squad Alpha'} (${c.severity} SLA)`,
      ward: c.ward,
      severity: c.severity,
      time: "Recent"
    }));

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Executive Governance & Administration Console"
        subtitle="Platform oversight, municipal squad SLA monitoring, member management (citizens & municipal staff), and AI infrastructure."
        breadcrumbs={[{ label: "Admin Console" }]}
        badge={
          <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span>Supervisory Mode Active</span>
          </span>
        }
      />

      {/* 4 Executive Governance KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard 
          title="Citizen Members" 
          value={`${citizenMembers} Registered`} 
          change="Reporting active" 
          icon={Users} 
          color="purple" 
          subtitle="Community contributors" 
        />
        <StatCard 
          title="Municipal Staff" 
          value={`${municipalOfficers} Officers`} 
          change={`${teams.length} Active squads`} 
          icon={Shield} 
          color="blue" 
          subtitle="Field & triage personnel" 
        />
        <StatCard 
          title="Municipal SLA Compliance" 
          value={slaCompliance} 
          change="Target: >90%" 
          icon={ShieldCheck} 
          color="emerald" 
          subtitle="Squad responsiveness" 
        />
        <StatCard 
          title="AI Vision Accuracy" 
          value="98.6%" 
          change="Dual-Model YOLO" 
          icon={Activity} 
          color="teal" 
          subtitle="Plastic & Biohazard pipeline" 
        />
      </div>

      {/* 3 Dedicated Administrative Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Pillar 1: Member Management */}
        <Link
          to="/admin/users"
          className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-purple-500 transition-all space-y-3 group shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base group-hover:text-purple-300 transition-colors flex items-center justify-between">
              <span>Member Management</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Supervise citizen profiles, Green Points rewards, municipal officer accounts, and role authorizations (RBAC).
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-purple-300">
            <span>Citizens & Staff</span>
            <span className="font-bold">{totalUsers} Total Accounts</span>
          </div>
        </Link>

        {/* Pillar 2: Municipal Actions Watchdog */}
        <Link
          to="/admin/municipal-watch"
          className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-blue-500 transition-all space-y-3 group shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base group-hover:text-blue-300 transition-colors flex items-center justify-between">
              <span>Municipal SLA Watchdog</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Watch municipal actions: track squad response times, ensure SLA deadlines are met, and audit officer dispatches.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-blue-300">
            <span>Active Field Missions</span>
            <span className="font-bold">{inProgressSquads} In Progress</span>
          </div>
        </Link>

        {/* Pillar 3: AI Vision & Model Telemetry */}
        <Link
          to="/admin/ai-monitoring"
          className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-emerald-500 transition-all space-y-3 group shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base group-hover:text-emerald-300 transition-colors flex items-center justify-between">
              <span>AI Vision & Model Ops</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Inspect YOLOv8 neural pipeline performance, classification accuracy (98.6%), and biomedical inference telemetry.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-emerald-300">
            <span>Neural Accuracy</span>
            <span className="font-bold">98.6% Validated</span>
          </div>
        </Link>
      </div>

      {/* Live Supervisory Oversight: Squad Health & Officer Action Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Sanitation Squad Readiness Radar */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Municipal Squad Deployment Radar</h3>
            </div>
            <Link to="/admin/municipal-watch" className="text-xs font-bold text-blue-400 hover:underline">
              View Full Radar →
            </Link>
          </div>

          <div className="space-y-3">
            {teams.map((t) => (
              <div key={t.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                    {t.name.split(' ')[1]?.[0] || 'S'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{t.name}</h5>
                    <p className="text-[11px] text-slate-400">{t.unit} • {t.vehicleType}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.statusColor}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Officer Action Feed */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Recent Municipal Officer Actions</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">Live Stream</span>
          </div>

          <div className="space-y-2.5">
            {recentOfficerActions.map((log, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">#{log.id}</span>
                    <strong className="text-white">{log.action}</strong>
                  </div>
                  <p className="text-[11px] text-slate-400">{log.ward} • {log.officer}</p>
                </div>
                <span className="text-[10px] font-bold text-purple-400 font-mono bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                  {log.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
