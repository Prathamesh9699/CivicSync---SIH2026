import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { MobileNav } from '../components/common/MobileNav';
import { Toast } from '../components/common/Toast';
import { ShieldCheck, Activity } from 'lucide-react';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Navbar />

      {/* Admin System Banner */}
      <div className="bg-slate-950 text-slate-300 px-4 py-1.5 border-b border-slate-800 text-[11px] font-mono flex items-center justify-between">
        <div className="flex items-center gap-3 text-purple-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-bold">SYSTEM ADMIN ROOT ACCESS (PMC CENTRAL)</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <Activity className="w-3.5 h-3.5" />
          <span>Services: 100% Operational</span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="hidden lg:block">
          <Sidebar type="admin" />
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
