import { supabase } from "./supabase.js";
import { auditLog } from "../middleware/auditLogger.js";
import { analyzeSkinWithGemini } from "./geminiService.js";

interface PipelineJob {
  analysisId: string;
  uploadId: string;
  storagePath: string;
  userId: string;
}

/**
 * Triggers the local Gemini AI microservice.
 * Updates analysis_results in real-time via direct DB writes.
 * Called fire-and-forget from the analysis route.
 */
export async function triggerAIPipeline(job: PipelineJob): Promise<void> {
  try {
    // 1. Mark as processing
    await supabase
      .from("analysis_results")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", job.analysisId);

    // 2. Download the image from Supabase Storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("skin-images")
      .download(job.storagePath);

    if (downloadErr || !fileData) {
      await markFailed(
        job.analysisId,
        "Could not download image for AI pipeline.",
      );
      return;
    }

    // 3. Convert image Blob to Base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // Guess mime type from path extension (default jpeg)
    const ext = job.storagePath.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

    // 4. Call our local Gemini service directly
    const aiResult = await analyzeSkinWithGemini(base64Image, mimeType);

    // Determine referral and emergency flags based on Gemini's output
    const referralRequired = ["MODERATE", "HIGH", "CRITICAL"].includes(
      aiResult.risk_level,
    );
    const emergencyFlag = aiResult.risk_level === "CRITICAL";
    const finalSummary =
      aiResult.summary +
      (referralRequired
        ? "\n\nSuggested next step: Consult a dermatologist."
        : "");

    // 5. Update analysis_results to complete
    await supabase
      .from("analysis_results")
      .update({
        status: "complete",
        progress: 100,
        risk_level: aiResult.risk_level,
        confidence: Math.round(aiResult.confidence * 1000) / 1000,
        severity_score: Math.round(aiResult.severity_score * 10) / 10,
        summary: finalSummary,
        referral_required: referralRequired,
        emergency_flag: emergencyFlag,
        xai_metadata: aiResult.bounding_box
          ? { bounding_box: aiResult.bounding_box }
          : {},
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.analysisId);

    // 6. Update upload status
    await supabase
      .from("uploads")
      .update({ status: "complete" })
      .eq("id", job.uploadId);

    // 7. Log the completed AI decision
    await auditLog("analysis.complete", {
      userId: job.userId,
      resourceType: "analysis",
      resourceId: job.analysisId,
      metadata: {
        riskLevel: aiResult.risk_level,
        referralRequired,
        emergencyFlag,
      },
    });

    if (emergencyFlag) {
      await auditLog("analysis.emergency", {
        userId: job.userId,
        resourceType: "analysis",
        resourceId: job.analysisId,
        metadata: { riskLevel: aiResult.risk_level },
      });
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Pipeline] Analysis FAILED:", err);
    await markFailed(job.analysisId, `AI pipeline error: ${errorMsg}`);

    // Fail the upload as well
    await supabase
      .from("uploads")
      .update({ status: "failed" })
      .eq("id", job.uploadId);
  }
}

async function markFailed(
  analysisId: string,
  errorMessage: string,
): Promise<void> {
  await supabase
    .from("analysis_results")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", analysisId);
}
