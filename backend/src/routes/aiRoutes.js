import express from 'express';
import { analyzeImage, checkDuplicates, calculateSeverity } from '../controllers/aiController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/analyze', upload.single('image'), analyzeImage);
router.post('/duplicate', checkDuplicates);
router.post('/severity', calculateSeverity);

export default router;
