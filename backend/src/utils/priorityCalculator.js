/**
 * CleanTrack Multi-Factor Real-World Priority Scoring Engine
 * Evaluates municipal waste severity across 4 tiers:
 * - CRITICAL (Score 80-100): Biohazard sharps, chemical hazard, road/drainage blockage, water contamination.
 * - HIGH (Score 60-79): Heavy open dump, rotting organic/mixed waste, toxic e-waste, sensitive public zones.
 * - MEDIUM (Score 40-59): Overflowing municipal bins, commercial market packaging, moderate roadside clusters.
 * - NORMAL (Score 15-39): Minor scattered litter, isolated PET bottle/can, sidewalk wrappers, dry leaves.
 */

export const calculatePriorityScore = ({
  category = "Plastic Waste",
  condition = "roadside_dumping",
  plasticCoverage = 0,
  medicalCoverage = 0,
  ewasteCoverage = 0,
  totalCoverage = null,
  totalItems = 1,
  isSensitiveArea = false,
  isRecurring = false,
  customScore = null
}) => {
  // If a direct AI / custom score was provided
  if (customScore !== null && customScore !== undefined) {
    const score = Math.max(10, Math.min(99, Number(customScore)));
    const level = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Normal";
    return {
      score,
      level,
      reason: `${level} Priority based on AI multi-factor index (${score}/100)`
    };
  }

  const catLower = (category || "").toLowerCase();
  const condLower = (condition || "").toLowerCase();

  const isMedical = catLower.includes("biomedical") || catLower.includes("medical") || catLower.includes("sharps") || catLower.includes("syringe") || catLower.includes("hazard");
  const isEWaste = catLower.includes("e-waste") || catLower.includes("electronic") || catLower.includes("battery");
  const isRottingOrMixed = catLower.includes("organic") || catLower.includes("wet") || catLower.includes("mixed") || condLower.includes("rotting");
  const isMinorLitter = condLower.includes("minor") || condLower.includes("isolated") || condLower.includes("footpath") || condLower.includes("single") || condLower.includes("sidewalk");
  const isOverflowingBin = condLower.includes("bin") || condLower.includes("dustbin") || condLower.includes("container");
  const isHeavyDump = condLower.includes("large") || condLower.includes("heap") || condLower.includes("open_dumping") || condLower.includes("commercial") || condLower.includes("market");
  const isHazardousCond = condLower.includes("biohazard") || condLower.includes("hazardous") || condLower.includes("block") || condLower.includes("drain") || condLower.includes("traffic");

  // 1. Base Material Hazard Weight (0 - 45)
  let materialWeight = 20; // Default dry plastic
  if (isMedical) materialWeight = 45;
  else if (isEWaste) materialWeight = 32;
  else if (isRottingOrMixed) materialWeight = 28;
  else if (isMinorLitter) materialWeight = 12;

  // 2. Condition & Environmental Hazard Weight (0 - 35)
  let conditionWeight = 15; // Default roadside
  if (isHazardousCond || isMedical) conditionWeight = 35;
  else if (isHeavyDump) conditionWeight = 26;
  else if (isOverflowingBin) conditionWeight = 18;
  else if (isMinorLitter) conditionWeight = 6;

  // 3. Extent / Coverage / Item Count Weight (0 - 15)
  let extentWeight = 5;
  const coverage = totalCoverage !== null ? totalCoverage : (plasticCoverage + medicalCoverage + ewasteCoverage);
  if (coverage > 40 || totalItems >= 10 || isHeavyDump) extentWeight = 14;
  else if (coverage > 15 || totalItems >= 4 || isOverflowingBin) extentWeight = 9;
  else if (isMinorLitter || totalItems <= 2) extentWeight = 3;

  // 4. Proximity & Sensitive Zone Weight (0 - 10)
  let proximityWeight = 0;
  if (isSensitiveArea) proximityWeight += 7;
  if (isRecurring) proximityWeight += 3;

  // Raw combined score (10 - 99)
  const rawScore = materialWeight + conditionWeight + extentWeight + proximityWeight;
  const score = Math.max(15, Math.min(96, Math.round(rawScore)));

  // Determine Level from real-world thresholds
  let level = "Normal";
  let reason = "";

  if (score >= 80 || isMedical || isHazardousCond) {
    level = "Critical";
    reason = isMedical 
      ? "Critical Priority: Clinical sharps / biohazard waste requiring immediate hazardous dispatch protocol."
      : "Critical Priority: Severe hazard or roadway / drainage obstruction requiring emergency municipal clearance.";
  } else if (score >= 60 || isHeavyDump || isEWaste) {
    level = "High";
    reason = isEWaste
      ? "High Priority: Discarded toxic electronics & battery scrap queued for fast-track collection."
      : "High Priority: Large accumulated dump / organic rotting debris in active residential corridor.";
  } else if (score >= 40 || isOverflowingBin) {
    level = "Medium";
    reason = isOverflowingBin
      ? "Medium Priority: Overflowing municipal community dustbin scheduled for standard shift sweep."
      : "Medium Priority: Moderate commercial or dry packaging accumulation scheduled for daily route.";
  } else {
    level = "Normal";
    reason = "Normal Priority: Minor isolated street litter queued for routine municipal morning sweep.";
  }

  const breakdown = {
    wasteTypeScore: materialWeight,
    visualExtentScore: conditionWeight + extentWeight,
    locationSensitivityScore: proximityWeight > 0 ? proximityWeight : 5,
    recurrenceScore: isRecurring ? 10 : 3,
    timeFactorScore: level === "Critical" ? 10 : level === "High" ? 8 : level === "Medium" ? 5 : 2
  };

  return {
    score,
    level,
    breakdown,
    reason
  };
};
