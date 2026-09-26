import express from 'express';
import {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignSquad,
  submitWorkerEvidence
} from '../controllers/complaintController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createComplaint);
router.get('/', optionalAuth, getAllComplaints);
router.get('/:id', optionalAuth, getComplaintById);
router.patch('/:id', optionalAuth, updateComplaintStatus);
router.post('/:id/assign', optionalAuth, assignSquad);
router.post('/:id/worker-evidence', optionalAuth, submitWorkerEvidence);

export default router;
