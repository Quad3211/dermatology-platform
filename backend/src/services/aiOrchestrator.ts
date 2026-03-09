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

    const response = await postToAIService({
      analysis_id: job.analysisId,
      upload_id: job.uploadId,
      image_url: signedData.signedUrl,
    });

    if (!response.ok) {
      const text = await response.text();
      await markFailed(
        job.analysisId,
        `AI service rejected job (${response.status}): ${text}`,
      );
      return;
    }

    // Poll for result
    await pollForResult(job);
  } catch (err) {
    const msg = describeFetchError(err);
    await markFailed(job.analysisId, `AI pipeline error: ${msg}`);
  }
}

type AnalyzeRequestPayload = {
  analysis_id: string;
  upload_id: string;
  image_url: string;
};

async function postToAIService(payload: AnalyzeRequestPayload): Promise<Response> {
  const candidateUrls = buildAIServiceUrls(AI_SERVICE_URL);
  const attemptErrors: string[] = [];

  for (const baseUrl of candidateUrls) {
    try {
      return await fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000), // 10s to accept job
      });
    } catch (err) {
      attemptErrors.push(`${baseUrl}: ${describeFetchError(err)}`);
    }
  }

  throw new Error(attemptErrors.join(" | "));
}

function buildAIServiceUrls(baseUrl: string): string[] {
  const trimmed = baseUrl.replace(/\/+$/, "");
  const urls = [trimmed];

  // On some dev setups localhost prefers IPv6 (::1). Add IPv4 fallback.
  if (/^https?:\/\/localhost(?::|\/|$)/i.test(trimmed)) {
    urls.push(trimmed.replace(/^((?:https?:\/\/))localhost/i, "$1127.0.0.1"));
  }

  return Array.from(new Set(urls));
}

function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) {
    return String(err);
  }

  const details: string[] = [];
  const errorWithCause = err as Error & { cause?: unknown };
  const cause = errorWithCause.cause;

  if (cause instanceof AggregateError) {
    for (const inner of cause.errors) {
      const info = extractNetworkInfo(inner);
      if (info) details.push(info);
    }
  } else {
    const info = extractNetworkInfo(cause);
    if (info) details.push(info);
  }

  return details.length > 0
    ? `${err.message} (${details.join("; ")})`
    : err.message;
}

function extractNetworkInfo(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const v = value as Record<string, unknown>;
  const code = typeof v.code === "string" ? v.code : null;
  const address = typeof v.address === "string" ? v.address : null;
  const port =
    typeof v.port === "number" || typeof v.port === "string"
      ? String(v.port)
      : null;

  const hostPort = address && port ? `${address}:${port}` : address ?? port;
  if (!code && !hostPort) return null;

  return [code, hostPort].filter(Boolean).join(" ");
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
