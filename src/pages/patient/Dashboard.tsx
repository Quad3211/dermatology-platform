import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { Button } from "../../components/core/Button";
import { UploadCloud, FileSearch, ShieldCheck } from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-6">
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
        <Card>
          <CardContent className="p-8 text-center text-slate-500 cursor-default">
            <p>You have no prior assessments.</p>
            <Link to="/patient/upload">
              <Button variant="outline" className="mt-4">
                Start your first scan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
