import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { ShieldCheck, Activity, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userRole = data.user.user_metadata?.role;
      if (userRole !== "admin") {
        await supabase.auth.signOut();
        throw new Error(
          "Access Denied: This portal is strictly for system administrators.",
        );
      } else {
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full bg-slate-900 relative overflow-hidden">
      {/* Background Splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 0.8 }}
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-400 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Left side: Animated Themed Branding */}
      <div className="hidden md:flex md:w-1/2 relative p-12 lg:p-24 flex-col justify-between overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col h-full justify-center"
        >
          <div className="bg-slate-800 text-emerald-400 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-700">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
            System Operations. <br />
            <span className="text-emerald-400">Secure Access.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-lg mb-12">
            Access the administrative dashboard to monitor platform health,
            verify medical credentials, and oversee system compliance.
          </p>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800 p-3 rounded-full border border-slate-700">
                <KeyRound className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-white">Strict Authentication</h4>
                <p className="text-sm text-slate-400">
                  Role-based access control with comprehensive audit logging.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800 p-3 rounded-full border border-slate-700">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-white">Real-time Monitoring</h4>
                <p className="text-sm text-slate-400">
                  Observe and action critical events rapidly.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 relative z-20 border-l border-slate-800 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Admin Sign In
            </h3>
            <p className="text-slate-500 font-medium">
              Enter your administrative credentials to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@skinhealth.com"
              required
            />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-sm text-status-danger bg-red-50 rounded-lg border border-red-200 flex items-center"
              >
                <Activity className="w-4 h-4 mr-2" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full text-lg h-12 rounded-xl transition-all shadow-lg font-bold bg-slate-900 hover:bg-slate-800 text-white"
              isLoading={isLoading}
            >
              Access Operations
            </Button>
          </form>

          <div className="text-center text-sm font-medium mt-8 pt-8 border-t border-slate-100 text-slate-500">
            Not an administrator?{" "}
            <Link to="/login" className="text-primary-600 hover:underline">
              Return to Patient Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
