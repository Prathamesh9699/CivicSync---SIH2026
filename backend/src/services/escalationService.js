import { Complaint } from '../models/Complaint.js';
import { AuditLog } from '../models/AuditLog.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { notificationService } from './notificationService.js';
import { isOverdue, getHoursRemaining } from '../utils/dateUtils.js';

export const escalationService = {
  /**
   * Evaluates all active complaints against SLA deadlines
   */
  async checkAndEscalateComplaints() {
    try {
      const settings = await SystemSetting.findOne({ key: 'default_config' }) || {
        slaWarningHours: 6,
        reminderIntervalHours: 6
      };

      const now = new Date();

      // Find all unresolved complaints
      const activeComplaints = await Complaint.find({
        status: {
          $nin: [
            'resolved',
            'citizen_verified',
            'rejected',
            'Resolved',
            'Citizen Verified',
            'Rejected'
          ]
        }
      });

      let escalatedCount = 0;
      let warningCount = 0;

      for (const complaint of activeComplaints) {
        if (!complaint.sla || !complaint.sla.dueAt) continue;

        const dueAt = new Date(complaint.sla.dueAt);

        // 1. Check for Overdue Breach
        if (now > dueAt) {
          const previousLevel = complaint.priority?.level || complaint.severity || 'MEDIUM';

          // If not already escalated or if reminder interval elapsed
          const lastReminder = complaint.sla.lastReminderAt ? new Date(complaint.sla.lastReminderAt) : null;
          const hoursSinceLastReminder = lastReminder ? (now - lastReminder) / (1000 * 60 * 60) : 999;

          if (previousLevel !== 'CRITICAL' || hoursSinceLastReminder >= settings.reminderIntervalHours) {
            // Escalate priority
            complaint.priority = {
              level: 'CRITICAL',
              score: 95,
              reason: `SLA Deadline Exceeded (Breached on ${dueAt.toLocaleTimeString()})`
            };
            complaint.severity = 'Critical';
            complaint.aiPriorityScore = 95;

            complaint.sla.escalationLevel = (complaint.sla.escalationLevel || 0) + 1;
            complaint.sla.lastReminderAt = now;
            complaint.sla.reminderCount = (complaint.sla.reminderCount || 0) + 1;
            complaint.sla.isOverdue = true;
            if (!complaint.sla.escalatedAt) {
              complaint.sla.escalatedAt = now;
            }

            // Append to Priority History
            complaint.priorityHistory.push({
              previousLevel,
              newLevel: 'CRITICAL',
              reason: 'Automatic SLA deadline breach escalation',
              changedAt: now
            });

            await complaint.save();

            // Create Audit Log
            await AuditLog.create({
              action: 'PRIORITY_ESCALATED',
              entityType: 'Complaint',
              entityId: complaint.complaintId,
              oldValue: { priority: previousLevel },
              newValue: { priority: 'CRITICAL', escalationLevel: complaint.sla.escalationLevel },
              detail: `Complaint #${complaint.complaintId} automatically escalated to CRITICAL priority due to SLA breach.`
            });

            // Dispatch Notifications
            await notificationService.sendSlaEscalation(complaint);
            escalatedCount++;
          }
        }
        // 2. Check for SLA Warning (Approaching deadline)
        else {
          const hoursRemaining = (dueAt - now) / (1000 * 60 * 60);
          if (hoursRemaining <= settings.slaWarningHours && !complaint.sla.warningSent) {
            complaint.sla.warningSent = true;
            await complaint.save();

            await notificationService.sendSlaWarning(complaint, hoursRemaining.toFixed(1));
            warningCount++;
          }
        }
      }

      return { success: true, escalatedCount, warningCount, evaluatedTotal: activeComplaints.length };
    } catch (error) {
      console.error('[EscalationService Error]', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Manual or Development-Test Escalation Trigger
   */
  async simulateEscalation(complaintId) {
    const complaint = await Complaint.findOne({
      $or: [{ complaintId }, { _id: complaintId.match(/^[0-9a-fA-F]{24}$/) ? complaintId : null }]
    });

    if (!complaint) {
      throw new Error(`Complaint with ID ${complaintId} not found`);
    }

    const previousLevel = complaint.priority?.level || complaint.severity || 'MEDIUM';
    const now = new Date();

    complaint.priority = {
      level: 'CRITICAL',
      score: 98,
      reason: 'Manual / Dev SLA Test Escalation'
    };
    complaint.severity = 'Critical';
    complaint.aiPriorityScore = 98;

    complaint.sla.escalationLevel = (complaint.sla.escalationLevel || 0) + 1;
    complaint.sla.lastReminderAt = now;
    complaint.sla.reminderCount = (complaint.sla.reminderCount || 0) + 1;
    complaint.sla.isOverdue = true;
    complaint.sla.escalatedAt = now;

    complaint.priorityHistory.push({
      previousLevel,
      newLevel: 'CRITICAL',
      reason: 'Development test simulation SLA trigger',
      changedAt: now
    });

    await complaint.save();

    await AuditLog.create({
      action: 'TEST_ESCALATION_TRIGGERED',
      entityType: 'Complaint',
      entityId: complaint.complaintId,
      oldValue: { priority: previousLevel },
      newValue: { priority: 'CRITICAL' },
      detail: `Development simulation: Complaint #${complaint.complaintId} escalated.`
    });

    await notificationService.sendSlaEscalation(complaint);

    return complaint;
  }
};
