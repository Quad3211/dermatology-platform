import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import {
  Users,
  Activity,
  CheckCircle,
  ShieldCheck,
  Search,
  LogOut,
  Stethoscope,
  Clock,
  Zap,
  Play,
  Pause,
  Database,
  Server,
  Microscope,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../components/core/Button";
import { cn } from "../../utils/cn";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

interface ActivityEvent {
  id: string;
  text: string;
  time: string;
  type: "user" | "ai" | "doctor" | "system";
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"doctors" | "patients">("doctors");
  const [searchQuery, setSearchQuery] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([
    {
      id: "init-1",
      text: "System initialized and waiting for events...",
      time: new Date().toLocaleTimeString(),
      type: "system",
    },
  ]);

  // Demo stats
  const [demoScreenings, setDemoScreenings] = useState(142);
  const [demoConsults, setDemoConsults] = useState(38);

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

  // Real-time synchronization
  useEffect(() => {
    const channel = supabase
      .channel("admin-profiles-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  // Demo Mode Generation
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      const events = [
        {
          text: "Patient uploaded high-resolution skin image.",
          type: "user" as const,
        },
        {
          text: `AI Model classified image: MODERATE RISK (Conf: ${(
            80 +
            Math.random() * 15
          ).toFixed(1)}%).`,
          type: "ai" as const,
        },
        {
          text: `AI Model classified image: HIGH RISK (Conf: ${(
            85 +
            Math.random() * 13
          ).toFixed(1)}%).`,
          type: "ai" as const,
        },
        {
          text: "Dr. Smith initiated secure video consultation.",
          type: "doctor" as const,
        },
        { text: "Patient profile updated via portal.", type: "user" as const },
        {
          text: "System routed priority case to next available dermatologist.",
          type: "system" as const,
        },
        {
          text: "AI screening flagged 'Malignant Melanoma' patterns for manual review.",
          type: "ai" as const,
        },
      ];

      const newEvent = {
        id: Math.random().toString(),
        ...events[Math.floor(Math.random() * events.length)],
        time: new Date().toLocaleTimeString(),
      };

      setActivityFeed((prev) => [newEvent, ...prev].slice(0, 30));

      if (newEvent.type === "ai") {
        setDemoScreenings((prev) => prev + 1);
      }
      if (newEvent.type === "doctor") {
        setDemoConsults((prev) => prev + 1);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [demoMode]);

  // Filtered lists
  const allDoctors = profiles.filter((p) => p.role === "doctor");
  const allPatients = profiles.filter((p) => p.role === "patient");
  const unverifiedDoctors = allDoctors.filter((d) => !d.is_verified).length;

  const searchLower = searchQuery.toLowerCase();
  const doctors = allDoctors.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower),
  );
  const patients = allPatients.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower),
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-300">
      {/* ── Admin Navbar ── */}
      <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-7 w-7 text-primary-400" />
              <span className="text-xl font-bold tracking-tight">
                SkinHealth Operations
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={demoMode ? "default" : "outline"}
                size="sm"
                className={cn(
                  "border font-bold flex items-center transition-all",
                  demoMode
                    ? "bg-primary-600 hover:bg-primary-700 text-white border-transparent"
                    : "border-primary-600/50 text-primary-400 hover:bg-primary-900/30",
                )}
                onClick={() => setDemoMode(!demoMode)}
              >
                {demoMode ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" /> Stop Demo Activity
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> Start Demo Simulator
                  </>
                )}
              </Button>
              <div className="w-px h-6 bg-slate-800 mx-2" />
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Top Metrics Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Patients",
              value: allPatients.length,
              icon: Users,
              color: "text-blue-400",
              bg: "bg-blue-400/10 border-blue-400/20",
            },
            {
              title: "Verified Doctors",
              value: allDoctors.filter((d) => d.is_verified).length,
              icon: Stethoscope,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
            {
              title: "AI Screenings Today",
              value: demoScreenings,
              icon: Microscope,
              color: "text-fuchsia-400",
              bg: "bg-fuchsia-400/10 border-fuchsia-400/20",
            },
            {
              title: "Consultations",
              value: demoConsults,
              icon: Activity,
              color: "text-orange-400",
              bg: "bg-orange-400/10 border-orange-400/20",
            },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex items-center space-x-4 relative overflow-hidden"
            >
              <div
                className={`p-4 rounded-xl border ${stat.bg} ${stat.color} relative z-10`}
              >
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-3xl font-extrabold text-white">
                  {stat.value}
                </p>
              </div>
              <div
                className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-50 z-0`}
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* ── Left Column (Main Directory & Analytics) ── */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            {/* AI Analytics Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-3xl border border-slate-800 shadow-lg p-6 overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary-400" />
                  AI Model Telemetry
                </h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                  Live Inferencing Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400 font-bold">
                      Critical Risk
                    </span>
                    <span className="text-slate-400">12%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-red-400 h-2 rounded-full"
                      style={{ width: "12%" }}
                    />
                  </div>

                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-orange-400 font-bold">High Risk</span>
                    <span className="text-slate-400">28%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-orange-400 h-2 rounded-full"
                      style={{ width: "28%" }}
                    />
                  </div>

                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-yellow-400 font-bold">Moderate</span>
                    <span className="text-slate-400">45%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: "45%" }}
                    />
                  </div>
                </div>

                <div className="col-span-2 bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-center justify-center">
                  <div className="text-center">
                    <Cpu className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      Average Inference Time
                    </p>
                    <p className="text-2xl font-mono text-white mt-1">
                      {demoMode ? (Math.random() * 20 + 240).toFixed(0) : "245"}{" "}
                      ms
                    </p>
                  </div>
                  <div className="w-px h-16 bg-slate-800 mx-8" />
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-900 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      Escalation Accuracy
                    </p>
                    <p className="text-2xl font-mono text-white mt-1">94.2%</p>
                  </div>
                </div>
              </div>

              {/* Decorative backgrounds */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-900/20 rounded-full blur-[80px] pointer-events-none" />
            </motion.div>

            {/* User Directory */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-lg overflow-hidden flex-1 flex flex-col">
              <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-slate-950 p-1 rounded-xl w-fit border border-slate-800">
                  <button
                    onClick={() => setActiveTab("doctors")}
                    className={cn(
                      "px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center",
                      activeTab === "doctors"
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Doctors
                    {unverifiedDoctors > 0 && (
                      <span className="ml-2 bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/50 text-[10px] px-2 py-0.5 rounded-full">
                        {unverifiedDoctors} Pending
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("patients")}
                    className={cn(
                      "px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center",
                      activeTab === "patients"
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Patients
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all w-full md:w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1 h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm border-b border-slate-800">
                    <tr className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-4">Name & Email</th>
                      {activeTab === "doctors" && (
                        <>
                          <th className="px-6 py-4">Credentials</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Indexing users...
                        </td>
                      </tr>
                    ) : (
                      (activeTab === "doctors" ? doctors : patients).map(
                        (profile) => (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={profile.id}
                            className="hover:bg-slate-800/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold mr-3 shrink-0 uppercase">
                                  {profile.full_name?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-200 block">
                                    {profile.full_name || "Myster User"}
                                  </span>
                                  <span className="text-xs text-slate-500 block">
                                    {profile.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {activeTab === "doctors" && (
                              <>
                                <td className="px-6 py-4">
                                  <div className="font-mono text-slate-300 font-medium text-sm">
                                    {profile.license_number || "NO LICENSE"}
                                  </div>
                                  <div className="text-slate-500 text-xs mt-0.5">
                                    {profile.specialty || "General"}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {profile.is_verified ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      <Clock className="w-3.5 h-3.5 mr-1" />{" "}
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {profile.is_verified ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
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
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 shadow-lg border-transparent"
                                      onClick={() =>
                                        verifyMutation.mutate({
                                          id: profile.id,
                                          is_verified: true,
                                        })
                                      }
                                      disabled={verifyMutation.isPending}
                                    >
                                      Approve License
                                    </Button>
                                  )}
                                </td>
                              </>
                            )}

                            <td className="px-6 py-4 text-sm text-slate-500 text-right">
                              {new Date(
                                profile.created_at,
                              ).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Right Column (System Status & Activity Feed) ── */}
          <div className="xl:col-span-4 flex flex-col gap-8">
            {/* System Status */}
            <div className="bg-slate-900 shadow-lg rounded-3xl border border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white flex items-center mb-6">
                <Server className="w-5 h-5 mr-2 text-primary-400" />
                Service Health
              </h3>
              <div className="space-y-4">
                {[
                  {
                    name: "Platform Database",
                    icon: Database,
                    status: "Operational",
                  },
                  {
                    name: "AI Python Microservice",
                    icon: Cpu,
                    status: "Operational",
                  },
                  {
                    name: "Storage Buckets",
                    icon: Server,
                    status: "Operational",
                  },
                  {
                    name: "WebRTC Video Gateway",
                    icon: Zap,
                    status: "Operational",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <s.icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-300">
                        {s.name}
                      </span>
                    </div>
                    <span className="flex items-center text-xs font-bold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-slate-900 shadow-lg rounded-3xl border border-slate-800 flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur z-10 sticky top-0">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary-400" />
                  Live Activity Feed
                </h3>
                {demoMode && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                  </span>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 h-[500px] custom-scrollbar">
                <AnimatePresence initial={false}>
                  {activityFeed.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      className="flex gap-4 items-start"
                    >
                      <div className="flex flex-col items-center mt-1">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full ring-4 ring-slate-900",
                            event.type === "ai"
                              ? "bg-fuchsia-400"
                              : event.type === "doctor"
                                ? "bg-emerald-400"
                                : event.type === "system"
                                  ? "bg-slate-400"
                                  : "bg-blue-400",
                          )}
                        />
                        <div className="w-px h-12 bg-slate-800 mt-2" />
                      </div>
                      <div className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-sm">
                        <p className="text-xs text-slate-500 mb-1 font-mono uppercase tracking-wider">
                          {event.time} · {event.type.toUpperCase()}
                        </p>
                        <p className="text-sm font-medium text-slate-300">
                          {event.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
      `}</style>
    </div>
  );
}
