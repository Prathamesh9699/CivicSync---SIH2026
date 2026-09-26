import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { MobileNav } from '../components/common/MobileNav';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { Truck, MapPin, Radio, ShieldCheck, Clock } from 'lucide-react';

export const WorkerLayout = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Navbar />

      {/* Field Worker Live Telemetry & Squad Ticker Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 border-b border-slate-800 text-[11px] font-mono flex items-center justify-between overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold">FIELD SQUAD OPERATIONS ACTIVE</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Squad: <strong className="text-amber-400">{currentUser?.assignedTeam || 'Squad Alpha (Sanitation Unit 04)'}</strong></span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPS Tracking: <strong className="text-emerald-400">Connected (Live)</strong></span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Shift: <strong className="text-sky-400">{currentUser?.shift || 'Morning (06:00 - 14:00)'}</strong></span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vehicle: {currentUser?.vehicleAssigned || 'MH-12-QX-4012'}</span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="hidden lg:block">
          <Sidebar type="worker" />
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
