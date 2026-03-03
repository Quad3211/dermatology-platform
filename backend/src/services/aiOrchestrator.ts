import { supabase } from "./supabase.js";
import { auditLog } from "../middleware/auditLogger.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // 60 * 2s = 2 min timeout

interface PipelineJob {
  analysisId: string;
  uploadId: string;
  storagePath: string;
  userId: string;
}

/**
 * Triggers the Python AI microservice and polls for completion.
 * Updates analysis_results in real-time via direct DB writes.
 * Called fire-and-forget from the analysis route.
 */
export async function triggerAIPipeline(job: PipelineJob): Promise<void> {
  try {
    // Generate a signed URL for the AI service to download the image
    const { data: signedData, error: signErr } = await supabase.storage
      .from("skin-images")
      .createSignedUrl(job.storagePath, 300); // 5 min — enough for pipeline

    if (signErr || !signedData?.signedUrl) {
      await markFailed(
        job.analysisId,
        "Could not generate image access URL for AI pipeline.",
      );
      return;
    }

    // POST to AI service
    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis_id: job.analysisId,
        upload_id: job.uploadId,
        image_url: signedData.signedUrl,
      }),
      signal: AbortSignal.timeout(10_000), // 10s to accept job
    });

    if (!response.ok) {
      const text = await response.text();
      await markFailed(job.analysisId, `AI service rejected job: ${text}`);
      return;
    }

    // Poll for result
    await pollForResult(job);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.analysisId, `AI pipeline error: ${msg}`);
  }
}

async function pollForResult(job: PipelineJob): Promise<void> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const { data: analysis, error } = await supabase
      .from("analysis_results")
      .select("status, risk_level, emergency_flag, referral_required")
      .eq("id", job.analysisId)
      .single();

    if (error || !analysis) continue;

    if (analysis.status === "complete") {
      // Update upload status
      await supabase
        .from("uploads")
        .update({ status: "complete" })
        .eq("id", job.uploadId);

      // Log the completed AI decision
      await auditLog("analysis.complete", {
        userId: job.userId,
        resourceType: "analysis",
        resourceId: job.analysisId,
        metadata: {
          riskLevel: analysis.risk_level,
          referralRequired: analysis.referral_required,
          emergencyFlag: analysis.emergency_flag,
        },
      });

      // Handle emergency
      if (analysis.emergency_flag) {
        await auditLog("analysis.emergency", {
          userId: job.userId,
          resourceType: "analysis",
          resourceId: job.analysisId,
          metadata: { riskLevel: analysis.risk_level },
        });
      }

      return;
    }

    if (analysis.status === "failed") {
      await supabase
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", job.uploadId);
      return;
    }
  }

  // Timed out
  await markFailed(job.analysisId, "Analysis timed out after 2 minutes.");
  await supabase
    .from("uploads")
    .update({ status: "failed" })
    .eq("id", job.uploadId);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
