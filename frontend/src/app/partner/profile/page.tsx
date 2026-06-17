"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Phone, Building2, MapPin, ShieldCheck, 
  ShieldAlert, Save, AlertCircle, CheckCircle2
} from "lucide-react";
import { useVendorAuth, vendorAuthHeader } from "@/context/VendorAuthContext";
import VendorSidebar from "@/components/VendorSidebar";
import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

export default function VendorProfilePage() {
  const { vendor, token, isLoading, refreshVendor } = useVendorAuth();
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [vendorBusinessName, setVendorBusinessName] = useState("");
  const [vendorBusinessAddress, setVendorBusinessAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/partner/login");
    }
  }, [vendor, isLoading, router]);

  // Populate form with vendor details
  useEffect(() => {
    if (vendor) {
      setName(vendor.name || "");
      setPhoneNumber(vendor.phoneNumber || "");
      setVendorBusinessName(vendor.vendorBusinessName || "");
      setVendorBusinessAddress(vendor.vendorBusinessAddress || "");
      setCompanyName(vendor.companyName || "");
      setGstNumber(vendor.gstNumber || "");
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/vendor/profile`, {
        method: "PATCH",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({
          name,
          phoneNumber,
          vendorBusinessName,
          vendorBusinessAddress,
          companyName,
          gstNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile details");

      setSuccess("Profile details updated successfully!");
      await refreshVendor(); // Update state globally so name and headers update immediately
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-black text-gray-900 text-lg">My Profile</h1>
            <p className="text-xs text-gray-400">Manage account information and business registry details</p>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 text-sm">Save Failed</p>
                  <p className="text-red-700 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-800 text-sm">Success</p>
                  <p className="text-emerald-700 text-xs mt-0.5">{success}</p>
                </div>
              </div>
            )}

            {/* Account Accountability & Verification Details */}
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                Account Status
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {vendor.vendorVerified ? (
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-md border border-amber-100">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      {vendor.vendorVerified ? "Verified Partner Account" : "Verification Pending"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {vendor.vendorVerified 
                        ? "Your properties are live and eligible to accept bookings immediately." 
                        : "Our team is reviewing your vendor registry. Properties will remain in review until approved."}
                    </p>
                  </div>
                </div>
                <div>
                  <span className={`inline-block text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-md ${
                    vendor.vendorVerified 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {vendor.vendorVerified ? "Active" : "Under Review"}
                  </span>
                </div>
              </div>
            </div>

            {/* General Account details */}
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-50 pb-2">
                <User className="w-4 h-4 text-[#1B3A6B]" /> Account Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1B3A6B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address (Read-only)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      disabled
                      value={vendor.email} 
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      value={phoneNumber} 
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +91 9988776655"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1B3A6B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business details */}
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-50 pb-2">
                <Building2 className="w-4 h-4 text-[#1B3A6B]" /> Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Name (Trade/Brand Name)</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={vendorBusinessName} 
                      onChange={e => setVendorBusinessName(e.target.value)}
                      placeholder="e.g. Snowview Retreats"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1B3A6B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Legal Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Snowview Hospitality Pvt Ltd"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1B3A6B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GSTIN (GST Identification Number)</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={gstNumber} 
                      onChange={e => setGstNumber(e.target.value)}
                      placeholder="e.g. 02AAECS3812K1Z9"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1B3A6B] uppercase"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Registered Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <textarea 
                      rows={3}
                      value={vendorBusinessAddress} 
                      onChange={e => setVendorBusinessAddress(e.target.value)}
                      placeholder="Complete physical address of the company head office"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1B3A6B] resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-[#1B3A6B] text-white text-sm font-bold px-6 py-2.5 rounded-md hover:bg-[#0f2548] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
