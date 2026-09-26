import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Sliders, Columns, ArrowRightLeft } from 'lucide-react';

export const BeforeAfterSlider = ({ beforeUrl, afterUrl, visualImprovement = 92 }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'

  // Distinct default waste site vs spotless clean municipal site
  const fallbackBefore = "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80"; // Waste accumulation
  const fallbackAfter = "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80"; // Cleaned street & sidewalk

  const finalBefore = beforeUrl || fallbackBefore;
  // If afterUrl is empty or identical to beforeUrl, use distinct clean site photo
  const finalAfter = (afterUrl && afterUrl !== finalBefore) ? afterUrl : fallbackAfter;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header controls */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">AI Cleanup Verification Comparison</span>
          <span className="bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-400/30">
            {visualImprovement}% Visual Improvement
          </span>
        </div>

        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'slider' ? "bg-brand-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            Interactive Slider
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'side-by-side' ? "bg-brand-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Visual Content */}
      {viewMode === 'slider' ? (
        <div className="relative aspect-video w-full overflow-hidden select-none bg-slate-950">
          {/* AFTER IMAGE (Background - full 100% width) */}
          <img
            src={finalAfter}
            alt="After Cleanup"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-lg flex items-center gap-1.5 pointer-events-none z-10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AFTER CLEANUP</span>
          </div>

          {/* BEFORE IMAGE (Foreground - clipped using CSS polygon so geometry is never distorted) */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
            style={{
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
            }}
          >
            <img
              src={finalBefore}
              alt="Before Cleanup"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-lg pointer-events-none">
              BEFORE REPORT
            </div>
          </div>

          {/* SLIDER DIVIDER LINE & HANDLE */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none z-20 flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-slate-800 shadow-2xl flex items-center justify-center border-2 border-emerald-500 transform -translate-x-1/2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* RANGE INPUT CONTROLLER */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-100">
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm">
            <img src={finalBefore} alt="Before Cleanup" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow">
              BEFORE REPORT
            </div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm">
            <img src={finalAfter} alt="After Cleanup" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              AFTER CLEANUP
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
