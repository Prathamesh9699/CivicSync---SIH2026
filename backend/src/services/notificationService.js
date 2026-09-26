import { Notification } from '../models/Notification.js';
import { smsService } from './smsService.js';

let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

export const notificationService = {
  /**
   * Dispatch an in-app and real-time notification
   */
  async createNotification({
    userId = null,
    targetRole = 'all',
    complaintId = null,
    type = 'info',
    title,
    message,
    priority = 'medium',
    link = ''
  }) {
    try {
      const notif = await Notification.create({
        userId,
        targetRole,
        complaintId,
        type,
        title,
        message,
        priority,
        link,
        isRead: false
      });

      // Emit real-time Socket.io event if connected
      if (ioInstance) {
        ioInstance.emit('notification:new', notif);
        if (targetRole !== 'all') {
          ioInstance.to(targetRole).emit('notification:role', notif);
        }
        if (userId) {
          ioInstance.to(userId.toString()).emit('notification:user', notif);
        }
      }

      return notif;
    } catch (error) {
      console.error('[NotificationService Error]', error.message);
      return null;
    }
  },

  /**
   * Dispatches SLA Warning alert
   */
  async sendSlaWarning(complaint, hoursRemaining) {
    return await this.createNotification({
      targetRole: 'municipal_staff',
      complaintId: complaint.complaintId,
      type: 'sla_warning',
      title: `⚠️ SLA Warning: Complaint #${complaint.complaintId}`,
      message: `Complaint at ${complaint.ward} is approaching its deadline (${hoursRemaining}h remaining).`,
      priority: 'high',
      link: `/municipal/complaints`
    });
  },

  /**
   * Dispatches SLA Escalation alert
   */
  async sendSlaEscalation(complaint) {
    // Notify Municipal Staff
    await this.createNotification({
      targetRole: 'municipal_staff',
      complaintId: complaint.complaintId,
      type: 'sla_escalated',
      title: `🚨 Urgent: Complaint #${complaint.complaintId} Escalated to CRITICAL`,
      message: `Resolution deadline exceeded for ${complaint.ward}. Escalated to CRITICAL priority.`,
      priority: 'critical',
      link: `/municipal/complaints`
    });

    // Notify Administrator
    await this.createNotification({
      targetRole: 'administrator',
      complaintId: complaint.complaintId,
      type: 'sla_escalated',
      title: `⚠️ SLA Breach: #${complaint.complaintId} Overdue`,
      message: `Complaint #${complaint.complaintId} (${complaint.aiCategory}) has breached SLA resolution deadline. Review required.`,
      priority: 'critical',
      link: `/admin/dashboard`
    });
  },

  /**
   * Dispatches Citizen Cleanup Verification Request
   */
  async sendVerificationRequest(citizenId, complaint) {
    return await this.createNotification({
      userId: citizenId,
      targetRole: 'citizen',
      complaintId: complaint.complaintId,
      type: 'citizen_verification_required',
      title: `✨ Cleanup Ready for Verification!`,
      message: `Municipal team has completed cleanup for #${complaint.complaintId}. Confirm to receive +50 Green Points!`,
      priority: 'high',
      link: `/citizen/complaints/${complaint.complaintId}`
    });
  },

  /**
   * Dispatches Citizen Congratulations & Green Points notification + Phone SMS
   */
  async sendResolutionCongratulations(citizenId, complaint, pointsEarned = 50) {
    const notif = await this.createNotification({
      userId: citizenId,
      targetRole: 'citizen',
      complaintId: complaint.complaintId,
      type: 'complaint_resolved',
      title: `🎉 Great News! Cleanup Verified (+${pointsEarned} Green Points)`,
      message: `Your report #${complaint.complaintId} at ${complaint.ward} is verified clean. Thank you for making our city cleaner! 🌱`,
      priority: 'medium',
      link: `/citizen/complaints/${complaint.complaintId}`
    });

    // Dispatch SMS to Citizen's Phone Number
    if (complaint.citizenPhone) {
      await smsService.sendComplaintResolvedSms({
        phone: complaint.citizenPhone,
        complaintId: complaint.complaintId,
        ward: complaint.ward || 'Civic Area',
        category: complaint.aiCategory || complaint.waste?.category || 'Waste',
        citizenName: complaint.citizenName || 'Citizen',
        pointsEarned: pointsEarned,
        officerName: complaint.assignedTeamName || complaint.assignedOfficer || 'Municipal Sanitation Squad'
      });
    }

    return notif;
  }
};
