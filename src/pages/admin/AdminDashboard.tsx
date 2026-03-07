import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import {
  Users,
  Activity,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
  LogOut,
  Settings,
  Stethoscope,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "../../components/core/Button";
import { cn } from "../../utils/cn";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  license_number?: string;
  specialty?: string;
  created_at: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"doctors" | "patients">("doctors");

  // Fetch Profiles
  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
    refetchInterval: 30_000,
  });

  // Verify Mutation
  const verifyMutation = useMutation({
    mutationFn: async ({
      id,
      is_verified,
    }: {
      id: string;
      is_verified: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const doctors = profiles.filter((p) => p.role === "doctor");
  const patients = profiles.filter((p) => p.role === "patient");

  const unverifiedDoctors = doctors.filter((d) => !d.is_verified).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
              <span className="text-xl font-bold tracking-tight">
                SkinHealth Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-slate-300 hidden md:block mr-4">
                System Status:{" "}
                <span className="text-emerald-400">
                  All Systems Operational
                </span>
              </div>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-primary-50 text-primary-600 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Patients
              </p>
              <p className="text-3xl font-extrabold text-slate-900">
                {patients.length}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Verified Doctors
              </p>
              <p className="text-3xl font-extrabold text-slate-900">
                {doctors.filter((d) => d.is_verified).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Pending Verification
              </p>
              <p className="text-3xl font-extrabold text-slate-900">
                {unverifiedDoctors}
              </p>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab("doctors")}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center",
                  activeTab === "doctors"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                Doctors
                {unverifiedDoctors > 0 && (
                  <span className="ml-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {unverifiedDoctors}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("patients")}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center",
                  activeTab === "patients"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                Patients
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all w-full md:w-64"
              />
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  {activeTab === "doctors" && (
                    <>
                      <th className="px-6 py-4">License / Specialty</th>
                      <th className="px-6 py-4">Verification Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </>
                  )}
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  (activeTab === "doctors" ? doctors : patients).map(
                    (profile) => (
                      <tr
                        key={profile.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3 shrink-0">
                              {profile.full_name?.charAt(0) || "?"}
                            </div>
                            <span className="font-bold text-slate-800">
                              {profile.full_name || "Myster User"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {profile.email}
                        </td>

                        {activeTab === "doctors" && (
                          <>
                            <td className="px-6 py-4 text-sm">
                              <div className="font-mono text-slate-700 font-medium">
                                {profile.license_number || "—"}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {profile.specialty || "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {profile.is_verified ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {profile.is_verified ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                  onClick={() =>
                                    verifyMutation.mutate({
                                      id: profile.id,
                                      is_verified: false,
                                    })
                                  }
                                  disabled={verifyMutation.isPending}
                                >
                                  Revoke
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 shadow-md"
                                  onClick={() =>
                                    verifyMutation.mutate({
                                      id: profile.id,
                                      is_verified: true,
                                    })
                                  }
                                  disabled={verifyMutation.isPending}
                                >
                                  Approve
                                </Button>
                              )}
                            </td>
                          </>
                        )}

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
