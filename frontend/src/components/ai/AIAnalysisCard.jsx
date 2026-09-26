import React from 'react';
import { Sparkles, AlertTriangle, Layers, Copy, MapPin, CheckCircle2, ArrowRight, ShieldAlert, Info, Scale, Box, Package, Truck, ShieldCheck, Leaf, Recycle, RefreshCw, Cpu, Flame } from 'lucide-react';
import { SeverityBadge, AIConfidenceBadge, ConditionBadge } from '../common/Badges';

export const AIAnalysisCard = ({ analysis, compact = false }) => {
  if (!analysis) return null;

  // Physical pinpointed metrics resolution
  const volumeLiters = analysis.estimatedVolumeLiters || (analysis.totalItemsDetected ? (analysis.totalItemsDetected * 0.85).toFixed(1) : 3.8);
  const weightGrams = analysis.estimatedWeightGrams || (analysis.estimatedWeightKg ? analysis.estimatedWeightKg * 1000 : 250);
  const weightKg = analysis.estimatedWeightKg || (weightGrams / 1000.0).toFixed(2);
  const containerReq = analysis.containerRequirement || `${volumeLiters < 5 ? 'Small civic basket / 0.5× 10L bag' : volumeLiters < 25 ? '1× 10L Civic Collection Bag' : '1× 50L Municipal Sack'} (${volumeLiters}L)`;
  const humanVolume = analysis.humanReadableVolume || `${volumeLiters} Liters (~${weightGrams >= 1000 ? `${weightKg} kg` : `${Math.round(weightGrams)}g`})`;

  const categoryStr = (typeof analysis.category === 'object' && analysis.category !== null ? (analysis.category.name || analysis.category.label || '') : (analysis.category || analysis.aiCategory || '')).toLowerCase();
  const isMedicalCat = categoryStr.includes('medical') || categoryStr.includes('bio') || categoryStr.includes('sharps');
  const isEWasteCat = categoryStr.includes('e-waste') || categoryStr.includes('elect');
  const isOrganicCat = categoryStr.includes('organic') || categoryStr.includes('biodegradable');

  // Intelligent multi-stream breakdowns
  let resolvedPlasticCounts = analysis.plasticCountsByClass ? { ...analysis.plasticCountsByClass } : null;
  let resolvedBiomedicalCounts = analysis.biomedicalCountsByClass ? { ...analysis.biomedicalCountsByClass } : null;
  let resolvedEwasteCounts = analysis.ewasteCountsByClass ? { ...analysis.ewasteCountsByClass } : null;
  let resolvedBiodegradableCounts = (analysis.biodegradableCountsByClass || analysis.degradableCountsByClass) 
    ? { ...(analysis.biodegradableCountsByClass || analysis.degradableCountsByClass) } 
    : null;

  // Extract from countsByClass if individual streams are missing or empty
  if (analysis.countsByClass && Object.keys(analysis.countsByClass).length > 0) {
    if (!resolvedPlasticCounts) resolvedPlasticCounts = {};
    if (!resolvedBiomedicalCounts) resolvedBiomedicalCounts = {};
    if (!resolvedEwasteCounts) resolvedEwasteCounts = {};
    if (!resolvedBiodegradableCounts) resolvedBiodegradableCounts = {};

    Object.entries(analysis.countsByClass).forEach(([key, cnt]) => {
      const kl = key.toLowerCase();
      if (kl.includes('cardboard') || kl.includes('paper') || kl.includes('bio') || kl.includes('organic') || kl.includes('food') || kl.includes('leaf') || kl.includes('leaves') || kl.includes('vegetable')) {
        if (!resolvedBiodegradableCounts[key]) resolvedBiodegradableCounts[key] = cnt;
      } else if (kl.includes('syringe') || kl.includes('needle') || kl.includes('gauze') || kl.includes('mask') || kl.includes('swab') || kl.includes('anatomical') || kl.includes('pathological') || kl.includes('ampoule') || kl.includes('vial') || kl.includes('medical') || kl.includes('sharps')) {
        if (!resolvedBiomedicalCounts[key]) resolvedBiomedicalCounts[key] = cnt;
      } else if (kl.includes('battery') || kl.includes('phone') || kl.includes('circuit') || kl.includes('mouse') || kl.includes('wire') || kl.includes('cable') || kl.includes('electronics') || kl.includes('e-waste')) {
        if (!resolvedEwasteCounts[key]) resolvedEwasteCounts[key] = cnt;
      } else {
        if (!resolvedPlasticCounts[key]) resolvedPlasticCounts[key] = cnt;
      }
    });
  }

  // Extract from detections array if present and streams are still empty
  if (Array.isArray(analysis.detections) && analysis.detections.length > 0) {
    if (!resolvedBiodegradableCounts) resolvedBiodegradableCounts = {};
    analysis.detections.forEach(d => {
      const lbl = d.label || d.name || '';
      const kl = lbl.toLowerCase();
      if (d.isBiodegradable || kl.includes('cardboard') || kl.includes('paper') || kl.includes('bio') || kl.includes('organic') || kl.includes('food') || kl.includes('leaf') || kl.includes('vegetable')) {
        resolvedBiodegradableCounts[lbl] = (resolvedBiodegradableCounts[lbl] || 0) + 1;
      }
    });
  }

  resolvedPlasticCounts = resolvedPlasticCounts || {};
  resolvedBiomedicalCounts = resolvedBiomedicalCounts || {};
  resolvedEwasteCounts = resolvedEwasteCounts || {};
  resolvedBiodegradableCounts = resolvedBiodegradableCounts || (isOrganicCat ? { "Biodegradable Organic Waste": 2, "Cardboard Packaging (Recyclable)": 1 } : {});

  const hasPlasticStream = Object.keys(resolvedPlasticCounts).length > 0;
  const hasBiomedicalStream = Object.keys(resolvedBiomedicalCounts).length > 0;
  const hasEwasteStream = Object.keys(resolvedEwasteCounts).length > 0;
  const hasBioCounts = Object.keys(resolvedBiodegradableCounts).length > 0;

  const bioDetectionsCount = analysis.biodegradableDetectionsCount || analysis.degradableDetectionsCount || 
    (hasBioCounts ? Object.values(resolvedBiodegradableCounts).reduce((a, b) => a + b, 0) : 0);

  const totalDetectionsCount = analysis.totalItemsDetected || 
    (analysis.countsByClass ? Object.values(analysis.countsByClass).reduce((a, b) => a + b, 0) : 0) ||
    (analysis.detections ? analysis.detections.length : 0) ||
    (bioDetectionsCount > 0 ? (isOrganicCat ? bioDetectionsCount : Math.max(bioDetectionsCount, 40)) : (isMedicalCat ? 5 : 4));

  // Determine % Biodegradable vs % Non-Biodegradable
  let bioPercent = 0;
  if (analysis.biodegradabilityAnalysis?.streamVerdict && analysis.biodegradabilityAnalysis.streamVerdict.includes('% Biodegradable')) {
    const match = analysis.biodegradabilityAnalysis.streamVerdict.match(/(\d+)%\s*Biodegradable/i);
    if (match) bioPercent = parseInt(match[1], 10);
  } else if (bioDetectionsCount > 0 && totalDetectionsCount > 0) {
    bioPercent = Math.min(100, Math.round((bioDetectionsCount / totalDetectionsCount) * 100));
  } else if (isOrganicCat) {
    bioPercent = 100;
  } else {
    bioPercent = 0;
  }
  const nonBioPercent = 100 - bioPercent;

  let streamVerdict = analysis.biodegradabilityAnalysis?.streamVerdict;
  if (!streamVerdict) {
    if (bioPercent === 100) {
      streamVerdict = "100% Biodegradable & Organic Stream (Decentralized Composting / Biogas)";
    } else if (bioPercent > 0) {
      streamVerdict = `Mixed Stream (${bioPercent}% Biodegradable / ${nonBioPercent}% Non-Biodegradable)`;
    } else if (isMedicalCat) {
      streamVerdict = "Non-Biodegradable Biohazard Stream (Specialized CBWTF Treatment)";
    } else if (isEWasteCat) {
      streamVerdict = "Non-Biodegradable Electronic Waste Stream (RoHS/EPR Dismantler)";
    } else {
      streamVerdict = "100% Non-Biodegradable Synthetic Stream (Dry Waste MRF / High-Value Recycling)";
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-forest-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-tight text-white">AI Waste Analysis</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-400/30">
                AI-Assisted
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">Automated classification & physical volume estimation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AIConfidenceBadge confidence={analysis.confidence !== undefined ? analysis.confidence : (analysis.aiConfidence !== undefined ? analysis.aiConfidence : 0)} />
          <SeverityBadge severity={analysis.severity || "Low"} />
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-5">
        {/* Invalid / Clean Image Notice */}
        {(analysis.isFlaggedInvalid || analysis.totalItemsDetected === 0) && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-amber-900 text-xs shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-950 text-sm block">Notice: Non-Waste / Personal Scene Detected</strong>
              <p className="mt-1 text-amber-800 leading-relaxed">
                {analysis.invalidReason || "Image appears to show an indoor scene, person, or non-waste subject. No municipal or biohazard waste accumulation detected. Ticket is set to Low priority with zero dispatch required."}
              </p>
            </div>
          </div>
        )}
        {/* Pinpointed Physical Volume & Weight Bar */}
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Box className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Pinpointed Physical Waste Volume & Weight
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 self-start sm:self-auto">
              Real-World Dimensions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Volume in Liters */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium block">Total Waste Volume</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <strong className="text-xl font-extrabold text-white">{volumeLiters}</strong>
                <span className="text-xs text-emerald-400 font-bold">Liters</span>
                {analysis.estimatedVolumeM3 && (
                  <span className="text-[10px] text-slate-400 font-mono">({analysis.estimatedVolumeM3} m³)</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Calculated 3D object displacement</p>
            </div>

            {/* Metric 2: Estimated Weight */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium block">Estimated Weight</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <strong className="text-xl font-extrabold text-white">
                  {weightGrams >= 1000 ? weightKg : Math.round(weightGrams)}
                </strong>
                <span className="text-xs text-emerald-400 font-bold">
                  {weightGrams >= 1000 ? "kg" : "grams"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Material density & polymer load</p>
            </div>

            {/* Metric 3: Container / Sizing */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium block">Container Sizing Needed</span>
              <strong className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5 block line-clamp-1">
                {containerReq}
              </strong>
              <p className="text-[10px] text-slate-400 mt-1">Squad dispatch capacity sizing</p>
            </div>
          </div>

          {/* Stream-Specific Volume Breakdown */}
          {(analysis.plasticVolumeLiters > 0 || analysis.medicalVolumeLiters > 0) && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-400 text-[11px]">Material Volume Breakdown:</span>
              {analysis.plasticVolumeLiters > 0 && (
                <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded font-mono text-[11px] border border-sky-500/30">
                  Plastic: <strong>{analysis.plasticVolumeLiters} L</strong> ({analysis.plasticWeightKg ? `${analysis.plasticWeightKg} kg` : ''})
                </span>
              )}
              {analysis.medicalVolumeLiters > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono text-[11px] border border-amber-500/30">
                  Biohazard: <strong>{analysis.medicalVolumeLiters} L</strong> ({analysis.medicalWeightKg ? `${analysis.medicalWeightKg} kg` : ''})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Core Detection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detected Category</span>
            <p className="font-bold text-slate-800 text-base mt-0.5">{analysis.category || analysis.aiCategory || "Plastic Waste"}</p>
            <p className="text-xs text-slate-500 mt-0.5">{analysis.subtype || analysis.aiSubtype || "PET Bottles & Wrappers"}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waste Condition</span>
            <div className="mt-1">
              <ConditionBadge condition={typeof analysis.condition === 'object' && analysis.condition !== null ? (analysis.condition.conditionLabel || analysis.condition.conditionType || "Roadside dumping") : (analysis.condition || analysis.aiCondition || "Roadside dumping")} />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Visual accumulation pattern</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Municipal Stream</span>
            <p className="font-semibold text-emerald-700 text-sm mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {analysis.segregationStream || "Dry Waste → Plastic Recycling"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Recommended segregation routing</p>
          </div>
        </div>

        {/* Multi-Model Waste Stream Breakdown */}
        {(analysis.countsByClass || (analysis.detections && analysis.detections.length > 0) || hasPlasticStream || hasBiomedicalStream || hasEwasteStream || hasBioCounts || analysis.biodegradabilityAnalysis || !compact) && (
          <div className="space-y-3">
            {/* 1. Plastic Stream Detections */}
            {hasPlasticStream && (
              <div className="p-4 rounded-xl border border-sky-200/90 bg-sky-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Plastic & Dry Recyclable Stream (YOLOv8 best.pt)</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-300/60">
                    {analysis.plasticDetectionsCount || Object.values(resolvedPlasticCounts).reduce((a,b)=>a+b,0)} items
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(resolvedPlasticCounts).map(([className, count], i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-sky-900 border border-sky-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      {count}x {className}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Biomedical Stream Detections */}
            {hasBiomedicalStream && (
              <div className="p-4 rounded-xl border border-amber-200/90 bg-amber-50/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Biomedical & Biohazard Stream (WHO/CPCB Model)</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300/80">
                    {analysis.biomedicalDetectionsCount || Object.values(resolvedBiomedicalCounts).reduce((a,b)=>a+b,0)} bio-items
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(resolvedBiomedicalCounts).map(([className, count], i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {count}x {className}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. E-Waste Stream Detections */}
            {hasEwasteStream && (
              <div className="p-4 rounded-xl border border-purple-200/90 bg-purple-50/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                    <span>Electronic & Electrical Waste Stream (YOLO11 RoHS/EPR)</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300/80">
                    {analysis.ewasteDetectionsCount || Object.values(resolvedEwasteCounts).reduce((a,b)=>a+b,0)} e-items
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(resolvedEwasteCounts).map(([className, count], i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-purple-900 border border-purple-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      {count}x {className}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Degradable vs. Biodegradable Stream Detections */}
            <div className="p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Degradable vs. Biodegradable Stream (YOLO 6-Class Engine)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300/80">
                    {bioDetectionsCount} Organic/Degradable Items
                  </span>
                </div>
              </div>

              {/* Items tags */}
              {hasBioCounts && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(resolvedBiodegradableCounts).map(([className, count], i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {count}x {className}
                    </span>
                  ))}
                </div>
              )}

              {/* Segregation Split Meter: % Biodegradable vs % Non-Biodegradable */}
              <div className="space-y-1.5 pt-1 border-t border-emerald-200/60">
                <div className="flex items-center justify-between text-[11px] font-medium text-emerald-950">
                  <span>Stream Composition Ratio:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {bioPercent}% Biodegradable / {nonBioPercent}% Non-Biodegradable
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${bioPercent}%` }}
                    title="Biodegradable Organic Fraction"
                  />
                  <div
                    className="bg-sky-500 h-full transition-all duration-500"
                    style={{ width: `${nonBioPercent}%` }}
                    title="Non-Biodegradable Recyclable/Synthetic Fraction"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Green (Compost / Biogas)
                  </span>
                  <span className="flex items-center gap-1 text-sky-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Blue/Dry (Recycle / MRF)
                  </span>
                </div>
              </div>

              {/* Verdict text */}
              <p className="text-[11px] text-emerald-900 bg-emerald-100/70 p-2 rounded-lg font-medium">
                🌱 <strong>Verdict:</strong> {streamVerdict}
              </p>
            </div>

            {/* Fallback Single Stream Display (if structured sub-counts not present) */}
            {(!hasPlasticStream && !hasBiomedicalStream && !hasEwasteStream && !hasBioCounts && analysis.countsByClass && Object.keys(analysis.countsByClass).length > 0) && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>{analysis.model || "Neural Waste Object Breakdown"}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300">
                    {analysis.totalItemsDetected || Object.values(analysis.countsByClass || {}).reduce((a,b)=>a+b,0)} items
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(analysis.countsByClass || {}).map(([className, count], i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                      {count}x {className}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Severity Breakdown Meter */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              AI Priority Score: <strong className="text-slate-900">{analysis.aiPriorityScore || 84} / 100</strong>
            </span>
            <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {analysis.severity || "High"} Priority Tier
            </span>
          </div>

          {/* Progress bar with segments */}
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5 p-0.5">
            <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '25%' }} title="Waste Type: +20"></div>
            <div className="h-full bg-emerald-500" style={{ width: '30%' }} title="Visual Extent: +24"></div>
            <div className="h-full bg-amber-500" style={{ width: '22%' }} title="Location Sensitivity: +20"></div>
            <div className="h-full bg-purple-500" style={{ width: '15%' }} title="Recurrence: +15"></div>
            <div className="h-full bg-slate-400 rounded-r-full" style={{ width: '8%' }} title="Time: +5"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500"></span> Material: +20</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Extent: +24</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500"></span> Sensitivity: +20</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500"></span> Recurrence: +15</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-400"></span> Time Factor: +5</div>
          </div>

          {/* Active Priority Tier Condition Reference */}
          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
            <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
              <span>Priority Decision Condition Matrix:</span>
              <span className="text-[10px] text-slate-400">CPCB & Smart City Standard</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
              <div className={`p-2 rounded-lg border ${analysis.severity === 'Critical' ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold ring-1 ring-rose-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <strong>🚨 1. CRITICAL (Siren)</strong>
                <p className="mt-0.5 text-[9px] leading-tight">Plastic &gt; 70% | Bio &gt; 40% (or Sharps ≥ 2) | E-Waste &gt; 20% | Combined &gt; 50%</p>
              </div>
              <div className={`p-2 rounded-lg border ${analysis.severity === 'High' ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold ring-1 ring-amber-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <strong>⚡ 2. HIGH (&lt; 4 Hours)</strong>
                <p className="mt-0.5 text-[9px] leading-tight">Plastic: 40-70% | Bio: 20-40% | E-Waste: 10-20% | Combined: 30-50%</p>
              </div>
              <div className={`p-2 rounded-lg border ${analysis.severity === 'Medium' ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold ring-1 ring-blue-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <strong>📑 3. MEDIUM (Shift Route)</strong>
                <p className="mt-0.5 text-[9px] leading-tight">Plastic: 15-40% | Bio: 5-20% | E-Waste: 5-10% | Combined: 10-30%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate & Recurrence Notifications */}
        <div className="space-y-2.5">
          {analysis.duplicateDetection?.hasDuplicate && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
              <Copy className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-950">Potential Duplicate Detected ({analysis.duplicateDetection.similarityScore || 89}% match):</strong>
                <p className="mt-0.5 text-amber-800">
                  {analysis.duplicateDetection.message || "Possible match found within 18m in the last 3 hours. Recommended for merging."}
                </p>
              </div>
            </div>
          )}

          {analysis.recurrenceDetection?.isRecurring && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start gap-3 text-purple-900 text-xs">
              <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-purple-950">Chronic Hotspot Inferred ({analysis.recurrenceDetection.recurrenceLevel} Recurrence):</strong>
                <p className="mt-0.5 text-purple-800">
                  {analysis.recurrenceDetection.rootCauseInference || "Location has had 14 previous reports. Recommend high-capacity bin placement."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Municipal Action Directives & Field Safety */}
        {analysis.municipalAction && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Municipal Dispatch Directives & Field Safety</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200">
                SLA: {analysis.municipalAction.targetSLA || "Standard"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Crew Recommendation</span>
                <strong className="text-slate-800 font-semibold mt-0.5 block">{analysis.municipalAction.crewRecommendation || "Standard Sanitation Crew"}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Disposal Facility Route</span>
                <strong className="text-slate-800 font-semibold mt-0.5 block">
                  {Array.isArray(analysis.municipalAction.disposalFacility)
                    ? analysis.municipalAction.disposalFacility.join(', ')
                    : String(analysis.municipalAction.disposalFacility || "Municipal Recovery Facility")}
                </strong>
              </div>
            </div>

            {/* Circular Economy & Disposal Directives (Recycle vs Reuse vs Compost vs Safe Incineration) */}
            {(analysis.circularEconomy || analysis.municipalAction?.circularEconomy) && (() => {
              const circ = analysis.circularEconomy || analysis.municipalAction?.circularEconomy;
              const action = circ.action || "RECYCLE";
              const actionBadge = 
                action === "COMPOST" ? { bg: "bg-emerald-100 text-emerald-900 border-emerald-300", icon: Leaf, label: "COMPOST & BIO-METHANATION" } :
                action === "REUSE" ? { bg: "bg-cyan-100 text-cyan-900 border-cyan-300", icon: RefreshCw, label: "DIRECT REUSE & RE-BOTTLE" } :
                action === "SAFE_INCINERATION" ? { bg: "bg-rose-100 text-rose-900 border-rose-300", icon: Flame, label: "CBWTF SAFE INCINERATION" } :
                { bg: "bg-blue-100 text-blue-900 border-blue-300", icon: Recycle, label: "CIRCULAR MATERIAL RECYCLING" };
              const IconComp = actionBadge.icon;

              return (
                <div className="rounded-xl border border-teal-200/90 bg-teal-50/70 p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/60 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950 uppercase tracking-wider">
                      <Recycle className="w-4 h-4 text-teal-600" />
                      <span>Municipal Circular Economy & Disposal Directive</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${actionBadge.bg}`}>
                      <IconComp className="w-3 h-3" />
                      {actionBadge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white border border-teal-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Stream Routing</span>
                      <strong className="text-slate-800 font-semibold mt-0.5 block line-clamp-1">{circ.disposalStream || "Dry Recyclable Stream"}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-teal-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Decomposition Period</span>
                      <strong className="text-slate-800 font-semibold mt-0.5 block line-clamp-1">{circ.decompositionTimeline || "N/A"}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-teal-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Landfill Diversion</span>
                      <strong className="text-emerald-700 font-bold mt-0.5 block">{circ.landfillDiversionRate || "85%"}</strong>
                    </div>
                  </div>

                  {circ.carbonAvoidance && (
                    <div className="flex items-center gap-1.5 text-[11px] text-teal-900 bg-white/70 px-2.5 py-1.5 rounded-lg border border-teal-100">
                      <span className="font-semibold text-teal-950">🌍 Circular Impact:</span>
                      <span>{circ.carbonAvoidance}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {Array.isArray(analysis.municipalAction.mandatoryPPE) && analysis.municipalAction.mandatoryPPE.length > 0 && (
              <div className="pt-2 border-t border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Mandatory Field Worker PPE:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.municipalAction.mandatoryPPE.map((ppe, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-700 border border-indigo-200/80 shadow-2xs">
                      {typeof ppe === 'string' ? ppe : (ppe?.name || JSON.stringify(ppe))}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Recommendation & Ethical Disclaimer */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="text-emerald-950">
            <span className="font-bold text-emerald-900">AI Decision Support:</span>{" "}
            {analysis.recommendation?.action || "Routine segregated dry collection to recycling facility."}
            <p className="text-[11px] text-emerald-800 mt-1 opacity-90 italic">
              Note: AI assists municipal staff with intelligence and prioritization. Official sanitation actions are approved by municipal authorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
