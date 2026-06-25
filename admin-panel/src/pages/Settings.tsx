import AdminLayout from "../components/AdminLayout";
import { useState, useEffect } from "react";
import { 
  Save, Globe, Phone, Mail, MapPin, 
  Shield, Key, Bell, Ticket, Share2, 
  Award, RefreshCw, Loader2, Image as ImageIcon,
  BookOpen, HeartHandshake, Laptop
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
  const [activeTab, setActiveTab] = useState<"general" | "social" | "seo" | "rewards">("general");
  
  // Local state for settings grouping
  const [general, setGeneral] = useState({
    siteName: "Sampooran Holidays",
    tagline: "Your Dream Holiday, Planned Perfectly",
    phone: "+91-85955-13009",
    email: "info@sampooranholidays.com",
    address: "Mall Road, Manali, Himachal Pradesh — 175131",
    whatsapp: "918595513009",
    og_banner: "https://sampooranholidays.com/logo.png"
  });

  const [social, setSocial] = useState({
    social_facebook: "https://facebook.com/sampooranholidays",
    social_instagram: "https://instagram.com/sampooranholidays",
    social_youtube: "https://youtube.com/sampooranholidays",
    social_linkedin: "https://linkedin.com/company/sampooranholidays",
  });

  const [seo, setSeo] = useState({
    home: { title: "", description: "", keywords: "" },
    about: { title: "", description: "", keywords: "" },
    b2b: { title: "", description: "", keywords: "" },
    contact: { title: "", description: "", keywords: "" },
    hotels: { title: "", description: "", keywords: "" },
    packages: { title: "", description: "", keywords: "" },
    transport: { title: "", description: "", keywords: "" },
    "travel-guide": { title: "", description: "", keywords: "" },
    "customized-holidays": { title: "", description: "", keywords: "" },
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
      const newGeneral = { ...general };
      const newSocial = { ...social };
      const newEnterprise = { ...enterprise };
      const newSeo = { ...seo };

      items.forEach(item => {
        // General
        if (item.key in newGeneral) {
          (newGeneral as any)[item.key] = item.value;
        }
        // Social
        if (item.key in newSocial) {
          (newSocial as any)[item.key] = item.value;
        }
        // Enterprise
        if (item.key in newEnterprise) {
          (newEnterprise as any)[item.key] = item.value;
        }
        // SEO page metas
        if (item.key.startsWith("meta_")) {
          const pageName = item.key.replace("meta_", "");
          if (pageName in newSeo) {
            try {
              (newSeo as any)[pageName] = JSON.parse(item.value);
            } catch (e) {
              console.error("Failed to parse SEO meta setting", item.key, e);
            }
          }
        }
      });

      setGeneral(newGeneral);
      setSocial(newSocial);
      setEnterprise(newEnterprise);
      setSeo(newSeo);
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
      const settingsPayload: Array<{ key: string; value: string }> = [];

      // 1. General Settings
      Object.entries(general).forEach(([key, value]) => {
        settingsPayload.push({ key, value });
      });

      // 2. Social Links
      Object.entries(social).forEach(([key, value]) => {
        settingsPayload.push({ key, value });
      });

      // 3. Enterprise
      Object.entries(enterprise).forEach(([key, value]) => {
        settingsPayload.push({ key, value });
      });

      // 4. SEO Page Metadata
      Object.entries(seo).forEach(([key, value]) => {
        settingsPayload.push({ key: `meta_${key}`, value: JSON.stringify(value) });
      });
      
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ settings: settingsPayload }),
      });

      if (!res.ok) throw new Error("Save failed");

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
    <AdminLayout title="Settings" subtitle="Configure your platform profiles, marketing, and SEO metadata">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-100 gap-4 mb-6">
        {[
          { id: "general", label: "General & Brand", icon: Globe },
          { id: "social", label: "Socials & OG Banner", icon: Share2 },
          { id: "seo", label: "SEO Page Metadata", icon: BookOpen },
          { id: "rewards", label: "Growth & Rewards", icon: Ticket },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all ${
                activeTab === t.id 
                  ? "border-[#1B3A6B] text-[#1B3A6B]" 
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: General & Brand */}
          {activeTab === "general" && (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-gray-900">General Settings</h3>
                  <p className="text-xs text-gray-500">Public profile & contact info</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Site Name", key: "siteName", icon: Globe, state: general, setState: setGeneral },
                  { label: "Tagline", key: "tagline", icon: Globe, state: general, setState: setGeneral },
                  { label: "Phone", key: "phone", icon: Phone, state: general, setState: setGeneral },
                  { label: "Email", key: "email", icon: Mail, state: general, setState: setGeneral },
                  { label: "WhatsApp Number (Digits Only)", key: "whatsapp", icon: Phone, state: general, setState: setGeneral },
                  { label: "Office Address", key: "address", icon: MapPin, state: general, setState: setGeneral },
                ].map(({ label, key, icon: Icon, state, setState }) => (
                  <div key={key}>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        value={(state as any)[key]}
                        onChange={e => setState({ ...state, [key]: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/10 focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Socials & OG Banner */}
          {activeTab === "social" && (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm space-y-6">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <Share2 className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Social Connections & Banner</h3>
                  <p className="text-xs text-gray-500">Facebook, Instagram, and default OG image link</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Facebook Page URL", key: "social_facebook", state: social, setState: setSocial },
                  { label: "Instagram Profile URL", key: "social_instagram", state: social, setState: setSocial },
                  { label: "YouTube Channel URL", key: "social_youtube", state: social, setState: setSocial },
                  { label: "LinkedIn Company URL", key: "social_linkedin", state: social, setState: setSocial },
                ].map(({ label, key, state, setState }) => (
                  <div key={key}>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
                    <div className="relative">
                      <Share2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        value={(state as any)[key]}
                        onChange={e => setState({ ...state, [key]: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                      />
                    </div>
                  </div>
                ))}

                {/* OG Banner Custom Image URL */}
                <div className="pt-4 border-t border-gray-50">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Default OG Banner Image URL (1200 x 630 px)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      value={general.og_banner}
                      onChange={e => setGeneral({ ...general, og_banner: e.target.value })}
                      placeholder="https://cloudinary.com/..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                    />
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-2xl flex items-center gap-4">
                    <img 
                      src={general.og_banner || "/logo.png"} 
                      alt="OG Preview" 
                      className="w-20 h-12 object-cover rounded-lg border border-gray-200 shrink-0 bg-white"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png" }}
                    />
                    <div className="text-[10px] text-gray-500 leading-normal">
                      This banner represents the social media thumbnail when anyone shares your links on Facebook or WhatsApp.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SEO Page Metadata */}
          {activeTab === "seo" && (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-gray-900">SEO Page Metadata</h3>
                  <p className="text-xs text-gray-500">Configure page-level titles and descriptions for search indexers</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {[
                  { id: "home", label: "Home Page" },
                  { id: "about", label: "About Page" },
                  { id: "b2b", label: "B2B Agent Portal" },
                  { id: "contact", label: "Contact Page" },
                  { id: "hotels", label: "Hotels Search Hub" },
                  { id: "packages", label: "Tour Packages Grid" },
                  { id: "transport", label: "Cabs & Transport Hub" },
                  { id: "travel-guide", label: "Travel Guide Hub" },
                  { id: "customized-holidays", label: "Plan Custom Trip Form" }
                ].map(p => (
                  <div key={p.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wide">{p.label}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">SEO Title</label>
                        <input
                          value={(seo as any)[p.id]?.title || ""}
                          onChange={e => setSeo({
                            ...seo,
                            [p.id]: { ...(seo as any)[p.id], title: e.target.value }
                          })}
                          placeholder="Leave blank for fallback default"
                          className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Keywords</label>
                        <input
                          value={(seo as any)[p.id]?.keywords || ""}
                          onChange={e => setSeo({
                            ...seo,
                            [p.id]: { ...(seo as any)[p.id], keywords: e.target.value }
                          })}
                          placeholder="comma, separated, tags"
                          className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Meta Description</label>
                      <textarea
                        rows={2}
                        value={(seo as any)[p.id]?.description || ""}
                        onChange={e => setSeo({
                          ...seo,
                          [p.id]: { ...(seo as any)[p.id], description: e.target.value }
                        })}
                        placeholder="Limit to 150-160 characters for best display on Google search snippet."
                        className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs bg-white text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Growth & Rewards */}
          {activeTab === "rewards" && (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <Ticket className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Growth & Rewards</h3>
                  <p className="text-xs text-gray-500">Real-time Marketing Controls</p>
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
                      className="w-full pl-9 pr-4 py-4 border border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all bg-gray-50/50 text-slate-800"
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
                        className="w-full pl-4 pr-10 py-3 border border-gray-100 rounded-2xl text-md font-bold focus:outline-none focus:border-primary bg-gray-50/30 text-slate-800"
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
                        className="w-full pl-4 pr-10 py-3 border border-gray-100 rounded-2xl text-md font-bold focus:outline-none focus:border-primary bg-gray-50/30 text-slate-800"
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
                      className="w-full pl-4 pr-10 py-4 border border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all bg-gray-50/50 text-slate-800"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic px-1">Sets the hard cap for all agents regardless of badge.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Side Controls panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-primary/10 overflow-hidden shadow-xl shadow-primary/5 p-6">
            <h3 className="font-bold text-gray-900 mb-2">Settings Operations</h3>
            <p className="text-xs text-gray-500 mb-6">Commit your updates to the live cluster database.</p>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              style={{ background: saved ? "#059669" : "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? "✓ CONFIGS UPDATED" : <><Save className="w-4 h-4" /> COMMIT CHANGES</>}
            </button>
          </div>

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
