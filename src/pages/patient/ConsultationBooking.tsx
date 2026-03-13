import { useState } from "react";
import {
  Calendar,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  UploadCloud,
  MapPin,
  User,
  Stethoscope,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { Button } from "../../components/core/Button";
import { cn } from "../../utils/cn";
import { supabase } from "../../config/supabase";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────
interface DoctorProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  office_address: string | null;
  specialty: string | null;
}

export function ConsultationBooking() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch available doctors ─────────────────────────────────
  const { data: doctors = [], isLoading: isDoctorsLoading } = useQuery<
    DoctorProfile[]
  >({
    queryKey: ["available-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, office_address, specialty")
        .eq("role", "doctor")
        .order("full_name");

      if (error) throw error;
      return (data ?? []) as DoctorProfile[];
    },
  });

  // Find most recent upload + any linked analysis (analysis may still be processing)
  const { data: latestUpload } = useQuery({
    queryKey: ["latest-upload"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Accept any upload that's been sent to storage (uploaded, processing, or complete)
      const { data: uploads } = await supabase
        .from("uploads")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["uploaded", "processing", "complete"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (!uploads?.length) return null;

      // Try to find an analysis, but it's optional
      const { data: analysis } = await supabase
        .from("analysis_results")
        .select("id, risk_level, confidence, summary, status")
        .eq("upload_id", uploads[0].id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { uploadId: uploads[0].id, analysis };
    },
  });

  // Next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
  ];

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const selectedDoctorProfile = doctors.find((d) => d.id === selectedDoctor);

  const handleSubmit = async () => {
    // Guard — analysis_id is NOT NULL in schema; block if missing
    if (!selectedDate || !selectedTime || !selectedDoctor) return;
    if (!latestUpload?.analysis?.id) {
      setError(
        "No completed analysis found. Please upload and wait for analysis before booking.",
      );
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: insertErr } = await supabase.from("consultations").insert({
        patient_id: user.id,
        doctor_id: selectedDoctor,
        analysis_id: latestUpload.analysis.id, // guaranteed non-null here
        status: "pending",
        urgency:
          latestUpload.analysis?.risk_level === "HIGH"
            ? "HIGH"
            : latestUpload.analysis?.risk_level === "CRITICAL"
              ? "CRITICAL"
              : "ROUTINE",
        patient_notes: notes || null,
        preferred_date: `${selectedDate}T${selectedTime}:00`,
      });

      if (insertErr) throw new Error(insertErr.message);
      setIsBooked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to book consultation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <Card className="max-w-xl mx-auto text-center border-primary-200 fade-in">
        <CardContent className="pt-10 pb-10">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-status-safe" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Consultation Requested
          </h2>
          <p className="text-slate-600 mb-2">
            Your request has been sent to{" "}
            <strong>
              Dr.{" "}
              {selectedDoctorProfile?.full_name?.replace(/^Dr\.?\s*/i, "") ??
                "your doctor"}
            </strong>
            .
          </p>
          <p className="text-slate-500 text-sm mb-4">
            You requested:{" "}
            <strong>
              {selectedDate &&
                new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
              at {selectedTime && formatTime(selectedTime)}
            </strong>
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-8">
            <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            The doctor must confirm this appointment. You'll be notified once
            it's confirmed.
          </div>
          <Link to="/patient">
            <Button>Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Request a Consultation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a doctor, select your preferred date and time. The doctor will
          confirm your appointment.
        </p>
      </div>

      {/* Linked analysis — shown if analysis exists */}
      {latestUpload?.analysis && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            This consultation will be linked to your most recent analysis —{" "}
            <strong>Risk: {latestUpload.analysis.risk_level}</strong> (
            {((latestUpload.analysis.confidence ?? 0) * 100).toFixed(0)}%
            confidence)
          </p>
        </div>
      )}

      {/* Upload found but no analysis yet */}
      {latestUpload && !latestUpload.analysis && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            Your uploaded image has been found. The AI analysis may still be
            processing — your consultation request will be linked once it
            completes.
          </p>
        </div>
      )}

      {/* No analysis yet — must upload first */}
      {!latestUpload && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              No uploaded image found.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              You must upload a skin image and wait for analysis before booking.
            </p>
            <Link
              to="/patient/upload"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 underline"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Go to Upload
            </Link>
          </div>
        </div>
      )}

      {/* Upload exists but analysis still processing */}
      {latestUpload && !latestUpload.analysis && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              AI Analysis Still Processing
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your uploaded image is being analysed. Please wait a moment and
              refresh this page.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 1: Select a Doctor ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Stethoscope className="w-5 h-5 mr-3 text-primary-600" />
            Step 1 — Choose Your Doctor
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Select a doctor near you. The doctor will need to confirm the
            appointment on their end.
          </p>
        </CardHeader>
        <CardContent>
          {isDoctorsLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading doctors…
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No doctors are currently available.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doc) => {
                const isSelected = selectedDoctor === doc.id;
                const initials = doc.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc.id)}
                    className={cn(
                      "relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200"
                        : "border-surface-border bg-white hover:border-slate-300 hover:shadow-sm",
                    )}
                  >
                    {/* Avatar */}
                    {doc.avatar_url ? (
                      <img
                        src={doc.avatar_url}
                        alt={doc.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                        {initials}
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">
                        Dr.{" "}
                        {doc.full_name.replace(/^Dr\.?\s*/i, "")}
                      </p>
                      {doc.specialty && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.specialty}
                        </p>
                      )}
                      {doc.office_address && (
                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                          <span>{doc.office_address}</span>
                        </p>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-primary-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Step 2: Date & Time ─────────────────────────────────── */}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity",
          !selectedDoctor && "opacity-50 pointer-events-none",
        )}
      >
        {/* Date picker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-3 text-primary-600" />
              Step 2 — Preferred Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dates.map((d) => {
              const iso = d.toISOString().split("T")[0];
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer text-sm",
                    selectedDate === iso
                      ? "bg-primary-50 border-primary-500 text-primary-700 font-medium"
                      : "border-surface-border text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span>
                    {d.toLocaleDateString("en-US", { weekday: "long" })}
                  </span>
                  <span className="opacity-70">
                    {d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Time picker */}
        <Card
          className={cn(
            "transition-opacity",
            !selectedDate && "opacity-50 pointer-events-none",
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="w-5 h-5 mr-3 text-primary-600" />
              Step 3 — Preferred Time
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {timeSlots.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={cn(
                  "p-2.5 rounded-lg border text-xs text-center transition-colors font-medium cursor-pointer",
                  selectedTime === t
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-surface-border text-slate-700 hover:bg-slate-50",
                )}
              >
                {formatTime(t)}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card
        className={cn(
          "transition-opacity",
          !selectedDoctor && "opacity-50 pointer-events-none",
        )}
      >
        <CardHeader>
          <CardTitle className="text-base">
            Additional Notes (optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe your concern, how long you've noticed it, or any other details..."
            className="w-full border border-surface-border rounded-lg p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {notes.length}/500
          </p>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-status-danger text-center">{error}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          disabled={
            !selectedDoctor ||
            !selectedDate ||
            !selectedTime ||
            !latestUpload ||
            !latestUpload.analysis?.id ||
            isSubmitting
          }
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting…
            </>
          ) : (
            "Request Consultation"
          )}
        </Button>
      </div>
    </div>
  );
}
