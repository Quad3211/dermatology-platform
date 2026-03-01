import { PublicNavbar } from "../../components/shared/PublicNavbar";
import { ShieldPlus, Award, UserCheck, Heart } from "lucide-react";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      <PublicNavbar />
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-100 p-4 rounded-2xl shadow-sm border border-primary-200">
              <ShieldPlus className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            About SkinHealth
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed font-medium">
            Our mission is to democratize access to board-certified
            dermatological care using the power of ethically trained artificial
            intelligence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="flex justify-center mb-4">
              <Award className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Clinical Excellence
            </h3>
            <p className="text-slate-600 text-sm">
              Our AI models are trained on millions of clinically verified
              images and strictly overseen by medical professionals.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="flex justify-center mb-4">
              <UserCheck className="w-8 h-8 text-status-safe" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Patient First
            </h3>
            <p className="text-slate-600 text-sm">
              We believe that anxiety from long wait times is harmful. Instant
              triage helps prioritize care safely.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="flex justify-center mb-4">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Accessibility
            </h3>
            <p className="text-slate-600 text-sm">
              We are breaking down geographic and financial barriers to early
              skin cancer detection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
