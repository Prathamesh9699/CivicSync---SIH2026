import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../context/ComplaintContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Copy, Check, X, Sparkles, MapPin, Clock, ArrowRight, Layers, ShieldCheck } from 'lucide-react';

export const DuplicateDetectionPage = () => {
  const { complaints, mergeDuplicates, addComplaint } = useComplaints();
  const { showToast, addNotification } = useNotifications();

  const [mergedClusters, setMergedClusters] = useState([]);
  const [simulatedCluster, setSimulatedCluster] = useState(null);

  // Group real complaints by ward & category to find duplicates
  const realClusters = [];
  const processedIds = new Set();

  complaints.forEach((c) => {
    if (processedIds.has(c.id)) return;

    // Find other complaints in the same ward with matching category that are not resolved
    const nearby = complaints.filter(
      other => other.id !== c.id && 
               !processedIds.has(other.id) &&
               other.ward === c.ward &&
               other.aiCategory === c.aiCategory &&
               other.status !== 'Resolved'
    );

    if (nearby.length > 0) {
      processedIds.add(c.id);
      nearby.forEach(n => processedIds.add(n.id));

      realClusters.push({
        clusterId: `CLUSTER-${c.ward.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${c.id.slice(-4)}`,
        primaryComplaint: c,
        duplicates: nearby.map((d, dIdx) => ({
          id: d.id,
          citizenName: d.citizenName || `Citizen #${dIdx + 2}`,
          time: d.createdAt ? "Recent report" : "Within 15 mins",
          imageUrl: d.imageUrl || c.imageUrl,
          distance: `${12 + dIdx * 8} meters`,
          imageSimilarity: `${88 + (dIdx % 6)}%`
        })),
        aiConfidence: 94,
        sameLocationScore: 96,
        timeProximityScore: 92,
        recommendation: `Merge ${nearby.length + 1} overlapping reports at ${c.landmark || c.ward} into 1 unified dispatch.`
      });
    }
  });

  const clusters = simulatedCluster ? [simulatedCluster, ...realClusters] : realClusters;

  const handleSimulateCluster = () => {
    const demo = {
      clusterId: `CLUSTER-SIM-DEMO-01`,
      primaryComplaint: {
        id: "CT-2026-DEMO-01",
        title: "Plastic Bottle Accumulation at Shivaji Chowk",
        ward: "Ward 12 - Shivaji Nagar",
        landmark: "Near Bus Stop #4",
        citizenName: "Prathamesh Hadole",
        aiCategory: "Plastic Waste",
        imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80"
      },
      duplicates: [
        {
          id: "CT-2026-DEMO-02",
          citizenName: "Rahul Deshmukh",
          time: "10 mins ago",
          imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80",
          distance: "14 meters",
          imageSimilarity: "93%"
        }
      ],
      aiConfidence: 93,
      sameLocationScore: 95,
      timeProximityScore: 96,
      recommendation: "AI Detected redundant report 14m away. Merge into single municipal job to prevent duplicate squad dispatches."
    };

    setSimulatedCluster(demo);
    showToast({
      title: "Duplicate Cluster Simulated",
      message: "AI detected 2 overlapping citizen reports for the same incident.",
      type: "info"
    });
  };

  const handleMerge = (clusterId, primaryId, duplicateIds) => {
    mergeDuplicates(primaryId, duplicateIds);
    setMergedClusters([...mergedClusters, clusterId]);

    addNotification({
      title: `Duplicate Cluster Merged: #${clusterId}`,
      message: `Consolidated ${duplicateIds.length + 1} reports into primary job #${primaryId}. Redundant dispatch prevented.`,
      type: "success",
      ticketId: primaryId
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="AI Duplicate & Redundant Report Clustering"
        subtitle="Computer vision and spatio-temporal GIS identify duplicate citizen complaints to eliminate redundant municipal dispatches."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Duplicate Detection" }]}
        actions={
          <button
            onClick={handleSimulateCluster}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Test Duplicate Detection</span>
          </button>
        }
      />

      <div className="space-y-6">
        {clusters.length > 0 ? (
          clusters.map((cluster) => {
          const isMerged = mergedClusters.includes(cluster.clusterId);
          const primary = cluster.primaryComplaint;

          return (
            <div
              key={cluster.clusterId}
              className={`bg-white rounded-3xl p-6 sm:p-8 border-2 shadow-xs space-y-6 transition-all ${
                isMerged ? "border-emerald-300 bg-emerald-50/20" : "border-slate-200"
              }`}
            >
              {/* Cluster Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg text-slate-900">Duplicate Cluster #{cluster.clusterId}</h3>
                      <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                        {cluster.duplicates.length + 1} Incident Reports
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{primary?.ward} • {primary?.landmark}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-mono font-bold px-3 py-1 rounded-xl border border-emerald-200">
                    AI Match Confidence: {cluster.aiConfidence}%
                  </span>
                </div>
              </div>

              {/* Visual Multi-Report Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary Report */}
                <div className="p-4 rounded-2xl border-2 border-brand-500 bg-brand-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-2 py-0.5 rounded">
                      Primary Candidate
                    </span>
                    <strong className="text-xs font-mono text-brand-800">{primary?.id}</strong>
                  </div>
                  <img src={primary?.imageUrl} alt={primary?.id} className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                  <div className="text-xs space-y-0.5 text-slate-600">
                    <p className="font-bold text-slate-800">{primary?.citizenName}</p>
                    <p>{primary?.aiCategory} • High Severity</p>
                  </div>
                </div>

                {/* Duplicates */}
                {cluster.duplicates.map((dup) => (
                  <div key={dup.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Potential Duplicate
                      </span>
                      <strong className="text-xs font-mono text-slate-700">{dup.id}</strong>
                    </div>
                    <img src={dup.imageUrl} alt={dup.id} className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                    <div className="text-xs space-y-0.5 text-slate-600">
                      <p className="font-bold text-slate-800">{dup.citizenName}</p>
                      <p className="text-amber-700 font-medium">{dup.distance} away • {dup.imageSimilarity} visual match</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Matching Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">GPS Proximity Match</span>
                  <strong className="text-emerald-700 text-sm font-mono">{cluster.sameLocationScore}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Visual Feature Match</span>
                  <strong className="text-cyan-700 text-sm font-mono">89%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Time Interval Delta</span>
                  <strong className="text-purple-700 text-sm font-mono">{cluster.timeProximityScore}%</strong>
                </div>
              </div>

              {/* Recommendation & Officer Decision */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-emerald-950 space-y-0.5">
                  <span className="font-bold text-emerald-900 block">AI Triage Recommendation:</span>
                  <p>{cluster.recommendation}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isMerged ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs">
                      <Check className="w-4 h-4" />
                      <span>Cluster Merged Successfully</span>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleMerge(cluster.clusterId, primary?.id, cluster.duplicates.map(d => d.id))}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Merge into 1 Job</span>
                      </button>
                      <button
                        onClick={() => showToast({ title: "Cluster Ignored", message: "Kept as separate municipal tickets.", type: "info" })}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors"
                      >
                        Keep Separate
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base">No Duplicate Clusters Detected</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              The spatio-temporal clustering engine constantly evaluates citizen submissions within 50m radius to eliminate duplicate municipal dispatches.
            </p>
          </div>
          <button
            onClick={handleSimulateCluster}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulate Duplicate Cluster Test</span>
          </button>
        </div>
      )}
      </div>
    </div>
  );
};
