import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Camera, Sparkles, Building2, Award, ArrowRight, CheckCircle2, Copy, MapPin, Truck } from 'lucide-react';

export const HowItWorksPage = () => {
  const [activeTab, setActiveTab] = useState('citizen');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <PageHeader
        title="How CleanTrack Works"
        subtitle="An interactive breakdown of the closed-loop civic intelligence lifecycle."
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "How It Works" }]}
      />

      {/* Role Tabs */}
      <div className="flex justify-center">
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-2">
          <button
            onClick={() => setActiveTab('citizen')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'citizen' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Citizen Experience
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'ai' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. AI Intelligence Engine
          </button>
          <button
            onClick={() => setActiveTab('municipality')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'municipality' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Municipal Action
          </button>
        </div>
      </div>

      {/* Tab 1: Citizen Experience */}
      {activeTab === 'citizen' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-mono font-bold text-brand-600">STEP 1</span>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Capture Waste Photo</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizen takes or uploads a photo of the accumulated waste directly via mobile or desktop browser.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-600">STEP 2</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Auto Geo-Tagging</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              GPS coordinates are automatically captured or manually fine-tuned using the interactive map.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-mono font-bold text-purple-600">STEP 3</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Instant AI Preview</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizen previews detected waste category, condition, and estimated priority before submission.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-600">STEP 4</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Earn Green Points</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once cleanup is verified, citizen earns +50 Green Points toward community badges and leaderboard status.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: AI Intelligence */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">01</div>
            <h3 className="font-bold text-base text-slate-900">Taxonomy Classification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              YOLOv8 vision models classify waste into 11 master streams (Organic, Plastic, E-Waste, C&D, Hazardous-looking, etc.).
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">02</div>
            <h3 className="font-bold text-base text-slate-900">Duplicate Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              OpenCV feature embeddings and GPS distance checks identify duplicate reports to prevent redundant municipal dispatches.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">03</div>
            <h3 className="font-bold text-base text-slate-900">Multi-Factor Severity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent algorithm evaluates material type, accumulation visual extent, sensitive location proximity, and recurrence.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Municipal Action */}
      {activeTab === 'municipality' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">A</div>
            <h3 className="font-bold text-base text-slate-900">Priority Triage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zonal sanitation officers review AI-ordered priority queue and merge duplicate complaint clusters with one click.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">B</div>
            <h3 className="font-bold text-base text-slate-900">Squad Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sanitation teams (Compactor, Tipper, Bio Squad) are assigned with specific field instructions and vehicle routes.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">C</div>
            <h3 className="font-bold text-base text-slate-900">Before/After AI Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crews upload cleanup photos; AI verifies clearance percentage; officer closes case or dispatches citizen confirmation.
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-6">
        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/30 transition-all"
        >
          <span>Try Reporting a Problem</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
