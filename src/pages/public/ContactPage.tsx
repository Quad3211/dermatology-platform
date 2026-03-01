import { PublicNavbar } from "../../components/shared/PublicNavbar";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "../../components/core/Button";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      <PublicNavbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 text-center">
          Contact Us
        </h1>
        <p className="text-lg text-slate-600 mb-12 text-center max-w-2xl mx-auto">
          Our support team and medical liaisons are available to help you with
          technical issues or platform inquiries.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Send a Message
            </h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="How can we help?"
                ></textarea>
              </div>
              <Button className="w-full">Submit Inquiry</Button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-start space-x-4">
              <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Email Support</h3>
                <p className="text-slate-600">support@skinhealth.example.com</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-start space-x-4">
              <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Phone</h3>
                <p className="text-slate-600">+1 (800) 555-SKIN</p>
                <p className="text-sm text-slate-500 mt-1">
                  Mon-Fri 9am-5pm EST
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-start space-x-4">
              <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Headquarters</h3>
                <p className="text-slate-600">123 Medical Innovation Drive</p>
                <p className="text-slate-600">Boston, MA 02115</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
