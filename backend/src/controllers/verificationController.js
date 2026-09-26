import { Verification } from '../models/Verification.js';
import { Complaint } from '../models/Complaint.js';
import { AuditLog } from '../models/AuditLog.js';
import { rewardService } from '../services/rewardService.js';
import { notificationService } from '../services/notificationService.js';
import { smsService } from '../services/smsService.js';
import { SystemSetting } from '../models/SystemSetting.js';


export const createVerification = async (req, res, next) => {
  try {
    const { complaintId, beforeImage, afterImage, visualImprovementScore, comments } = req.body;

    const complaint = await Complaint.findOne({
      $or: [{ complaintId }, { _id: complaintId.match(/^[0-9a-fA-F]{24}$/) ? complaintId : null }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const verification = await Verification.create({
      complaintId: complaint._id,
      verifiedBy: req.user ? req.user._id : null,
      beforeImage: beforeImage || complaint.beforeImageUrl,
      afterImage: afterImage || complaint.afterImageUrl,
      visualImprovementScore: visualImprovementScore || 92,
      status: 'pending',
      comments: comments || ''
    });

    complaint.status = 'Awaiting Verification';
    if (afterImage) complaint.afterImageUrl = afterImage;
    await complaint.save();

    // Notify Citizen
    if (complaint.citizenId) {
      await notificationService.sendVerificationRequest(complaint.citizenId, complaint);
    }

    res.status(201).json({
      success: true,
      verification
    });
  } catch (error) {
    next(error);
  }
};

export const approveVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const complaint = await Complaint.findOne({
      $or: [{ complaintId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const settings = await SystemSetting.findOne({ key: 'default_config' }) || { verificationRewardPoints: 50 };
    const pointsToAward = settings.verificationRewardPoints || 50;

    complaint.status = 'Resolved';
    complaint.isVerifiedByCitizen = true;
    complaint.isVerifiedByMunicipal = true;
    complaint.citizenVerification = {
      isClean: true,
      notes: notes || 'Verified clean and validated by authority.',
      verifiedAt: new Date()
    };
    complaint.verifiedAt = new Date();
    complaint.resolvedAt = new Date();

    // Update timeline step
    if (complaint.timeline) {
      complaint.timeline = complaint.timeline.map(t => {
        if (t.step === 'Citizen Verification' || t.step === 'Resolved') {
          return { ...t.toObject(), status: 'completed', time: 'Just now' };
        }
        return t;
      });
    }

    await complaint.save();

    // Award Green Points (Idempotent: will not award duplicate if already credited)
    if (complaint.citizenId) {
      await rewardService.awardPoints({
        userId: complaint.citizenId,
        complaintId: complaint.complaintId,
        type: 'cleanup_verified',
        points: pointsToAward,
        description: `Cleanup confirmed for complaint #${complaint.complaintId}`
      });

      // Send Congratulations Notification
      await notificationService.sendResolutionCongratulations(complaint.citizenId, complaint, pointsToAward);
    } else if (complaint.citizenPhone) {
      await smsService.sendComplaintResolvedSms({
        phone: complaint.citizenPhone,
        complaintId: complaint.complaintId,
        ward: complaint.ward || 'Civic Area',
        category: complaint.aiCategory || complaint.waste?.category || 'Waste',
        citizenName: complaint.citizenName || 'Citizen',
        pointsEarned: pointsToAward,
        officerName: complaint.assignedTeamName || complaint.assignedOfficer || 'Municipal Sanitation Squad'
      });
    }

    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : complaint.citizenName,
      action: 'VERIFICATION_APPROVED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      detail: `Citizen confirmed cleanup of #${complaint.complaintId}. Awarded +${pointsToAward} Green Points.`
    });

    res.json({
      success: true,
      message: `Cleanup verified successfully. +${pointsToAward} Green Points awarded!`,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

export const rejectVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const complaint = await Complaint.findOne({
      $or: [{ complaintId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = 'In Progress';
    complaint.isVerifiedByCitizen = false;
    complaint.citizenVerification = {
      isClean: false,
      notes: reason || 'Citizen reported remaining debris at location.',
      verifiedAt: new Date()
    };

    await complaint.save();

    // Notify Municipal Staff of Re-Clean request
    await notificationService.createNotification({
      targetRole: 'municipal_staff',
      complaintId: complaint.complaintId,
      type: 'alert',
      title: `Re-Cleanup Needed: #${complaint.complaintId}`,
      message: `Citizen reported incomplete clearance at ${complaint.ward}: "${reason || 'Remaining debris'}"`,
      priority: 'high',
      link: `/municipal/complaints`
    });

    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : complaint.citizenName,
      action: 'VERIFICATION_REJECTED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      detail: `Citizen requested re-cleanup for #${complaint.complaintId}. Reason: ${reason || 'Incomplete cleanup'}`
    });

    res.json({
      success: true,
      message: 'Re-cleanup requested. Sanitation squad notified.',
      complaint
    });
  } catch (error) {
    next(error);
  }
};
