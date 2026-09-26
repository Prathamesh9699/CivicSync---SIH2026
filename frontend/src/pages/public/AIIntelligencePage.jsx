import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { 
  Sparkles, 
  Layers, 
  Copy, 
  Flame, 
  Activity, 
  ShieldAlert, 
  Info, 
  CheckCircle2,
  Cpu,
  ArrowRight,
  Leaf
} from 'lucide-react';
import { WASTE_CATEGORIES, WASTE_CONDITIONS } from '../../data/wasteCategories';

export const AIIntelligencePage = () => {
  const aiModules = [
    {
      id: "mod_1",
      title: "1. Waste Image Classification & Subtyping",
      tagline: "YOLOv8 + Vision Transformer (ViT)",
      description: "Classifies citizen-uploaded photos into 11 master waste categories and subtypes with real-time confidence scores.",
      features: [
        "Detects material composition (Plastic, Wet, C&D, E-Waste, Glass, etc.)",
        "Identifies 7 distinct waste conditions (Overflowing bin, Illegal dump, Heap)",
        "Recommends appropriate municipal segregation routing stream",
        "Flags low-confidence non-waste images for validity review"
      ],
      icon: Sparkles,
      color: "border-blue-200 bg-blue-50/40 text-blue-700"
    },
    {
      id: "mod_2",
      title: "2. Duplicate & Recurring Location Detection",
      tagline: "OpenCV Feature Embeddings + Spatio-Temporal GIS",
      description: "Identifies duplicate complaints submitted by multiple citizens within the same geographic proximity and time window.",
      features: [
        "Calculates visual cosine similarity between complaint photographs",
        "Geo-distance radius clustering (0 - 50 meters)",
        "Time proximity windowing to cluster simultaneous reports",
        "One-click municipal merging to prevent multiple truck dispatches"
      ],
      icon: Copy,
      color: "border-amber-200 bg-amber-50/40 text-amber-700"
    },
    {
      id: "mod_3",
      title: "3. Severity & Priority Prediction Engine",
      tagline: "Multi-Factor Scikit-Learn Regression",
      description: "Computes a transparent 0 - 100 severity index prioritizing severe public health hazards over minor litter.",
      features: [
        "Material Hazard Factor (+25 for Biomedical / Hazardous visual cues)",
        "Visual Extent & Accumulation Volume (+24 points)",
        "Sensitive Area Proximity (+20 for schools, hospitals, water bodies)",
        "Historical Recurrence Factor (+15 points for chronic dump sites)"
      ],
      icon: Flame,
      color: "border-rose-200 bg-rose-50/40 text-rose-700"
    },
    {
      id: "mod_4",
      title: "4. Waste Hotspot & Chronic Recurrence Engine",
      tagline: "DBSCAN Spatio-Temporal Density Clustering",
      description: "Analyzes historical cleanup logs to detect chronic illegal dumping spots and infer underlying urban infrastructure gaps.",
      features: [
        "Heatmap GIS clustering across municipal wards",
        "Chronological dump-cleanup recurrence cycle tracking",
        "Root cause inference (e.g. lack of high-capacity bin vs. market surge)",
        "Targeted preventative municipal cleanup recommendations"
      ],
      icon: Activity,
      color: "border-purple-200 bg-purple-50/40 text-purple-700"
    },
    {
      id: "mod_5",
      title: "5. AI Decision Support & Verification",
      tagline: "Before/After Visual Difference Matching",
      description: "Assists sanitation officers by evaluating post-cleanup evidence and recommending appropriate squad dispatch options.",
      features: [
        "Calculates Visual Improvement % between Before and After images",
        "Recommends team type (Compactor vs JCB Tipper vs Bio Squad)",
        "Automates citizen verification dispatch for Green Points release",
        "Strictly adheres to AI-assisted human-in-the-loop governance"
      ],
      icon: ShieldAlert,
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-700"
    },
    {
      id: "mod_6",
      title: "6. Degradable vs. Biodegradable & Circular Disposal Engine",
      tagline: "YOLO 6-Class Vision + Swachh Bharat Circular Economy Directives",
      description: "Differentiates rapid-decay organic matter from recyclable cellulose packaging and non-biodegradable synthetic polymers, guiding circular municipal disposal.",
      features: [
        "Detects 6 distinct material streams: Biodegradable, Cardboard, Paper, Glass, Metal, and Plastic",
        "Calculates biodegradable vs non-biodegradable segregation ratios and spatial coverage",
        "Recommends circular pathways: Composting, Material Recycling, Bottle Reuse, or Safe Incineration",
        "Estimates real-world landfill diversion yields, decomposition timelines, and CO2e avoidance"
      ],
      icon: Leaf,
      color: "border-teal-200 bg-teal-50/40 text-teal-700"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <PageHeader
        title="AI Intelligence Architecture"
        subtitle="Six specialized AI modules powering civic cleanliness, circular economy, and municipal decision support."
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "AI Intelligence" }]}
      />

      {/* Ethical & Assistive AI Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex items-start gap-4 text-amber-900">
        <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
        <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
          <h4 className="font-bold text-amber-950 text-base">Ethical AI Principles & Human-in-the-Loop Governance</h4>
          <p>
            CleanTrack AI models provide <strong>decision-support and prioritization assistance</strong>. AI outputs are clearly labeled as <em>estimated severity</em>, <em>AI-assisted recommendations</em>, and <em>potential duplicates</em>. Municipal officers retain full authority to approve, modify, or override AI suggestions.
          </p>
          <p className="text-amber-800 text-xs">
            For sensitive categories like Biomedical or Hazardous-looking waste, CleanTrack explicitly indicates <em>visual appearance detection only</em> without claiming laboratory confirmation of chemical composition.
          </p>
        </div>
      </div>

      {/* 5 Core Modules Cards */}
      <div className="space-y-8">
        {aiModules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xs bg-white ${module.color.split(' ')[0]} transition-all hover:shadow-md`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${module.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">{module.title}</h3>
                    <p className="text-xs font-mono font-medium text-slate-500">{module.tagline}</p>
                  </div>
                </div>

                <span className="self-start lg:self-auto bg-slate-100 text-slate-700 text-xs font-mono font-bold px-3 py-1 rounded-full border border-slate-200">
                  Model Latency: &lt;150ms
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 my-4 leading-relaxed">{module.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {module.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Report CTA */}
      <div className="text-center bg-slate-900 rounded-3xl p-8 text-white space-y-4">
        <h3 className="text-2xl font-bold">Experience AI Waste Scanning First-Hand</h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Test the interactive 4-step report wizard to see real-time computer vision simulation on sample images.
        </p>
        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all"
        >
          <span>Launch AI Report Wizard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
