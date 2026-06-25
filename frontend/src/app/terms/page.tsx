import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Sampooran Holidays",
  description: "Read the terms of service and conditions for booking custom tour packages, cab services, and hotels with Sampooran Holidays.",
};

export default function TermsAndConditions() {
  return (
    <main className="w-full bg-slate-50 pt-28 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm space-y-8 text-slate-700">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 mb-2">Terms & Conditions</h1>
            <p className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Last Updated: June 24, 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">1. Agreement to Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing our portal or booking services with Sampooran Holidays, you agree to comply with and be bound by these Terms and Conditions. Please review them carefully before initiating any booking.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. Bookings, Payments, and Confirmations</h2>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>All holiday bookings are subject to availability at the time of processing.</li>
              <li>A booking is only considered confirmed once the required deposit or full payment has been received and verified by our system, and a confirmation voucher is issued.</li>
              <li>Rates are dynamic and may change due to seasonality, fuel pricing, tax changes, or vendor adjustments.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">3. Cancellation and Refund Policy</h2>
            <p className="text-sm leading-relaxed">
              Cancellations must be requested via email at <a href="mailto:bookings@sampooranholidays.com" className="text-primary font-semibold hover:underline">bookings@sampooranholidays.com</a>. Refunds are calculated based on:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Cancellations 30+ days before departure: 90% refund of package price.</li>
              <li>Cancellations 15–29 days before departure: 50% refund.</li>
              <li>Cancellations under 15 days before departure: No refund.</li>
              <li>Refunds are processed within 7 to 10 working days, subject to hotel/vendor policies.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">4. Liabilities and Force Majeure</h2>
            <p className="text-sm leading-relaxed">
              Sampooran Holidays acts as a travel agent connecting you with transport, hotels, and local experience providers. We are not responsible for any delay, loss, injury, or additional expense caused by landslides, weather conditions, airline delays, strikes, or general Force Majeure events common in mountainous terrains.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">5. Governing Law and Dispute Jurisdiction</h2>
            <p className="text-sm leading-relaxed">
              These terms are governed by the laws of India. Any legal action, dispute, or proceeding arising under these bookings will be settled exclusively within the jurisdiction of the courts of Himachal Pradesh, India.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
