import express from 'express';
import { getHotspots, getHotspotById } from '../controllers/hotspotController.js';

const router = express.Router();

router.get('/', getHotspots);
router.get('/:id', getHotspotById);

export default router;
