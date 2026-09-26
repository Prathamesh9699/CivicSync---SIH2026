import { INITIAL_COMPLAINTS } from '../data/complaints';
import { complaintApi, verificationApi } from './api';
import { updateSquadStatusOnAssignment } from '../data/teams';

const STORAGE_KEY = 'cleantrack_complaints_v6';

export const syncTimeline = (item) => {
  const citizenName = item.citizenName || 'Citizen';
  const aiCategory = item.aiCategory || 'Plastic Waste';
  const aiConfidence = item.aiConfidence || 92;
  const severity = item.severity || 'Critical';
  const squadName = item.assignedTeamName || 'Team Alpha (Rapid Response)';

  const baseSteps = [
    {
      step: "Reported",
      time: "Just now",
      description: `Report submitted by ${citizenName}.`,
      status: "completed"
    },
    {
      step: "AI Analyzed",
      time: "Just now",
      description: `AI classified: ${aiCategory} (${aiConfidence}% conf). Severity: ${severity}. SLA deadline: 12h.`,
      status: "completed"
    },
    {
      step: "Municipal Review",
      time: "Updated",
      description: "Zonal sanitation officer triaged and validated SLA priority.",
      status: "completed"
    },
    {
      step: "Assigned",
      time: "Updated",
      description: `Dispatched ${squadName} with specialized collection equipment.`,
      status: "pending"
    },
    {
      step: "Cleanup In Progress",
      time: "Updated",
      description: "Sanitation squad on-site performing waste removal and site sweep.",
      status: "pending"
    },
    {
      step: "Before/After Uploaded",
      time: "Updated",
      description: "Field squad submitted post-cleanup photographic evidence.",
      status: "pending"
    },
    {
      step: "Citizen Verification",
      time: "Updated",
      description: "Reporting citizen validated neighborhood cleanup (+50 Green Points credited).",
      status: "pending"
    },
    {
      step: "Resolved",
      time: "Updated",
      description: "Municipal ticket closed. City cleanliness registry updated.",
      status: "pending"
    }
  ];

  const status = item.status || "AI Analyzed";

  if (status === "Reported") {
    baseSteps[0].status = "completed";
    baseSteps[1].status = "current";
    baseSteps[1].time = "Processing";
  } else if (status === "AI Analyzed" || status === "Under Review") {
    baseSteps[0].status = "completed";
    baseSteps[1].status = "completed";
    baseSteps[2].status = "current";
    baseSteps[2].time = "Queued";
    baseSteps[2].description = "Pending zonal sanitation officer triage.";
  } else if (status === "Assigned") {
    baseSteps[0].status = "completed";
    baseSteps[1].status = "completed";
    baseSteps[2].status = "completed";
    baseSteps[3].status = "completed";
    baseSteps[4].status = "current";
    baseSteps[4].time = "Dispatched";
    baseSteps[4].description = "Sanitation squad mobilized to incident location.";
  } else if (status === "In Progress") {
    baseSteps[0].status = "completed";
    baseSteps[1].status = "completed";
    baseSteps[2].status = "completed";
    baseSteps[3].status = "completed";
    baseSteps[4].status = "completed";
    baseSteps[5].status = "current";
    baseSteps[5].time = "In Progress";
    baseSteps[5].description = "Squad clearing waste and preparing clearance photo.";
  } else if (status === "Awaiting Verification") {
    baseSteps[0].status = "completed";
    baseSteps[1].status = "completed";
    baseSteps[2].status = "completed";
    baseSteps[3].status = "completed";
    baseSteps[4].status = "completed";
    baseSteps[5].status = "completed";
    baseSteps[6].status = "current";
    baseSteps[6].time = "Awaiting Verification";
    baseSteps[6].description = "Field worker uploaded cleanup photo. Awaiting municipal review & approval.";
  } else if (status === "Citizen Verified" || status === "Resolved") {
    // 100% COMPLETE - ALL 8 STEPS MARKED GREEN COMPLETED
    baseSteps[0].status = "completed";
    baseSteps[1].status = "completed";
    baseSteps[2].status = "completed";
    baseSteps[3].status = "completed";
    baseSteps[4].status = "completed";
    baseSteps[5].status = "completed";
    baseSteps[6].status = "completed";
    baseSteps[7].status = "completed";
    baseSteps[6].description = item.citizenResolutionNote || "Citizen verified clean site. +50 Green Points credited to wallet.";
    baseSteps[7].description = "Issue closed and recorded in municipal cleanliness archive.";
  } else if (status === "Withdrawn" || status === "Cancelled") {
    baseSteps[0].status = "completed";
    baseSteps[1].status = "completed";
    baseSteps[2].status = "completed";
    baseSteps[2].description = "Complaint voluntarily withdrawn and closed by citizen.";
  } else if (status === "Rejected") {
    baseSteps[0].status = "completed";
    baseSteps[1].status = "completed";
    baseSteps[2].status = "completed";
    baseSteps[2].description = "Report reviewed and dismissed (non-waste / duplicate).";
  }

  return baseSteps;
};

