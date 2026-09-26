import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Truck, 
  Layers, 
  BarChart3, 
  Search, 
  Eye, 
  Flame, 
  Users, 
  RefreshCw,
  PlusCircle,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { CleanCityPulseGauge } from '../../components/ai/CleanCityPulseGauge';
import { LeafletHotspotMap } from '../../components/maps/LeafletHotspotMap';
import { WASTE_CATEGORIES } from '../../data/wasteCategories';
import { GIS_HOTSPOTS } from '../../data/hotspots';

export const LandingPage = () => {
  const [selectedHotspot, setSelectedHotspot] = useState(GIS_HOTSPOTS[0]);

  const intelligenceSteps = [
    { num: "01", title: "Report", desc: "Citizen captures geo-tagged photo with 1-tap automated location.", icon: PlusCircle, color: "from-emerald-500 to-green-600" },
    { num: "02", title: "AI Detects", desc: "Computer vision classifies material, condition, and checks duplicates.", icon: Sparkles, color: "from-cyan-500 to-blue-600" },
    { num: "03", title: "Prioritize", desc: "Transparent severity score ranks critical hazards above minor litter.", icon: Flame, color: "from-amber-500 to-orange-600" },
    { num: "04", title: "Assign", desc: "Municipal triage dispatches dedicated sanitation trucks and teams.", icon: Truck, color: "from-purple-500 to-indigo-600" },
    { num: "05", title: "Clean", desc: "Field crew clears waste and uploads geo-verified After photo.", icon: Layers, color: "from-blue-500 to-teal-600" },
    { num: "06", title: "Verify & Reward", desc: "Citizen validates cleanup; AI confirms; Green Points awarded.", icon: Award, color: "from-emerald-500 to-brand-600" }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-forest-900 to-slate-900 text-white pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>The Clean City Pulse™ is Active</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Make Your City Cleaner, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  One Smart Report at a Time.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                CleanTrack uses AI vision, location intelligence, and civic participation to help municipalities detect, prioritize, and resolve civic cleanliness problems faster.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl mx-auto lg:mx-0">
                <Link
                  to="/login?portal=citizen"
                  className="p-4 bg-gradient-to-r from-emerald-600 to-forest-800 hover:from-emerald-500 hover:to-forest-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 transition-all transform active:scale-98 flex items-center justify-between group border border-emerald-400/30"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Citizen Portal</h4>
                      <p className="text-[11px] text-emerald-200 font-normal">Report Waste & Earn Points</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/login?portal=municipal"
                  className="p-4 bg-slate-800/90 hover:bg-slate-800 text-white rounded-2xl font-bold border border-slate-700 hover:border-blue-500/40 shadow-lg transition-all transform active:scale-98 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Municipal Portal</h4>
                      <p className="text-[11px] text-slate-300 font-normal">Officer Triage & Dispatches</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Instant Complaint Tracking Bar on Landing Page */}
              <div className="pt-2 max-w-xl mx-auto lg:mx-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.target.elements.complaintId.value.trim().toUpperCase();
                    if (input) window.location.href = `/citizen/complaints/${input}`;
                  }}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg"
                >
                  <Search className="w-4 h-4 text-emerald-400 ml-3 flex-shrink-0" />
                  <input
                    name="complaintId"
                    type="text"
                    placeholder="Enter Ticket ID to Track (e.g. CT-2026-00128)..."
                    className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
                  >
                    Track Status
                  </button>
                </form>
              </div>

              {/* Tagline Motto & Admin Link */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <p className="text-xs font-mono text-emerald-400/90 tracking-wider uppercase">
                  Report • Detect • Prioritize • Clean • Verify
                </p>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <Link to="/login?portal=admin" className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4">
                  Administrator Console Sign In
                </Link>
              </div>
            </div>

            {/* Right Hero Card: Smart Clean City Pulse */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-6 shadow-2xl backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">Live Cleanliness Pulse</h3>
                    <p className="text-xs text-slate-400">Smart City Zone Central</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold">
                    82 / 100
                  </span>
                </div>

                <div className="flex justify-center py-2">
                  <CleanCityPulseGauge score={100} size="lg" trend="0%" subtitle="Citywide Environmental Index" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Resolution Rate</span>
                    <p className="text-lg font-bold text-emerald-400">100%</p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Active Issues</span>
                    <p className="text-lg font-bold text-cyan-400">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Stat Counters */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 text-center">
            <div>
              <p className="text-3xl font-extrabold text-white">0</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Pending Complaints</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-400">4 Squads</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Ready Sanitation Teams</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-cyan-400">0</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Chronic Hotspots</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-amber-400">100%</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">System SLA Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 6-STEP INTELLIGENCE LOOP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Closed-Loop Civic Intelligence
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How CleanTrack Closes the Cleanliness Loop
          </h2>
          <p className="text-sm text-slate-600">
            CleanTrack goes far beyond a generic complaint registry. It transforms every citizen photo into actionable municipal intelligence.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {intelligenceSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-lg transition-all relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold font-mono text-slate-200 group-hover:text-brand-500 transition-colors">
                    {step.num}
                  </span>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. "SEE YOUR CITY THROUGH AI" INTERACTIVE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>GIS Spatial Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">See Your City Through AI</h2>
            </div>
            <Link
              to="/municipal/hotspots"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <span>Full Command Center Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Interactive Map */}
            <div className="lg:col-span-7">
              <LeafletHotspotMap
                hotspots={GIS_HOTSPOTS}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={setSelectedHotspot}
                height="380px"
              />
            </div>

            {/* AI Real-time Insights Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected Hotspot</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: selectedHotspot?.color || '#dc2626' }}>
                    {selectedHotspot?.severity} Priority
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white">{selectedHotspot?.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-emerald-400">AI Root Cause Inference:</strong> {selectedHotspot?.aiRootCause}
                </p>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-xs text-slate-300">
                  <strong className="text-cyan-400">Recommended Action:</strong> {selectedHotspot?.recommendedAction}
                </div>
              </div>

              {/* 4 AI Metric Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-slate-400">Analyzed Today</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">184 Reports</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-slate-400">Duplicate Clusters</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">3 Active</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-slate-400">High-Priority Queue</p>
                  <p className="text-lg font-bold text-rose-400 mt-0.5">7 Issues</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-slate-400">Cleanups Verified</p>
                  <p className="text-lg font-bold text-cyan-400 mt-0.5">24 Today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REALISTIC CITIZEN STORY SCENARIO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-50/50 border border-brand-200/80 rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">Real-World Lifecycle</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              One Report Can Trigger an Entire Cleanup Cycle
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Follow how an unsegregated plastic pile at Shivaji Chowk went from report to verified green points in under 2 hours.
            </p>
          </div>

          {/* Timeline steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono font-bold text-brand-600">STEP 1 • REPORT</span>
              <h4 className="font-bold text-sm text-slate-900">Citizen Photo Upload</h4>
              <p className="text-xs text-slate-600">Citizen snaps photo of waste pile with auto-GPS location capture.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-600">STEP 2 • AI SCAN</span>
              <h4 className="font-bold text-sm text-slate-900">AI Vision & Duplicates</h4>
              <p className="text-xs text-slate-600">AI classifies material category, predicts severity priority, and links duplicates.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono font-bold text-purple-600">STEP 3 • DISPATCH</span>
              <h4 className="font-bold text-sm text-slate-900">Squad Dispatch & Clean</h4>
              <p className="text-xs text-slate-600">Officer approves triage routing; dedicated municipal squad clears incident site.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-600">STEP 4 • VERIFY</span>
              <h4 className="font-bold text-sm text-slate-900">Verify & +50 Points</h4>
              <p className="text-xs text-slate-600">Citizen confirms before/after photo clearance and earns +50 Civic Green Points.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MASTER WASTE TAXONOMY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">AI Taxonomy</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              11 Civic Waste Streams Recognized by AI
            </h2>
          </div>
          <Link to="/ai-intelligence" className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1">
            <span>Explore AI Modules</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {WASTE_CATEGORIES.slice(0, 8).map((cat) => (
            <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-400 transition-all">
              <span className="text-[10px] font-mono font-bold text-slate-400">STREAM {cat.id}</span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">{cat.name}</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-semibold text-emerald-700">
                {cat.stream}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-800 to-forest-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Clean Up Your Neighborhood?
            </h2>
            <p className="text-sm text-emerald-100 font-light">
              Join thousands of citizens improving civic hygiene and earning Green Points with every report.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/citizen/report"
                className="px-8 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-extrabold text-sm shadow-xl transition-all"
              >
                Report Waste Now
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 bg-emerald-950/60 hover:bg-emerald-950 text-white border border-emerald-400/40 rounded-xl font-bold text-sm transition-all"
              >
                Demo Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
