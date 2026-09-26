import { aiService } from '../services/aiService.js';
import { calculatePriorityScore } from '../utils/priorityCalculator.js';

export const analyzeImage = async (req, res, next) => {
  try {
    let imageUrl = req.body.imageUrl || req.body.image || req.body.imageFile || req.body.image_url || req.body.image_base64;
    
    // If a file was uploaded via multer
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const { categoryHint, conditionHint } = req.body;

    const result = await aiService.analyzeWasteImage({
      imageUrl,
      categoryHint,
      conditionHint
    });

    res.json({
      success: true,
      data: result,
      analysis: result
    });
  } catch (error) {
    next(error);
  }
};

export const checkDuplicates = async (req, res, next) => {
  try {
    const duplicateData = await aiService.detectDuplicates(req.body);
    res.json({
      success: true,
      duplicateDetection: duplicateData
    });
  } catch (error) {
    next(error);
  }
};

export const calculateSeverity = async (req, res, next) => {
  try {
    const { category, condition, isSensitiveArea, isRecurring, customScore } = req.body;
    const result = calculatePriorityScore({
      category,
      condition,
      isSensitiveArea,
      isRecurring,
      customScore
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
};
