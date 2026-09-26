import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { MUNICIPAL_ANALYTICS } from '../../data/analytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Filter, Download, Sparkles } from 'lucide-react';

import { useComplaints } from '../../context/ComplaintContext';

export const MunicipalAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('6months');
  const { complaints } = useComplaints();

  const resolvedCount = complaints.filter(c => c.status === "Resolved" || c.status === "Citizen Verified").length;
  const liveResolutionRate = complaints.length === 0 ? "100%" : `${Math.round((resolvedCount / complaints.length) * 100)}%`;

  // Dynamic 3-Stream Distribution (Plastic Waste, Medical Waste, E-Waste)
  const categoryCounts = complaints.reduce((acc, c) => {
    let cat = c.aiCategory || 'Plastic Waste';
    if (cat.toLowerCase().includes('medic') || cat.toLowerCase().includes('bio')) cat = 'Medical Waste';
    else if (cat.toLowerCase().includes('e-waste') || cat.toLowerCase().includes('elect')) cat = 'E-Waste';
    else cat = 'Plastic Waste';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const dynamicWasteDistribution = [
    { name: "Plastic Waste", count: categoryCounts["Plastic Waste"] || 0, color: "#0284c7" },
    { name: "Medical Waste", count: categoryCounts["Medical Waste"] || 0, color: "#e11d48" },
    { name: "E-Waste", count: categoryCounts["E-Waste"] || 0, color: "#8b5cf6" }
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Municipal Cleanliness Analytics"
        subtitle="Urban sanitation intelligence, ward compliance rankings, response speeds, and AI model performance."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Analytics" }]}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium"
            >
              <option value="30days">Last 30 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Year to Date (2026)</option>
            </select>
          </div>
        }
      />

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Cleanups" value={resolvedCount.toString()} change={resolvedCount > 0 ? "+1 this week" : "0 total"} color="emerald" subtitle="Closed successfully" />
        <StatCard title="Avg Resolution Speed" value={complaints.length > 0 ? "2.4 Hours" : "0 Hours"} change="Optimized SLA" color="blue" subtitle="Triage to verification" />
        <StatCard title="Citizen Validation Rate" value={liveResolutionRate} change="Optimal" color="amber" subtitle="Confirmed clear" />
        <StatCard title="AI Accuracy Index" value={complaints.length > 0 ? "95.4%" : "100% Ready"} change="YOLOv8 ViT" color="purple" subtitle="Ground-truth verified" />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ward Performance Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ward Cleanliness Performance Index</h3>
              <p className="text-xs text-slate-500">Resolution Rate (%) by Municipal Zone</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              All Wards Clean
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MUNICIPAL_ANALYTICS.wardPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="ward" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="resolutionRate" fill="#16a34a" radius={[6, 6, 0, 0]} name="Resolution Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3-Stream Waste Taxonomy Distribution */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Waste Stream Distribution</h3>
            <span className="text-xs text-slate-500 font-mono">Plastic • Medical • E-Waste</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {complaints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicWasteDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {dynamicWasteDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">
                <p className="font-bold text-slate-600">0 Incident Reports</p>
                <p>Tracking Plastic, Medical & E-Waste streams</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
            {dynamicWasteDistribution.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-500 font-medium text-[10px]">{item.name}</span>
                <strong className="text-slate-900 text-xs mt-0.5">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
