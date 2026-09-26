"""
CleanTrack AI - Production FastAPI Vision Server
Serves the two-stage hierarchical pipeline via REST API:
  - POST /api/ai/analyze-waste: Full two-stage hierarchical analysis
  - POST /api/ai/gatekeeper-check: Stage 1 rapid scene gatekeeper check (<50ms)
  - GET /api/ai/taxonomy: 11-class CleanTrack taxonomy specification
  - GET /api/ai/health: System health and model availability
"""

import os
import sys
import io
import time
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

from backend.ai_engine.pipeline import CleanTrackPipeline
from backend.ai_engine.stage2_detector import CLEANTRACK_TAXONOMY

app = FastAPI(
    title="CleanTrack AI Waste Analysis Engine",
    version="2.0.0",
    description="Production-grade Two-Stage Hierarchical Computer Vision & Municipal Waste Triage Engine"
)

# Enable CORS for frontend and municipal portal
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipeline instance (cached in memory)
pipeline = CleanTrackPipeline()


class AnalyzeJsonRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    image_path: Optional[str] = None


@app.get("/api/ai/health")
def health_check():
    s2 = pipeline.stage2_detector
    rf = s2.roboflow_detector
    return {
        "status": "online",
        "pipelineVersion": "2.0-hierarchical",
        "models": {
            "biomedicalModelLoaded": s2.biomedical_model is not None,
            "medicalClassifierLoaded": s2.medical_classifier is not None and s2.medical_classifier.is_loaded,
            "roboflowConfigured": rf is not None and rf.last_status.get("configured", False),
            "roboflowModelId": rf.model_id if rf else None,
            "roboflowStatus": rf.status() if rf else None,
            "plasticModelLoaded": s2.plastic_model is not None,
            "ewasteModelLoaded": s2.ewaste_model is not None,
            "generalModelLoaded": s2.general_model is not None,
            "stage1MobileNetLoaded": pipeline.stage1_gatekeeper.mobilenet_model is not None
        },
        "device": str(pipeline.stage1_gatekeeper.device),
        "taxonomyClassesCount": len(CLEANTRACK_TAXONOMY)
    }


@app.get("/api/ai/taxonomy")
def get_taxonomy():
    return {
        "classes": CLEANTRACK_TAXONOMY,
        "standard": "CPCB / Solid Waste Management Rules 2016 & Biomedical Waste Rules 2016"
    }


@app.post("/api/ai/gatekeeper-check")
async def gatekeeper_check(
    file: Optional[UploadFile] = File(None),
    image_path: Optional[str] = Form(None)
):
    try:
        if file:
            contents = await file.read()
            img = Image.open(io.BytesIO(contents)).convert('RGB')
        elif image_path:
            img = Image.open(image_path).convert('RGB')
        else:
            raise HTTPException(status_code=400, detail="No image file or path provided")

        result = pipeline.stage1_gatekeeper.evaluate(img)
        return {"success": True, "gatekeeper": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/analyze-waste")
async def analyze_waste(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    image_base64: Optional[str] = Form(None),
    image_path: Optional[str] = Form(None)
):
    try:
        input_data = None
        if file:
            contents = await file.read()
            input_data = Image.open(io.BytesIO(contents)).convert('RGB')
        elif image_url:
            input_data = image_url
        elif image_base64:
            input_data = image_base64
        elif image_path:
            input_data = image_path
        else:
            raise HTTPException(status_code=400, detail="No image input provided")

        result = pipeline.process_image(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
