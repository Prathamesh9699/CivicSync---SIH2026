import { AuditLog } from '../models/AuditLog.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { escalationService } from '../services/escalationService.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      count: logs.length,
      auditLogs: logs
    });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'default_config' });
    if (!settings) {
      settings = await SystemSetting.create({ key: 'default_config' });
    }
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'default_config' },
      req.body,
      { new: true, upsert: true }
    );

    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Administrator',
      action: 'SETTINGS_UPDATED',
      entityType: 'SystemSetting',
      entityId: settings._id.toString(),
      detail: `System SLA & reward configuration updated by Administrator.`
    });

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

export const testEscalate = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const complaint = await escalationService.simulateEscalation(complaintId);

    res.json({
      success: true,
      message: `Development test: Complaint #${complaint.complaintId} escalated to CRITICAL priority.`,
      complaint
    });
  } catch (error) {
    next(error);
  }
};
