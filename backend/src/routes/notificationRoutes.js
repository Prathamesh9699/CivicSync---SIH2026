import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getNotifications);
router.patch('/read-all', optionalAuth, markAllAsRead);
router.patch('/:id/read', optionalAuth, markAsRead);

export default router;
