import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard', getDashboardAnalytics);
router.get('/complaints', getDashboardAnalytics);
router.get('/waste-categories', getDashboardAnalytics);
router.get('/severity', getDashboardAnalytics);
router.get('/resolution', getDashboardAnalytics);
router.get('/hotspots', getDashboardAnalytics);

export default router;
