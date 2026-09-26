import { Complaint } from '../models/Complaint.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateComplaintId } from '../utils/complaintIdGenerator.js';
import { calculateDueDate } from '../utils/dateUtils.js';
import { calculatePriorityScore } from '../utils/priorityCalculator.js';
import { aiService } from '../services/aiService.js';
import { notificationService } from '../services/notificationService.js';
import { rewardService } from '../services/rewardService.js';
import { smsService } from '../services/smsService.js';


export const createComplaint = async (req, res, next) => {
  try {
    const {
      title,
      description,
      citizenNotes,
      imageUrl,
      latitude,
      longitude,
      ward,
      landmark,
      aiCategory,
      aiSubtype,
      aiConfidence,
      aiCondition,
      segregationStream,
      severity,
      aiPriorityScore,
      estimatedVolumeLiters,
      estimatedVolumeM3,
      estimatedWeightKg,
      estimatedWeightGrams,
      plasticVolumeLiters,
      plasticWeightKg,
      medicalVolumeLiters,
      medicalWeightKg,
      ewasteVolumeLiters,
      ewasteWeightKg,
      containerRequirement,
      humanReadableVolume,
      totalItemsDetected,
      wasteCoveragePercent,
      plasticCoveragePercent,
      medicalCoveragePercent,
      ewasteCoveragePercent,
      biodegradableCoveragePercent,
      detections,
      countsByClass,
      plasticCountsByClass,
      biomedicalCountsByClass,
      ewasteCountsByClass,
      biodegradableCountsByClass,
      degradableCountsByClass,
      nonBiodegradableCountsByClass,
      biodegradableDetectionsCount,
      degradableDetectionsCount,
      nonBiodegradableDetectionsCount,
      biodegradabilityAnalysis,
      circularEconomy,
      municipalAction,
      model
    } = req.body;

    let citizenId = req.user ? req.user._id : null;
    let citizenName = req.user ? req.user.name : (req.body.citizenName || 'Prathamesh Hadole');
    let citizenPhone = req.user ? req.user.phone : (req.body.citizenPhone || '+91 98230 11452');

    // Resolve citizenId from user database if not present in token
    if (!citizenId && req.body.citizenId && /^[0-9a-fA-F]{24}$/.test(req.body.citizenId)) {
      citizenId = req.body.citizenId;
    }
    if (!citizenId && (req.body.citizenPhone || req.body.citizenName)) {
      const cleanP = String(req.body.citizenPhone || '').replace(/\D/g, '');
      const userMatch = await User.findOne({
        $or: [
          ...(cleanP && cleanP.length >= 7 ? [{ phone: new RegExp(cleanP.slice(-10)) }] : []),
          ...(req.body.citizenName ? [{ name: new RegExp(req.body.citizenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] : [])
        ]
      });
      if (userMatch) {
        citizenId = userMatch._id;
        if (!citizenName || citizenName === 'Citizen') citizenName = userMatch.name;
        if (!citizenPhone) citizenPhone = userMatch.phone;
      }
    }

    const complaintId = await generateComplaintId(Complaint);

    // Fetch dynamic SLA settings from DB
    const settings = await SystemSetting.findOne({ key: 'default_config' }) || {
      normalSlaHours: 48,
      mediumSlaHours: 24,
      criticalSlaHours: 12,
      reportRewardPoints: 10
    };

    const effectiveCategory = aiCategory || req.body.category || req.body.categoryHint || (req.body.waste && req.body.waste.category) ||
      (title && (title.toLowerCase().includes('biomedical') || title.toLowerCase().includes('syringe') || title.toLowerCase().includes('needle')) ? 'Biomedical Waste' :
       title && (title.toLowerCase().includes('battery') || title.toLowerCase().includes('e-waste') || title.toLowerCase().includes('electronics')) ? 'E-Waste' :
       title && (title.toLowerCase().includes('market') || title.toLowerCase().includes('mixed')) ? 'Mixed Municipal Waste' : 'Plastic Waste');

    const effectiveCondition = aiCondition || req.body.condition || req.body.conditionHint || (req.body.waste && req.body.waste.condition) ||
      (description && (description.toLowerCase().includes('syringe') || description.toLowerCase().includes('biohazard') || description.toLowerCase().includes('canal')) ? 'biohazard_sharps_drain' :
       description && (description.toLowerCase().includes('battery') || description.toLowerCase().includes('acid') || description.toLowerCase().includes('toxic')) ? 'hazardous_battery_leak' :
       description && (description.toLowerCase().includes('market') || description.toLowerCase().includes('heap') || description.toLowerCase().includes('pile')) ? 'commercial_market_heap' : 'roadside_single_item');

    // Calculate priority & SLA due date
    const { score, level, reason, breakdown } = calculatePriorityScore({
      category: effectiveCategory,
      condition: effectiveCondition,
      customScore: aiPriorityScore
    });

    const finalSeverity = severity || level || (score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Normal');
    const finalScore = (aiPriorityScore !== undefined && aiPriorityScore !== null) ? Number(aiPriorityScore) : score;

    const sevLower = finalSeverity.toLowerCase();
    const slaHours = sevLower === 'critical' 
      ? settings.criticalSlaHours 
      : sevLower === 'high' 
      ? (settings.highSlaHours || 18) 
      : sevLower === 'medium' 
      ? settings.mediumSlaHours 
      : settings.normalSlaHours;

    const createdAt = new Date();
    const dueAt = calculateDueDate(createdAt, slaHours);

    // Create Complaint Record
    const complaint = new Complaint({
      complaintId,
      title: title || `${aiCategory || 'Plastic Waste'} at ${landmark || ward || 'Civic Area'}`,
      citizenId,
      citizenName,
      citizenPhone,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800",
      beforeImageUrl: imageUrl || "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800",
      description: description || citizenNotes || '',
      citizenNotes: citizenNotes || '',
      location: {
        type: 'Point',
        coordinates: [Number(longitude) || 73.8567, Number(latitude) || 18.5204],
        address: landmark || '',
        ward: ward || 'Ward 12 - Shivaji Nagar',
        landmark: landmark || ''
      },
      latitude: Number(latitude) || 18.5204,
      longitude: Number(longitude) || 73.8567,
      ward: ward || 'Ward 12 - Shivaji Nagar',
      landmark: landmark || '',
      waste: {
        category: aiCategory || 'Plastic Waste',
        subtype: aiSubtype || 'PET Bottle & Plastic Packaging',
        segregationStream: segregationStream || 'Dry Waste → Plastic Recycling',
        condition: aiCondition || 'Roadside dumping'
      },
      aiCategory: aiCategory || 'Plastic Waste',
      aiSubtype: aiSubtype || 'PET Bottle & Plastic Packaging',
      aiCondition: aiCondition || 'Roadside dumping',
      segregationStream: segregationStream || 'Dry Waste → Plastic Recycling',
      aiConfidence: aiConfidence || 94,
      priority: {
        level: finalSeverity,
        score: finalScore,
        reason: reason || `${finalSeverity} Priority Level`
      },
      severity: finalSeverity,
      aiPriorityScore: finalScore,
      severityBreakdown: breakdown,

      // Multi-Stream Detection & Biodegradability Metrics
      estimatedVolumeLiters: estimatedVolumeLiters || 3.8,
      estimatedVolumeM3: estimatedVolumeM3 || 0.0038,
      estimatedWeightKg: estimatedWeightKg || (estimatedWeightGrams ? estimatedWeightGrams / 1000 : 0.25),
      estimatedWeightGrams: estimatedWeightGrams || (estimatedWeightKg ? estimatedWeightKg * 1000 : 250),
      plasticVolumeLiters: plasticVolumeLiters,
      plasticWeightKg: plasticWeightKg,
      medicalVolumeLiters: medicalVolumeLiters,
      medicalWeightKg: medicalWeightKg,
      ewasteVolumeLiters: ewasteVolumeLiters,
      ewasteWeightKg: ewasteWeightKg,
      containerRequirement: containerRequirement || 'Small civic basket / 0.5× 10L bag (3.8L)',
      humanReadableVolume: humanReadableVolume,
      totalItemsDetected: totalItemsDetected || 0,
      wasteCoveragePercent: wasteCoveragePercent,
      plasticCoveragePercent: plasticCoveragePercent,
      medicalCoveragePercent: medicalCoveragePercent,
      ewasteCoveragePercent: ewasteCoveragePercent,
      biodegradableCoveragePercent: biodegradableCoveragePercent,
      detections: detections || [],
      countsByClass: countsByClass || {},
      plasticCountsByClass: plasticCountsByClass || {},
      biomedicalCountsByClass: biomedicalCountsByClass || {},
      ewasteCountsByClass: ewasteCountsByClass || {},
      biodegradableCountsByClass: biodegradableCountsByClass || {},
      degradableCountsByClass: degradableCountsByClass || {},
      nonBiodegradableCountsByClass: nonBiodegradableCountsByClass || {},
      biodegradableDetectionsCount: biodegradableDetectionsCount || 0,
      degradableDetectionsCount: degradableDetectionsCount || 0,
      nonBiodegradableDetectionsCount: nonBiodegradableDetectionsCount || 0,
      biodegradabilityAnalysis: biodegradabilityAnalysis || null,
      circularEconomy: circularEconomy || null,
      municipalAction: municipalAction || null,
      model: model || 'YOLOv8x-ViT-v2.4.0',
      priorityHistory: [
        {
          previousLevel: 'UNASSIGNED',
          newLevel: level,
          reason: 'Initial AI Assessment & Location Triage',
          changedAt: createdAt
        }
      ],
      sla: {
        createdAt,
        dueAt,
        escalationLevel: 0,
        reminderCount: 0,
        isOverdue: false
      },
      status: 'AI Analyzed',
      assignedOfficer: 'Vikram Deshmukh (Zonal Triage)',
      greenPointsAwarded: 50,
      timeline: [
        { step: 'Reported', time: 'Just now', description: `Report submitted by ${citizenName}.`, status: 'completed' },
        { step: 'AI Analyzed', time: 'Just now', description: `AI classified: ${aiCategory || 'Plastic'} (${aiConfidence || 94}% conf). Severity: ${level}. SLA deadline: ${slaHours}h.`, status: 'completed' },
        { step: 'Municipal Review', time: 'Queued', description: 'Pending zonal sanitation triage.', status: 'current' },
        { step: 'Assigned', time: 'Pending', description: 'Pending squad dispatch.', status: 'pending' },
        { step: 'Cleanup In Progress', time: 'Pending', description: 'Pending field clearance.', status: 'pending' },
        { step: 'Before/After Uploaded', time: 'Pending', description: 'Pending clearance photo.', status: 'pending' },
        { step: 'Citizen Verification', time: 'Pending', description: 'Pending citizen validation.', status: 'pending' },
        { step: 'Resolved', time: 'Pending', description: 'Pending registry close.', status: 'pending' }
      ]
    });

    // Check for Duplicates
    const duplicateData = await aiService.detectDuplicates(complaint);
    complaint.duplicateDetection = duplicateData;

    await complaint.save();

    // Store AI Analysis in separate collection
    const aiAnalysisRecord = await AIAnalysis.create({
      complaintId: complaint.complaintId,
      category: complaint.aiCategory,
      subtype: complaint.aiSubtype,
      confidence: complaint.aiConfidence,
      condition: complaint.aiCondition,
      segregationStream: complaint.segregationStream,
      severityScore: complaint.aiPriorityScore,
      priorityLevel: level,
      duplicateDetection: duplicateData,
      totalItemsDetected: complaint.totalItemsDetected || 0,
      detections: complaint.detections || [],
      countsByClass: complaint.countsByClass || {},
      plasticCountsByClass: complaint.plasticCountsByClass || {},
      biomedicalCountsByClass: complaint.biomedicalCountsByClass || {},
      ewasteCountsByClass: complaint.ewasteCountsByClass || {},
      biodegradableCountsByClass: complaint.biodegradableCountsByClass || {},
      degradableCountsByClass: complaint.degradableCountsByClass || {},
      nonBiodegradableCountsByClass: complaint.nonBiodegradableCountsByClass || {},
      biodegradableDetectionsCount: complaint.biodegradableDetectionsCount || 0,
      degradableDetectionsCount: complaint.degradableDetectionsCount || 0,
      nonBiodegradableDetectionsCount: complaint.nonBiodegradableDetectionsCount || 0,
      biodegradabilityAnalysis: complaint.biodegradabilityAnalysis || null,
      circularEconomy: complaint.circularEconomy || null,
      municipalAction: complaint.municipalAction || null,
      modelVersion: complaint.model || 'YOLOv8x-ViT-v2.4.0'
    });

    complaint.ai.analysisId = aiAnalysisRecord._id;
    await complaint.save();

    // Audit Log
    await AuditLog.create({
      userId: citizenId,
      userName: citizenName,
      action: 'COMPLAINT_CREATED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      newValue: { priority: level, dueAt },
      detail: `Complaint #${complaint.complaintId} created in ${complaint.ward}.`
    });

    // Award +10 Green Points for initial report
    if (citizenId) {
      await rewardService.awardPoints({
        userId: citizenId,
        complaintId: complaint.complaintId,
        type: 'report_submitted',
        points: settings.reportRewardPoints || 10,
        description: `Submitted verified waste report #${complaint.complaintId}`
      });
    }

    // Notify Municipal Staff
    await notificationService.createNotification({
      targetRole: 'municipal_staff',
      complaintId: complaint.complaintId,
      type: 'complaint_created',
      title: `New Report: #${complaint.complaintId}`,
      message: `${complaint.aiCategory} reported at ${complaint.ward}. Initial Priority: ${level}.`,
      priority: level === 'CRITICAL' ? 'critical' : 'medium',
      link: `/municipal/complaints`
    });

    res.status(201).json({
      success: true,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

export const getAllComplaints = async (req, res, next) => {
  try {
    const { status, ward, severity, citizenId, search } = req.query;

    const andConditions = [];

    // RULE 1: If Citizen, only return their own complaints unless requested by staff/admin
    if (req.user && req.user.role === 'citizen') {
      const userCleanPhone = String(req.user.phone || '').replace(/\D/g, '');
      const nameParts = String(req.user.name || '').split(' ').filter(p => p.length > 2);

      const citizenOr = [
        { citizenId: req.user._id },
        { citizenName: new RegExp(String(req.user.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      ];
      nameParts.forEach(part => {
        citizenOr.push({ citizenName: new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      });
      if (userCleanPhone && userCleanPhone.length >= 7) {
        citizenOr.push({ citizenPhone: new RegExp(userCleanPhone.slice(-10)) });
      }
      andConditions.push({ $or: citizenOr });
    } else if (req.user && req.user.role === 'worker') {
      // Worker views tasks assigned to them, their squad, or active assigned tasks
      andConditions.push({
        $or: [
          { assignedTo: req.user._id },
          { assignedWorkerId: req.user.userId },
          { assignedTeamId: req.user.assignedTeamId || 'team_alpha' },
          { assignedTeamName: new RegExp(req.user.assignedSquad || 'Squad Alpha', 'i') },
          { status: { $in: ['Assigned', 'In Progress', 'Awaiting Verification', 'Citizen Verified', 'Resolved'] } }
        ]
      });
    } else if (citizenId) {
      if (/^[0-9a-fA-F]{24}$/.test(citizenId)) {
        andConditions.push({ citizenId });
      }
    }

    if (status && status !== 'All') {
      andConditions.push({ status: { $regex: new RegExp(`^${status}$`, 'i') } });
    }

    if (ward && ward !== 'All') {
      andConditions.push({ ward: { $regex: ward, $options: 'i' } });
    }

    if (severity && severity !== 'All') {
      andConditions.push({
        $or: [
          { severity: { $regex: severity, $options: 'i' } },
          { 'priority.level': { $regex: severity, $options: 'i' } }
        ]
      });
    }

    if (search) {
      andConditions.push({
        $or: [
          { complaintId: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { 'waste.category': { $regex: search, $options: 'i' } },
          { ward: { $regex: search, $options: 'i' } },
          { landmark: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const complaints = await Complaint.find(query).sort({ 'priority.score': -1, createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const orClauses = [{ complaintId: id }];
    if (isMongoId) {
      orClauses.push({ _id: id });
    }

    const complaint = await Complaint.findOne({ $or: orClauses });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, officerNote, assignedTeamId, assignedTeamName, beforeImageUrl, afterImageUrl } = req.body;

    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const oldStatus = complaint.status;
    if (status) {
      complaint.status = status;
      if ((status === 'Resolved' || status === 'Citizen Verified') && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }
    }
    if (officerNote) complaint.officerNote = officerNote;
    if (assignedTeamId) complaint.assignedTeamId = assignedTeamId;
    if (assignedTeamName) complaint.assignedTeamName = assignedTeamName;
    if (beforeImageUrl) complaint.beforeImageUrl = beforeImageUrl;
    if (afterImageUrl) complaint.afterImageUrl = afterImageUrl;

    // Update timeline step
    const statusMap = {
      'Under Review': 'Municipal Review',
      'Assigned': 'Assigned',
      'In Progress': 'Cleanup In Progress',
      'Awaiting Verification': 'Before/After Uploaded',
      'Citizen Verified': 'Citizen Verification',
      'Resolved': 'Resolved'
    };

    const stepName = statusMap[status];
    if (stepName && complaint.timeline) {
      complaint.timeline = complaint.timeline.map(t => {
        if (t.step === stepName) return { ...t.toObject(), status: 'completed', time: 'Updated just now' };
        return t;
      });
    }

    await complaint.save();

    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Municipal Officer',
      action: 'STATUS_UPDATED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      oldValue: { status: oldStatus },
      newValue: { status: complaint.status },
      detail: `Status of #${complaint.complaintId} changed from ${oldStatus} to ${complaint.status}`
    });

    // If awaiting verification, notify citizen
    if (status === 'Awaiting Verification' && complaint.citizenId) {
      await notificationService.sendVerificationRequest(complaint.citizenId, complaint);
    }

    // If resolved or citizen verified, notify citizen and send phone SMS
    if (status === 'Resolved' || status === 'Citizen Verified') {
      if (complaint.citizenId) {
        await notificationService.sendResolutionCongratulations(complaint.citizenId, complaint, complaint.greenPointsAwarded || 50);
      } else if (complaint.citizenPhone) {
        await smsService.sendComplaintResolvedSms({
          phone: complaint.citizenPhone,
          complaintId: complaint.complaintId,
          ward: complaint.ward || 'Civic Area',
          category: complaint.aiCategory || complaint.waste?.category || 'Waste',
          citizenName: complaint.citizenName || 'Citizen',
          pointsEarned: complaint.greenPointsAwarded || 50,
          officerName: complaint.assignedTeamName || complaint.assignedOfficer || 'Municipal Sanitation Squad'
        });
      }
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

export const assignSquad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { teamId, teamName, instructions, priorityOverride, workerId, workerName, workerPhone } = req.body;

    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = 'Assigned';
    complaint.assignedTeamId = teamId || 'team_alpha';
    complaint.assignedTeamName = teamName || 'Squad Alpha';
    complaint.assignedWorkerId = workerId || 'WRK-2026-00001';
    complaint.assignedWorkerName = workerName || 'Ramesh Shinde (Squad Lead)';
    if (workerPhone) complaint.assignedWorkerPhone = workerPhone;
    complaint.officerNote = instructions || '';
    if (priorityOverride) {
      complaint.severity = priorityOverride;
      complaint.priority.level = priorityOverride.toUpperCase();
    }

    await complaint.save();

    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Municipal Officer',
      action: 'COMPLAINT_ASSIGNED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      newValue: { assignedTeamName: complaint.assignedTeamName, workerName: complaint.assignedWorkerName, instructions },
      detail: `Assigned ${complaint.assignedTeamName} (Worker: ${complaint.assignedWorkerName}) to #${complaint.complaintId}`
    });

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

export const submitWorkerEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { afterImageUrl, notes, equipmentUsed, wasteVolumeCollected, workerName, workerId } = req.body;

    const complaint = await Complaint.findOne({
      $or: [
        { complaintId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const currentWorkerName = workerName || (req.user ? req.user.name : 'Ramesh Shinde (Sanitation Worker)');
    const currentWorkerId = workerId || (req.user ? req.user.userId : 'WRK-2026-00001');

    complaint.status = 'Awaiting Verification';
    complaint.evidenceSubmittedAt = new Date();
    if (afterImageUrl) complaint.afterImageUrl = afterImageUrl;
    if (!complaint.beforeImageUrl) complaint.beforeImageUrl = complaint.imageUrl;
    
    complaint.workerEvidence = {
      photoUrl: afterImageUrl || complaint.afterImageUrl,
      submittedAt: new Date(),
      workerId: currentWorkerId,
      workerName: currentWorkerName,
      notes: notes || 'Site cleared and debris loaded into municipal compactor.',
      equipmentUsed: equipmentUsed || ['Hydraulic Compactor', 'Litter Grabbers'],
      wasteVolumeCollected: wasteVolumeCollected || '4 Sacks (Approx. 85 kg)'
    };

    // Update timeline step
    if (complaint.timeline) {
      complaint.timeline = complaint.timeline.map(t => {
        if (t.step === 'Cleanup In Progress' || t.step === 'Before/After Uploaded') {
          return {
            ...t.toObject(),
            status: 'completed',
            time: 'Just now',
            description: `Field worker ${currentWorkerName} uploaded direct post-cleanup photographic evidence.`
          };
        }
        if (t.step === 'Citizen Verification') {
          return {
            ...t.toObject(),
            status: 'current',
            time: 'Awaiting Verification',
            description: 'Field cleanup evidence submitted by worker. Ready for municipal verification & approval.'
          };
        }
        return t;
      });
    }

    await complaint.save();

    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      userName: currentWorkerName,
      action: 'WORKER_EVIDENCE_SUBMITTED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      detail: `Field worker ${currentWorkerName} submitted clearance photo proof for #${complaint.complaintId}. Complaint moved to Awaiting Verification.`
    });

    // Notify citizen that cleanup was done and evidence is ready for verification
    if (complaint.citizenId) {
      await notificationService.sendVerificationRequest(complaint.citizenId, complaint);
    }

    // Notify municipal staff that worker submitted evidence
    await notificationService.createNotification({
      targetRole: 'municipal_staff',
      complaintId: complaint.complaintId,
      type: 'cleanup_completed',
      title: `Worker Photo Uploaded: #${complaint.complaintId}`,
      message: `${currentWorkerName} uploaded cleanup evidence photo for ${complaint.ward}. Ready for municipal verification.`,
      priority: 'high',
      link: `/municipal/verification`
    });

    res.json({
      success: true,
      message: 'Cleanup evidence photo submitted directly by worker. Sent for municipal verification.',
      complaint
    });
  } catch (error) {
    next(error);
  }
};
