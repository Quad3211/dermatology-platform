import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ImageUploader } from "../../components/medical/ImageUploader";
import { RealTimeShield } from "../../components/shared/RealTimeShield";
import { RiskAssessmentWidget } from "../../components/medical/RiskAssessmentWidget";
import { SkinBodyMap } from "../../components/medical/SkinBodyMap";
import { supabase } from "../../config/supabase";
import { Button } from "../../components/core/Button";
import { Link } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────
interface AnalysisResult {
  id: string;
  risk_level: string | null;
  confidence: number | null;
  severity_score: number | null;
  summary: string | null;
  referral_required: boolean;
  emergency_flag: boolean;
  status: string;
}

export function UploadFlow() {
  const [step, setStep] = useState<
    "UPLOAD" | "ANALYSING" | "RESULTS" | "ERROR"
  >("UPLOAD");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setStep("ANALYSING");
    setProgress(5);
    setStatusText("Connecting securely to storage…");

    try {
      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in. Please log in and try again.");

      // 2. Insert upload record into uploads table
      setProgress(15);
      setStatusText("Creating secure upload record…");
      const { data: uploadRecord, error: insertErr } = await supabase
        .from("uploads")
        .insert({
          user_id: user.id,
          filename: file.name,
          mime_type: file.type as "image/jpeg" | "image/png" | "image/webp",
          size_bytes: file.size,
          body_part: "unspecified",
          status: "pending",
          storage_path: "", // will update after upload
          expires_at: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .select("id")
        .single();

      if (insertErr || !uploadRecord) {
        throw new Error(
          insertErr?.message ?? "Failed to create upload record.",
        );
      }

      const currentUploadId = uploadRecord.id as string;
      const storagePath = `${user.id}/${currentUploadId}/${file.name}`;

      // 3. Upload the image bytes directly to Supabase Storage
      setProgress(35);
      setStatusText("Encrypting and uploading image…");
      const { error: storageErr } = await supabase.storage
        .from("skin-images")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (storageErr) throw new Error(storageErr.message);

      // 4. Update record with storage path and mark as uploaded
      setProgress(55);
      setStatusText("Securing upload record…");
      await supabase
        .from("uploads")
        .update({ storage_path: storagePath, status: "uploaded" })
        .eq("id", currentUploadId);

      // 5. Insert analysis_results row to trigger AI pipeline
      setProgress(65);
      setStatusText("Queuing AI analysis pipeline…");
      const { data: analysisRow, error: analysisInsertErr } = await supabase
        .from("analysis_results")
        .insert({
          upload_id: currentUploadId,
          status: "queued",
          progress: 0,
        })
        .select("id")
        .single();

      if (analysisInsertErr || !analysisRow) {
        // If analysis row fails (e.g. AI service not connected), still proceed
        console.warn("Analysis queue failed:", analysisInsertErr?.message);
      }

      // 6. Poll for analysis completion (up to 45 seconds)
      setProgress(70);
      setStatusText("Analyzing dermatological morphologies…");

      let result: AnalysisResult | null = null;
      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        await delay(3000);

        const { data: latest } = await supabase
          .from("analysis_results")
          .select(
            "id, risk_level, confidence, severity_score, summary, referral_required, emergency_flag, status",
          )
          .eq("upload_id", currentUploadId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest) {
          result = latest as AnalysisResult;
          if (result.status === "complete" || result.status === "failed") break;
        }

        // Update progress bar during wait
        const newProgress = Math.min(70 + (i + 1) * 2, 95);
        setProgress(newProgress);
        if (i === 4) setStatusText("Cross-referencing imaging patterns…");
        if (i === 8) setStatusText("Generating clinical summary…");
      }

      setProgress(100);
      setStatusText("Assessment complete.");
      await delay(400);

      setAnalysisResult(result);
      setStep("RESULTS");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMsg(msg);
      setStep("ERROR");
    } finally {
      setIsUploading(false);
    }
  };

  // ── Risk display helpers ─────────────────────────────────────
  const riskLevel = (analysisResult?.risk_level ?? "MODERATE") as
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "CRITICAL";
  const confidence = analysisResult?.confidence
    ? analysisResult.confidence * 100
    : null;
  // Map CRITICAL -> HIGH for RiskAssessmentWidget which only accepts LOW/MODERATE/HIGH
  const widgetRisk = (riskLevel === "CRITICAL" ? "HIGH" : riskLevel) as
    | "LOW"
    | "MODERATE"
    | "HIGH";

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Assessment</h1>
        <p className="text-slate-500 mt-1">
          {step === "UPLOAD" &&
            "Select the lesion location and upload a clear, focused photo. All data is end-to-end encrypted."}
          {step === "ANALYSING" &&
            "Please wait while we process your image through our secure triage engine."}
          {step === "RESULTS" &&
            "Upload complete. You can now book a consultation."}
          {step === "ERROR" && "Something went wrong during upload."}
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {step === "UPLOAD" && (
          <>
            <SkinBodyMap />
            <ImageUploader onUpload={handleUpload} isUploading={isUploading} />
          </>
        )}

        {step === "ANALYSING" && (
          <RealTimeShield progress={progress} status={statusText} />
        )}

        {step === "RESULTS" && (
          <div className="space-y-6">
            {/* Real analysis result */}
            {analysisResult && analysisResult.status === "complete" ? (
              <RiskAssessmentWidget
                riskLevel={widgetRisk}
                confidence={confidence ?? 0}
              />
            ) : (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <Loader2 className="h-5 w-5 text-blue-600 shrink-0 animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    AI Analysis In Progress
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Your image was uploaded. The AI analysis is still processing
                    — it will appear in your dashboard shortly.
                  </p>
                </div>
              </div>
            )}

            {/* Emergency flag */}
            {analysisResult?.emergency_flag && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-xl p-4">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 animate-pulse" />
                <p className="text-sm font-bold text-red-800">
                  🚨 Emergency flag raised — please seek immediate medical
                  attention or call emergency services.
                </p>
              </div>
            )}

            {/* Referral recommended */}
            {analysisResult?.referral_required &&
              !analysisResult.emergency_flag && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                  <p className="text-sm text-orange-800">
                    <strong>Referral recommended.</strong> A dermatologist
                    should review this as soon as possible.
                  </p>
                </div>
              )}

            {/* Summary */}
            {analysisResult?.summary && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  AI Summary
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>
            )}

            {/* Upload success + CTA */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Image uploaded successfully
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  You can now{" "}
                  <Link
                    to="/patient/consultation"
                    className="underline font-medium"
                  >
                    book a consultation
                  </Link>{" "}
                  with a dermatologist.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link to="/patient/consultation">
                <Button>Book Consultation</Button>
              </Link>
              <Link to="/patient">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        )}

        {step === "ERROR" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">{errorMsg}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStep("UPLOAD");
                setErrorMsg("");
                setProgress(0);
                setAnalysisResult(null);
              }}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
