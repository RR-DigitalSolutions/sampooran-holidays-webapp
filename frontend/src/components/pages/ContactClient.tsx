"use client";


import { useSubmitInquiry } from "@workspace/api-client-react";
import { useState } from "react";

import Link from "next/link";
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react";

export default function Contact() {
  const submitInquiry = useSubmitInquiry();
  const [form, setForm] = useState({ name: "", phone: "", email: "", destination: "", inquiryType: "package", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitInquiry.mutateAsync({ data: { ...form, message: form.message || "General inquiry" } as any });
    } catch {}
    setSubmitted(true);
  };

  return (
    <>
      

      <div className="bg-primary text-white py-14 px-4">
        <div className="container mx-auto">
          <nav className="text-white/70 text-sm mb-4 flex gap-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span><span className="text-white">Contact Us</span>
          </nav>
          <h1 className="text-4xl font-serif font-bold mb-2">Contact Us</h1>
          <p className="text-white/80">We're here to help you plan your perfect holiday</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Get in Touch</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Phone</p>
                    <a href="tel:+919876543210" className="text-primary font-semibold hover:underline">+91-98765-43210</a>
                    <p className="text-sm text-muted-foreground">Mon-Sun, 8 AM to 10 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Email</p>
                    <a href="mailto:info@sampooranholidays.com" className="text-primary font-semibold hover:underline">info@sampooranholidays.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Office Address</p>
                    <p className="font-medium">Sampooran Holidays</p>
                    <p className="text-muted-foreground text-sm">Mall Road, Manali — 175131</p>
                    <p className="text-muted-foreground text-sm">Himachal Pradesh, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Working Hours</p>
                    <p className="text-sm">Monday – Sunday: 8:00 AM – 10:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 text-white rounded-2xl p-4 hover:bg-green-600 transition-colors">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <div>
                <p className="font-bold">WhatsApp Us</p>
                <p className="text-sm text-green-100">+91-98765-43210 — Quick Response</p>
              </div>
            </a>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-3">
            <div className="border rounded-2xl p-8 shadow-lg bg-white">
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Send an Inquiry</h2>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium mb-1">Full Name *</label>
                      <input id="contact-name" required className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-medium mb-1">Phone *</label>
                      <input id="contact-phone" required className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium mb-1">Email</label>
                    <input id="contact-email" type="email" className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="contact-type" className="block text-sm font-medium mb-1">Inquiry Type</label>
                    <select id="contact-type" className="w-full border rounded-xl px-4 py-3 text-sm" value={form.inquiryType} onChange={e => setForm({ ...form, inquiryType: e.target.value })}>
                      <option value="package">Holiday Package</option>
                      <option value="customized">Customized Package</option>
                      <option value="transport">Transport / Cab</option>
                      <option value="b2b">B2B / Agent Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-destination" className="block text-sm font-medium mb-1">Destination</label>
                    <input id="contact-destination" className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="e.g. Manali, Leh, Kashmir..." value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-1">Message</label>
                    <textarea id="contact-message" rows={4} className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Tell us about your travel plans, group size, dates, budget..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full bg-accent text-accent-foreground rounded-xl py-4 font-bold text-base hover:bg-accent/90 transition-colors" disabled={submitInquiry.isPending}>
                    {submitInquiry.isPending ? "Sending..." : "Send Inquiry"}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">We respond within 2 hours. Your data is safe with us.</p>
                </form>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif font-bold text-primary mb-2">Inquiry Received!</h3>
                  <p className="text-muted-foreground">Our travel expert will contact you within 2 hours.</p>
                  <a href="tel:+919876543210" className="mt-6 inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-3 font-semibold">
                    <Phone className="h-4 w-4" />Call Us Now
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
