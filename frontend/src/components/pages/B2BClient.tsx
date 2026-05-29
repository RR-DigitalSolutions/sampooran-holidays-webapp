"use client";


import { useSubmitInquiry } from "@workspace/api-client-react";
import {  } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Users, TrendingUp, Shield, Phone, Handshake } from "lucide-react";
import { useState } from "react";

export default function B2B() {
  const submitInquiry = useSubmitInquiry();
  const [form, setForm] = useState({ name: "", phone: "", email: "", company: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitInquiry.mutateAsync({
        data: {
          name: form.name, phone: form.phone, email: form.email,
          inquiryType: "b2b",
          message: `B2B Partnership Inquiry from ${form.company}: ${form.message}`,
        } as any
      });
    } catch {}
    setSubmitted(true);
  };

  const benefits = [
    { icon: TrendingUp, title: "Attractive Commission", desc: "Earn up to 15% commission on every confirmed booking from your clients." },
    { icon: Shield, title: "Exclusive B2B Rates", desc: "Special net rates on all Himachal, Ladakh, Kashmir, and Asia packages." },
    { icon: Users, title: "Dedicated Partner Manager", desc: "A dedicated relationship manager available 7 days a week for your queries." },
    { icon: Handshake, title: "Co-branding Support", desc: "Customizable itineraries with your agency branding on documents and vouchers." },
  ];

  return (
    <>
      

      <div className="bg-primary text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="inline-block bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">TRADE PARTNERS</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">B2B Travel Agent Portal</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">Join our network of 500+ travel agents across India. Earn great commissions, get exclusive rates, and deliver unforgettable Himalayan holidays to your clients.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-accent/10 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[["500+", "Agent Partners"], ["15%", "Max Commission"], ["120+", "Packages"], ["12+", "Years Experience"]].map(([val, label]) => (
              <div key={label}>
                <div className="text-3xl font-bold text-primary">{val}</div>
                <div className="text-muted-foreground text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-12">
            {/* Benefits */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-primary mb-8">Why Partner With Us?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {benefits.map((b, i) => (
                  <div key={i} className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <b.icon className="h-8 w-8 text-accent mb-3" />
                    <h3 className="font-semibold text-primary mb-2">{b.title}</h3>
                    <p className="text-muted-foreground text-sm">{b.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Commission */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Commission Structure</h2>
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="text-left p-3">Package Type</th>
                      <th className="text-center p-3">Commission</th>
                      <th className="text-center p-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Himachal Packages", "Up to 12%", "On Confirmation"],
                      ["Ladakh / J&K Packages", "Up to 12%", "On Confirmation"],
                      ["International / Asia", "Up to 15%", "On Confirmation"],
                      ["Transport / Cab", "Up to 10%", "On Completion"],
                      ["Group Bookings (10+)", "15% + Bonus", "On Confirmation"],
                    ].map(([type, comm, payment], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-secondary"}>
                        <td className="p-3 font-medium">{type}</td>
                        <td className="p-3 text-center font-bold text-primary">{comm}</td>
                        <td className="p-3 text-center text-muted-foreground">{payment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* How it works */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">How to Join</h2>
              <div className="space-y-4">
                {["Register your agency by filling the form below", "Our B2B team will verify and activate your account within 24 hours", "Access exclusive net rates and customizable packages", "Share with your clients and earn commissions on every confirmed booking"].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</div>
                    <p className="mt-1.5 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="border rounded-2xl p-6 shadow-lg sticky top-24 bg-white">
              <h3 className="text-xl font-serif font-bold text-primary mb-4">Register as B2B Partner</h3>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Contact Person Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input required className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  <input type="email" className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <input className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Agency / Company Name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                  <textarea rows={4} className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Tell us about your agency (location, volume, specialization...)" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                  <button type="submit" className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary/90 transition-colors" disabled={submitInquiry.isPending}>
                    {submitInquiry.isPending ? "Sending..." : "Register Now"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-green-700">Registration Submitted!</p>
                  <p className="text-sm text-muted-foreground mt-1">Our B2B team will contact you within 24 hours.</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-primary">
                <Phone className="h-4 w-4" />
                <a href="tel:+919876543210" className="font-semibold hover:underline">+91-98765-43210</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
