"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plane, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useVendorAuth } from "@/context/VendorAuthContext";

export default function VendorLoginPage() {
  const { login } = useVendorAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/partner/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-5/12 bg-gradient-to-br from-[#0B1F4E] via-[#1B3A6B] to-[#0f2f5a] p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-0 w-60 h-60 bg-[#F5A623]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F5A623] rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg">SAMPOORAN HOLIDAYS</span>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-black mb-3">
            Welcome Back,<br /><span className="text-[#F5A623]">Partner!</span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            Sign in to manage your properties, rooms, inventory, bookings, and track your revenue in real-time.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/50">
            <p>✦ Manage property listings & rooms</p>
            <p>✦ Update nightly rates & availability</p>
            <p>✦ View & confirm guest bookings</p>
            <p>✦ Track revenue & settlements</p>
          </div>
        </div>
        <div className="relative z-10 pt-6 border-t border-white/10 text-white/30 text-xs">
          Not yet a partner?{" "}
          <Link href="/partner/register" className="text-[#F5A623] font-bold hover:underline">Join for free →</Link>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#1B3A6B] rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-[#1B3A6B]">SAMPOORAN HOLIDAYS</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Partner Sign In</h2>
          <p className="text-gray-500 text-sm mb-8">
            New partner?{" "}
            <Link href="/partner/register" className="text-[#1B3A6B] font-bold hover:underline">Create free account</Link>
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                placeholder="you@yourbusiness.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500">Password</label>
                <Link href="/partner/forgot-password" className="text-xs text-[#1B3A6B] font-medium hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-11 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1B3A6B] to-[#0f2548] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:from-[#0f2548] hover:to-[#061226] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : (
                <>Sign In to Dashboard <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
            <strong>Note:</strong> This portal is for hotel owners and property vendors only. If you are a traveller, please{" "}
            <Link href="/login" className="text-[#1B3A6B] font-bold hover:underline">login here</Link>.
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link href="/" className="hover:underline text-gray-400">← Back to Sampooran Holidays</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
