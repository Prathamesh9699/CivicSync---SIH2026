import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { MUNICIPAL_ANALYTICS } from '../../data/analytics';
import { Activity, Cpu, Sparkles, CheckCircle2, Server, Clock, Database, ShieldCheck } from 'lucide-react';

export const AIMonitoringPage = () => {
  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="AI System Telemetry & Model Ops"
        subtitle="Real-time performance metrics for YOLOv8 Vision, OpenCV embeddings, and Scikit-Learn severity engines."
        breadcrumbs={[{ label: "Admin Console", path: "/admin/dashboard" }, { label: "AI Monitoring" }]}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Pipeline Status</span>
          <p className="text-2xl font-extrabold text-emerald-400">100% Online</p>
          <p className="text-[11px] text-slate-400">5 Models Active</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Mean Inference Latency</span>
          <p className="text-2xl font-extrabold text-cyan-400">98.4 ms</p>
          <p className="text-[11px] text-slate-400">PyTorch GPU Accelerated</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Average Confidence</span>
          <p className="text-2xl font-extrabold text-purple-400">94.2%</p>
          <p className="text-[11px] text-slate-400">Across 11 Waste Streams</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Model Checkpoint</span>
          <p className="text-2xl font-extrabold text-amber-400">v2.4.0</p>
          <p className="text-[11px] text-slate-400">Last Synced: 3h ago</p>
        </div>
      </div>

      {/* 5 Core Models Telemetry Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Active Neural Model Architecture & Health</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">FastAPI Microservices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">AI Model Subsystem</th>
                <th className="py-3.5 px-4">Architecture / Framework</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Avg Confidence</th>
                <th className="py-3.5 px-4">Latency</th>
                <th className="py-3.5 px-4 text-right">Inferences Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {MUNICIPAL_ANALYTICS.aiModelTelemetry.map((model, idx) => (
                <tr key={idx} className="hover:bg-slate-700/40 transition-colors">
                  <td className="py-4 px-4">
                    <strong className="text-white block font-bold text-sm">{model.name}</strong>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-cyan-300">{model.modelType}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {model.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold font-mono text-white">{model.avgConfidence}</td>
                  <td className="py-4 px-4 font-mono text-slate-300">{model.latencyMs} ms</td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400">{model.processedToday} scans</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
