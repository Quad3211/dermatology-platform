import { Card, CardContent } from "../../components/core/Card";
import { Users } from "lucide-react";

export function PatientList() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in p-8 bg-surface-muted min-h-[calc(100vh-64px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Patient Directory
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your active patients and their ongoing consultation history.
          </p>
        </div>
      </div>

      <Card className="text-center py-24 bg-white border border-surface-border shadow-sm">
        <CardContent>
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="bg-slate-50 p-6 rounded-full">
              <Users className="w-16 h-16 text-slate-300" />
            </div>
            <h3 className="text-xl font-medium text-slate-600">
              No active patients
            </h3>
            <p className="max-w-md mx-auto text-sm text-center">
              Once you review cases from the triage portal and take them on for
              ongoing management, they will appear here in your secure patient
              directory.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
