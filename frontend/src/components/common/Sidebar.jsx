import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import {
  LayoutDashboard,
  Inbox,
  AlertOctagon,
  Copy,
  MapPin,
  Sparkles,
  Users,
  CheckSquare,
  BarChart3,
  FileText,
  ShieldAlert,
  Flame,
  Layers,
  Activity,
  Award,
  PlusCircle,
  Settings,
  HelpCircle,
  Bell,
  Truck
} from 'lucide-react';

export const Sidebar = ({ type = "municipal" }) => {
  const { role, currentUser } = useAuth();
  const { complaints = [] } = useComplaints() || {};
  const safeList = Array.isArray(complaints) ? complaints : [];

  // Badge counts
  const criticalCount = safeList.filter(c => c && c.severity === "Critical" && c.status !== "Resolved").length;
  const duplicateClusters = safeList.filter(c => c && c.duplicateDetection?.hasDuplicate).length;
  const verificationCount = safeList.filter(c => c && c.status === "Awaiting Verification").length;
  const invalidCount = safeList.filter(c => c && (c.isFlaggedInvalid || c.status === "Rejected")).length;

  const municipalNavItems = [
    { label: "Dashboard", path: "/municipal/dashboard", icon: LayoutDashboard },
    { label: "Priority Queue", path: "/municipal/complaints", icon: Inbox, badge: criticalCount > 0 ? `${criticalCount} Crit` : null, badgeColor: "bg-rose-500 text-white" },
    { label: "GIS Hotspot Center", path: "/municipal/hotspots", icon: Flame, badge: "Live", badgeColor: "bg-emerald-500 text-white" },
    { label: "Duplicate Detection", path: "/municipal/duplicates", icon: Copy, badge: duplicateClusters > 0 ? `${duplicateClusters}` : null, badgeColor: "bg-amber-500 text-white" },
    { label: "Recurring Waste", path: "/municipal/recurring", icon: MapPin },
    { label: "AI Recommendations", path: "/municipal/ai-recommendations", icon: Sparkles },
    { label: "Squad Assignments", path: "/municipal/assignments", icon: Users },
    { label: "Cleanup Verification", path: "/municipal/verification", icon: CheckSquare, badge: verificationCount > 0 ? `${verificationCount}` : null, badgeColor: "bg-purple-500 text-white" },
    { label: "Analytics & Trends", path: "/municipal/analytics", icon: BarChart3 },
    { label: "AI Monthly Reports", path: "/municipal/reports", icon: FileText },
    { label: "Invalid Reports Filter", path: "/municipal/invalid-reports", icon: ShieldAlert, badge: invalidCount > 0 ? `${invalidCount}` : null, badgeColor: "bg-slate-700 text-white" }
  ];

  const workerNavItems = [
    { label: "Worker Dashboard", path: "/worker/dashboard", icon: LayoutDashboard },
    { label: "Assigned Field Tasks", path: "/worker/tasks", icon: Inbox, badge: safeList.filter(c => c && (c.status === "Assigned" || c.status === "In Progress")).length ? `${safeList.filter(c => c && (c.status === "Assigned" || c.status === "In Progress")).length} Tasks` : null, badgeColor: "bg-amber-500 text-white" },
    { label: "Evidence Archive", path: "/worker/history", icon: CheckSquare },
    { label: "Squad Fleet & Safety", path: "/worker/squad", icon: Truck },
    { label: "My Profile & Shift", path: "/profile", icon: Users }
  ];

  const adminNavItems = [
    { label: "Executive Governance", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Member Management (RBAC)", path: "/admin/users", icon: Users },
    { label: "Municipal SLA Watchdog", path: "/admin/municipal-watch", icon: ShieldAlert, badge: "Live SLA", badgeColor: "bg-blue-500 text-white" },
    { label: "AI Vision Telemetry", path: "/admin/ai-monitoring", icon: Activity, badge: "98.6%", badgeColor: "bg-emerald-500 text-white" }
  ];

  const citizenNavItems = [
    { label: "My Dashboard", path: "/citizen/dashboard", icon: LayoutDashboard },
    { label: "Report Waste (AI Scan)", path: "/citizen/report", icon: PlusCircle, highlight: true },
    { label: "My Complaints", path: "/citizen/complaints", icon: Inbox },
    { label: "Nearby Hotspots", path: "/citizen/hotspots", icon: Flame },
    { label: "Green Points Rewards", path: "/citizen/green-points", icon: Award, badge: `${typeof currentUser?.greenPoints === 'number' ? currentUser.greenPoints : 0} pts`, badgeColor: "bg-amber-500 text-white" },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Help & FAQ", path: "/help", icon: HelpCircle }
  ];

  const items = type === "admin" ? adminNavItems : type === "citizen" ? citizenNavItems : type === "worker" ? workerNavItems : municipalNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 space-y-6">
        {/* Role Identity Tag */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            {type === "admin" ? <Activity className="w-5 h-5 text-purple-400" /> : type === "citizen" ? <Award className="w-5 h-5 text-emerald-400" /> : type === "worker" ? <Truck className="w-5 h-5 text-amber-400" /> : <Layers className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white uppercase tracking-wider truncate">
              {type === "admin" ? "Admin Console" : type === "citizen" ? "Citizen Portal" : type === "worker" ? "Worker Operations" : "Municipal Triage"}
            </p>
            <p className="text-[11px] text-emerald-400 font-mono truncate">
              {currentUser?.name || (type === "admin" ? "Administrator" : type === "citizen" ? "Citizen" : type === "worker" ? "Sanitation Worker" : "Municipal Officer")}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold"
                      : item.highlight
                      ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Clean City Pulse Live Indicator in Sidebar Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Pulse:</span>
            <strong className="text-emerald-400">82/100</strong>
          </div>
          <span className="text-[10px] text-slate-500">AI ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};
