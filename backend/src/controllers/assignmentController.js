import { Assignment } from '../models/Assignment.js';
import { Complaint } from '../models/Complaint.js';
import { AuditLog } from '../models/AuditLog.js';

export const createAssignment = async (req, res, next) => {
  try {
    const { complaintId, teamId, teamName, instructions, priorityOverride } = req.body;

    const complaint = await Complaint.findOne({
      $or: [{ complaintId }, { _id: complaintId.match(/^[0-9a-fA-F]{24}$/) ? complaintId : null }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const assignment = await Assignment.create({
      complaintId: complaint._id,
      assignedBy: req.user ? req.user._id : null,
      teamId: teamId || 'team_alpha',
      teamName: teamName || 'Team Alpha',
      instructions: instructions || '',
      priorityOverride: priorityOverride || complaint.severity
    });

    complaint.status = 'Assigned';
    complaint.assignedTeamId = teamId || 'team_alpha';
    complaint.assignedTeamName = teamName || 'Team Alpha';
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
      detail: `Assigned squad ${teamName} to #${complaint.complaintId}`
    });

    res.status(201).json({
      success: true,
      assignment,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find().populate('complaintId').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    next(error);
  }
};
