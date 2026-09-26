import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { aiService } from '../../services/aiService';
import { WASTE_CATEGORIES, WASTE_CONDITIONS } from '../../data/wasteCategories';
import { PageHeader } from '../../components/common/PageHeader';
import { AIScanningVisualizer } from '../../components/ai/AIScanningVisualizer';
import { AIAnalysisCard } from '../../components/ai/AIAnalysisCard';
import { LocationPickerMap } from '../../components/maps/LocationPickerMap';
import { 
  Camera, 
  Upload, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  Layers, 
  Flame, 
  Award,
  AlertCircle
} from 'lucide-react';

export const ReportWastePage = () => {
  const { currentUser } = useAuth();
  const { addComplaint } = useComplaints();
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  // Form data
  const [imagePreview, setImagePreview] = useState("");
  const [latitude, setLatitude] = useState(18.5249); // Mangalwar Peth, Pune
  const [longitude, setLongitude] = useState(73.8644);
  const [ward, setWard] = useState(currentUser?.ward || "Ward 02 - Mangalwar Peth / Somwar Peth");
  const [landmark, setLandmark] = useState("");
  const [wasteCondition, setWasteCondition] = useState("minor_litter");
  const [citizenNotes, setCitizenNotes] = useState("");

  // Validation errors
  const [step1Error, setStep1Error] = useState("");
  const [step2Errors, setStep2Errors] = useState({});

  // AI Analysis Output
  const [aiResult, setAiResult] = useState(null);

  // 5 Sample Waste Images for instant 1-click test (Normal, Medium, High, Critical, E-Waste)
  const sampleImages = [
    { 
      label: "Minor Street Litter", 
      tier: "Normal",
      sla: "< 24h SLA",
      url: "/samples/sample_3_plastic_bottle.jpg", 
      hint: "Minor Litter - Normal", 
      condition: "minor_litter",
      badgeColor: "bg-emerald-500 text-white"
    },
    { 
      label: "Overflowing Bin", 
      tier: "Medium",
      sla: "< 12h SLA",
      url: "/samples/sample_2_mixed_waste.jpg", 
      hint: "Overflowing Bin - Medium", 
      condition: "overflowing_bin",
      badgeColor: "bg-yellow-400 text-slate-950 font-bold"
    },
    { 
      label: "Commercial Waste Dump", 
      tier: "High",
      sla: "< 4h SLA",
      url: "/samples/970666-garbage.webp", 
      hint: "Commercial Garbage Dump - High", 
      condition: "large_waste_accumulation",
      badgeColor: "bg-amber-500 text-white font-bold"
    },
    { 
      label: "E-Waste & Electronics", 
      tier: "High",
      sla: "< 4h SLA",
      url: "/samples/sample_ewaste.jpg", 
      hint: "E-Waste - Electronics", 
      condition: "large_waste_accumulation",
      badgeColor: "bg-purple-600 text-white font-bold"
    },
    { 
      label: "Medical Syringes & Sharps", 
      tier: "Critical",
      sla: "< 2h SLA",
      url: "/samples/sample_syringes_and_needle.jpg", 
      hint: "Medical Sharps - Critical", 
      condition: "hazardous_biohazard_dump",
      badgeColor: "bg-rose-500 text-white font-bold"
    },
    { 
      label: "Biodegradable & Organic", 
      tier: "Normal",
      sla: "< 24h SLA",
      url: "/samples/sample_biodegradable_waste.jpg", 
      hint: "Organic & Biodegradable Waste", 
      condition: "minor_litter",
      badgeColor: "bg-emerald-600 text-white font-bold"
    }
  ];

  // Selected manual hint (if sample was clicked)
  const [selectedHint, setSelectedHint] = useState(null);

  const handleImageUpload = (e) => {
    setStep1Error("");
    setSelectedHint(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStep1Error("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStep1Error("Image file size must be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target.result;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const optimized = canvas.toDataURL('image/jpeg', 0.82);
        setImagePreview(optimized);
      };
      img.onerror = () => {
        setImagePreview(rawData);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample) => {
    setStep1Error("");
    setImagePreview(sample.url);
    setSelectedHint(sample.hint);
    if (sample.condition) {
      setWasteCondition(sample.condition);
    }
  };

  const validateStep1 = () => {
    if (!imagePreview) {
      setStep1Error("Please capture or upload a waste photo to proceed.");
      return false;
    }
    setStep1Error("");
    return true;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!landmark.trim()) {
      errors.landmark = "Please provide a landmark or street description (e.g. Near Bus Stop #4).";
    } else if (landmark.trim().length < 3) {
      errors.landmark = "Landmark description must be at least 3 characters long.";
    }

    if (!ward) {
      errors.ward = "Please select a municipal ward.";
    }

    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleStartAnalysis = async () => {
    if (!validateStep2()) return;

    setIsScanning(true);
    setCurrentStep(3);
    const result = await aiService.analyzeWasteImage(imagePreview, selectedHint, wasteCondition);
    setAiResult(result);
    setIsScanning(false);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    const conditionObj = WASTE_CONDITIONS.find(c => c.id === wasteCondition) || WASTE_CONDITIONS[0];
    const resolvedSeverity = aiResult?.severity || conditionObj.tier || "Normal";
    const resolvedScore = aiResult?.aiPriorityScore || (
      resolvedSeverity === 'Critical' ? 92 :
      resolvedSeverity === 'High' ? 72 :
      resolvedSeverity === 'Medium' ? 48 : 25
    );

    const newRecord = {
      title: `${aiResult?.category || 'Plastic Waste'} at ${landmark || ward || 'Civic Area'}`,
      citizenId: currentUser?.id || currentUser?._id || currentUser?.userId || `usr_${Date.now()}`,
      citizenName: currentUser?.name || "Citizen Contributor",
      citizenPhone: currentUser?.phone || "",
      ward: ward || currentUser?.ward || "Ward 12 - Shivaji Nagar",
      landmark: landmark || "",
      latitude: latitude,
      longitude: longitude,
      imageUrl: imagePreview,
      beforeImageUrl: imagePreview,
      afterImageUrl: "",
      
      aiCategory: typeof aiResult?.category === 'object' && aiResult?.category !== null
        ? (aiResult.category.name || aiResult.category.label || "Plastic Waste")
        : (aiResult?.category || "Plastic Waste"),
      aiCategoryId: aiResult?.categoryId || "02",
      aiSubtype: aiResult?.subtype || "PET Bottle & Plastic Packaging",
      aiConfidence: aiResult?.confidence || 94,
      aiCondition: typeof aiResult?.condition === 'object' && aiResult?.condition !== null
        ? (aiResult.condition.conditionLabel || aiResult.condition.conditionType || aiResult.condition.description || "Minor isolated street litter")
        : (aiResult?.condition || conditionObj.name || "Minor isolated street litter"),
      aiConditionDetails: typeof aiResult?.condition === 'object' && aiResult?.condition !== null ? aiResult.condition : null,
      aiConditionId: aiResult?.conditionId || wasteCondition || "minor_litter",
      segregationStream: aiResult?.segregationStream || "Dry Waste → Plastic Recycling",
      severity: resolvedSeverity,
      aiPriorityScore: resolvedScore,
      severityBreakdown: aiResult?.severityBreakdown,
      duplicateDetection: aiResult?.duplicateDetection,
      recurrenceDetection: aiResult?.recurrenceDetection,
      aiRecommendation: aiResult?.recommendation,
      citizenNotes: citizenNotes,

      // Multi-Stream Detections & Biodegradability Metrics
      estimatedVolumeLiters: aiResult?.estimatedVolumeLiters,
      estimatedVolumeM3: aiResult?.estimatedVolumeM3,
      estimatedWeightKg: aiResult?.estimatedWeightKg,
      estimatedWeightGrams: aiResult?.estimatedWeightGrams,
      plasticVolumeLiters: aiResult?.plasticVolumeLiters,
      plasticWeightKg: aiResult?.plasticWeightKg,
      medicalVolumeLiters: aiResult?.medicalVolumeLiters,
      medicalWeightKg: aiResult?.medicalWeightKg,
      ewasteVolumeLiters: aiResult?.ewasteVolumeLiters,
      ewasteWeightKg: aiResult?.ewasteWeightKg,
      containerRequirement: aiResult?.containerRequirement,
      humanReadableVolume: aiResult?.humanReadableVolume,
      totalItemsDetected: aiResult?.totalItemsDetected,
      wasteCoveragePercent: aiResult?.wasteCoveragePercent,
      plasticCoveragePercent: aiResult?.plasticCoveragePercent,
      medicalCoveragePercent: aiResult?.medicalCoveragePercent,
      ewasteCoveragePercent: aiResult?.ewasteCoveragePercent,
      biodegradableCoveragePercent: aiResult?.biodegradableCoveragePercent,
      detections: aiResult?.detections,
      countsByClass: aiResult?.countsByClass,
      plasticCountsByClass: aiResult?.plasticCountsByClass,
      biomedicalCountsByClass: aiResult?.biomedicalCountsByClass,
      ewasteCountsByClass: aiResult?.ewasteCountsByClass,
      biodegradableCountsByClass: aiResult?.biodegradableCountsByClass,
      degradableCountsByClass: aiResult?.degradableCountsByClass,
      nonBiodegradableCountsByClass: aiResult?.nonBiodegradableCountsByClass,
      biodegradableDetectionsCount: aiResult?.biodegradableDetectionsCount,
      degradableDetectionsCount: aiResult?.degradableDetectionsCount,
      nonBiodegradableDetectionsCount: aiResult?.nonBiodegradableDetectionsCount,
      biodegradabilityAnalysis: aiResult?.biodegradabilityAnalysis,
      circularEconomy: aiResult?.circularEconomy,
      municipalAction: aiResult?.municipalAction,
      model: aiResult?.model
    };

    try {
      const created = await addComplaint(newRecord);
      setSubmittedComplaint(created);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#06b6d4', '#f59e0b']
      });
    } catch (err) {
      console.error('Failed to register complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Smart Waste Report Wizard"
        subtitle="Report civic waste with AI computer vision, geo-tagging, and priority estimation."
        breadcrumbs={[{ label: "Dashboard", path: "/citizen/dashboard" }, { label: "Report Waste" }]}
      />

      {/* 4-Step Progress Indicator */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          {[
            { step: 1, label: "Capture Photo", icon: Camera },
            { step: 2, label: "Geo-Location", icon: MapPin },
            { step: 3, label: "AI Analysis", icon: Sparkles },
            { step: 4, label: "Review & Submit", icon: CheckCircle2 }
          ].map((item) => {
            const Icon = item.icon;
            const isPassed = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} className="flex flex-col items-center">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mb-1.5 transition-all ${
                  isPassed
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-brand-600 text-white ring-4 ring-brand-100"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <span className={`text-[10px] sm:text-xs font-bold ${
                  isCurrent ? "text-brand-700" : isPassed ? "text-emerald-700" : "text-slate-400"
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: CAPTURE / UPLOAD */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Step 1 — Capture or Upload Waste Photo</h3>
            <p className="text-xs text-slate-500 mt-1">Take a clear photo of the accumulated waste or select from your device.</p>
          </div>

          {step1Error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{step1Error}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div className="relative border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-3xl p-8 text-center bg-slate-50 hover:bg-brand-50/20 transition-all cursor-pointer">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Click to Upload Photo or Drag and Drop</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, JPEG up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Selected Image Preview */}
          {imagePreview && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Selected Photo Preview:
              </span>
              <div className="relative rounded-2xl overflow-hidden border-2 border-brand-500 max-h-60 bg-slate-100">
                <img src={imagePreview} alt="Selected waste" className="w-full h-56 object-cover" />
                <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm font-semibold">
                  Photo Ready ✓
                </div>
              </div>
            </div>
          )}

          {/* Quick Test Samples */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Or Select a Sample Image for Instant Demo Test:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {sampleImages.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2.5 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden text-center flex flex-col items-center justify-between ${
                    imagePreview === sample.url ? "border-brand-600 bg-brand-50 shadow-md ring-2 ring-brand-200" : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <img src={sample.url} alt={sample.label} className="w-full h-20 object-cover rounded-xl mb-1.5" />
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{sample.label}</span>
                  <div className="flex flex-col items-center gap-0.5 w-full">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sample.badgeColor}`}>
                      {sample.tier} Priority
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {sample.sla}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Preview & Next */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {imagePreview ? "Photo selected & ready" : "Please select an image"}
            </span>
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Next: Set Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LOCATION PICKER */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Step 2 — Verify Geo-Location</h3>
            <p className="text-xs text-slate-500 mt-1">Pin the exact position on the smart-city map so municipal squads can navigate directly.</p>
          </div>

          {/* Interactive Map */}
          <LocationPickerMap
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            onAddressFound={(addressString, addrDetails) => {
              if (addressString) {
                setLandmark(addressString);
                setStep2Errors(prev => ({ ...prev, landmark: '' }));
              }
            }}
            onWardSuggested={(suggestedWard) => {
              if (suggestedWard) {
                setWard(suggestedWard);
                setStep2Errors(prev => ({ ...prev, ward: '' }));
              }
            }}
            height="280px"
          />

          {/* Ward & Landmark Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                 Municipal Ward <span className="text-rose-500">*</span>
              </label>
              <select
                value={ward}
                onChange={(e) => {
                  setWard(e.target.value);
                  if (step2Errors.ward) setStep2Errors(prev => ({ ...prev, ward: '' }));
                }}
                className={`w-full text-xs sm:text-sm border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  step2Errors.ward ? "border-rose-400 focus:ring-2 focus:ring-rose-400" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                }`}
              >
                <option value="Ward 02 - Mangalwar Peth / Somwar Peth">Ward 02 - Mangalwar Peth / Somwar Peth</option>
                <option value="Ward 03 - Guruwar Peth / Swargate">Ward 03 - Guruwar Peth / Swargate</option>
                <option value="Ward 01 - Kasba Peth / Raviwar Peth">Ward 01 - Kasba Peth / Raviwar Peth</option>
                <option value="Ward 12 - Shivaji Nagar">Ward 12 - Shivaji Nagar</option>
                <option value="Ward 14 - Deccan">Ward 14 - Deccan</option>
                <option value="Ward 07 - Kothrud">Ward 07 - Kothrud</option>
                <option value="Ward 09 - Hadapsar">Ward 09 - Hadapsar</option>
                <option value="Ward 05 - Baner">Ward 05 - Baner</option>
                <option value="Ward 11 - Viman Nagar">Ward 11 - Viman Nagar</option>
              </select>
              {step2Errors.ward && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{step2Errors.ward}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Landmark / Street Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => {
                  setLandmark(e.target.value);
                  if (step2Errors.landmark) setStep2Errors(prev => ({ ...prev, landmark: '' }));
                }}
                placeholder="e.g. Near Bus Stop #4, Shivaji Chowk Junction"
                className={`w-full text-xs sm:text-sm border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  step2Errors.landmark ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                }`}
              />
              {step2Errors.landmark && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{step2Errors.landmark}</p>
              )}
            </div>
          </div>

          {/* Real-World Waste Condition & Severity Impact */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Observed Waste Condition & Extent <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-lg">
                Determines Municipal Response SLA
              </span>
            </div>
            
            <select
              value={wasteCondition}
              onChange={(e) => setWasteCondition(e.target.value)}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all font-medium text-slate-800 cursor-pointer"
            >
              {WASTE_CONDITIONS.map((cond) => (
                <option key={cond.id} value={cond.id}>
                  [{cond.tier.toUpperCase()} PRIORITY] {cond.name} — {cond.alertText}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 pt-1">
              <div className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider flex-shrink-0 ${
                WASTE_CONDITIONS.find(c => c.id === wasteCondition)?.tier === 'Critical' ? 'bg-rose-500 text-white' :
                WASTE_CONDITIONS.find(c => c.id === wasteCondition)?.tier === 'High' ? 'bg-amber-500 text-white' :
                WASTE_CONDITIONS.find(c => c.id === wasteCondition)?.tier === 'Medium' ? 'bg-yellow-400 text-slate-950 font-bold' :
                'bg-emerald-500 text-white'
              }`}>
                {WASTE_CONDITIONS.find(c => c.id === wasteCondition)?.tier} Tier
              </div>
              <p className="text-slate-600 text-xs">
                {WASTE_CONDITIONS.find(c => c.id === wasteCondition)?.description}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleStartAnalysis}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run AI Waste Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AI ANALYSIS SCANNER */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Laser Scanner Visualizer */}
          <AIScanningVisualizer imageUrl={imagePreview} isScanning={isScanning} analysis={aiResult} />

          {/* AI Output Card (Shown once scanning finishes) */}
          {!isScanning && aiResult && (
            <div className="space-y-6">
              <AIAnalysisCard analysis={aiResult} />

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Adjust Location</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all"
                >
                  <span>Proceed to Final Submission</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: FINAL REVIEW & SUBMIT */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Step 4 — Final Review & Submit Smart Report</h3>
            <p className="text-xs text-slate-500 mt-1">Review the AI-classified complaint summary before dispatching to the municipal priority queue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              <img src={imagePreview} alt="Report subject" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Detected Material:</span>
                <strong className="text-slate-900">{aiResult?.category} ({aiResult?.confidence}% conf)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Estimated Volume:</span>
                <strong className="text-emerald-700 font-mono">
                  {aiResult?.humanReadableVolume || (aiResult?.estimatedVolumeLiters ? `${aiResult.estimatedVolumeLiters} Liters` : "3.8 Liters (~250g)")}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Estimated Severity:</span>
                <strong className={
                  aiResult?.severity === 'Critical' ? 'text-rose-600 font-bold' :
                  aiResult?.severity === 'High' ? 'text-amber-600 font-bold' :
                  aiResult?.severity === 'Medium' ? 'text-yellow-600 font-bold' :
                  'text-emerald-600 font-bold'
                }>{aiResult?.severity} Priority ({aiResult?.aiPriorityScore}/100)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Location:</span>
                <strong className="text-slate-900 truncate max-w-[200px]">{landmark}, {ward}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Segregation Stream:</span>
                <strong className="text-emerald-700">{aiResult?.segregationStream}</strong>
              </div>
              {aiResult?.biodegradabilityAnalysis?.streamVerdict && (
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">Degradability Stream:</span>
                  <strong className="text-emerald-700 font-semibold truncate max-w-[200px]" title={aiResult.biodegradabilityAnalysis.streamVerdict}>
                    {aiResult.biodegradabilityAnalysis.streamVerdict}
                  </strong>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-medium">Potential Green Points:</span>
                <strong className="text-brand-600 font-bold">+50 Green Points upon cleanup</strong>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Additional Citizen Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={citizenNotes}
              onChange={(e) => setCitizenNotes(e.target.value)}
              placeholder="e.g. Garbage accumulation is blocking pedestrian walkway near bus stand."
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to AI Results</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-brand-700 hover:from-emerald-700 hover:to-brand-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xl shadow-brand-500/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? "Submitting Smart Report..." : "Submit Smart Report"}</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUCCESS MODAL */}
      {submittedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-extrabold text-slate-900">Report Successfully Submitted!</h3>
              <p className="text-xs text-slate-500">AI analysis completed and queued for municipal action.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Complaint ID:</span>
                <strong className="text-brand-700">{submittedComplaint.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Priority:</span>
                <strong className={
                  submittedComplaint.severity === 'Critical' ? 'text-rose-600 font-bold' :
                  submittedComplaint.severity === 'High' ? 'text-amber-600 font-bold' :
                  submittedComplaint.severity === 'Medium' ? 'text-yellow-600 font-bold' :
                  'text-emerald-600 font-bold'
                }>{submittedComplaint.severity} Priority</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Ward:</span>
                <span className="text-slate-800">{submittedComplaint.ward}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate(`/citizen/complaints/${submittedComplaint.id}`)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Track Complaint & Timeline
              </button>
              <button
                type="button"
                onClick={() => navigate('/citizen/dashboard')}
                className="w-full py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
