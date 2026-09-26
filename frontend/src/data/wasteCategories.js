export const WASTE_CATEGORIES = [
  {
    id: "01",
    name: "Plastic Waste",
    icon: "Milk",
    color: "#0284c7",
    bgColor: "bg-sky-50 text-sky-700 border-sky-200",
    stream: "Dry Waste → Plastic Recycling",
    description: "Recyclable and non-biodegradable polymeric materials, PET bottles, and single-use packaging.",
    examples: [
      "PET bottle", "beverage bottle", "plastic container", "plastic jar", "plastic cup",
      "plastic bag", "garbage bag", "plastic pouch", "wrapper", "film", "plastic plate",
      "disposable cutlery", "packaging material", "polyethylene sheet"
    ],
    recommendedAction: "Dry waste segregated recycling & compactor truck dispatch",
    defaultSeverity: "High"
  },
  {
    id: "02",
    name: "Medical Waste",
    icon: "ShieldAlert",
    color: "#e11d48",
    bgColor: "bg-rose-50 text-rose-700 border-rose-200",
    stream: "Biomedical / Special Handling Protocol",
    description: "Biomedical disposables, masks, syringes, clinic refuse, and pharmaceutical packaging.",
    isSensitive: true,
    disclaimer: "Visual appearance analysis. Handled under bio-safety sanitization protocols.",
    examples: [
      "face mask", "surgical mask", "medical gloves", "syringe", "bandage",
      "medicine packaging", "clinical disposables", "sanitary refuse", "cotton swab"
    ],
    recommendedAction: "URGENT: Bio-hazard safety squad dispatch with protective PPE and sharps container",
    defaultSeverity: "Critical"
  },
  {
    id: "03",
    name: "E-Waste",
    icon: "Smartphone",
    color: "#8b5cf6",
    bgColor: "bg-purple-50 text-purple-700 border-purple-200",
    stream: "GREY STREAM — Authorized E-Waste Dismantler (RoHS/EPR)",
    description: "Discarded electronic devices, circuit boards (PCB), batteries, monitors, computers, and home appliances.",
    examples: [
      "Battery", "Smartphone", "Laptop", "Computer Keyboard", "Computer Mouse",
      "PCB Circuit Board", "Flat-Panel Monitor", "Router", "Hard Disk Drive (HDD)",
      "Microwave", "Telephone Set", "Television", "Solar Panel", "Electronic Scrap"
    ],
    recommendedAction: "Authorized EPR electronic waste dismantling facility dispatch (Squad Gamma)",
    defaultSeverity: "High"
  },
  {
    id: "04",
    name: "Organic / Biodegradable Waste",
    icon: "Leaf",
    color: "#16a34a",
    bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stream: "GREEN STREAM — Composting / Biogas Digestion",
    description: "Readily compostable organic matter, food leftovers, vegetable/fruit scraps, cardboard, and paper fibers.",
    examples: [
      "vegetable peels", "food scraps", "fruit waste", "cardboard box", "paper packaging",
      "fallen leaves", "organic compostable packaging", "biodegradable matter"
    ],
    recommendedAction: "Green Stream collection & dispatch to municipal aerobic composting or bio-methanation facility",
    defaultSeverity: "Medium"
  }
];

export const WASTE_CONDITIONS = [
  { 
    id: "minor_litter", 
    name: "Minor Isolated Litter", 
    tier: "Normal", 
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300",
    description: "1–3 isolated plastic bottles, paper cups, or snack wrappers on footpath", 
    severityMultiplier: 0.7, 
    alertText: "Routine Sweeping Route (< 24h)" 
  },
  { 
    id: "overflowing_bin", 
    name: "Overflowing Community Bin", 
    tier: "Medium", 
    badgeColor: "bg-yellow-50 text-yellow-900 border-yellow-300",
    description: "1.1m³ municipal dumper bin overflowing onto pavement (< 15 items)", 
    severityMultiplier: 1.0, 
    alertText: "Standard Shift Turnaround (< 12h)" 
  },
  { 
    id: "large_waste_accumulation", 
    name: "Heavy Commercial Dump / Open Heap", 
    tier: "High", 
    badgeColor: "bg-amber-50 text-amber-900 border-amber-300",
    description: "Large accumulating garbage pile or rotting food waste in residential corridor", 
    severityMultiplier: 1.4, 
    alertText: "Priority Fast-Track Turnaround (< 4h)" 
  },
  { 
    id: "hazardous_biohazard_dump", 
    name: "Biohazard Medical Sharps / Hazard", 
    tier: "Critical", 
    badgeColor: "bg-rose-50 text-rose-900 border-rose-300",
    description: "Clinical syringes, hazardous sharps, chemical leakage, or road blockage", 
    severityMultiplier: 1.8, 
    alertText: "Immediate Emergency Dispatch (< 2h)" 
  },
  { 
    id: "roadside_dumping", 
    name: "Roadside Curb Accumulation", 
    tier: "Medium", 
    badgeColor: "bg-blue-50 text-blue-900 border-blue-300",
    description: "Dry packaging and bottles accumulated along roadside curb", 
    severityMultiplier: 1.1, 
    alertText: "Scheduled Shift Route (< 12h)" 
  }
];
