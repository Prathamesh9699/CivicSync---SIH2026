import express from 'express';
import { getLeaderboard, getUserRewards } from '../controllers/rewardController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/user/:userId', optionalAuth, getUserRewards);
router.get('/summary', optionalAuth, getLeaderboard);

export default router;
