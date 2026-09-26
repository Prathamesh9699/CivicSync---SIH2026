import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useNotifications } from '../../context/NotificationContext';
import { FileText, Download, Printer, Sparkles, Building2, CheckCircle2, TrendingUp, Award } from 'lucide-react';

export const AIReportsPage = () => {
  const { showToast } = useNotifications();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      showToast({
        title: "Report Downloaded Successfully",
        message: "CleanTrack_Monthly_Cleanliness_Report_August_2026.pdf ready.",
        type: "success"
      });
      window.print();
    }, 600);
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="AI-Generated Municipal Cleanliness Reports"
        subtitle="Automated monthly executive summaries, ward hygiene audits, and strategic preventative cleanup plans."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "AI Reports" }]}
        actions={
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGenerating ? "Compiling Report..." : "Download PDF / Print Report"}</span>
          </button>
        }
      />

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg max-w-4xl mx-auto space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                CT
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Pune Municipal Corporation</h2>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Solid Waste Management & Urban Sanitation Division
            </p>
          </div>

          <div className="text-right font-mono text-xs text-slate-600">
            <p><strong>REPORT ID:</strong> PMC-AI-2026-08M</p>
            <p><strong>PERIOD:</strong> August 2026 (Monthly)</p>
            <p><strong>ISSUED:</strong> August 19, 2026</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">1. Executive Cleanliness Summary</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            During August 2026, the CleanTrack platform processed <strong>1,500 civic complaints</strong> with an average automated AI classification accuracy of <strong>95.4%</strong>. Citywide Cleanliness Pulse stood at <strong>82/100</strong> (+6.4% improvement). Average field resolution time dropped to <strong>4.6 hours</strong>.
          </p>
        </div>

        {/* 6 Key Performance Metrics Table */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block">Total Complaints</span>
            <strong className="text-base text-slate-900">1,500</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Successfully Cleaned</span>
            <strong className="text-base text-emerald-600">1,240 (82.7%)</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Pending Triage</span>
            <strong className="text-base text-amber-600">180 (12.0%)</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Critical Hazards</span>
            <strong className="text-base text-rose-600">80 Issues</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Top Waste Stream</span>
            <strong className="text-base text-blue-600">Plastic (32%)</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Citizen Green Points</span>
            <strong className="text-base text-brand-700">74,200 pts</strong>
          </div>
        </div>

        {/* Hotspot & Recurrence Findings */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">2. Key AI Hotspot Diagnostics</h3>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600">
            <li><strong>Top Chronic Hotspot:</strong> Ward 12 (Shivaji Chowk Junction) logged 28 repeat roadside accumulations.</li>
            <li><strong>Duplicate Cluster Efficiency:</strong> 34 duplicate complaints were merged, saving an estimated 18 redundant squad dispatches.</li>
            <li><strong>Citizen Validation Compliance:</strong> 94.8% of post-cleanup photos were verified clean by reporting citizens.</li>
          </ul>
        </div>

        {/* Recommended Strategic Action */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
          <span className="font-bold text-emerald-900 block text-sm">3. Municipal Sanitation Officer Action Plan:</span>
          <p>
            1. Install 2x high-capacity solar-compacting dry bins at Shivaji Chowk (Ward 12).<br />
            2. Double afternoon compactor clearance shift at Kothrud Vegetable Mandi (Ward 07).<br />
            3. Issue municipal penalty notice to unauthorized C&D remodeling contractor on Prabhat Road.
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs font-mono text-slate-500">
          <div>
            <p className="font-bold text-slate-800">Municipal Sanitation Officer</p>
            <p>Zonal Sanitation Operations</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">Admin</p>
            <p>System Administrator & IT Governance</p>
          </div>
        </div>
      </div>
    </div>
  );
};
