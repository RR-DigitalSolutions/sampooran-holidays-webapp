import AdminLayout from "../components/AdminLayout";
import { useState, useEffect } from "react";
import { 
  Save, Globe, Phone, Mail, MapPin, 
  Shield, Key, Bell, Ticket, Share2, 
  Award, RefreshCw, Loader2 
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

interface Setting {
  key: string;
  value: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Local state for settings grouping
  const [general, setGeneral] = useState({
    siteName: "Sampooran Holidays",
    tagline: "Your Dream Holiday, Planned Perfectly",
    phone: "+91-98765-43210",
    email: "info@sampooranholidays.com",
    address: "Mall Road, Manali, Himachal Pradesh — 175131",
    whatsapp: "919876543210",
  });

  const [enterprise, setEnterprise] = useState({
    SIGNUP_BONUS_INR: "1000",
    REFERRAL_PERCENT_REFERRER: "5",
    REFERRAL_PERCENT_REFEREE: "2",
    AGENT_MARKUP_MAX: "25",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch settings");
      const items: Setting[] = await res.json();
      
      // Map DB items to state
      const newEnterprise = { ...enterprise };
      items.forEach(item => {
        if (item.key in newEnterprise) {
          (newEnterprise as any)[item.key] = item.value;
        }
      });
      setEnterprise(newEnterprise);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare payload for DB
      const settingsPayload = Object.entries(enterprise).map(([key, value]) => ({ key, value }));
      
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ settings: settingsPayload }),
      });

      if (!res.ok) throw new Error("Save adjustment failed");

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Settings" subtitle="Loading configurations...">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
           <RefreshCw className="w-8 h-8 animate-spin mb-2" />
           <p className="text-sm font-medium">Syncing with Enterprise Engine...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Configure your platform and marketing parameters">
      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">General Settings</h3>
                <p className="text-xs text-gray-500">Public profile & contact info</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Site Name", key: "siteName", icon: Globe },
                { label: "Tagline", key: "tagline", icon: Globe },
                { label: "Phone", key: "phone", icon: Phone },
                { label: "Email", key: "email", icon: Mail },
                { label: "WhatsApp Number", key: "whatsapp", icon: Phone },
              ].map(({ label, key, icon: Icon }) => (
                <div key={key}>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      value={general[key as keyof typeof general]}
                      onChange={e => setGeneral({ ...general, [key]: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-gray-50/30 transition-all font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Security</h3>
                <p className="text-xs text-gray-500">Credentials Management</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <button className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                <Key className="w-4 h-4" /> Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enterprise & Rewards [DYNAMIC] */}
          <div className="bg-white rounded-3xl border-2 border-primary/10 overflow-hidden shadow-xl shadow-primary/5">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-primary/5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary text-white">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Growth & Rewards</h3>
                <p className="text-xs text-gray-500 text-primary/70 font-medium font-mono">Real-time Marketing Controls</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                   <label className="text-[10px] uppercase font-bold text-gray-400">Signup Bonus (INR)</label>
                   <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">One-time Credit</span>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">₹</div>
                  <input
                    type="number"
                    value={enterprise.SIGNUP_BONUS_INR}
                    onChange={e => setEnterprise({ ...enterprise, SIGNUP_BONUS_INR: e.target.value })}
                    className="w-full pl-9 pr-4 py-4 border border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Referrer Earn (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={enterprise.REFERRAL_PERCENT_REFERRER}
                      onChange={e => setEnterprise({ ...enterprise, REFERRAL_PERCENT_REFERRER: e.target.value })}
                      className="w-full pl-4 pr-10 py-3 border border-gray-100 rounded-2xl text-md font-bold focus:outline-none focus:border-primary bg-gray-50/30"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Referee Earn (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={enterprise.REFERRAL_PERCENT_REFEREE}
                      onChange={e => setEnterprise({ ...enterprise, REFERRAL_PERCENT_REFEREE: e.target.value })}
                      className="w-full pl-4 pr-10 py-3 border border-gray-100 rounded-2xl text-md font-bold focus:outline-none focus:border-primary bg-gray-50/30"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                   <Award className="w-4 h-4 text-primary" />
                   <label className="text-[10px] uppercase font-bold text-gray-400">Agent Max Markup (%)</label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    max="100"
                    value={enterprise.AGENT_MARKUP_MAX}
                    onChange={e => setEnterprise({ ...enterprise, AGENT_MARKUP_MAX: e.target.value })}
                    className="w-full pl-4 pr-10 py-4 border border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all bg-gray-50/50"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 font-bold">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic px-1">Sets the hard cap for all agents regardless of badge.</p>
              </div>
            </div>
            
            <div className="px-6 py-6 bg-primary/5 border-t border-primary/10">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                style={{ background: saved ? "#059669" : "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? "✓ CONFIGS UPDATED" : <><Save className="w-4 h-4" /> COMMIT CHANGES</>}
              </button>
            </div>
          </div>

          {/* Integration Stats */}
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <RefreshCw className="w-24 h-24" />
             </div>
             <h4 className="text-xl font-black mb-1">API Sync Active</h4>
             <p className="text-xs text-gray-400 mb-4">Connected to enterprise cluster `sampooran-holidays-core`</p>
             <button className="text-[10px] font-bold uppercase tracking-widest text-primary bg-white px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
               Force Global Sync
             </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
