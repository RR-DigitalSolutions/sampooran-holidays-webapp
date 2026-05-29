"use client";


import { useSubmitInquiry } from "@workspace/api-client-react";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle, ChevronRight } from "lucide-react";

const DESTINATIONS = ["Himachal Pradesh", "Leh Ladakh", "Kashmir", "Uttarakhand", "Rajasthan", "Goa", "Kerala", "Northeast India", "Thailand", "Bhutan", "Nepal", "Dubai", "Singapore", "Other"];
const BUDGETS = ["Under Rs 10,000/person", "Rs 10,000 - 20,000/person", "Rs 20,000 - 35,000/person", "Rs 35,000 - 50,000/person", "Above Rs 50,000/person"];
const INTERESTS = ["Adventure Sports", "Cultural & Heritage", "Wildlife Safari", "Beach Holiday", "Honeymoon", "Family Trip", "Photography", "Trekking", "Pilgrimage", "Road Trip"];

export default function Customize() {
  const submitInquiry = useSubmitInquiry();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    destination: "", travelDate: "", duration: "5", persons: "2", budget: "",
    interests: [] as string[], hotelCategory: "3-star", transport: "included",
    name: "", phone: "", email: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const toggleInterest = (interest: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest) ? f.interests.filter(i => i !== interest) : [...f.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitInquiry.mutateAsync({
        data: {
          name: form.name, phone: form.phone, email: form.email,
          inquiryType: "customized",
          destination: form.destination,
          travelDate: form.travelDate,
          numberOfPersons: parseInt(form.persons),
          budget: parseFloat(form.budget.replace(/[^0-9]/g, "")) || undefined,
          message: `Customized Package Request: ${form.destination} for ${form.persons} persons, ${form.duration} days, ${form.hotelCategory} hotel, interests: ${form.interests.join(", ")}. ${form.message}`,
        } as any
      });
    } catch {}
    setSubmitted(true);
  };

  return (
    <>
      

      <div className="bg-primary text-white py-14 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl font-serif font-bold mb-4">Build Your Perfect Holiday</h1>
          <p className="text-white/80 text-lg">Tell us your preferences and we'll craft a personalized itinerary exactly the way you want it.</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
            {["Destination", "Preferences", "Contact"].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                  {step > i + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${step === i + 1 ? "font-semibold text-primary" : "text-muted-foreground"}`}>{s}</span>
                {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {submitted ? (
          <div className="text-center py-16">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold text-primary mb-3">Package Request Received!</h2>
            <p className="text-muted-foreground mb-6">Our travel experts are crafting your personalized itinerary. We'll share it with you within 3-4 hours.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/packages"><button className="bg-primary text-white rounded-xl px-6 py-3 font-semibold">Browse Packages</button></Link>
              <a href="tel:+919876543210" className="bg-accent text-accent-foreground rounded-xl px-6 py-3 font-semibold">Call Us Now</a>
            </div>
          </div>
        ) : (
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-primary">Where do you want to go?</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">Choose Destination *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DESTINATIONS.map(d => (
                      <button type="button" key={d} onClick={() => setForm(f => ({ ...f, destination: d }))}
                        className={`p-3 rounded-xl border text-sm font-medium text-left transition-colors ${form.destination === d ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40"}`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="travel-date" className="block text-sm font-medium mb-1">Travel Date *</label>
                    <input id="travel-date" type="date" required className="w-full border rounded-xl px-4 py-3 text-sm" value={form.travelDate} onChange={e => setForm(f => ({ ...f, travelDate: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium mb-1">Duration (Days)</label>
                    <select id="duration" className="w-full border rounded-xl px-4 py-3 text-sm" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                      {[3,4,5,6,7,8,10,12,14,21].map(n => <option key={n} value={n}>{n} Days</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="persons" className="block text-sm font-medium mb-1">No. of Persons</label>
                    <select id="persons" className="w-full border rounded-xl px-4 py-3 text-sm" value={form.persons} onChange={e => setForm(f => ({ ...f, persons: e.target.value }))}>
                      {[1,2,3,4,5,6,7,8,10,15,20,30,50].map(n => <option key={n} value={n}>{n} {n===1?"Person":"Persons"}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={!form.destination || !form.travelDate} className="bg-primary text-white rounded-xl px-8 py-3 font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  Next: Preferences
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-primary">Your Preferences</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">Budget per Person</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BUDGETS.map(b => (
                      <button type="button" key={b} onClick={() => setForm(f => ({ ...f, budget: b }))}
                        className={`p-3 rounded-xl border text-sm font-medium text-left transition-colors ${form.budget === b ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40"}`}
                      >{b}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hotel Category</label>
                  <div className="flex flex-wrap gap-3">
                    {["Budget (2-star)", "Standard (3-star)", "Deluxe (4-star)", "Luxury (5-star)", "Homestay"].map(h => (
                      <button type="button" key={h} onClick={() => setForm(f => ({ ...f, hotelCategory: h }))}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${form.hotelCategory === h ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40"}`}
                      >{h}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Interests (select all that apply)</label>
                  <div className="flex flex-wrap gap-3">
                    {INTERESTS.map(interest => (
                      <button type="button" key={interest} onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${form.interests.includes(interest) ? "border-accent bg-accent/20 text-accent-foreground" : "hover:border-accent/40"}`}
                      >{interest}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="border rounded-xl px-6 py-3 font-semibold hover:bg-secondary transition-colors">Back</button>
                  <button type="submit" className="bg-primary text-white rounded-xl px-8 py-3 font-bold hover:bg-primary/90 transition-colors">Next: Contact Details</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-primary">Your Contact Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="full-name" className="block text-sm font-medium mb-1">Full Name *</label>
                    <input id="full-name" required className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Your Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone *</label>
                    <input id="phone" required className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                  <input id="email" type="email" className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="additional-req" className="block text-sm font-medium mb-1">Additional Requirements</label>
                  <textarea id="additional-req" rows={4} className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Any special requirements, dietary needs, mobility concerns, etc." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-primary mb-2">Your Package Summary:</p>
                  <p>Destination: {form.destination} | {form.duration} Days | {form.persons} Persons | {form.hotelCategory}</p>
                  {form.interests.length > 0 && <p>Interests: {form.interests.join(", ")}</p>}
                  {form.budget && <p>Budget: {form.budget}</p>}
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="border rounded-xl px-6 py-3 font-semibold hover:bg-secondary transition-colors">Back</button>
                  <button type="submit" disabled={submitInquiry.isPending} className="bg-accent text-accent-foreground rounded-xl px-8 py-3 font-bold hover:bg-accent/90 transition-colors flex-1">
                    {submitInquiry.isPending ? "Submitting..." : "Submit Package Request"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
}
