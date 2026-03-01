import { PublicNavbar } from "../../components/shared/PublicNavbar";
import { Shield } from "lucide-react";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      <PublicNavbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div className="flex items-center space-x-3 mb-8 pb-8 border-b border-slate-100">
            <div className="bg-primary-50 p-3 rounded-xl border border-primary-100">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
          </div>
          <div className="prose prose-slate max-w-none">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Last updated: March 2026</p>
      <h3>1. Information We Collect</h3>
      <p>
        We take your medical privacy seriously. When you use the SkinHealth
        Triage platform, we collect the minimum necessary information to provide
        accurate screening services, including submitted photographs, basic
        demographic information, and account details.
      </p>
      <h3>2. How We Use Your Data</h3>
      <p>
        Your data is used strictly for the purpose of medical triage and
        analysis by our AI systems and board-certified dermatologists. We do not
        sell your data under any circumstances.
      </p>
      <h3>3. Data Retention and Security</h3>
      <p>
        All images are automatically deleted from our primary servers after the
        analysis is complete unless you specifically opt-in to save them to your
        secure encrypted patient vault. All databases are end-to-end encrypted
        following HIPAA regulations.
      </p>
    </LegalPage>
  );
}

export function MedicalDisclaimer() {
  return (
    <LegalPage title="Medical Disclaimer">
      <p>Last updated: March 2026</p>
      <h3>Not Medical Advice</h3>
      <p>
        The SkinHealth Triage platform, including its AI analysis and generated
        reports, is designed for educational and informational triage purposes
        only. It is <strong>NOT</strong> a substitute for professional medical
        advice, diagnosis, or treatment.
      </p>
      <h3>Consult a Professional</h3>
      <p>
        Always seek the advice of your physician or other qualified health
        provider with any questions you may have regarding a medical condition.
        Never disregard professional medical advice or delay in seeking it
        because of something you have read on this website.
      </p>
      <h3>Emergency Situations</h3>
      <p>
        If you think you may have a medical emergency, call your doctor or 911
        immediately.
      </p>
    </LegalPage>
  );
}

export function TermsOfUse() {
  return (
    <LegalPage title="Terms of Use">
      <p>Last updated: March 2026</p>
      <h3>1. Acceptance of Terms</h3>
      <p>
        By accessing and using this service, you accept and agree to be bound by
        the terms and provision of this agreement.
      </p>
      <h3>2. User Responsibilities</h3>
      <p>
        You agree to provide accurate information and to only upload images to
        which you hold the rights or have explicit permission to use. You agree
        not to misuse the platform or attempt to bypass any security measures.
      </p>
      <h3>3. Service Limitations</h3>
      <p>
        SkinHealth architecture provides no absolute guarantee of uptime, though
        we strive for 99.9% availability. AI triage results are probabilistic
        and not diagnostic.
      </p>
    </LegalPage>
  );
}
