"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff, Plane, ArrowRight, CheckCircle } from "lucide-react";
import { useVendorAuth } from "@/context/VendorAuthContext";

const PROPERTY_TYPES = ["Hotel", "Resort", "Cottage", "Homestay", "Villa", "Camp", "Hostel", "Apartment"];

export default function VendorRegisterPage() {
  const { register } = useVendorAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    vendorBusinessName: "",
    vendorBusinessAddress: "",
    companyName: "",
    gstNumber: "",
    propertyType: "Hotel",
    agreeTerms: false,
  });

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.agreeTerms) { setError("Please accept the terms and conditions"); return; }
    setLoading(true);
    setError("");
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        vendorBusinessName: form.vendorBusinessName,
        vendorBusinessAddress: form.vendorBusinessAddress,
        companyName: form.companyName,
        gstNumber: form.gstNumber,
      });
      router.push("/partner/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-[#0B1F4E] via-[#1B3A6B] to-[#0f2f5a] p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 bg-[#F5A623] rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg">SAMPOORAN HOLIDAYS</span>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-black mb-4 leading-tight">
            Start Earning<br /><span className="text-[#F5A623]">Today</span>
          </h1>
          <p className="text-white/70 text-lg mb-10">
            Join 1,200+ properties. Free to join, no setup costs, payouts every week.
          </p>
          <div className="space-y-4">
            {["No upfront fees or monthly subscriptions", "Dedicated partner success manager", "Real-time booking & revenue dashboard", "Reach 50,000+ monthly travellers"].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#F5A623] shrink-0" />
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 mt-auto pt-8 border-t border-white/10 text-white/40 text-xs">
          © 2025 Sampooran Holidays. Powered by RRDS.
        </div>
      </div>

      {/* Right Panel — Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#1B3A6B] rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-[#1B3A6B]">SAMPOORAN HOLIDAYS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">Create Partner Account</h2>
            <p className="text-gray-500 text-sm mt-1">
              Already a partner?{" "}
              <Link href="/partner/login" className="text-[#1B3A6B] font-bold hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-0 mb-8">
            {["Account", "Business", "Property"].map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 ${step > i + 1 ? "text-emerald-600" : step === i + 1 ? "text-[#1B3A6B]" : "text-gray-300"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 ${step > i + 1 ? "bg-emerald-600 border-emerald-600 text-white" : step === i + 1 ? "border-[#1B3A6B] text-[#1B3A6B]" : "border-gray-200 text-gray-300"}`}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block">{s}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? "bg-emerald-400" : "bg-gray-100"}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">{error}</div>
          )}

          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => update("name", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Address *</label>
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  placeholder="you@yourbusiness.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                    placeholder="Min. 8 characters" />
                  <button onClick={() => setShowPass(!showPass)} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Mobile Number</label>
                <input type="tel" value={form.phoneNumber} onChange={e => update("phoneNumber", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  placeholder="+91 98765 43210" />
              </div>
              <button onClick={() => {
                if (!form.name || !form.email || !form.password) { setError("Please fill in all required fields."); return; }
                setError(""); setStep(2);
              }} className="w-full bg-[#1B3A6B] text-white font-bold py-3.5 rounded-xl hover:bg-[#0f2548] transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Business / Property Name *</label>
                <input value={form.vendorBusinessName} onChange={e => update("vendorBusinessName", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  placeholder="The Grand Himalayan Resort" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Business Address</label>
                <textarea value={form.vendorBusinessAddress} onChange={e => update("vendorBusinessAddress", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  rows={2} placeholder="Village, Town, District, State" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Company Name</label>
                  <input value={form.companyName} onChange={e => update("companyName", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                    placeholder="Pvt Ltd / LLP etc." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">GST Number</label>
                  <input value={form.gstNumber} onChange={e => update("gstNumber", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                    placeholder="22AAAAA0000A1Z5" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-3.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button onClick={() => { setError(""); setStep(3); }} className="flex-1 bg-[#1B3A6B] text-white font-bold py-3.5 rounded-xl hover:bg-[#0f2548] transition-colors flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Property Type & Terms */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3">Primary Property Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {PROPERTY_TYPES.map(type => (
                    <button key={type} type="button"
                      onClick={() => update("propertyType", type)}
                      className={`p-3 rounded-xl border-2 text-xs font-bold text-center transition-all ${form.propertyType === type ? "border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                      <Building2 className="w-4 h-4 mx-auto mb-1" />
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
                <strong>What happens next?</strong> After registration, you will have immediate access to your dashboard. You can add your properties and submit them for verification. They will go live on the platform once our team reviews and approves the property details.
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreeTerms} onChange={e => update("agreeTerms", e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1B3A6B]" />
                <span className="text-xs text-gray-600">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#1B3A6B] font-bold hover:underline">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-[#1B3A6B] font-bold hover:underline">Privacy Policy</Link>
                  . I confirm that I am authorised to list this property.
                </span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 py-3.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Create Partner Account</>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Have questions?{" "}
            <Link href="/contact" className="text-[#1B3A6B] font-semibold hover:underline">Contact Partner Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
