import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Sparkles, Shield, Heart, MapPin, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-forest-950 text-slate-300 border-t border-emerald-900/50 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-emerald-900/40">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Clean<span className="text-emerald-400">Track</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI Powered Civic Cleanliness Platform. Connecting citizens and municipal corporations to detect, prioritize, clean, and verify urban waste.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Clean City Pulse Active</span>
            </div>
          </div>

          {/* Col 2: Citizen Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/citizen/report" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Report Waste (AI Scan)</span>
                </Link>
              </li>
              <li>
                <Link to="/citizen/complaints" className="hover:text-emerald-300 transition-colors">
                  Track My Complaints
                </Link>
              </li>
              <li>
                <Link to="/citizen/hotspots" className="hover:text-emerald-300 transition-colors">
                  Nearby Hotspots Map
                </Link>
              </li>
              <li>
                <Link to="/citizen/green-points" className="hover:text-emerald-300 transition-colors">
                  Green Points & Rewards
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Municipal Intelligence */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
              Municipal Command
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/municipal/dashboard" className="hover:text-emerald-300 transition-colors">
                  Triage Command Center
                </Link>
              </li>
              <li>
                <Link to="/municipal/complaints" className="hover:text-emerald-300 transition-colors">
                  AI Priority Queue
                </Link>
              </li>
              <li>
                <Link to="/municipal/hotspots" className="hover:text-emerald-300 transition-colors">
                  GIS Hotspot Command
                </Link>
              </li>
              <li>
                <Link to="/municipal/duplicates" className="hover:text-emerald-300 transition-colors">
                  Duplicate Cluster Merge
                </Link>
              </li>
              <li>
                <Link to="/municipal/reports" className="hover:text-emerald-300 transition-colors">
                  AI Monthly Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Architecture */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
              Platform & AI
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/ai-intelligence" className="hover:text-emerald-300 transition-colors">
                  5 Core AI Modules
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-300 transition-colors">
                  6-Step Intelligence Loop
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-300 transition-colors">
                  About CleanTrack
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-emerald-300 transition-colors">
                  Help & FAQs
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-emerald-300 transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Console</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 CleanTrack. AI Powered Civic Cleanliness Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 font-mono text-[11px]">Report • Detect • Prioritize • Clean • Verify</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
