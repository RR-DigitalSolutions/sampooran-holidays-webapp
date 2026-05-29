import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Plane, Lock, User, Eye, EyeOff, Shield, Globe, Star } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (!success) {
      setError("Invalid credentials. Please check your username and password.");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[45%] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1F4E 0%, #1B3A6B 50%, #1a4fa3 100%)" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-15%] w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #F5A623, transparent)" }} />
          <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow">
              <Plane className="w-6 h-6 text-[#F5A623]" />
            </div>
            <div>
              <span className="font-bold text-white text-xl block" style={{ fontFamily: "'Poppins', sans-serif" }}>Sampooran</span>
              <span className="text-[#F5A623] text-xs font-bold tracking-widest">HOLIDAYS — ADMIN</span>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 my-auto">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Manage Your<br />
            <span style={{ color: "#F5A623" }}>Travel Empire</span><br />
            From Here.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            A powerful CMS to manage packages, destinations, inquiries, and content — all from one place.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Globe, label: "Destinations", val: "50+" },
              { icon: Plane, label: "Packages", val: "200+" },
              { icon: Star, label: "Happy Clients", val: "5k+" },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <Icon className="w-5 h-5 text-[#F5A623] mx-auto mb-2" />
                <div className="text-white font-bold text-xl">{val}</div>
                <div className="text-white/50 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Shield className="w-3 h-3" />
            <span>Secured with end-to-end JWT authentication</span>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1B3A6B, #1a4fa3)" }}>
                <Plane className="w-5 h-5 text-[#F5A623]" />
              </div>
              <span className="font-bold text-[#1B3A6B] text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>Sampooran Admin</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8" style={{ boxShadow: "0 20px 60px rgba(27,58,107,0.12)" }}>
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your admin dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50"
                    style={{ "--tw-ring-color": "#1B3A6B" } as any}
                    onFocus={e => { e.target.style.boxShadow = "0 0 0 2px #1B3A6B33"; e.target.style.borderColor = "#1B3A6B"; }}
                    onBlur={e => { e.target.style.boxShadow = ""; e.target.style.borderColor = ""; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50"
                    onFocus={e => { e.target.style.boxShadow = "0 0 0 2px #1B3A6B33"; e.target.style.borderColor = "#1B3A6B"; }}
                    onBlur={e => { e.target.style.boxShadow = ""; e.target.style.borderColor = ""; }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all shadow-lg disabled:opacity-70"
                style={{
                  background: loading ? "#93a3c4" : "linear-gradient(135deg, #1B3A6B, #2a519b)",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(27,58,107,0.35)"
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign In to Dashboard"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              🔒 This area is restricted to authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
