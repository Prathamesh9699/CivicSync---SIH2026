import React from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { CleanCityPulseGauge } from '../../components/ai/CleanCityPulseGauge';
import { StatusBadge, SeverityBadge } from '../../components/common/Badges';
import { MUNICIPAL_ANALYTICS } from '../../data/analytics';
import { MUNICIPAL_TEAMS } from '../../data/teams';
import { 
  Inbox, 
  Flame, 
  CheckSquare, 
  MapPin, 
  Truck, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  AlertOctagon,
  Copy,
  Users
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';

export const MunicipalDashboard = () => {
  const { complaints } = useComplaints();
  const { currentUser } = useAuth();

  const pendingCount = complaints.filter(c => c.status !== "Resolved" && c.status !== "Citizen Verified").length;
  const criticalCount = complaints.filter(c => c.severity === "Critical" && c.status !== "Resolved").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved" || c.status === "Citizen Verified").length;
  const awaitingVerification = complaints.filter(c => c.status === "Awaiting Verification").length;

  const liveResolutionRate = complaints.length === 0 ? "100%" : `${Math.round((resolvedCount / complaints.length) * 100)}%`;
  const livePulseScore = complaints.length === 0 ? 100 : Math.round((resolvedCount / complaints.length) * 100);

  // Dynamic monthly trend based on live complaints
  const dynamicComplaintsTrend = [
    { month: "Jan", reported: 0, resolved: 0 },
    { month: "Feb", reported: 0, resolved: 0 },
    { month: "Mar", reported: 0, resolved: 0 },
    { month: "Apr", reported: 0, resolved: 0 },
    { month: "May", reported: 0, resolved: 0 },
    { month: "Today", reported: complaints.length, resolved: resolvedCount }
  ];

  // Dynamic 3-Stream Category Distribution (Plastic Waste, Medical Waste, E-Waste)
  const allowedStreams = [
    { name: "Plastic Waste", fill: "#0284c7" },
    { name: "Medical Waste", fill: "#e11d48" },
    { name: "E-Waste", fill: "#8b5cf6" }
  ];

  const categoryCounts = complaints.reduce((acc, c) => {
    let cat = c.aiCategory || 'Plastic Waste';
    if (cat.toLowerCase().includes('medic') || cat.toLowerCase().includes('bio')) cat = 'Medical Waste';
    else if (cat.toLowerCase().includes('e-waste') || cat.toLowerCase().includes('elect')) cat = 'E-Waste';
    else cat = 'Plastic Waste';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const dynamicCategoryDistribution = allowedStreams.map(stream => {
    const count = categoryCounts[stream.name] || 0;
    return {
      name: stream.name,
      count,
      percentage: complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0,
      fill: stream.fill
    };
  });

  const recentTriage = complaints.slice(0, 5);

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Municipal Command & Triage Center"
        subtitle={`Zonal Officer: ${currentUser?.name || "Sanitation Officer"} • ID: ${currentUser?.userId || 'MUN-2026'} • Solid Waste Management Division`}
        breadcrumbs={[{ label: "Command Center" }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              to="/municipal/complaints"
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Inbox className="w-4 h-4" />
              <span>Priority Queue ({pendingCount})</span>
            </Link>
            <Link
              to="/municipal/reports"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-all"
            >
              Generate Report
            </Link>
          </div>
        }
      />

      {/* Top Cleanliness Pulse & Operational KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Clean City Pulse Widget */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">City Cleanliness Pulse™</h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Zonal Index
            </span>
          </div>

          <div className="py-4 flex justify-center">
            <CleanCityPulseGauge score={livePulseScore} size="md" trend="0%" subtitle="Zonal Cleanliness & SLA Health" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block">Avg Clear Time</span>
              <strong className="text-slate-900 text-sm">{complaints.length > 0 ? "2.4 Hours" : "0 Hours"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Resolution Rate</span>
              <strong className="text-emerald-600 text-sm">{liveResolutionRate}</strong>
            </div>
          </div>
        </div>

        {/* 4 Core Municipal KPIs */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Complaints"
            value={complaints.length.toString()}
            change={complaints.length > 0 ? `${complaints.length} active` : "0 active"}
            icon={Inbox}
            color="blue"
            subtitle="Logged into registry"
          />
          <StatCard
            title="Critical Priority"
            value={criticalCount.toString()}
            change={criticalCount > 0 ? "Immediate squad" : "0 critical"}
            isPositive={criticalCount === 0}
            icon={AlertOctagon}
            color="rose"
            subtitle="Requires urgent triage"
          />
          <StatCard
            title="Awaiting Verification"
            value={awaitingVerification.toString()}
            change={awaitingVerification > 0 ? "Photos uploaded" : "0 pending"}
            icon={CheckSquare}
            color="purple"
            subtitle="Before/After ready"
          />
          <StatCard
            title="Active Squads"
            value="4 Teams"
            change="100% operational"
            icon={Truck}
            color="emerald"
            subtitle="Sanitation fleet on road"
          />
        </div>
      </div>

      {/* Analytics Charts Grid: Trends & Category Segregation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Monthly Trend Area Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Complaints vs Resolutions Trend</h3>
              <p className="text-xs text-slate-500">6-Month Urban Response Timeline</p>
            </div>
            <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
              Live Sync
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicComplaintsTrend}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="reported" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorReported)" name="Reported Issues" />
                <Area type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved Cleanups" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Waste Stream Distribution Pie */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Waste Stream Distribution</h3>
            <span className="text-xs text-slate-500 font-mono">{dynamicCategoryDistribution.length} Streams</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {dynamicCategoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicCategoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {dynamicCategoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">
                <p className="font-bold text-slate-600">No Waste Data</p>
                <p>Zero reports logged in registry</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {dynamicCategoryDistribution.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }}></span>
                <span className="truncate text-slate-700">{cat.name}: <strong>{cat.percentage}%</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Priority Triage Queue Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Live AI-Assisted Priority Triage Queue</h3>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-300">
                Sorted by AI Priority Score
              </span>
            </div>
            <p className="text-xs text-slate-500">Auto-ranked considering waste hazard, visual extent, sensitive location, and recurrence.</p>
          </div>
          <Link
            to="/municipal/complaints"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Full Priority Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Priority Score</th>
                <th className="py-3 px-3">ID & Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Location / Ward</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assigned Squad</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTriage.length > 0 ? (
                recentTriage.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-bold font-mono">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          c.severity === "Critical" ? "bg-rose-600 animate-ping" : c.severity === "High" ? "bg-amber-500" : "bg-yellow-400"
                        }`}></span>
                        <span>{c.aiPriorityScore || 84}</span>
                        <span className="text-[10px] text-slate-400 font-normal">/100</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <strong className="text-slate-900 block font-mono">{c.id}</strong>
                      <span className="text-slate-500 line-clamp-1 max-w-[200px]">{c.title}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {c.aiCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{c.landmark || c.ward}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {c.assignedTeamName ? (
                        <span className="flex items-center gap-1 font-medium">
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          {c.assignedTeamName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/municipal/complaints/${c.id}`}
                        className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg transition-colors inline-block"
                      >
                        Triage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 font-medium">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">Priority Triage Queue is Empty</p>
                    <p className="text-xs text-slate-400 mt-0.5">No unresolved complaints in the system. All city sectors are clean.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workforce Sanitation Squads Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">Sanitation Squad Deployment Status</h3>
          </div>
          <Link to="/municipal/assignments" className="text-xs font-bold text-brand-700 hover:text-brand-800">
            Manage Squads
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MUNICIPAL_TEAMS.map((team) => (
            <div key={team.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{team.name}</h4>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${team.statusColor}`}>
                  {team.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">{team.unit}</p>
              <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl space-y-1">
                <p><strong>Vehicle:</strong> {team.vehicleType}</p>
                <p><strong>Location:</strong> {team.currentLocation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
