import { useState } from "react";
import { ImageUploader } from "../../components/medical/ImageUploader";
import { RealTimeShield } from "../../components/shared/RealTimeShield";
import { RiskAssessmentWidget } from "../../components/medical/RiskAssessmentWidget";
import { SkinBodyMap } from "../../components/medical/SkinBodyMap";

export function UploadFlow() {
  const [step, setStep] = useState<"UPLOAD" | "ANALYSING" | "RESULTS">(
    "UPLOAD",
  );
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const handleUpload = async (_file: File) => {
    // Mock simulation of Supabase webhook + Websocket progression
    setStep("ANALYSING");
    setProgress(10);
    setStatusText("Encrypting and securing upload connection...");

    setTimeout(() => {
      setProgress(45);
      setStatusText("Analyzing dermatological morphologies...");
    }, 1500);
    setTimeout(() => {
      setProgress(80);
      setStatusText("Cross-referencing medical imaging databases...");
    }, 3000);

    setTimeout(() => {
      setProgress(100);
      setStep("RESULTS");
    }, 4500);
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
            "Review your preliminary automated assessment results."}
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {step === "UPLOAD" && (
          <>
            <SkinBodyMap />
            <ImageUploader onUpload={handleUpload} />
          </>
        )}
        {step === "ANALYSING" && (
          <RealTimeShield progress={progress} status={statusText} />
        )}
        {step === "RESULTS" && (
          <RiskAssessmentWidget riskLevel="MODERATE" confidence={87.4} />
        )}
      </div>
    </div>
  );
}
