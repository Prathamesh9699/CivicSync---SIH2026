import express from 'express';
import { getAuditLogs, getSettings, updateSettings, testEscalate } from '../controllers/adminController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/audit-logs', optionalAuth, getAuditLogs);
router.get('/settings', optionalAuth, getSettings);
router.patch('/settings', optionalAuth, updateSettings);

// Development SLA test trigger endpoint
router.post('/test/escalate/:complaintId', testEscalate);

export default router;
