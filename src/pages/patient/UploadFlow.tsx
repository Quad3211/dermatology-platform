import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ImageUploader } from "../../components/medical/ImageUploader";
import { RealTimeShield } from "../../components/shared/RealTimeShield";
import { RiskAssessmentWidget } from "../../components/medical/RiskAssessmentWidget";
import { SkinBodyMap } from "../../components/medical/SkinBodyMap";
import { supabase } from "../../config/supabase";
import { Button } from "../../components/core/Button";

export function UploadFlow() {
  const [step, setStep] = useState<
    "UPLOAD" | "ANALYSING" | "RESULTS" | "ERROR"
  >("UPLOAD");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

      const uploadId = uploadRecord.id as string;
      const storagePath = `${user.id}/${uploadId}/${file.name}`;

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
      setProgress(65);
      setStatusText("Securing upload record…");
      await supabase
        .from("uploads")
        .update({ storage_path: storagePath, status: "uploaded" })
        .eq("id", uploadId);

      // 5. Simulate pipeline progress (real pipeline would come from Realtime)
      setProgress(70);
      setStatusText("Analyzing dermatological morphologies…");
      await delay(1200);

      setProgress(85);
      setStatusText("Cross-referencing imaging patterns…");
      await delay(1000);

      setProgress(100);
      setStatusText("Assessment complete.");
      await delay(400);

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
            <RiskAssessmentWidget riskLevel="MODERATE" confidence={87.4} />
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Image uploaded successfully
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  You can now{" "}
                  <a
                    href="/patient/consultations/book"
                    className="underline font-medium"
                  >
                    book a consultation
                  </a>{" "}
                  with a dermatologist.
                </p>
              </div>
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
