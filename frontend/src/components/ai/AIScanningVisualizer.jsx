import React, { useState, useEffect } from 'react';
import { Sparkles, Scan, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AIScanningVisualizer = ({ imageUrl, isScanning = true, onScanComplete, analysis = null }) => {
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    "Initializing YOLOv8 neural vision model (best.pt)...",
    "Extracting spatial feature maps & bounding boxes...",
    "Classifying polymer taxonomy (PET, HDPE, Soft Plastics)...",
    "Running spatio-temporal duplicate & recurrence check...",
    "Computing accurate multi-factor severity & confidence..."
  ];

  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onScanComplete) onScanComplete();
          return prev;
        }
      });
    }, 380);

    return () => clearInterval(interval);
  }, [isScanning]);

  const displayImage = (!isScanning && analysis?.annotatedImage) ? analysis.annotatedImage : (imageUrl || "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80");
  const topDetection = analysis?.detections?.[0];
  const isPlasticDetected = (analysis?.totalItemsDetected > 0) || (analysis?.confidence > 0 && analysis?.category === "Plastic Waste");
  const confidenceValue = analysis?.confidence !== undefined ? analysis.confidence : 0;

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-slate-950 shadow-2xl">
      {/* Image with overlay */}
      <div className="relative aspect-video sm:aspect-[16/10] w-full overflow-hidden flex items-center justify-center bg-slate-900">
        <img
          src={displayImage}
          alt="AI Waste Scan Subject"
          className="w-full h-full object-cover opacity-95 transition-all duration-500"
        />

        {/* Dynamic AI Laser Scan Line */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-cyan-400 shadow-[0_0_15px_#22c55e] animate-scan-line"></div>
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#22c55e10_1px,transparent_1px),linear-gradient(to_bottom,#22c55e10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
        )}

        {/* Dynamic Bounding Box Overlays */}
        {!isScanning && (
          <div className="absolute inset-0 pointer-events-none p-4 sm:p-6">
            {!analysis?.annotatedImage && isPlasticDetected && topDetection && (
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-emerald-400 bg-emerald-500/10 rounded-lg animate-pulse-subtle">
                <div className="absolute -top-7 left-0 bg-emerald-600 text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-200" />
                  <span>{topDetection.label || "Plastic Waste"}: {topDetection.confidence}%</span>
                </div>
              </div>
            )}

            {!isPlasticDetected && (
              <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg">
                <span>No prominent plastic accumulation detected</span>
              </div>
            )}

            <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>YOLOv8 best.pt Validated</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Telemetry Status Bar */}
      <div className="bg-slate-900 px-4 py-3 border-t border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isScanning ? (
            <Scan className="w-4 h-4 text-emerald-400 animate-spin-slow flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <span className="truncate text-emerald-300 font-medium">
            {isScanning ? steps[scanStep] : (
              (analysis?.plasticDetectionsCount > 0 && analysis?.biomedicalDetectionsCount > 0)
                ? `YOLOv8 Analysis Complete • ${analysis?.totalItemsDetected} waste objects (${analysis.plasticDetectionsCount} Plastic + ${analysis.biomedicalDetectionsCount} Medical Biohazard)`
                : (analysis?.biomedicalDetectionsCount > 0)
                ? `YOLOv8 Analysis Complete • ${analysis?.totalItemsDetected} medical & biohazard objects identified`
                : (analysis?.totalItemsDetected > 0)
                ? `YOLOv8 Analysis Complete • ${analysis?.totalItemsDetected} recyclable & plastic objects identified`
                : "YOLOv8 Analysis Complete • No prominent waste detected"
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 self-end sm:self-auto text-[11px]">
          <span>Detected Accuracy: <strong className={confidenceValue > 0 ? "text-emerald-400" : "text-slate-400"}>{confidenceValue}%</strong></span>
          {analysis?.plasticCoveragePercent !== undefined && (
            <span>Coverage: <strong className="text-cyan-400">{analysis.plasticCoveragePercent}%</strong></span>
          )}
          <span>Engine: <strong className="text-purple-400">best.pt</strong></span>
        </div>
      </div>
    </div>
  );
};
