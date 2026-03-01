import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { ShieldPlus, Activity, Lock, Scan, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      });

      if (error) throw error;

      if (role === "doctor") {
        navigate("/doctor");
      } else {
        navigate("/patient");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  const isPatient = role === "patient";

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full bg-white relative overflow-hidden">
      {/* Dynamic Background Splashes based on role */}
      <AnimatePresence>
        {isPatient ? (
          <motion.div
            key="patient-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-100 rounded-full blur-[120px] pointer-events-none"
          />
        ) : (
          <motion.div
            key="doctor-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[120px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Left side: Animated Themed Branding */}
      <div className="hidden md:flex md:w-1/2 relative p-12 lg:p-24 flex-col justify-between overflow-hidden">
        {/* Patient Theme Container */}
        <AnimatePresence mode="wait">
          {isPatient ? (
            <motion.div
              key="patient-container"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex flex-col h-full justify-center"
            >
              <div className="bg-primary-50 text-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                <ShieldPlus className="w-8 h-8" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                Understand Your Skin. <br />
                <span className="text-primary-600">Know Your Risk.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg mb-12">
                Join thousands of patients taking back control of their
                dermatological health. Get instantaneous AI pre-screening and
                expedited clinical reviews from leading specialists.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <Scan className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Upload a Photo</h4>
                    <p className="text-sm text-slate-500">
                      Take a picture of the lesion and upload it securely.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <Lock className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Get Instant Results
                    </h4>
                    <p className="text-sm text-slate-500">
                      Our clinical AI provides an immediate risk assessment.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="doctor-container"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex flex-col h-full justify-center"
            >
              <div className="bg-emerald-50 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                <Activity className="w-8 h-8" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                The AI Co-Pilot for <br />
                <span className="text-emerald-600">Dermatologists.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg mb-12">
                Sign up to join our secure network. Review AI-triaged patient
                cases, streamline your digital workflow, and focus your time
                where it's needed most.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Reduce Backlogs
                    </h4>
                    <p className="text-sm text-slate-500">
                      Let AI pre-sort benign vs suspect cases for you.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <ShieldPlus className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Second Opinions
                    </h4>
                    <p className="text-sm text-slate-500">
                      Collaborate securely with peers on complex diagnoses.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side: Themed Register Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 relative z-20 border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Create an Account
            </h3>
            <p className="text-slate-500 font-medium">
              Register for full access to the platform.
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-8 border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setRole("patient")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                isPatient
                  ? "bg-white text-primary-700 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              I'm a Patient
            </button>
            <button
              type="button"
              onClick={() => setRole("doctor")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                !isPatient
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              I'm a Doctor
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

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
              className={`w-full text-lg h-12 rounded-xl transition-all shadow-lg font-bold ${
                isPatient
                  ? "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
              isLoading={isLoading}
            >
              Create Secure Account
            </Button>
          </form>

          <div className="text-center text-sm font-medium mt-8 text-slate-500 px-8">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-slate-800">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-slate-800">
              Privacy Policy
            </Link>
            .
          </div>

          <div className="text-center text-sm font-medium mt-6 pt-6 border-t border-slate-100">
            <span className="text-slate-500">Already have an account? </span>
            <Link
              to="/login"
              className={`hover:underline ${isPatient ? "text-primary-600" : "text-emerald-600"}`}
            >
              Sign in Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
