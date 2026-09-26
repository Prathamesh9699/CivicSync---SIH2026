import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, PlusCircle, Flame, Award, Camera, Truck, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileNav = () => {
  const { role } = useAuth();

  if (role === 'worker') {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around">
          <NavLink
            to="/worker/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/worker/tasks"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Inbox className="w-5 h-5" />
            <span>Tasks</span>
          </NavLink>

          {/* Center Floating Action Button for Worker Photo Upload */}
          <NavLink
            to="/worker/tasks"
            className="flex flex-col items-center -mt-6 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-orange-500/40 group-active:scale-90 transition-transform font-black">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-amber-400 mt-1">Proof</span>
          </NavLink>

          <NavLink
            to="/worker/history"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <CheckSquare className="w-5 h-5" />
            <span>Archive</span>
          </NavLink>

          <NavLink
            to="/worker/squad"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Truck className="w-5 h-5" />
            <span>Fleet</span>
          </NavLink>
        </div>
      </div>
    );
  }

  const isAdmin = role === 'admin' || role === 'administrator';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        <NavLink
          to={role === 'citizen' ? '/citizen/dashboard' : isAdmin ? '/admin/dashboard' : '/municipal/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to={role === 'citizen' ? '/citizen/complaints' : '/municipal/complaints'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Inbox className="w-5 h-5" />
          <span>Complaints</span>
        </NavLink>

        {/* Center Floating Action Button for Report Waste */}
        <NavLink
          to="/citizen/report"
          className="flex flex-col items-center -mt-6 group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/40 group-active:scale-90 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-brand-700 mt-1">Report</span>
        </NavLink>

        <NavLink
          to={role === 'citizen' ? '/citizen/hotspots' : '/municipal/hotspots'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Flame className="w-5 h-5" />
          <span>Hotspots</span>
        </NavLink>

        <NavLink
          to={role === 'citizen' ? '/citizen/green-points' : '/profile'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Award className="w-5 h-5" />
          <span>Rewards</span>
        </NavLink>
      </div>
    </div>
  );
};
