"""
DermTriage AI Microservice
FastAPI application — simplified skin lesion risk triage pipeline with Gemini
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, UUID4
import os

from pipeline.image_validator import validate_image
from pipeline.gemini_analyzer import analyze_skin_with_gemini
from pipeline.medical_safety import (
    apply_safety_gate,
    get_risk_guidance,
    MANDATORY_DISCLAIMER,
)
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


class AnalyzeSyncRequest(BaseModel):
    image_url: str

class AnalyzeSyncResponse(BaseModel):
    risk_level: str
    confidence: float
    severity_score: float
    summary: str
    referral_required: bool
    emergency_flag: bool

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


@app.post("/analyze-sync", response_model=AnalyzeSyncResponse)
async def analyze_sync(req: AnalyzeSyncRequest) -> AnalyzeSyncResponse:
    """
    Synchronous analysis for public scanning without DB persistence.
    """
    try:
        image_bytes = download_image(req.image_url)
        validate_image(image_bytes)
        
        tensor_224, tensor_380, pil_image = preprocess_image(image_bytes)
        detection = detect_lesions(tensor_380, pil_image)
        risk_result = score_risk(tensor_224, detection)
        
        safe_result = apply_safety_gate(
            raw_summary=risk_result.summary,
            risk_level=risk_result.risk_level,
            confidence=risk_result.confidence,
        )
        
        return AnalyzeSyncResponse(
            risk_level=risk_result.risk_level,
            confidence=round(risk_result.confidence, 3),
            severity_score=round(risk_result.severity_score, 1),
            summary=safe_result.summary,
            referral_required=safe_result.referral_required,
            emergency_flag=safe_result.emergency_flag,
        )
    except Exception as e:
        print(f"[Pipeline Sync] FAILED: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Pipeline orchestration ─────────────────────────────────────
async def run_pipeline(req: AnalyzeRequest) -> None:
    """
    Full pipeline with Gemini Analysis — runs in background.
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

        # ── Stage 3: Gemini Analysis ──────────────────────────
        gemini_result = analyze_skin_with_gemini(image_bytes)
        update_progress("geminiAnalysis", "pass", 70)

        # ── Stage 9: Medical Safety Gate ──────────────────────
        safe_result = apply_safety_gate(
            raw_summary=gemini_result.get("summary", ""),
            risk_level=gemini_result.get("risk_level", "LOW"),
            confidence=gemini_result.get("confidence", 0.0),
        )
        guidance = get_risk_guidance(gemini_result.get("risk_level", "LOW"))
        guidance_msg = str(guidance.get("message", "")).strip()
        final_summary = (
            f"{safe_result.summary}\n\nSuggested next step: {guidance_msg}"
            if guidance_msg
            else safe_result.summary
        )
        update_progress("safetyGate", "pass", 95)

        # ── Write final result ────────────────────────────────
        supabase.table("analysis_results").update({
            "status":           "complete",
            "progress":         100,
            "risk_level":       gemini_result.get("risk_level", "LOW"),
            "confidence":       round(gemini_result.get("confidence", 0.0), 3),
            "severity_score":   round(gemini_result.get("severity_score", 0.0), 1),
            "summary":          final_summary,
            "disclaimer":       MANDATORY_DISCLAIMER,
            "referral_required": safe_result.referral_required,
            "emergency_flag":   safe_result.emergency_flag,
            "xai_metadata":     {},
            "completed_at":     "now()",
        }).eq("id", analysis_id).execute()

        print(f"[Pipeline] Analysis {analysis_id} complete — risk: {gemini_result.get('risk_level', 'LOW')}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Pipeline] Analysis {analysis_id} FAILED: {e}")
        mark_failed(str(e))
