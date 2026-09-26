import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Sparkles, ShieldCheck, Heart, Award, ArrowRight, CheckCircle2, Users, Building2, BarChart2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';

export const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <PageHeader
        title="About CleanTrack"
        subtitle="Empowering citizens and municipal corporations with AI-assisted cleanliness intelligence."
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "About" }]}
      />

      {/* 1. Problem vs Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-3xl p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            01
          </div>
          <h3 className="text-xl font-bold text-slate-900">The Civic Waste Challenge</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Rapid urbanization has led to unmonitored waste accumulation, chronic dumping spots, duplicate citizen complaints, and inefficient manual complaint triage. Sanitation departments struggle without visual prioritization or segregation intelligence.
          </p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            02
          </div>
          <h3 className="text-xl font-bold text-slate-900">The CleanTrack Solution</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            CleanTrack bridges citizens and municipal authorities. Using computer vision, GPS spatial clustering, and automated severity prediction, CleanTrack classifies waste, detects duplicates, recommends municipal actions, and rewards citizen participation through Green Points.
          </p>
        </div>
      </div>

      {/* 2. Core Pillars */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Platform Pillars</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Built on Four Solid Foundations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">AI Decision Support</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI assists municipal staff with classification and severity estimates. It never autonomously replaces municipal oversight.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Civic Green Points</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizens earn gamified eco points for verified reporting and post-cleanup verification, driving active community ownership.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Municipal Command</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time priority queues, duplicate clustering, workforce management, and GIS heatmap monitoring for sanitation departments.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Urban Cleanliness Pulse</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent, data-backed Clean City Pulse™ metrics showing real-time municipal response trends and ward-by-ward compliance.
            </p>
          </div>
        </div>
      </div>

      {/* 3. System Architecture Alignment */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-6">
        <h3 className="text-2xl font-bold text-white">System Architecture & Future Scalability</h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          CleanTrack is designed with a decoupled architecture: React/Tailwind frontend, Node.js REST API layer, Python FastAPI microservices (YOLOv8 + PyTorch + Scikit-Learn), and MongoDB. The current prototype provides realistic simulated services ready for live backend deployment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-mono">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <span className="text-emerald-400 font-bold block mb-1">FRONTEND LAYER</span>
            React.js, Tailwind CSS, Leaflet GIS, Recharts, PWA Architecture
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <span className="text-cyan-400 font-bold block mb-1">AI SERVICE LAYER</span>
            Python FastAPI, YOLOv8 Vision, OpenCV, Cosine GPS Matching
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <span className="text-purple-400 font-bold block mb-1">BACKEND & STORAGE</span>
            Node.js / Express, MongoDB Atlas, Cloud Storage, JWT Auth
          </div>
        </div>
      </div>
    </div>
  );
};
