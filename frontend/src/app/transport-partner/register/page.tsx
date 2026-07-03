"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, ShieldAlert, Award, CreditCard, Truck, ArrowRight,
  ArrowLeft, CheckCircle2, CloudLightning, BadgeAlert, AlertCircle
} from "lucide-react";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { API_BASE } from "@/context/AuthContext";

export default function TransporterRegister() {
  const router = useRouter();
  const { register: authRegister, token } = useVendorAuth();
  
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [form, setForm] = useState({
    // Account Signup
    name: "",
    email: "",
    password: "",
    phone: "",

    // Step 1: Business Profile
    businessName: "",
    businessType: "PROPRIETORSHIP",
    alternatePhone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    pincode: "",

    // Step 2: KYC Documents
    gstNumber: "",
    panNumber: "",
    gstCertificateUrl: "https://cloudinary.com/sample_gst.pdf", // mocks for now
    panCardUrl: "https://cloudinary.com/sample_pan.pdf",
    businessRegistrationUrl: "",
    addressProofUrl: "",

    // Step 3: Operations & Fleets
    operatingSince: "2020",
    operatingCities: "Delhi, Manali, Shimla, Chandigarh",
    vehicleTypes: ["CAB"], // CAB | TEMPO_TRAVELLER | BUS | LUXURY

    // Step 4: Banking Payout
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankName: "",

    // Step 5: First Vehicle Registration
    vehicleName: "",
    vehicleType: "CAB",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "2022",
    vehicleRegistrationNumber: "",
    vehicleSeatingCapacity: "4",
    vehicleBasePricePerDay: "3000",
    vehicleBasePricePerKm: "14",
    vehicleIsAC: true,
  });

  const nextStep = () => {
    // Simple checks per step
    if (step === 1 && (!form.name || !form.email || !form.password || !form.businessName || !form.phone)) {
      setErrorMsg("Please fill in all account credentials and business name.");
      return;
    }
    setErrorMsg("");
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep(prev => prev - 1);
  };

  const handleCheckbox = (type: string) => {
    setForm(prev => {
      const types = prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type];
      return { ...prev, vehicleTypes: types };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Sign up user account as a TRANSPORTER
      const registerRes = await fetch(`${API_BASE}/auth/vendor/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phoneNumber: form.phone,
          vendorBusinessName: form.businessName,
          vendorBusinessAddress: form.address,
          role: "TRANSPORTER",
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) throw new Error(registerData.error || "Failed to create transporter account");
      const activeToken = registerData.token;

      // 2. Submit Transporter Detailed Business Profile & KYC
      const profileRes = await fetch(`${API_BASE}/vendor/transport/profile`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: form.businessName,
          businessType: form.businessType,
          phone: form.phone,
          alternatePhone: form.alternatePhone,
          email: form.email,
          website: form.website,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          gstNumber: form.gstNumber,
          panNumber: form.panNumber,
          gstCertificateUrl: form.gstCertificateUrl,
          panCardUrl: form.panCardUrl,
          businessRegistrationUrl: form.businessRegistrationUrl,
          addressProofUrl: form.addressProofUrl,
          operatingSince: Number(form.operatingSince),
          operatingCities: form.operatingCities.split(",").map(c => c.trim()),
          vehicleTypes: form.vehicleTypes,
          bankAccountName: form.bankAccountName,
          bankAccountNumber: form.bankAccountNumber,
          bankIfscCode: form.bankIfscCode,
          bankName: form.bankName,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error || "Failed to submit business credentials");

      // 3. Register First Fleet Vehicle (Step 5)
      const vehicleRes = await fetch(`${API_BASE}/vendor/transport/vehicles`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.vehicleName || `${form.vehicleMake} ${form.vehicleModel}`,
          type: form.vehicleType,
          make: form.vehicleMake,
          model: form.vehicleModel,
          year: Number(form.vehicleYear),
          registrationNumber: form.vehicleRegistrationNumber,
          seatingCapacity: Number(form.vehicleSeatingCapacity),
          basePricePerDay: Number(form.vehicleBasePricePerDay),
          basePricePerKm: Number(form.vehicleBasePricePerKm),
          isAC: form.vehicleIsAC,
        }),
      });

      const vehicleData = await vehicleRes.json();
      if (!vehicleRes.ok) throw new Error(vehicleData.error || "Failed to register first vehicle profile");

      // Sync active state in browser local storage and redirect
      localStorage.setItem("sh_vendor_token", JSON.stringify({ token: activeToken }));
      router.push("/transport-partner/dashboard");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "An unexpected registration error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between py-12 px-6">
      <div className="max-w-2xl w-full mx-auto bg-slate-950 border border-slate-850 p-8 rounded-3xl backdrop-blur relative shadow-xl">
        
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
          {[
            { step: 1, icon: FileText, label: "Business" },
            { step: 2, icon: ShieldAlert, label: "KYC Check" },
            { step: 3, icon: Award, label: "Operating" },
            { step: 4, icon: CreditCard, label: "Payouts" },
            { step: 5, icon: Truck, label: "First Asset" }
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-1 flex-1 text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s.step ? "bg-amber-400 text-slate-900" : "bg-slate-800 text-slate-500"
              }`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] hidden sm:block ${step >= s.step ? "text-amber-400 font-bold" : "text-slate-500"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs rounded-xl p-3.5 flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Step 1: Account & Business Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white mb-2">Transporter Business Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Company / Fleet Name *</label>
                  <input required value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value, name: e.target.value})}
                    placeholder="e.g. Himalayan Cabs Association" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Business Type</label>
                  <select value={form.businessType} onChange={e => setForm({...form, businessType: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none">
                    <option value="PROPRIETORSHIP">Proprietorship</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="PRIVATE_LTD">Private Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="INDIVIDUAL">Individual Owner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Login Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="e.g. operations@agency.com" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Account Password *</label>
                  <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Min 6 characters" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Primary Mobile *</label>
                  <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="10-digit phone" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Alternate Phone</label>
                  <input value={form.alternatePhone} onChange={e => setForm({...form, alternatePhone: e.target.value})}
                    placeholder="Optional alternate" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Registered Address *</label>
                <input required value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">City *</label>
                  <input required value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State *</label>
                  <input required value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                    placeholder="e.g. Himachal" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pincode *</label>
                  <input required value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: KYC Check */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white mb-2">Transporter Verification Documents</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                We verify standard tax registration records to secure premium client travel approvals.
              </p>
              <div>
                <label className="block text-slate-400 mb-1">GST Identification Number (GSTIN)</label>
                <input value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})}
                  placeholder="e.g. 02AAACH1234F1Z9" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Permanent Account Number (PAN)</label>
                <input value={form.panNumber} onChange={e => setForm({...form, panNumber: e.target.value})}
                  placeholder="e.g. AAACH1234F" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
              </div>
            </div>
          )}

          {/* Step 3: Operations details */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white mb-2">Logistical Scope</h3>
              <div>
                <label className="block text-slate-400 mb-1">Active Cities of Operation (Comma separated)</label>
                <input value={form.operatingCities} onChange={e => setForm({...form, operatingCities: e.target.value})}
                  placeholder="Delhi, Chandigarh, Manali" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Year Established</label>
                <input value={form.operatingSince} onChange={e => setForm({...form, operatingSince: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-400 mb-2 font-bold">Supported Vehicle Ranges</label>
                <div className="grid grid-cols-2 gap-3">
                  {["CAB", "TEMPO_TRAVELLER", "BUS", "LUXURY"].map((t) => (
                    <label key={t} className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700">
                      <input type="checkbox" checked={form.vehicleTypes.includes(t)} onChange={() => handleCheckbox(t)}
                        className="rounded border-slate-700 text-amber-500 bg-slate-900 focus:ring-transparent w-4.5 h-4.5" />
                      <span>{t.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Banking Payout details */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white mb-2">Banking settlements Details</h3>
              <p className="text-slate-400 text-[11px] mb-4">Payouts are settled directly to this corporate or individual bank account.</p>
              <div>
                <label className="block text-slate-400 mb-1">Account Holder Name</label>
                <input value={form.bankAccountName} onChange={e => setForm({...form, bankAccountName: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Account Number</label>
                  <input value={form.bankAccountNumber} onChange={e => setForm({...form, bankAccountNumber: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Bank IFSC Code</label>
                  <input value={form.bankIfscCode} onChange={e => setForm({...form, bankIfscCode: e.target.value})}
                    placeholder="e.g. SBIN0001234" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Bank Name</label>
                <input value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})}
                  placeholder="e.g. State Bank of India" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
              </div>
            </div>
          )}

          {/* Step 5: First Fleet Asset */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white mb-2">First Fleet Asset Registry</h3>
              <p className="text-slate-400 text-[11px]">Declare a vehicle in your active fleet to publish immediately upon audit.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Make</label>
                  <input value={form.vehicleMake} onChange={e => setForm({...form, vehicleMake: e.target.value})}
                    placeholder="e.g. Toyota" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Model</label>
                  <input value={form.vehicleModel} onChange={e => setForm({...form, vehicleModel: e.target.value})}
                    placeholder="e.g. Innova Crysta" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Seating Capacity</label>
                  <input type="number" value={form.vehicleSeatingCapacity} onChange={e => setForm({...form, vehicleSeatingCapacity: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Price / Day</label>
                  <input type="number" value={form.vehicleBasePricePerDay} onChange={e => setForm({...form, vehicleBasePricePerDay: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Price / KM</label>
                  <input type="number" value={form.vehicleBasePricePerKm} onChange={e => setForm({...form, vehicleBasePricePerKm: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Registration Number</label>
                  <input value={form.vehicleRegistrationNumber} onChange={e => setForm({...form, vehicleRegistrationNumber: e.target.value})}
                    placeholder="e.g. HP-01-A-1234" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Air Conditioning</label>
                  <select value={form.vehicleIsAC ? "true" : "false"} onChange={e => setForm({...form, vehicleIsAC: e.target.value === "true"})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4.5 py-3 text-white focus:outline-none">
                    <option value="true">A/C Cabin</option>
                    <option value="false">Non A/C</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-800 mt-8">
            {step > 1 ? (
              <button type="button" onClick={prevStep}
                className="flex items-center gap-1.5 px-5 py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <Link href="/transport-partner" className="text-slate-400 hover:text-slate-300 font-medium">Cancel Registration</Link>
            )}

            {step < 5 ? (
              <button type="button" onClick={nextStep}
                className="flex items-center gap-1.5 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all ml-auto">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex items-center gap-1.5 px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black rounded-xl transition-all shadow-md ml-auto disabled:opacity-50">
                {loading ? "Registering Enterprise..." : "Publish Fleet & Console"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