export const normalizeComplaint = (c) => {
  if (!c || typeof c !== 'object') return c;

  let normCondition = c.aiCondition ?? c.condition;
  let conditionObj = null;

  if (typeof normCondition === 'object' && normCondition !== null) {
    conditionObj = normCondition;
    normCondition = normCondition.conditionLabel || 
                    normCondition.conditionType || 
                    normCondition.label || 
                    normCondition.description || 
                    'Roadside dumping';
  } else if (!normCondition) {
    normCondition = 'Minor isolated street litter';
  }

  let normCategory = c.aiCategory ?? c.waste?.category;
  if (typeof normCategory === 'object' && normCategory !== null) {
    normCategory = normCategory.name || normCategory.label || 'Plastic Waste';
  } else if (!normCategory) {
    normCategory = 'Plastic Waste';
  }

  return {
    ...c,
    aiCondition: String(normCondition),
    condition: String(normCondition),
    aiConditionDetails: conditionObj || c.aiConditionDetails || null,
    aiCategory: String(normCategory)
  };
};

// LocalStorage helpers as resilient cache
const getStoredComplaints = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(c => {
          const norm = normalizeComplaint(c);
          return {
            ...norm,
            timeline: syncTimeline(norm || {})
          };
        });
      }
    }
  } catch (e) {
    console.error('LocalStorage load failed', e);
  }
  return Array.isArray(INITIAL_COMPLAINTS) ? INITIAL_COMPLAINTS.map(normalizeComplaint) : [];
};

