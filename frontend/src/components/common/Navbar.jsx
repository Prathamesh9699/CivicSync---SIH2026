import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Sparkles, 
  MapPin, 
  Bell, 
  User, 
  LogOut, 
  Shield, 
  Building2, 
  Menu, 
  X, 
  ChevronDown,
  Award,
  PlusCircle,
  BarChart3,
  HelpCircle,
  Layers,
  Leaf,
  Inbox,
  Flame,
  CheckSquare,
  ShieldCheck,
  Users,
  Activity
} from 'lucide-react';

export const Navbar = () => {
  const { currentUser, role, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  // Determine where clicking the CleanTrack logo navigates
  const brandLogoPath = !isAuthenticated
    ? '/'
    : role === 'citizen'
    ? '/citizen/dashboard'
    : role === 'municipal_staff'
    ? '/municipal/dashboard'
    : role === 'worker'
    ? '/worker/dashboard'
    : '/admin/dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs w-full">
      {/* Full-width container from extreme left to extreme right */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 w-full">
          
          {/* 1. BRAND LOGO AT COMPLETE LEFT */}
          <Link to={brandLogoPath} className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-forest-800 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-all">
              <div className="relative">
                <Leaf className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                  Clean<span className="text-brand-600">Track</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-emerald-300 hidden sm:inline-block">
                  AI Civic
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
                AI Powered Civic Cleanliness Platform
              </p>
            </div>
          </Link>

          {/* 2. CENTER NAVIGATION TABS (SPACIOUS, BALANCED & ROLE-AWARE - NO HOME TAB WHEN SIGNED IN) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8 2xl:gap-10 flex-1 justify-center px-6">
            
            {/* A. CITIZEN LOGGED IN: Dedicated Citizen Tabs */}
            {isAuthenticated && role === 'citizen' && (
              <>
                <Link
                  to="/citizen/dashboard"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/citizen/dashboard') ? 'text-brand-700 bg-brand-50 shadow-2xs font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/citizen/report"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/citizen/report') ? 'text-brand-700 bg-brand-50 shadow-2xs font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Report Waste
                </Link>
                <Link
                  to="/citizen/complaints"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/citizen/complaints') ? 'text-brand-700 bg-brand-50 shadow-2xs font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Complaints
                </Link>
                <Link
                  to="/citizen/hotspots"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/citizen/hotspots') ? 'text-brand-700 bg-brand-50 shadow-2xs font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Nearby Hotspots
                </Link>
                <Link
                  to="/citizen/green-points"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/citizen/green-points') ? 'text-brand-700 bg-brand-50 shadow-2xs font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Green Points
                </Link>
              </>
            )}

            {/* B. MUNICIPAL STAFF LOGGED IN: Dedicated Municipal Tabs */}
            {isAuthenticated && role === 'municipal_staff' && (
              <>
                <Link
                  to="/municipal/dashboard"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/municipal/dashboard') ? 'text-blue-700 bg-blue-50 shadow-2xs font-extrabold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Command Center
                </Link>
                <Link
                  to="/municipal/complaints"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/municipal/complaints') ? 'text-blue-700 bg-blue-50 shadow-2xs font-extrabold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Priority Queue
                </Link>
                <Link
                  to="/municipal/hotspots"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/municipal/hotspots') ? 'text-blue-700 bg-blue-50 shadow-2xs font-extrabold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  GIS Map
                </Link>
                <Link
                  to="/municipal/assignments"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/municipal/assignments') ? 'text-blue-700 bg-blue-50 shadow-2xs font-extrabold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Squad Fleet
                </Link>
                <Link
                  to="/municipal/verification"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/municipal/verification') ? 'text-blue-700 bg-blue-50 shadow-2xs font-extrabold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Verification
                </Link>
                <Link
                  to="/municipal/analytics"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/municipal/analytics') ? 'text-blue-700 bg-blue-50 shadow-2xs font-extrabold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Analytics
                </Link>
              </>
            )}

            {/* C. WORKER LOGGED IN: Dedicated Field Worker Tabs */}
            {isAuthenticated && role === 'worker' && (
              <>
                <Link
                  to="/worker/dashboard"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/worker/dashboard') ? 'text-amber-700 bg-amber-50 shadow-2xs font-extrabold ring-1 ring-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Worker Dashboard
                </Link>
                <Link
                  to="/worker/tasks"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/worker/tasks') ? 'text-amber-700 bg-amber-50 shadow-2xs font-extrabold ring-1 ring-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Assigned Field Tasks
                </Link>
                <Link
                  to="/worker/history"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/worker/history') ? 'text-amber-700 bg-amber-50 shadow-2xs font-extrabold ring-1 ring-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Evidence Archive
                </Link>
                <Link
                  to="/worker/squad"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/worker/squad') ? 'text-amber-700 bg-amber-50 shadow-2xs font-extrabold ring-1 ring-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Squad Fleet & Safety
                </Link>
              </>
            )}

            {/* D. ADMIN LOGGED IN: Dedicated Executive Governance Tabs */}
            {isAuthenticated && (role === 'admin' || role === 'administrator') && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/admin/dashboard') ? 'text-purple-700 bg-purple-50 shadow-2xs font-extrabold ring-1 ring-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Executive Governance
                </Link>
                <Link
                  to="/admin/users"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/admin/users') ? 'text-purple-700 bg-purple-50 shadow-2xs font-extrabold ring-1 ring-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Member Management
                </Link>
                <Link
                  to="/admin/municipal-watch"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/admin/municipal-watch') ? 'text-purple-700 bg-purple-50 shadow-2xs font-extrabold ring-1 ring-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Municipal Watchdog
                </Link>
                <Link
                  to="/admin/ai-monitoring"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/admin/ai-monitoring') ? 'text-purple-700 bg-purple-50 shadow-2xs font-extrabold ring-1 ring-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  AI Telemetry
                </Link>
              </>
            )}

            {/* D. PUBLIC VISITOR (LOGGED OUT ONLY): Visible strictly when not signed in */}
            {!isAuthenticated && (
              <>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/') ? 'text-brand-700 bg-brand-50 font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/about') ? 'text-brand-700 bg-brand-50 font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  About
                </Link>
                <Link
                  to="/how-it-works"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                    isCurrent('/how-it-works') ? 'text-brand-700 bg-brand-50 font-extrabold ring-1 ring-brand-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  How It Works
                </Link>
                <Link
                  to="/ai-intelligence"
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-bold flex items-center gap-1.5 transition-all ${
                    isCurrent('/ai-intelligence') ? 'text-emerald-800 bg-emerald-50 font-extrabold ring-1 ring-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>AI Intelligence</span>
                </Link>
              </>
            )}
          </nav>

          {/* 3. RIGHT ACTION CLUSTER AT COMPLETE RIGHT */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
            
            {/* Primary Action CTA Button */}
            {role === 'municipal_staff' ? (
              <Link
                to="/municipal/complaints"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all transform active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                <span>Priority Triage</span>
              </Link>
            ) : role === 'admin' || role === 'administrator' ? (
              <Link
                to="/admin/municipal-watch"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-800 hover:from-purple-700 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all transform active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>SLA Watchdog</span>
              </Link>
            ) : (
              <Link
                to={isAuthenticated ? "/citizen/report" : "/login?portal=citizen"}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-forest-800 hover:from-brand-700 hover:to-forest-900 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition-all transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Waste</span>
              </Link>
            )}

            {/* Citizen Green Points Badge */}
            {role === 'citizen' && currentUser && (
              <Link
                to="/citizen/green-points"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
                title="Your Green Points Balance"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>{typeof currentUser.greenPoints === 'number' ? currentUser.greenPoints : 0} pts</span>
              </Link>
            )}

            {/* Notification Bell with Ping (Only visible when user is logged in) */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Role & Profile Badge Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                  title="Account Details & Role"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    role === 'citizen' ? 'bg-emerald-500' :
                    role === 'municipal_staff' ? 'bg-blue-500' :
                    role === 'worker' ? 'bg-amber-500' : 'bg-purple-500'
                  }`}></span>
                  <span className="capitalize font-bold">
                    {role === 'municipal_staff' ? 'Municipal' : role === 'worker' ? 'Worker' : role === 'admin' || role === 'administrator' ? 'Admin' : 'Citizen'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate text-sm">{currentUser?.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser?.email}</p>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {role === 'municipal_staff' ? 'Municipal Officer' : role === 'worker' ? 'Field Worker' : role === 'admin' || role === 'administrator' ? 'Admin' : 'Citizen'}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {currentUser?.userId || 'ID: CIT-2026'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={role === 'citizen' ? '/citizen/dashboard' : role === 'municipal_staff' ? '/municipal/dashboard' : role === 'worker' ? '/worker/dashboard' : '/admin/dashboard'}
                        onClick={() => setIsRoleDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-bold"
                      >
                        <Layers className="w-4 h-4 text-brand-600" />
                        <span>Go to My Dashboard</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsRoleDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-semibold"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Profile & Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => { logout(); setIsRoleDropdownOpen(false); navigate('/login'); }}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-rose-50 text-rose-600 transition-colors font-bold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Profile Avatar or Login */}
            {isAuthenticated ? (
              <Link to="/profile" className="flex items-center gap-2 group flex-shrink-0" title="View Profile">
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={currentUser?.name || "User"}
                  className="w-9 h-9 rounded-full object-cover border-2 border-brand-500/40 group-hover:border-brand-600 transition-all shadow-xs"
                />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Log In
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl lg:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 text-sm shadow-2xl">
          {/* Citizen Mobile Tabs */}
          {isAuthenticated && role === 'citizen' && (
            <>
              <Link to="/citizen/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Dashboard</Link>
              <Link to="/citizen/report" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Report Waste</Link>
              <Link to="/citizen/complaints" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">My Complaints</Link>
              <Link to="/citizen/hotspots" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Nearby Hotspots</Link>
              <Link to="/citizen/green-points" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Green Points</Link>
            </>
          )}

          {/* Municipal Mobile Tabs */}
          {isAuthenticated && role === 'municipal_staff' && (
            <>
              <Link to="/municipal/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Command Center</Link>
              <Link to="/municipal/complaints" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Priority Queue</Link>
              <Link to="/municipal/hotspots" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">GIS Map</Link>
              <Link to="/municipal/assignments" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Squad Fleet</Link>
              <Link to="/municipal/verification" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Verification</Link>
              <Link to="/municipal/analytics" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Analytics</Link>
            </>
          )}

          {/* Worker Mobile Tabs */}
          {isAuthenticated && role === 'worker' && (
            <>
              <Link to="/worker/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Worker Dashboard</Link>
              <Link to="/worker/tasks" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Assigned Tasks</Link>
              <Link to="/worker/history" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Evidence Archive</Link>
              <Link to="/worker/squad" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Squad Fleet & Safety</Link>
            </>
          )}

          {/* Admin Mobile Tabs */}
          {isAuthenticated && (role === 'admin' || role === 'administrator') && (
            <>
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Executive Governance</Link>
              <Link to="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Member Management</Link>
              <Link to="/admin/municipal-watch" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">Municipal Watchdog</Link>
              <Link to="/admin/ai-monitoring" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-semibold">AI Telemetry</Link>
            </>
          )}

          {/* Public Visitor Mobile Tabs (Only when logged out) */}
          {!isAuthenticated && (
            <>
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-slate-800 font-bold hover:text-brand-600"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-slate-800 font-bold hover:text-brand-600"
              >
                About CleanTrack
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-slate-800 font-bold hover:text-brand-600"
              >
                How It Works
              </Link>
              <Link
                to="/ai-intelligence"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-slate-800 font-bold hover:text-brand-600"
              >
                AI Intelligence
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
