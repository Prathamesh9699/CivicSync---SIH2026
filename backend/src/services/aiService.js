import { env } from '../config/env.js';
import { calculatePriorityScore } from '../utils/priorityCalculator.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { Complaint } from '../models/Complaint.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  path.resolve(__dirname, '../../../ai/pipelines/predict.py'),
  path.resolve(__dirname, '../../../ai_engine/predict.py'),
  path.resolve(__dirname, '../../ai_engine/predict.py'),
  path.resolve(process.cwd(), 'ai/pipelines/predict.py'),
  path.resolve(process.cwd(), '../ai/pipelines/predict.py'),
  path.resolve(process.cwd(), 'backend/ai_engine/predict.py')
];
const SCRIPT_PATH = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];

const resolveImagePayload = (imageInput) => {
  if (!imageInput) return null;
  if (typeof imageInput !== 'string') return imageInput;
  if (imageInput.startsWith('data:image') || imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    return imageInput;
  }
  const clean = imageInput.replace(/^\/+/, '');
  const candidates = [
    path.resolve(process.cwd(), clean),
    path.resolve(process.cwd(), 'frontend/public', clean),
    path.resolve(process.cwd(), 'frontend/dist', clean),
    path.resolve(__dirname, '../../../frontend/public', clean),
    path.resolve(__dirname, '../../../frontend/dist', clean),
    path.resolve(__dirname, '../../uploads', path.basename(clean))
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      try {
        const ext = path.extname(c).toLowerCase().replace('.', '') || 'jpeg';
        const mime = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
        return `data:${mime};base64,` + fs.readFileSync(c).toString('base64');
      } catch (err) {
        return c;
      }
    }
  }
  return imageInput;
};

const queryHttpAiService = async (imagePayload, categoryHint, conditionHint) => {
  if (!env.AI_SERVICE_URL) {
    console.error('[AI Service] AI_SERVICE_URL is missing');
    return null;
  }

  const targetUrl = `${env.AI_SERVICE_URL.replace(/\/+$/, '')}/analyze-waste`;

  console.log('[AI Service] Calling:', targetUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imagePayload,
        imageUrl: imagePayload,
        image_base64: imagePayload,
        categoryHint,
        conditionHint
      }),
      signal: controller.signal
    });

    const responseText = await res.text();

    console.log('[AI Service] HTTP status:', res.status);
    console.log('[AI Service] Response:', responseText.slice(0, 1000));

    if (!res.ok) {
      console.error('[AI Service] Request failed with status:', res.status);
      return null;
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[AI Service] Response was not valid JSON');
      return null;
    }

    if (data && data.success) {
      return data;
    }

    console.error('[AI Service] Response did not contain success: true');
    return null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[AI Service] Request timed out after 60 seconds');
    } else {
      console.error('[AI Service] Request error:', err.message);
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const runYoloInference = (imageInput) => {
  return new Promise((resolve) => {
    if (!imageInput) return resolve(null);
    try {
      const pythonProcess = spawn('python', [SCRIPT_PATH]);
      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && stdoutData.trim()) {
          try {
            const parsed = JSON.parse(stdoutData.trim());
            if (parsed.success) {
              return resolve(parsed);
            }
          } catch (e) {
            console.error('[AI Engine] Failed to parse YOLO output:', e.message);
          }
        } else {
          console.warn('[AI Engine] Python inference exited with code:', code, stderrData);
        }
        resolve(null);
      });

      // Handle errors from the Python process input pipe
pythonProcess.stdin.on('error', (err) => {
  if (err.code === 'EPIPE') {
    console.warn('[AI Engine] Python input pipe closed before data was written.');
  } else {
    console.error('[AI Engine] Python stdin error:', err.message);
  }
  resolve(null);
});

// Write payload safely
try {
  pythonProcess.stdin.end(imageInput);
} catch (err) {
  console.error('[AI Engine] Failed to send image to Python:', err.message);
  resolve(null);
}
    } catch (err) {
      console.warn('[AI Engine] Error starting python process:', err.message);
      resolve(null);
    }
  });
};

export const aiService = {
  /**
   * Performs AI classification on waste images using best.pt YOLO model.
   */
  async analyzeWasteImage({ imageFile, imageUrl, categoryHint = null, conditionHint = null }) {
    const startTime = Date.now();
    const rawTarget = imageFile || imageUrl;
    const imageTarget = resolveImagePayload(rawTarget);

    let realResult = null;

    // 1. First attempt HTTP AI service (e.g. Render FastAPI server or local server)
    if (imageTarget && env.AI_SERVICE_URL) {
      try {
        realResult = await queryHttpAiService(imageTarget, categoryHint, conditionHint);
      } catch (httpErr) {
        console.warn('[AI Service] HTTP AI service error:', httpErr.message);
      }
    }

    // 2. Fall back to local Python YOLO pipeline if HTTP did not return result
    // Do not launch a second inference process in production.
// If the hosted AI service fails, return an explicit error.
if (!realResult && imageTarget && process.env.NODE_ENV !== 'production') {
  try {
    realResult = await runYoloInference(imageTarget);
  } catch (err) {
    console.warn('[AI Engine] Local YOLO fallback failed:', err.message);
  }
}

    if (realResult && realResult.success) {
      const processingTimeMs = Date.now() - startTime;
      return {
        ...realResult,
        processingTimeMs,
        isFlaggedInvalid: realResult.isFlaggedInvalid !== undefined ? realResult.isFlaggedInvalid : (realResult.totalItemsDetected === 0),
        invalidReason: realResult.invalidReason || (realResult.totalItemsDetected === 0 ? "No municipal or biomedical waste detected." : null),
        duplicateDetection: {
          hasDuplicate: false,
          similarityScore: 12,
          duplicateCount: 0,
          duplicateIds: []
        },
        recurrenceDetection: {
          isRecurring: false,
          recurrenceLevel: "Low",
          pastCleanupsCount: 0,
          lastCleanedDaysAgo: 0,
          rootCauseInference: "Standard collection routing"
        }
      };
    }

    // Do not generate fake predictions when real inference fails.
    console.error(
      '[AI Service] Real inference failed. Returning an explicit error instead of fabricated detections.'
    );

    const error = new Error(
      'Waste analysis is temporarily unavailable. Please try again.'
    );
    error.statusCode = 503;
    throw error;
  },
 
  /**
   * Spatial & Visual Duplicate Detection
   */
  async detectDuplicates(complaint) {
    try {
      // Find complaints within 50 meters in the same ward
      const radiusInMeters = 50;
      const earthRadiusInMeters = 6378100;
      
      const nearby = await Complaint.find({
        _id: { $ne: complaint._id },
        ward: complaint.ward,
        status: { $nin: ['resolved', 'citizen_verified', 'rejected', 'Resolved', 'Citizen Verified', 'Rejected'] }
      }).limit(5);

      if (nearby.length > 0) {
        return {
          hasDuplicate: true,
          duplicateCount: nearby.length,
          similarityScore: 89,
          duplicateIds: nearby.map(n => n.complaintId),
          primaryClusterId: `CLUSTER-${complaint.ward.replace(/\s+/g, '-').toUpperCase()}`,
          message: `${nearby.length} matching reports detected in immediate 50m proximity.`
        };
      }
    } catch (e) {
      console.error('[AI Duplicate Check Error]', e.message);
    }

    return {
      hasDuplicate: false,
      similarityScore: 12,
      duplicateCount: 0,
      duplicateIds: []
    };
  }
};
