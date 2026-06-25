import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Sampooran Holidays",
  description: "Learn how Sampooran Holidays collects, protects, and uses your personal information when booking tour packages or visiting our portal.",
};

export default function PrivacyPolicy() {
  return (
    <main className="w-full bg-slate-50 pt-28 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm space-y-8 text-slate-700">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 mb-2">Privacy Policy</h1>
            <p className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Last Updated: June 24, 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed">
              At Sampooran Holidays, we collect personal information when you use our website, mobile application, or book services directly with us. This information includes, but is not limited to:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Contact Details: Name, email address, phone number, and physical billing address.</li>
              <li>Travel Details: Passport details, travel dates, destinations, companion information, and specific dietary or accommodation preferences.</li>
              <li>Payment Details: Payment methods, billing information, transaction histories, and related data (processed securely via our certified payment gateways).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed">
              We process your personal information for specific and limited purposes, including:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Booking & Logistics: Facilitating hotel reservations, transport services, activity tickets, and vendor routing.</li>
              <li>Customer Support: Addressing queries, tracking inquiries, and notifying you about booking modifications or alerts.</li>
              <li>Marketing & Communication: Sending personalized holiday inspirations, seasonal offers, and newsletter subscriptions (where opted-in).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">3. Information Sharing and Disclosure</h2>
            <p className="text-sm leading-relaxed">
              We do not sell, lease, or rent your personal information to third parties. We share your data only with verified vendors and logistics partners (such as hoteliers, airlines, local transport operators) who require this information to fulfill your tour itinerary.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">4. Security Standards</h2>
            <p className="text-sm leading-relaxed">
              We employ industry-standard encryption protocols (SSL/TLS) via our Cloudflare integration and secure server environment to protect your data against unauthorized access, loss, or manipulation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">5. Contact Information</h2>
            <p className="text-sm leading-relaxed">
              For any questions regarding this Privacy Policy or data privacy compliance, please email us at <a href="mailto:info@sampooranholidays.com" className="text-primary font-semibold hover:underline">info@sampooranholidays.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