const saveComplaints = (complaints) => {
  try {
    const list = Array.isArray(complaints) ? complaints.filter(Boolean) : [];
    const synced = list.map(c => {
      const norm = normalizeComplaint(c);
      return {
        ...norm,
        timeline: syncTimeline(norm || {})
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
  } catch (e) {
    console.error('LocalStorage save failed', e);
  }
};

export const complaintService = {
  async fetchAll() {
    let backendComplaints = [];
    try {
      const res = await complaintApi.getAll();
      if (res.success && res.complaints && res.complaints.length > 0) {
        // Map backend complaint structure to frontend UI compatibility fields
        backendComplaints = res.complaints.map(c => {
          const rawItem = {
            ...c,
            id: c.complaintId || c._id,
            complaintId: c.complaintId || c._id,
            aiCategory: c.aiCategory || c.waste?.category || 'Plastic Waste',
            aiSubtype: c.aiSubtype || c.waste?.subtype || '',
            aiConfidence: c.aiConfidence || c.ai?.confidence || 94,
            severity: c.severity || c.priority?.level || (c.aiPriorityScore >= 80 ? 'Critical' : c.aiPriorityScore >= 60 ? 'High' : 'Medium'),
            aiPriorityScore: c.aiPriorityScore || c.priority?.score || 75
          };
          const item = normalizeComplaint(rawItem);
          return {
            ...item,
            timeline: syncTimeline(item)
          };
        });
      }
    } catch (error) {
      console.log('[ComplaintService API Notice] Operating in cached/offline mode');
    }

    // Resilient merge: keep backend complaints and any locally created complaints
    const local = getStoredComplaints();
    const mergedMap = new Map();
    backendComplaints.forEach(c => {
      const k = c.id || c.complaintId;
      if (k) mergedMap.set(k, c);
    });
    local.forEach(c => {
      const k = c.id || c.complaintId;
      if (k && !mergedMap.has(k)) {
        mergedMap.set(k, c);
      }
    });

    const combined = Array.from(mergedMap.values());
    if (combined.length > 0) {
      saveComplaints(combined);
      return combined;
    }
    return local;
  },

  getAll() {
    return getStoredComplaints();
  },

  getById(id) {
    if (!id) return null;
    const list = getStoredComplaints();
    return list.find(c => c && (c.id === id || c.complaintId === id || String(c._id) === String(id))) || null;
  },

  async fetchById(id) {
    if (!id) return null;
    // 1. Try local cache
    const local = this.getById(id);
    if (local) return local;

    // 2. Try live backend API
    try {
      const res = await complaintApi.getById(id);
      if (res.success && res.complaint) {
        const item = {
          ...res.complaint,
          id: res.complaint.complaintId || res.complaint._id,
          complaintId: res.complaint.complaintId || res.complaint._id,
          aiCategory: res.complaint.aiCategory || res.complaint.waste?.category || 'Plastic Waste',
          aiSubtype: res.complaint.aiSubtype || res.complaint.waste?.subtype || '',
          aiConfidence: res.complaint.aiConfidence || res.complaint.ai?.confidence || 94,
          severity: res.complaint.severity || res.complaint.priority?.level || 'Medium',
          aiPriorityScore: res.complaint.aiPriorityScore || res.complaint.priority?.score || 75
        };
        item.timeline = syncTimeline(item);
        const list = getStoredComplaints();
        if (!list.some(c => (c.id === item.id || c.complaintId === item.id))) {
          saveComplaints([item, ...list]);
        }
        return item;
      }
    } catch (e) {
      console.log('[ComplaintService fetchById] Lookup completed');
    }
    return null;
  },

  async create(newComplaint) {
    let created = null;

    // 1. Try Live Backend API
    try {
      const res = await complaintApi.create(newComplaint);
      if (res.success && res.complaint) {
        created = {
          ...newComplaint,
          ...res.complaint,
          id: res.complaint.complaintId || res.complaint._id,
          complaintId: res.complaint.complaintId || res.complaint._id,
          citizenId: newComplaint.citizenId || res.complaint.citizenId,
          citizenName: newComplaint.citizenName || res.complaint.citizenName,
          citizenPhone: newComplaint.citizenPhone || res.complaint.citizenPhone,
          aiCategory: res.complaint.aiCategory || newComplaint.aiCategory,
          aiConfidence: res.complaint.aiConfidence || 94,
          severity: res.complaint.severity || res.complaint.priority?.level || newComplaint.severity || 'Medium',
          aiPriorityScore: res.complaint.aiPriorityScore || newComplaint.aiPriorityScore || 55
        };
      }
    } catch (e) {
      console.log('[ComplaintService Create] Creating in local persistence');
    }

    // 2. Resilient Local Creation Fallback
    if (!created) {
      const list = getStoredComplaints();
      const id = `CT-2026-${String(list.length + 135).padStart(5, '0')}`;
      const timestamp = new Date().toISOString();
      
      created = {
        ...newComplaint,
        id,
        complaintId: id,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: "AI Analyzed",
        assignedTeamId: null,
        assignedTeamName: null,
        assignedOfficer: "Vikram Deshmukh (Zonal Triage)",
        greenPointsAwarded: 50,
        isVerifiedByCitizen: false
      };
    }

    created.timeline = syncTimeline(created);
    const list = getStoredComplaints();
    const updated = [created, ...list.filter(c => c.id !== created.id && c.complaintId !== created.complaintId)];
    saveComplaints(updated);
    return created;
  },

  async updateStatus(id, newStatus, extraData = {}) {
    // 1. Try Live Backend API
    try {
      await complaintApi.updateStatus(id, newStatus, extraData);
    } catch (e) {}

    // 2. Update Local State
    const list = getStoredComplaints();
    const index = list.findIndex(c => c.id === id || c.complaintId === id);
    if (index === -1) return null;

    const item = { ...list[index], ...extraData, status: newStatus, updatedAt: new Date().toISOString() };
    if ((newStatus === "Resolved" || newStatus === "Citizen Verified") && !item.resolvedAt) {
      item.resolvedAt = new Date().toISOString();
    }
    item.timeline = syncTimeline(item);

    list[index] = item;
    saveComplaints(list);
    return item;
  },

  async assignTeam(id, teamId, teamName, officerNote = "", workerDetails = {}) {
    const workerId = workerDetails.workerId || 'WRK-2026-00001';
    const workerName = workerDetails.workerName || 'Ramesh Shinde';
    const workerPhone = workerDetails.workerPhone || '+91 98765 43210';

    try {
      updateSquadStatusOnAssignment(teamId, teamName);
      await complaintApi.assignSquad(id, { 
        teamId, 
        teamName, 
        instructions: officerNote,
        workerId,
        workerName,
        workerPhone
      });
    } catch (e) {}

    return this.updateStatus(id, "Assigned", {
      assignedTeamId: teamId,
      assignedTeamName: teamName,
      assignedWorkerId: workerId,
      assignedWorkerName: workerName,
      assignedWorkerPhone: workerPhone,
      officerNote
    });
  },

  async verifyCleanup(id, isClean, notes = "") {
    try {
      if (isClean) {
        await verificationApi.approve(id, notes);
      } else {
        await verificationApi.reject(id, notes);
      }
    } catch (e) {}

    if (isClean) {
      return this.updateStatus(id, "Resolved", {
        isVerifiedByCitizen: true,
        isVerifiedByMunicipal: true,
        resolvedAt: new Date().toISOString(),
        verificationNotes: notes,
        officerNote: `Cleanup verified and closed: ${notes || 'Site validated clear.'}`
      });
    } else {
      return this.updateStatus(id, "In Progress", {
        isVerifiedByCitizen: false,
        verificationNotes: `Re-cleanup requested: ${notes}`
      });
    }
  },

  async submitWorkerEvidence(id, evidenceData) {
    try {
      await complaintApi.submitWorkerEvidence(id, evidenceData);
    } catch (e) {}

    return this.updateStatus(id, "Awaiting Verification", {
      afterImageUrl: evidenceData.afterImageUrl,
      evidenceSubmittedAt: new Date().toISOString(),
      workerEvidence: {
        photoUrl: evidenceData.afterImageUrl,
        submittedAt: new Date().toISOString(),
        workerName: evidenceData.workerName || "Ramesh Shinde",
        workerId: evidenceData.workerId || "WRK-2026-00001",
        notes: evidenceData.notes || "Site cleaned and post-action evidence submitted.",
        equipmentUsed: evidenceData.equipmentUsed || ["Hydraulic Compactor", "Litter Grabbers"],
        wasteVolumeCollected: evidenceData.wasteVolumeCollected || "4 Bags (85 kg)"
      },
      officerNote: `Field worker ${evidenceData.workerName || 'Ramesh Shinde'} submitted completion evidence photo. Incident moved to Awaiting Verification for municipal review.`
    });
  },

  async startTask(id, workerData = {}) {
    return this.updateStatus(id, "In Progress", {
      startedAt: new Date().toISOString(),
      assignedWorkerName: workerData.workerName || "Ramesh Shinde (Squad Lead)",
      assignedWorkerId: workerData.workerId || "WRK-2026-00001",
      officerNote: `Field worker ${workerData.workerName || 'Ramesh Shinde'} has initiated on-site cleanup operations.`
    });
  },

  mergeDuplicates(primaryId, duplicateIds) {
    const list = getStoredComplaints();
    const updated = list.map(c => {
      if (duplicateIds.includes(c.id) || duplicateIds.includes(c.complaintId)) {
        return {
          ...c,
          status: "Resolved",
          mergedInto: primaryId,
          officerNote: `Merged into primary issue ${primaryId}`
        };
      }
      if (c.id === primaryId || c.complaintId === primaryId) {
        return {
          ...c,
          duplicateDetection: {
            ...c.duplicateDetection,
            hasDuplicate: false,
            mergedCount: duplicateIds.length,
            mergedIds: duplicateIds
          }
        };
      }
      return c;
    });
    saveComplaints(updated);
    return true;
  }
};
