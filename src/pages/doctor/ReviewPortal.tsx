import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { Button } from "../../components/core/Button";
import {
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { SecureTextChat } from "../../components/shared/SecureTextChat";

export function ReviewPortal() {
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const pendingCases = [
    {
      id: "A94-F",
      name: "Confidential Patient",
      risk: "HIGH",
      time: "10 mins ago",
      ai: "89.2%",
    },
    {
      id: "B22-X",
      name: "Confidential Patient",
      risk: "MODERATE",
      time: "2 hours ago",
      ai: "74.1%",
    },
    {
      id: "C19-L",
      name: "Confidential Patient",
      risk: "LOW",
      time: "5 hours ago",
      ai: "92.0%",
    },
  ];

  if (activeSession) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 fade-in p-8 bg-surface-muted min-h-screen">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-surface-border shadow-sm mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Active Consultation: Case #{activeSession}
            </h1>
            <p className="text-xs font-semibold text-primary-600 mt-0.5">
              SECURE TEXT MODALITY ACTIVE
            </p>
          </div>
          <Button variant="outline" onClick={() => setActiveSession(null)}>
            End Session
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-t-4 border-t-status-danger">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 uppercase tracking-wider">
                  Automated AI Triage Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 text-status-danger p-4 rounded-lg flex items-center mb-6 border border-red-200">
                  <AlertTriangle className="mr-3 h-8 w-8" />
                  <div>
                    <p className="font-bold text-xl leading-none">HIGH RISK</p>
                    <p className="text-xs font-medium mt-1">
                      AI Confidence: 89.2%
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-surface-border pb-1 mb-2">
                      Topographic Location
                    </p>
                    <p className="font-medium text-slate-800">Torso (Back)</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-surface-border pb-1 mb-2">
                      Highlighted Features
                    </p>
                    <ul className="text-sm text-slate-700 list-disc pl-4 space-y-1">
                      <li>Asymmetry detected (A)</li>
                      <li>Uneven macroscopic border (B)</li>
                      <li>Diameter exceeds 6mm (D)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <SecureTextChat />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dermatologist Review Portal
          </h1>
          <p className="text-slate-500 mt-1">
            Review incoming AI-triaged queues and conduct secure patient
            follow-ups.
          </p>
        </div>
        <div className="flex items-center bg-white border border-surface-border rounded-lg px-3 py-2.5 shadow-sm max-w-sm w-full">
          <Search className="h-5 w-5 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search case ID..."
            className="border-none focus:ring-0 text-sm flex-1 outline-none bg-transparent"
          />
        </div>
      </div>

      <Card className="overflow-hidden shadow-card border-none ring-1 ring-surface-border">
        <div className="bg-slate-50 border-b border-surface-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Pending Triage Queue
          </h3>
          <span className="bg-status-danger text-white text-xs font-bold px-2 py-1 rounded-full">
            3 Needs Attention
          </span>
        </div>
        <div className="divide-y divide-surface-border bg-white">
          {pendingCases.map((c) => (
            <div
              key={c.id}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4"
            >
              <div className="flex items-center space-x-6">
                <div
                  className={`p-4 rounded-full ${c.risk === "HIGH" ? "bg-red-50 text-status-danger ring-1 ring-red-200" : c.risk === "MODERATE" ? "bg-yellow-50 text-status-warning ring-1 ring-yellow-200" : "bg-green-50 text-status-safe ring-1 ring-green-200"}`}
                >
                  {c.risk === "HIGH" ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : c.risk === "MODERATE" ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Case #{c.id}:{" "}
                    <span className="text-slate-500 font-normal italic">
                      {c.name}
                    </span>
                  </h3>
                  <div className="flex items-center space-x-4 mt-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5" /> {c.time}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>AI Confidence {c.ai}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setActiveSession(c.id)}
                className="w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Open Session
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-center text-xs text-slate-400 mt-6">
        All queue items are stripped of identifying records until connection is
        securely authenticated.
      </p>
    </div>
  );
}
