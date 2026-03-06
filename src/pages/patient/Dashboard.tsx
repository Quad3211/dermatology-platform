import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { Button } from "../../components/core/Button";
import {
  UploadCloud,
  FileSearch,
  ShieldCheck,
  Loader2,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { cn } from "../../utils/cn";
import { SecureTextChat } from "../../components/shared/SecureTextChat";

// ── Types ──────────────────────────────────────────────────────
interface Consultation {
  id: string;
  status: "pending" | "scheduled" | "reviewed" | "closed";
  created_at: string;
  scheduled_at: string | null;
  doctor_notes: string | null;
  analysis: { risk_level: string } | null;
  doctor: { full_name: string } | null;
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "text-red-700 bg-red-50 ring-red-200",
  HIGH: "text-orange-700 bg-orange-50 ring-orange-200",
  MODERATE: "text-yellow-700 bg-yellow-50 ring-yellow-200",
  LOW: "text-green-700 bg-green-50 ring-green-200",
};

export function Dashboard() {
  const [chatConsult, setChatConsult] = useState<Consultation | null>(null);

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ["patient-consultations"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("consultations")
        .select(
          `
          id, status, created_at, scheduled_at, doctor_notes,
          analysis:analysis_results(risk_level),
          doctor:profiles!consultations_doctor_id_fkey(full_name)
        `,
        )
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  // ── Chat View Active ──────────────────────────────────────────
  if (chatConsult) {
    const doctorName = chatConsult.doctor?.full_name
      ? `Dr. ${chatConsult.doctor.full_name.replace("Dr. ", "")}`
      : "Your Doctor";

    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
        <div className="w-full max-w-3xl h-[80vh] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <SecureTextChat
            consultationId={chatConsult.id}
            role="patient"
            otherPartyName={doctorName}
            onClose={() => setChatConsult(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome to your Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your skin health assessments and track your progress securely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="space-y-4 max-w-md">
                <h2 className="text-2xl font-bold">
                  Start a new AI Assessment
                </h2>
                <p className="text-primary-100">
                  Upload a photo of a skin lesion for an immediate, confidential
                  AI-driven risk assessment.
                </p>
                <Link to="/patient/upload">
                  <Button
                    variant="secondary"
                    className="mt-4 text-primary-700 w-full sm:w-auto"
                  >
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Upload Image
                  </Button>
                </Link>
              </div>
              <div className="mt-6 sm:mt-0 opacity-20 hidden sm:block">
                <FileSearch className="h-32 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center">
              <ShieldCheck className="h-5 w-5 text-status-safe mr-2" />
              Privacy Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Your images are securely stored and will be automatically purged
              after 72 hours per your medical profile settings.
            </p>
            <div className="text-xs text-slate-400 border-t border-slate-100 pt-4 cursor-default">
              System is end-to-end encrypted.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">
          Recent Assessments
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 border border-surface-border rounded-xl bg-white">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading assessments...
          </div>
        ) : consultations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500 cursor-default">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-900 font-medium mb-1">
                No prior assessments.
              </p>
              <p className="text-sm mb-6">
                You haven't uploaded any lesions yet.
              </p>
              <Link to="/patient/upload">
                <Button variant="outline">Start your first scan</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {consultations.map((c) => {
              const riskLevel = c.analysis?.risk_level ?? "PENDING";
              const isScheduledOrReviewed = [
                "scheduled",
                "reviewed",
                "closed",
              ].includes(c.status);

              return (
                <Card
                  key={c.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center p-0">
                    {/* Status accent border */}
                    <div
                      className={cn(
                        "h-1.5 md:h-auto md:w-1.5 shrink-0",
                        c.status === "pending"
                          ? "bg-amber-400"
                          : c.status === "scheduled"
                            ? "bg-green-400"
                            : "bg-slate-300",
                      )}
                    />

                    <div className="flex-1 p-5 lg:p-6 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className={cn(
                              "text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wider ring-1 uppercase",
                              RISK_COLORS[riskLevel] ??
                                "bg-slate-100 text-slate-600 ring-slate-200",
                            )}
                          >
                            {riskLevel} RISK
                          </span>
                          <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(c.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                          {c.status === "pending" && (
                            <span className="text-amber-600 flex items-center">
                              <AlertTriangle className="h-3.5 w-3.5 mr-1" />{" "}
                              Requires Booking
                            </span>
                          )}
                          {c.status === "scheduled" && (
                            <span className="text-green-600 flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />{" "}
                              Appointment Confirmed
                            </span>
                          )}
                          {c.status === "reviewed" && (
                            <span className="text-slate-500 flex items-center">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />{" "}
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {c.scheduled_at && c.status === "scheduled" && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                          <span className="font-semibold text-green-900">
                            Next Appointment:{" "}
                          </span>
                          <span className="text-green-800">
                            {new Date(c.scheduled_at).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              },
                            )}{" "}
                            at{" "}
                            {new Date(c.scheduled_at).toLocaleTimeString(
                              "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      )}

                      {c.doctor_notes && (
                        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Doctor's Notes
                          </p>
                          <p className="text-sm text-slate-700 italic">
                            "{c.doctor_notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-5 lg:p-6 border-t md:border-t-0 md:border-l border-surface-border flex flex-col justify-center gap-3 w-full md:w-48 shrink-0">
                      {isScheduledOrReviewed ? (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setChatConsult(c)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Dr.
                        </Button>
                      ) : (
                        <Link to="/patient/consultation">
                          <Button className="w-full">
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Consult
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
