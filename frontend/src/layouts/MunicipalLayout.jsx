import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { MobileNav } from '../components/common/MobileNav';
import { Toast } from '../components/common/Toast';
import { Activity, ShieldAlert, Sparkles } from 'lucide-react';

export const MunicipalLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Navbar />

      {/* Municipal Live Ticker Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 border-b border-slate-800 text-[11px] font-mono flex items-center justify-between overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">MUNICIPAL COMMAND ACTIVE</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Triage Latency: <strong className="text-cyan-400">142ms</strong></span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Hotspots: <strong className="text-amber-400">4 Zones</strong></span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <span>Pune Municipal Solid Waste Division</span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="hidden lg:block">
          <Sidebar type="municipal" />
        </div>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <Toast />
    </div>
  );
};
