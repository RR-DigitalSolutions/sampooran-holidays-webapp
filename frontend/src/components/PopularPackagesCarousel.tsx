"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageSquareText, PhoneCall, Sparkles, Send } from "lucide-react";
import { PackageCard } from "./PackageCard";
import { motion } from "framer-motion";
import { useCarouselGuide } from "@/hooks/useCarouselGuide";

export function PopularPackagesCarousel({ packages, loading }: { packages: any[], loading?: boolean }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  });

  const { showHint } = useCarouselGuide({ emblaRef: sectionRef, emblaApi, sectionId: "packages", waitMs: 3000 });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [step, setStep] = useState(1);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryDestination, setInquiryDestination] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [inquiryPersons, setInquiryPersons] = useState("2");
  const [inquiryReqs, setInquiryReqs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Bot & Spam Protection States
  const [honeypot, setHoneypot] = useState("");
  const [honeypot2, setHoneypot2] = useState("");
  const [numA, setNumA] = useState(5);
  const [numB, setNumB] = useState(3);
  const [captchaInput, setCaptchaInput] = useState("");
  const formStartTime = useRef<number | null>(null);

  const generateCaptcha = () => {
    setNumA(Math.floor(Math.random() * 9) + 1);
    setNumB(Math.floor(Math.random() * 9) + 1);
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleInputFocus = () => {
    if (!formStartTime.current) {
      formStartTime.current = Date.now();
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!inquiryName.trim() || !inquiryPhone.trim()) {
        setSubmitError("Name and Phone number are required.");
        return;
      }
      setSubmitError("");
      setStep(2);
    } else if (step === 2) {
      if (!inquiryDestination.trim()) {
        setSubmitError("Destination is required.");
        return;
      }
      setSubmitError("");
      setStep(3);
    }
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setSubmitError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleQuickInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Bot defense: Math captcha validation
    if (parseInt(captchaInput) !== numA + numB) {
      setSubmitError("Incorrect verification answer. Please try again.");
      generateCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inquiryName.trim(),
          phone: inquiryPhone.trim(),
          email: inquiryEmail.trim() || "quickquote@sampooranholidays.com",
          destination: inquiryDestination.trim(),
          travelDate: inquiryDate || "Not Finalized",
          adults: parseInt(inquiryPersons) || 2,
          children: 0,
          inquiryType: "general",
          message: `Source: Homepage Customize Quote Form\nPersons: ${inquiryPersons}\nFinalized Date: ${inquiryDate || "Not Finalized"}\nSpecial Requests: ${inquiryReqs.trim() || "None"}\nValidation: Passed Bot Checks`,
          // Honeypot fields
          website: honeypot,
          address_confirm: honeypot2,
          submitDuration: formStartTime.current ? Date.now() - formStartTime.current : 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry. Please try again.");
      }

      setSubmitSuccess(true);
      setInquiryName("");
      setInquiryPhone("");
      setInquiryEmail("");
      setInquiryDestination("");
      setInquiryDate("");
      setInquiryPersons("2");
      setInquiryReqs("");
      setCaptchaInput("");
      setStep(1);
      formStartTime.current = null;
    } catch (err: any) {
      setSubmitError(err?.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PopularPackagesCarouselSkeleton />;
  if (!packages || packages.length === 0) return null;

  return (
    <div ref={sectionRef} className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white relative overflow-hidden rounded-md border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">

        <div className="relative z-10">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl p-2 md:p-2">
              <div className="flex items-center gap-2">
                <p className="text-accent font-bold text-[9px] md:text-[12px] uppercase tracking-[0.1em] font-sans">Trending Now</p>
              </div>
              <h2 className="text-xl md:text-3xl font-serif font-bold text-primary leading-tight">
                Trending Holiday <span className="text-accent font-light">Packages</span>
              </h2>
              <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm">
                Explore our most sought-after destinations. Handpicked, premium itineraries designed for unforgettable experiences.
              </p>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-col items-end gap-6 pr-2 pb-2">
              <Link
                href="/packages"
                onTouchStart={() => router.prefetch("/packages")}
                onMouseEnter={() => router.prefetch("/packages")}
                className="text-primary font-bold text-sm hover:text-accent flex items-center gap-1.5 group transition-colors"
              >
                All Holiday Packages <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-2">
                <button aria-label="Previous Package" title="Previous Package" onClick={scrollPrev} className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:shadow-sm transition-all focus:outline-none">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button aria-label="Next Package" title="Next Package" onClick={scrollNext} className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:shadow-sm transition-all focus:outline-none">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Embla Carousel */}
          <div className="relative">
            {/* One-time Swipe Hint Pill (MakeMyTrip style) */}
            {showHint && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                  <span>Swipe to explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-2 md:-ml-3 pb-2 pt-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex-[0_0_47%] xs:flex-[0_0_46%] sm:flex-[0_0_46%] lg:flex-[0_0_25%] min-w-0 pl-2 md:pl-3">
                    <PackageCard pkg={pkg} variant="carousel" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Integrated CTA & Inquiry Banner */}
          <div className="mt-4 relative rounded-md overflow-hidden bg-primary shadow-2xl shadow-primary/20">
            {/* Banner Background */}
            <div className="absolute inset-0 bg-primary/20 bg-cover bg-center opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-primary/95" />

            <div className="relative z-10 p-3 sm:p-5 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
              {/* Left: Text Content */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md text-accent text-[9px] sm:text-xs font-bold mb-1 sm:mb-2 backdrop-blur-sm border border-white/10">
                  Customize Your Trip
                </div>
                <h3 className="text-base sm:text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1.5 font-serif">
                  Can't find the <span className="text-accent font-light">Perfect Package?</span>
                </h3>
                <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Let our travel experts craft a personalized itinerary just for you. Get a custom quote within 24 hours!
                </p>
              </div>

              {/* Right: Quick Inquiry Form (Compact Multi-Step Wizard) */}
              <div className="w-full lg:w-[45%] bg-white/5 border border-white/15 p-3 sm:p-4 rounded-lg relative overflow-hidden">
                
                {submitSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mb-2 border border-emerald-500/30">✓</span>
                    <h4 className="text-white text-sm font-bold mb-1">Inquiry Submitted!</h4>
                    <p className="text-slate-300 text-[10.5px]">Our travel experts will contact you shortly.</p>
                    <button onClick={() => setSubmitSuccess(false)} className="mt-3 text-accent text-[10.5px] font-bold hover:underline">
                      Send another inquiry
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleQuickInquirySubmit} className="flex flex-col gap-2">
                    
                    {/* Bot Protection Honeypot fields (hidden) */}
                    <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
                    <input type="text" name="address_confirm" value={honeypot2} onChange={(e) => setHoneypot2(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

                    {/* Step indicator */}
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/50 font-bold border-b border-white/10 pb-1.5 mb-1.5">
                      <span>Step {step} of 3</span>
                      <span className="text-accent">{step === 1 ? "Contact Details" : step === 2 ? "Travel Specs" : "Verify & Submit"}</span>
                    </div>

                    {submitError && (
                      <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] p-1.5 rounded text-center leading-tight">
                        {submitError}
                      </div>
                    )}

                    {/* STEP 1: Basic Contact Details */}
                    {step === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Your Name"
                          required
                          value={inquiryName}
                          onFocus={handleInputFocus}
                          onChange={(e) => setInquiryName(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          required
                          value={inquiryPhone}
                          onFocus={handleInputFocus}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                        />
                        <input
                          type="email"
                          placeholder="Email Address (Optional)"
                          value={inquiryEmail}
                          onFocus={handleInputFocus}
                          onChange={(e) => setInquiryEmail(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                        />
                      </motion.div>
                    )}

                    {/* STEP 2: Destination & Travel Data */}
                    {step === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Destination Location (e.g. Manali, Ladakh)"
                          required
                          value={inquiryDestination}
                          onFocus={handleInputFocus}
                          onChange={(e) => setInquiryDestination(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            placeholder="Travel Date"
                            value={inquiryDate}
                            onFocus={handleInputFocus}
                            onChange={(e) => setInquiryDate(e.target.value)}
                            className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all w-full"
                          />
                          <select
                            value={inquiryPersons}
                            onFocus={handleInputFocus}
                            onChange={(e) => setInquiryPersons(e.target.value)}
                            className="bg-white/10 border border-white/20 text-white/80 px-2 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all w-full"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "10+"].map((n) => (
                              <option key={n} value={n} className="bg-primary text-white">{n} Traveler{n !== 1 ? "s" : ""}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Special Requirements & Verify */}
                    {step === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
                        <textarea
                          placeholder="Special requirements (e.g. 3-star stay, meal package, cab options)..."
                          value={inquiryReqs}
                          onFocus={handleInputFocus}
                          onChange={(e) => setInquiryReqs(e.target.value)}
                          rows={2}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all resize-none"
                        />
                        
                        {/* Interactive bot verification (Math challenge) */}
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded">
                          <span className="text-[10px] text-white/80 font-bold tracking-wider shrink-0 bg-white/10 px-2 py-1 rounded">
                            Solve: {numA} + {numB} = ?
                          </span>
                          <input
                            type="number"
                            required
                            placeholder="Answer"
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-center"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step Navigation Controls */}
                    <div className="flex items-center justify-between gap-2 mt-1 border-t border-white/10 pt-2">
                      {step > 1 ? (
                        <button
                          onClick={handlePrevStep}
                          className="px-3 py-1.5 rounded bg-white/10 text-white font-bold text-[10px] uppercase hover:bg-white/20 transition-all"
                        >
                          Back
                        </button>
                      ) : (
                        <div className="text-white/40 text-[9px] font-bold flex items-center gap-1">
                          <PhoneCall className="w-2.5 h-2.5" /> Call us: <a href="tel:+918595513009" className="text-accent hover:underline">+91 85955 13009</a>
                        </div>
                      )}

                      {step < 3 ? (
                        <button
                          onClick={handleNextStep}
                          className="px-4 py-1.5 rounded bg-accent text-primary font-black text-[10px] uppercase hover:bg-yellow-400 transition-all flex items-center gap-1 shadow-sm"
                        >
                          Next Step
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-1.5 rounded bg-accent text-primary font-black text-[10px] uppercase hover:bg-yellow-400 transition-all flex items-center gap-1 shadow-md disabled:opacity-50"
                        >
                          {isSubmitting ? "Submitting..." : <>Submit Quote <Send className="w-3 h-3" /></>}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>


        </div>
      </section>
    </div>
  );
}

export function PopularPackagesCarouselSkeleton() {
  return (
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="py-8 bg-white relative overflow-hidden rounded-lg border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="px-6">
          <div className="max-w-3xl mb-8">
            <div className="h-4 w-32 bg-slate-100 animate-pulse rounded mb-2" />
            <div className="h-10 w-80 bg-slate-100 animate-pulse rounded mb-4" />
            <div className="h-4 w-full bg-slate-50 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] bg-slate-100 animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
