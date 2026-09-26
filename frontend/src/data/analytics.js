export const MUNICIPAL_ANALYTICS = {
  cleanCityPulse: {
    overallScore: 0,
    monthlyChange: "0%",
    status: "All Zones Clean • No Active Incidents",
    metrics: {
      resolutionRate: "100%",
      activeComplaints: 0,
      avgResolutionHours: 0,
      citizenSatisfaction: "100%",
      recurringHotspotsResolved: 0
    }
  },
  
  complaintsTrend: [
    { month: "Jan", reported: 0, resolved: 0, aiAccuracy: 0 },
    { month: "Feb", reported: 0, resolved: 0, aiAccuracy: 0 },
    { month: "Mar", reported: 0, resolved: 0, aiAccuracy: 0 },
    { month: "Apr", reported: 0, resolved: 0, aiAccuracy: 0 },
    { month: "May", reported: 0, resolved: 0, aiAccuracy: 0 },
    { month: "Jun", reported: 0, resolved: 0, aiAccuracy: 0 }
  ],
  
  categoryDistribution: [],
  
  severityDistribution: [
    { level: "Critical", count: 0, color: "#dc2626" },
    { level: "High", count: 0, color: "#ea580c" },
    { level: "Medium", count: 0, color: "#eab308" },
    { level: "Low / Resolved", count: 0, color: "#22c55e" }
  ],
  
  wardPerformance: [
    { ward: "Ward 05 (Baner)", resolutionRate: 100, avgHours: 0, score: 100, complaints: 0 },
    { ward: "Ward 07 (Kothrud)", resolutionRate: 100, avgHours: 0, score: 100, complaints: 0 },
    { ward: "Ward 12 (Shivaji Nagar)", resolutionRate: 100, avgHours: 0, score: 100, complaints: 0 },
    { ward: "Ward 14 (Deccan)", resolutionRate: 100, avgHours: 0, score: 100, complaints: 0 },
    { ward: "Ward 09 (Hadapsar)", resolutionRate: 100, avgHours: 0, score: 100, complaints: 0 }
  ],
  
  aiModelTelemetry: [
    {
      name: "Plastic Waste & Polymer Detection (best.pt)",
      status: "Active & Loaded",
      avgConfidence: "95.4%",
      latencyMs: 142,
      processedToday: 0,
      modelType: "YOLOv8 Ultralytics PyTorch (best.pt)"
    },
    {
      name: "Biomedical & Medical Waste Detector (best.pt)",
      status: "Active & Loaded",
      avgConfidence: "96.8%",
      latencyMs: 138,
      processedToday: 0,
      modelType: "YOLOv8 17-Class Biohazard Vision"
    },
    {
      name: "Duplicate & Visual GPS Matcher",
      status: "Online",
      avgConfidence: "0%",
      latencyMs: 0,
      processedToday: 0,
      modelType: "OpenCV + Cosine Embeddings"
    },
    {
      name: "Severity & Priority Prediction",
      status: "Online",
      avgConfidence: "0%",
      latencyMs: 0,
      processedToday: 0,
      modelType: "Multi-factor Scikit-Learn Engine"
    },
    {
      name: "Waste Hotspot & Recurrence Engine",
      status: "Online",
      avgConfidence: "0%",
      latencyMs: 0,
      processedToday: 0,
      modelType: "DBSCAN Spatio-temporal GIS"
    },
    {
      name: "AI Decision Support & Triage",
      status: "Online",
      avgConfidence: "0%",
      latencyMs: 0,
      processedToday: 0,
      modelType: "Rule & LLM Hybrid Dispatcher"
    }
  ]
};
