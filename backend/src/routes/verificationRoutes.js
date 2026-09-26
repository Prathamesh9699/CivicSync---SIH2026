import express from 'express';
import {
  createVerification,
  approveVerification,
  rejectVerification
} from '../controllers/verificationController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createVerification);
router.post('/:id/approve', optionalAuth, approveVerification);
router.post('/:id/reject', optionalAuth, rejectVerification);

export default router;
