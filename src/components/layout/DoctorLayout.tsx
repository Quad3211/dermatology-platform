import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { Button } from "../core/Button";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X,
  Loader2,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { IncomingCallListener } from "../shared/IncomingCallListener";
import { useQuery } from "@tanstack/react-query";

export function DoctorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navLinks = [
    { name: "Review Portal", path: "/doctor", icon: LayoutDashboard },
    { name: "My Patients", path: "/doctor/patients", icon: Users },
    { name: "Settings", path: "/doctor/settings", icon: Settings },
  ];

  const isVerified = profile?.is_verified ?? false;

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">
      <nav className="bg-white border-b border-surface-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className=" flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center"
                >
                  SkinHealth{" "}
                  <span className="text-sm font-normal text-slate-500 ml-2 border-l pl-2 border-slate-300">
                    Doctor Portal
                  </span>
                </Link>
              </div>
              <div className="hidden sm:-my-px sm:ml-8 sm:flex sm:space-x-8">
                {navLinks.map((link) => {
                  const isActive =
                    location.pathname === link.path ||
                    (link.path !== "/doctor" &&
                      location.pathname.startsWith(link.path));
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                        isActive
                          ? "border-primary-500 text-slate-900"
                          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-white inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-surface-border">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-2 text-base font-medium",
                      isActive
                        ? "bg-primary-50 border-l-4 border-primary-500 text-primary-700"
                        : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800",
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {link.name}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full mx-auto relative p-4 lg:p-6">
        {isProfileLoading ? (
          <div className="flex h-full min-h-[50vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : !isVerified ? (
          <div className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl p-10 border border-slate-200 shadow-xl text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
              Account Pending Verification
            </h2>
            <p className="text-lg text-slate-600 mb-8 font-medium">
              Thank you for joining SkinHealth. Your medical license and
              credentials are currently under review by our administration team.
            </p>
            <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 mb-8">
              <h4 className="font-bold text-slate-800 mb-2">
                What happens next?
              </h4>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 mt-0.5" />{" "}
                  We verify your license number against the national registry.
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 mt-0.5" />{" "}
                  We confirm your identity and standing.
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 mt-0.5" />{" "}
                  You'll receive full access to patient AI-triage cases once
                  approved.
                </li>
              </ul>
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <>
            <IncomingCallListener role="doctor" />
            <Outlet />
          </>
        )}
      </main>
    </div>
  );
}
