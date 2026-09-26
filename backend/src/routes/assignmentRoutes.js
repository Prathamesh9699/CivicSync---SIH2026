import express from 'express';
import { createAssignment, getAssignments } from '../controllers/assignmentController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createAssignment);
router.get('/', optionalAuth, getAssignments);

export default router;
