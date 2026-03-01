import { Link } from "react-router-dom";
import { Button } from "../../components/core/Button";
import {
  ShieldPlus,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  Stethoscope,
  Lock,
  ArrowRight,
  CheckCircle2,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { PublicNavbar } from "../../components/shared/PublicNavbar";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      {/* 1. Nav Header */}
      <PublicNavbar />

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-white to-white opacity-80" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Hero Copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-800 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 border border-primary-200 fade-in-up shadow-sm">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>AI-Powered Medical Triage</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] fade-in-up delay-100">
                Your Skin Health. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-primary-500 drop-shadow-sm">
                  Instantly Understood.
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-700 mb-8 leading-relaxed max-w-lg fade-in-up delay-200 font-medium">
                Upload a photo. Get real-time AI screening. Know your risk.
                Connect to licensed professionals when needed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 fade-in-up delay-300">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto hover:scale-105 transition-transform"
                  >
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/50 hover:bg-slate-50"
                  >
                    See How It Works
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex items-center space-x-4 text-sm text-slate-600 font-semibold fade-in-up delay-400">
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-1.5 text-slate-500" /> HIPAA
                  Compliant
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1.5 text-slate-500" /> Secure
                  Encryption
                </div>
              </div>
            </motion.div>

            {/* Hero Visual Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative lg:h-[600px] flex items-center justify-center p-8"
            >
              <div className="absolute inset-0 bg-primary-100 rounded-[3rem] transform rotate-3 scale-105 opacity-50 blur-xl" />
              <div className="relative bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 max-w-sm w-full z-10">
                {/* Fake App Mockup */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Activity className="text-primary-500 w-6 h-6" />
                    </div>
                    <div>
                      <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                      <div className="h-3 w-16 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-50/50 to-transparent" />
                    <div className="h-1 w-full bg-primary-500 absolute top-1/2 left-0 shadow-[0_0_15px_rgba(14,165,233,0.5)] animate-scan" />
                    <span className="text-slate-400 font-medium text-sm">
                      Analyzing specific characteristics...
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-10 w-full bg-slate-100 rounded-lg flex items-center px-4">
                      <div className="w-2 h-2 rounded-full bg-status-warning mr-3" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    </div>
                    <div className="h-10 w-full bg-slate-100 rounded-lg flex items-center px-4">
                      <div className="w-2 h-2 rounded-full bg-status-safe mr-3" />
                      <div className="h-3 w-3/4 bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Problem Section */}
      <section className="py-20 bg-slate-100/50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Why Skin Concerns Shouldn’t Be Ignored
            </h2>
            <p className="text-lg text-slate-700 font-medium">
              Early detection is critical in dermatology, yet structural
              barriers keep people from seeking timely care.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Delaying Care",
                text: "Many people delay seeing a doctor due to cost, wait times, or uncertainty about whether an issue is serious.",
              },
              {
                icon: AlertTriangle,
                title: "Worsening Conditions",
                text: "Skin issues often worsen and become substantially harder and more painful to treat when ignored.",
              },
              {
                icon: Search,
                title: "Medical Anxiety",
                text: "Online searches create extreme confusion, self-misdiagnosis, and unnecessary anxiety.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Solution & Features Section */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="lg:w-1/2"
            >
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
                A Smarter Way to Check Your Skin
              </h2>
              <p className="text-lg text-slate-700 font-medium mb-8 leading-relaxed">
                We combine artificial intelligence with board-certified medical
                expertise to give you instant clarity without the anxiety of
                waiting rooms.
              </p>

              <ul className="space-y-5">
                {[
                  "AI-powered skin screening",
                  "Real-time analysis & instant results",
                  "Clear, color-coded risk level indicators",
                  "Personalized educational guidance",
                  "Direct doctor consultation access",
                  "Strict privacy-first data handling",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-6 h-6 text-primary-600 mr-3 flex-shrink-0" />
                    <span className="text-slate-800 font-semibold">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="lg:w-1/2 grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 mt-8">
                <div className="bg-primary-100 p-6 rounded-2xl border border-primary-200 shadow-sm">
                  <Activity className="w-8 h-8 text-primary-700 mb-4" />
                  <h4 className="font-extrabold text-primary-900 mb-2">
                    99.9% Uptime
                  </h4>
                  <p className="text-sm font-medium text-primary-800">
                    Always available AI engine
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-md">
                  <Lock className="w-8 h-8 text-slate-800 mb-4" />
                  <h4 className="font-extrabold text-slate-900 mb-2">
                    Encrypted
                  </h4>
                  <p className="text-sm font-medium text-slate-700">
                    AES-256 bank-level security
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-md">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-4" />
                  <h4 className="font-extrabold text-slate-900 mb-2">
                    Instant Results
                  </h4>
                  <p className="text-sm font-medium text-slate-700">
                    Sub-second triage times
                  </p>
                </div>
                <div className="bg-slate-950 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/20">
                  <Stethoscope className="w-8 h-8 text-primary-400 mb-4" />
                  <h4 className="font-extrabold text-white mb-2">
                    Real Doctors
                  </h4>
                  <p className="text-sm font-medium text-slate-300">
                    Certified human review
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section
        id="how-it-works"
        className="py-24 bg-slate-950 text-white border-y border-slate-900 shadow-inner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-xl text-primary-300 font-medium">
              Five simple steps to peace of mind.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-primary-800 z-0" />

            {[
              { num: "01", title: "Create a free secure account" },
              { num: "02", title: "Upload a clear photo of your skin concern" },
              { num: "03", title: "AI analyzes the image in real time" },
              { num: "04", title: "View your personalized risk assessment" },
              {
                num: "05",
                title: "Connect to licensed professionals if needed",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="relative z-10 text-center flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary-600 border-4 border-primary-900 flex items-center justify-center font-bold text-lg mb-6 shadow-xl">
                  {step.num}
                </div>
                <h4 className="font-semibold text-primary-50 leading-snug">
                  {step.title}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Trust & Safety Section */}
      <section className="py-24 bg-slate-100/50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="bg-white rounded-[2rem] shadow-lg border border-slate-200 p-8 lg:p-12 hover:border-emerald-100 transition-colors"
          >
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/3">
                <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-200 shadow-sm">
                  <Shield className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                  Built With Privacy & Safety First
                </h2>
                <p className="text-slate-700 font-medium leading-relaxed">
                  Medical infrastructure demands absolute trust. Our platform
                  architecture ensures your data is strictly siloed, temporary,
                  and protected.
                </p>
              </div>
              <div className="lg:w-2/3 grid sm:grid-cols-2 gap-6">
                {[
                  "Your images are automatically deleted after analysis",
                  "Medical-grade HIPAA security standards",
                  "No diagnosis — only screening & guidance",
                  "Human doctor verification available",
                  "Full transparency on AI confidence levels",
                  "End-to-end encrypted databases",
                ].map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-start bg-slate-50 p-4 rounded-xl"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-900">
                      {pt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. Use Case Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 tracking-tight">
            Who Is This For?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Students",
              "Working professionals",
              "Parents",
              "Athletes",
              "Anyone concerned about skin health",
            ].map((group, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border-2 border-slate-100 hover:border-primary-200 px-6 py-3 rounded-full text-slate-700 font-medium transition-colors cursor-default shadow-sm"
              >
                {group}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-700 to-primary-900 relative overflow-hidden text-center shadow-inner">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtbDItMiAyaDZWMTJoLTZsLTIgMi0yLTJINHYxaDF2MmgtMXYxSDB2MmgyLjlsMiAySDF2Mmg0LjVsLTIgMkgwdjJoOGw2LTV2LTJsLTItMnYtMmwtMi0ydjJIMXYtMmgtMXYyaDBWMTRoMTB2MTJoNHYtaDR2LTEwaDR2MmgtdjJoLXYxMGg0djEySDM2ek02IDIyaDd2Mkg2em0xMC0ydjFoOHYtMWgtOHpNOCAxMmgtMWg0djJoLTR2MWg2di0yaC0xdjFIM3YtMWg1em04LTEwaDJ2MmgtMnptLTQgMmgtMnYyaDJWMDR6')] opacity-10" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-8 tracking-tight drop-shadow-md">
            Take Control of Your Skin Health Today
          </h2>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-primary-800 hover:bg-slate-50 border-none shadow-2xl text-lg px-8 py-6 rounded-full hover:scale-105 transition-transform font-bold"
            >
              Start Free Screening
            </Button>
          </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <div className="flex items-center space-x-2">
              <ShieldPlus className="h-6 w-6 text-primary-500" />
              <span className="text-xl font-bold tracking-tight text-white">
                SkinHealth
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                { name: "About", path: "/about" },
                { name: "Privacy Policy", path: "/privacy" },
                { name: "Medical Disclaimer", path: "/disclaimer" },
                { name: "Contact", path: "/contact" },
                { name: "Terms of Use", path: "/terms" },
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="hover:text-primary-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-xs text-center leading-relaxed max-w-4xl mx-auto opacity-60">
            <p className="mb-2 uppercase tracking-wide font-semibold text-slate-500">
              Medical Disclaimer
            </p>
            <p>
              This platform provides AI-powered screening and educational
              guidance only. It does not provide medical diagnoses, treatment,
              or clinical advice. The automated risk analysis is a preliminary
              triage tool designed to assist, not replace, board-certified
              healthcare professionals. If you are experiencing a medical
              emergency, please dial 911 or visit your nearest emergency
              department immediately.
            </p>
            <p className="mt-6">
              &copy; {new Date().getFullYear()} SkinHealth Architecture Ltd. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
