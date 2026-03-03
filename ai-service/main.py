"""
DermTriage AI Microservice
FastAPI application — 9-stage skin lesion risk triage pipeline
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, UUID4
import os

from pipeline.image_validator import validate_image
from pipeline.preprocessor import preprocess_image
from pipeline.lesion_detector import detect_lesions
from pipeline.risk_scorer import score_risk
from pipeline.explainability import generate_xai
from pipeline.medical_safety import apply_safety_gate, MANDATORY_DISCLAIMER
from services.supabase_client import get_supabase
from services.storage_client import download_image


# ── Lifespan ───────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    print("[DermTriage AI] Service starting up...")
    yield
    print("[DermTriage AI] Service shutting down...")


app = FastAPI(
    title="DermTriage AI Service",
    description="Risk triage pipeline for dermatology screening. NOT a diagnosis tool.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:3001")],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


# ── Request / Response Models ──────────────────────────────────
class AnalyzeRequest(BaseModel):
    analysis_id: str
    upload_id: str
    image_url: str


class AnalyzeResponse(BaseModel):
    status: str
    analysis_id: str


# ── Endpoints ──────────────────────────────────────────────────
@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "dermtriage-ai", "version": "1.0.0"}


@app.post("/analyze", response_model=AnalyzeResponse, status_code=202)
async def analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks) -> AnalyzeResponse:
    """
    Accepts an analysis job and processes it asynchronously.
    The backend polls analysis_results for status updates.
    """
    supabase = get_supabase()

    # Verify record exists
    result = (
        supabase.table("analysis_results")
        .select("id, status")
        .eq("id", req.analysis_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    if result.data["status"] not in ("queued",):
        raise HTTPException(status_code=409, detail=f"Analysis already {result.data['status']}")

    background_tasks.add_task(run_pipeline, req)
    return AnalyzeResponse(status="queued", analysis_id=req.analysis_id)


# ── Pipeline orchestration ─────────────────────────────────────
async def run_pipeline(req: AnalyzeRequest) -> None:
    """
    Full 9-stage pipeline — runs in background.
    Writes progress + result directly to Supabase.
    """
    supabase = get_supabase()
    analysis_id = req.analysis_id

    def update_progress(stage: str, status: str, progress: int) -> None:
        supabase.table("analysis_results").update({
            "status": "processing",
            "progress": progress,
            "pipeline_stages": supabase.table("analysis_results")
                .select("pipeline_stages")
                .eq("id", analysis_id)
                .single()
                .execute()
                .data.get("pipeline_stages", {}) | {stage: status},
        }).eq("id", analysis_id).execute()

    def mark_failed(error_msg: str) -> None:
        supabase.table("analysis_results").update({
            "status": "failed",
            "error_message": error_msg,
        }).eq("id", analysis_id).execute()

    try:
        # Mark as processing
        supabase.table("analysis_results").update({
            "status": "processing",
            "started_at": "now()",
        }).eq("id", analysis_id).execute()

        # ── Stage 2: Download + Validate ──────────────────────
        image_bytes = download_image(req.image_url)
        validate_image(image_bytes)
        update_progress("validation", "pass", 15)

        # ── Stage 3: Preprocess ───────────────────────────────
        tensor_224, tensor_380, pil_image = preprocess_image(image_bytes)
        update_progress("preprocessing", "pass", 30)

        # ── Stage 4: Lesion Detection (CNN) ───────────────────
        detection = detect_lesions(tensor_380, pil_image)
        update_progress("lesionDetection", "pass", 50)

        # ── Stage 5+6: Risk Scoring (ViT ensemble) ────────────
        risk_result = score_risk(tensor_224, detection)
        update_progress("riskScoring", "pass", 70)

        # ── Stage 8: Explainability ───────────────────────────
        xai_result = generate_xai(tensor_380, pil_image, detection, analysis_id)
        update_progress("explainability", "pass", 85)

        # ── Stage 9: Medical Safety Gate ──────────────────────
        safe_result = apply_safety_gate(
            raw_summary=risk_result.summary,
            risk_level=risk_result.risk_level,
            confidence=risk_result.confidence,
        )
        update_progress("safetyGate", "pass", 95)

        # ── Write final result ────────────────────────────────
        supabase.table("analysis_results").update({
            "status":           "complete",
            "progress":         100,
            "risk_level":       risk_result.risk_level,
            "confidence":       round(risk_result.confidence, 3),
            "severity_score":   round(risk_result.severity_score, 1),
            "summary":          safe_result.summary,
            "disclaimer":       MANDATORY_DISCLAIMER,
            "referral_required": safe_result.referral_required,
            "emergency_flag":   safe_result.emergency_flag,
            "xai_metadata":     xai_result.to_dict(),
            "completed_at":     "now()",
        }).eq("id", analysis_id).execute()

        print(f"[Pipeline] Analysis {analysis_id} complete — risk: {risk_result.risk_level}")

    except Exception as e:
        print(f"[Pipeline] Analysis {analysis_id} FAILED: {e}")
        mark_failed(str(e))
