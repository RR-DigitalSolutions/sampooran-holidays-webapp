"use client";

import { useSubmitInquiry } from "@workspace/api-client-react";
import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Contact() {
  const submitInquiry = useSubmitInquiry();
  const siteSettings = useSiteSettings();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    destination: "",
    inquiryType: "package",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Build WhatsApp link from settings (digits only + country code)
  const waNumber = siteSettings.whatsapp
    ? siteSettings.whatsapp.replace(/\D/g, "")
    : siteSettings.phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${waNumber}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitInquiry.mutateAsync({
        data: { ...form, message: form.message || "General inquiry" } as any,
      });
    } catch {}
    setSubmitted(true);
  };

  return (
    <>
      {/* Hero */}
      <div className="bg-primary text-white py-14 px-4">
        <div className="container mx-auto">
          <nav className="text-white/70 text-sm mb-4 flex gap-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white">Contact Us</span>
          </nav>
          <h1 className="text-4xl font-serif font-bold mb-2">Contact Us</h1>
          <p className="text-white/80">We're here to help you plan your perfect holiday</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── Info Column ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Get in Touch</h2>
              <div className="space-y-5">

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Phone</p>
                    <a
                      href={`tel:${siteSettings.phone.replace(/[^+\d]/g, "")}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      {siteSettings.phone}
                    </a>
                    {siteSettings.phone2 && (
                      <a
                        href={`tel:${siteSettings.phone2.replace(/[^+\d]/g, "")}`}
                        className="block text-primary/80 text-sm font-medium hover:underline mt-0.5"
                      >
                        {siteSettings.phone2}
                      </a>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Email</p>
                    <a
                      href={`mailto:${siteSettings.email}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      {siteSettings.email}
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Office Address</p>
                    <p className="font-medium">{siteSettings.siteName}</p>
                    <p className="text-muted-foreground text-sm whitespace-pre-line">
                      {siteSettings.address}
                    </p>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Working Hours</p>
                    <p className="text-sm">{siteSettings.supportHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 text-white rounded-2xl p-4 hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-6 w-6 fill-white stroke-white" />
              <div>
                <p className="font-bold">WhatsApp Us</p>
                <p className="text-sm text-green-100">
                  {siteSettings.phone} — Quick Response
                </p>
              </div>
            </a>

            {/* Google Map Embed */}
            {siteSettings.mapEmbedUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-52">
                <iframe
                  src={siteSettings.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location"
                />
              </div>
            )}
          </div>

          {/* ── Inquiry Form ─────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="border rounded-2xl p-8 shadow-lg bg-white">
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Send an Inquiry</h2>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium mb-1">
                        Full Name *
                      </label>
                      <input
                        id="contact-name"
                        required
                        className="w-full border rounded-xl px-4 py-3 text-sm"
                        placeholder="Your Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-medium mb-1">
                        Phone *
                      </label>
                      <input
                        id="contact-phone"
                        required
                        className="w-full border rounded-xl px-4 py-3 text-sm"
                        placeholder="+91 XXXXX XXXXX"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="w-full border rounded-xl px-4 py-3 text-sm"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-type" className="block text-sm font-medium mb-1">
                      Inquiry Type
                    </label>
                    <select
                      id="contact-type"
                      className="w-full border rounded-xl px-4 py-3 text-sm"
                      value={form.inquiryType}
                      onChange={(e) => setForm({ ...form, inquiryType: e.target.value })}
                    >
                      <option value="package">Holiday Package</option>
                      <option value="customized">Customized Package</option>
                      <option value="transport">Transport / Cab</option>
                      <option value="b2b">B2B / Agent Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-destination" className="block text-sm font-medium mb-1">
                      Destination
                    </label>
                    <input
                      id="contact-destination"
                      className="w-full border rounded-xl px-4 py-3 text-sm"
                      placeholder="e.g. Manali, Leh, Kashmir..."
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-1">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      className="w-full border rounded-xl px-4 py-3 text-sm"
                      placeholder="Tell us about your travel plans, group size, dates, budget..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground rounded-xl py-4 font-bold text-base hover:bg-accent/90 transition-colors"
                    disabled={submitInquiry.isPending}
                  >
                    {submitInquiry.isPending ? "Sending..." : "Send Inquiry"}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    We respond within 2 hours. Your data is safe with us.
                  </p>
                </form>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif font-bold text-primary mb-2">
                    Inquiry Received!
                  </h3>
                  <p className="text-muted-foreground">
                    Our travel expert will contact you within 2 hours.
                  </p>
                  <a
                    href={`tel:${siteSettings.phone.replace(/[^+\d]/g, "")}`}
                    className="mt-6 inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-3 font-semibold"
                  >
                    <Phone className="h-4 w-4" />
                    Call Us Now
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
