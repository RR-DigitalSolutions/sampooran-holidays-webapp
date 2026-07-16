import AdminLayout from "../components/AdminLayout";
import { useState, useEffect, useRef } from "react";
import { 
  Save, Globe, Phone, Mail, MapPin, 
  Shield, Key, Bell, Ticket, Share2, 
  Award, RefreshCw, Loader2, Image as ImageIcon,
  BookOpen, HeartHandshake, Laptop, Twitter,
  MessageCircle, Hash, Building, FileText, Clock,
  CheckCircle2, X, AlertCircle, Info, ExternalLink,
  Building2, Link as LinkIcon, Plus, Trash2, GripVertical,
  Star, Users, Plane, Edit3, ToggleLeft, ToggleRight
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

interface Setting {
  key: string;
  value: string;
}

// ─── Partner / Association types ─────────────────────────────────────────────
interface OtaPartner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  category: "B2C_OTA" | "B2B_WHOLESALER" | "META_SEARCH" | "OFFLINE_AGENCY";
  isActive: boolean;
}

interface Association {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

interface WhyItem {
  title: string;
  description: string;
}

interface AboutContent {
  foundingYear: string;
  founderName: string;
  missionStatement: string;
  story: string;
  whyChooseUs: WhyItem[];
}

interface PartnerCard {
  title: string;
  subtitle: string;
  detail: string;
  tag: string;
  iconName: string;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function safeJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw || raw.trim() === "") return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

interface ConfirmModalProps {
  isOpen: boolean;
  changes: { label: string; key: string; oldVal: string; newVal: string }[];
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

function ConfirmModal({ isOpen, changes, onConfirm, onCancel, saving }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!saving ? onCancel : undefined}
      />
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#1B3A6B]/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center">
              <Save className="w-5 h-5 text-[#1B3A6B]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Confirm Settings Update</h3>
              <p className="text-[11px] text-gray-500">Review changes before publishing to website</p>
            </div>
          </div>
          {!saving && (
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Changes list */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto">
          {changes.length === 0 ? (
            <div className="flex items-center gap-3 py-4 text-gray-400">
              <Info className="w-5 h-5 shrink-0" />
              <p className="text-sm">No changes detected. All values are the same as before.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                {changes.length} field{changes.length !== 1 ? "s" : ""} will be updated:
              </p>
              {changes.map((c, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{c.label}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 font-semibold">Before</span>
                      <p className="text-gray-500 line-through truncate mt-0.5 font-mono text-[10px]">
                        {c.oldVal || <span className="italic text-gray-300">empty</span>}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-600 font-semibold">After</span>
                      <p className="text-gray-800 font-medium truncate mt-0.5 font-mono text-[10px]">
                        {c.newVal || <span className="italic text-gray-300">empty</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mx-6 mb-4 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            These changes will reflect <strong>live on the website</strong> within ~60 seconds after saving. Contact info, social links, and brand details will update automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Go Back & Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={saving || changes.length === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Confirm & Publish</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "social" | "seo" | "rewards" | "partners">("general");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ label: string; key: string; oldVal: string; newVal: string }[]>([]);

  // ── Snapshot for change detection
  const savedSnapshot = useRef<Record<string, string>>({});

  // ── General Settings State
  const [general, setGeneral] = useState({
    siteName: "Sampooran Holidays",
    tagline: "Your Dream Holiday, Planned Perfectly",
    phone: "+91-85955-13009",
    phone2: "",
    email: "info@sampooranholidays.com",
    whatsapp: "918595513009",
    address: "Mall Road, Manali, Himachal Pradesh — 175131",
    supportHours: "Mon–Sat, 9am–7pm",
    gstNumber: "",
    cinNumber: "",
    mapEmbedUrl: "",
    logoUrl: "",
    og_banner: "https://sampooranholidays.com/logo.png",
  });

  // ── Social Links State
  const [social, setSocial] = useState({
    social_facebook: "https://facebook.com/sampooranholidays",
    social_instagram: "https://instagram.com/sampooranholidays",
    social_youtube: "https://youtube.com/sampooranholidays",
    social_linkedin: "https://linkedin.com/company/sampooranholidays",
    social_twitter: "",
    social_whatsapp_channel: "",
  });

  // ── SEO State
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

  // ── Enterprise / Rewards State
  const [enterprise, setEnterprise] = useState({
    SIGNUP_BONUS_INR: "1000",
    REFERRAL_PERCENT_REFERRER: "5",
    REFERRAL_PERCENT_REFEREE: "2",
    AGENT_MARKUP_MAX: "25",
  });

  // ── OTA Partners State
  const DEFAULT_OTA: OtaPartner[] = [
    { id: "mmt", name: "MakeMyTrip", logoUrl: "", websiteUrl: "https://makemytrip.com", category: "B2C_OTA", isActive: true },
    { id: "goibibo", name: "Goibibo", logoUrl: "", websiteUrl: "https://goibibo.com", category: "B2C_OTA", isActive: true },
    { id: "booking", name: "Booking.com", logoUrl: "", websiteUrl: "https://booking.com", category: "B2C_OTA", isActive: true },
    { id: "agoda", name: "Agoda", logoUrl: "", websiteUrl: "https://agoda.com", category: "META_SEARCH", isActive: true },
    { id: "cleartrip", name: "Cleartrip", logoUrl: "", websiteUrl: "https://cleartrip.com", category: "B2C_OTA", isActive: true },
    { id: "easemytrip", name: "EaseMyTrip", logoUrl: "", websiteUrl: "https://easemytrip.com", category: "B2C_OTA", isActive: true },
    { id: "thomascook", name: "Thomas Cook", logoUrl: "", websiteUrl: "https://thomascook.in", category: "OFFLINE_AGENCY", isActive: true },
    { id: "sotc", name: "SOTC", logoUrl: "", websiteUrl: "https://sotc.in", category: "OFFLINE_AGENCY", isActive: true },
  ];
  const [otaPartners, setOtaPartners] = useState<OtaPartner[]>(DEFAULT_OTA);

  // ── Associations State
  const DEFAULT_ASSOC: Association[] = [
    { id: "iata", name: "IATA", url: "", isActive: true },
    { id: "tafi", name: "TAFI", url: "", isActive: true },
    { id: "otoai", name: "OTOAI", url: "", isActive: true },
    { id: "adtoi", name: "ADTOI", url: "", isActive: true },
  ];
  const [associations, setAssociations] = useState<Association[]>(DEFAULT_ASSOC);

  // ── About Content State
  const DEFAULT_ABOUT: AboutContent = {
    foundingYear: "2014",
    founderName: "",
    missionStatement: "To share the authentic beauty of the Himalayas with the world through genuine, personalised travel experiences.",
    story: "Founded in 2014 in Himachal Pradesh, Sampooran Holidays began with a simple mission: to share the authentic beauty of the Himalayas with the world.",
    whyChooseUs: [
      { title: "Local Expertise", description: "Being based in Himachal, we know the mountains better than anyone else." },
      { title: "Customized Itineraries", description: "We tailor every trip to suit your preferences and budget." },
      { title: "Reliable Transport", description: "Our fleet of well-maintained taxis, tempo travellers, and buses ensures a comfortable journey." },
      { title: "24/7 Support", description: "Our dedicated team is always available to assist you during your trip." },
    ],
  };
  const [aboutContent, setAboutContent] = useState<AboutContent>(DEFAULT_ABOUT);

  // ── Partner Network State
  const DEFAULT_PARTNER_NETWORK: PartnerCard[] = [
    {
      title: "Verified Property Listings",
      subtitle: "Hotel & Resort Partners",
      detail: "List your hotel, resort, or homestay with trusted visibility, faster approvals, and secure payouts in our marketplace.",
      tag: "Property Vendor",
      iconName: "Building2",
      imageSrc: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      imageAlt: "Verified Luxury resort hotel partner property listing",
      ctaLabel: "Register Property",
      ctaHref: "/partner/register",
      secondaryCtaLabel: "Partner Login",
      secondaryCtaHref: "/partner/login"
    },
    {
      title: "Taxi, Tempo & Coach Fleet",
      subtitle: "Transport Operators",
      detail: "Add your vehicles to a verified premium fleet for airport transfers, sightseeing routes, and group travel across the mountains.",
      tag: "Transport Vendor",
      iconName: "Truck",
      imageSrc: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
      imageAlt: "Taxi, coach, and traveler fleet services",
      ctaLabel: "Join Fleet",
      ctaHref: "/transport",
      secondaryCtaLabel: "Call Fleet Desk",
      secondaryCtaHref: "tel:+918595513009"
    },
    {
      title: "B2B Agent Partnerships",
      subtitle: "Travel Trade Network",
      detail: "Grow your agency business with exclusive net rates, marketing support, and a dedicated partner desk for travel agents.",
      tag: "B2B Agents",
      iconName: "Handshake",
      imageSrc: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      imageAlt: "B2B agent travel business networking partnership",
      ctaLabel: "Become an Agent",
      ctaHref: "/b2b",
      secondaryCtaLabel: "Agent Login",
      secondaryCtaHref: "/partner/login"
    }
  ];
  const [partnerNetwork, setPartnerNetwork] = useState<PartnerCard[]>(DEFAULT_PARTNER_NETWORK);

  // ─── Fetch settings on mount ──────────────────────────────────────────────

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch settings");
      const items: Setting[] = await res.json();

      const newGeneral = { ...general };
      const newSocial = { ...social };
      const newEnterprise = { ...enterprise };
      const newSeo = { ...seo };

      items.forEach((item) => {
        if (item.key in newGeneral) (newGeneral as any)[item.key] = item.value;
        if (item.key in newSocial) (newSocial as any)[item.key] = item.value;
        if (item.key in newEnterprise) (newEnterprise as any)[item.key] = item.value;
        if (item.key.startsWith("meta_")) {
          const pageName = item.key.replace("meta_", "");
          if (pageName in newSeo) {
            try { (newSeo as any)[pageName] = JSON.parse(item.value); } catch {}
          }
        }
        if (item.key === "ota_partners") setOtaPartners(safeJson<OtaPartner[]>(item.value, DEFAULT_OTA));
        if (item.key === "associations") setAssociations(safeJson<Association[]>(item.value, DEFAULT_ASSOC));
        if (item.key === "about_content") setAboutContent(safeJson<AboutContent>(item.value, DEFAULT_ABOUT));
        if (item.key === "partner_network") setPartnerNetwork(safeJson<PartnerCard[]>(item.value, DEFAULT_PARTNER_NETWORK));
      });

      setGeneral(newGeneral);
      setSocial(newSocial);
      setEnterprise(newEnterprise);
      setSeo(newSeo);

      // Save snapshot for change detection
      const snap: Record<string, string> = {};
      items.forEach((item) => { snap[item.key] = item.value ?? ""; });
      savedSnapshot.current = snap;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Detect changes and open confirmation modal ───────────────────────────

  const FIELD_LABELS: Record<string, string> = {
    siteName: "Site Name", tagline: "Tagline", phone: "Primary Phone",
    phone2: "Secondary Phone", email: "Email Address", whatsapp: "WhatsApp Number",
    address: "Office Address", supportHours: "Support Hours",
    gstNumber: "GST Number", cinNumber: "CIN Number",
    mapEmbedUrl: "Google Maps Embed URL", logoUrl: "Logo URL", og_banner: "OG Banner Image",
    social_facebook: "Facebook URL", social_instagram: "Instagram URL",
    social_youtube: "YouTube URL", social_linkedin: "LinkedIn URL",
    social_twitter: "Twitter / X URL", social_whatsapp_channel: "WhatsApp Channel URL",
    SIGNUP_BONUS_INR: "Signup Bonus (₹)", REFERRAL_PERCENT_REFERRER: "Referrer Earn %",
    REFERRAL_PERCENT_REFEREE: "Referee Earn %", AGENT_MARKUP_MAX: "Agent Max Markup %",
  };

  const handleCommitClick = () => {
    const allCurrent: Record<string, string> = {
      ...general,
      ...social,
      ...enterprise,
    };

    const changes: typeof pendingChanges = [];
    Object.entries(allCurrent).forEach(([key, newVal]) => {
      const oldVal = savedSnapshot.current[key] ?? "";
      if (String(oldVal) !== String(newVal)) {
        changes.push({
          key,
          label: FIELD_LABELS[key] || key,
          oldVal: String(oldVal),
          newVal: String(newVal),
        });
      }
    });

    // SEO
    Object.entries(seo).forEach(([pageKey, val]) => {
      const dbKey = `meta_${pageKey}`;
      const oldVal = savedSnapshot.current[dbKey] ?? "{}";
      const newVal = JSON.stringify(val);
      if (oldVal !== newVal) {
        changes.push({ key: dbKey, label: `SEO – ${pageKey}`, oldVal, newVal });
      }
    });

    // OTA Partners
    const otaKey = "ota_partners";
    const oldOta = savedSnapshot.current[otaKey] ?? "[]";
    const newOta = JSON.stringify(otaPartners);
    if (oldOta !== newOta) changes.push({ key: otaKey, label: "OTA & Booking Partners", oldVal: oldOta, newVal: newOta });

    // Associations
    const assocKey = "associations";
    const oldAssoc = savedSnapshot.current[assocKey] ?? "[]";
    const newAssoc = JSON.stringify(associations);
    if (oldAssoc !== newAssoc) changes.push({ key: assocKey, label: "Industry Associations", oldVal: oldAssoc, newVal: newAssoc });

    // About Content
    const aboutKey = "about_content";
    const oldAbout = savedSnapshot.current[aboutKey] ?? "{}";
    const newAbout = JSON.stringify(aboutContent);
    if (oldAbout !== newAbout) changes.push({ key: aboutKey, label: "About Page Content", oldVal: oldAbout, newVal: newAbout });

    // Partner Network
    const partnerKey = "partner_network";
    const oldPartner = savedSnapshot.current[partnerKey] ?? "[]";
    const newPartner = JSON.stringify(partnerNetwork);
    if (oldPartner !== newPartner) changes.push({ key: partnerKey, label: "Partner Network (Homepage)", oldVal: oldPartner, newVal: newPartner });

    setPendingChanges(changes);
    setConfirmOpen(true);
  };

  // ─── Actual save ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const settingsPayload: Array<{ key: string; value: string }> = [];
      Object.entries(general).forEach(([key, value]) => settingsPayload.push({ key, value }));
      Object.entries(social).forEach(([key, value]) => settingsPayload.push({ key, value }));
      Object.entries(enterprise).forEach(([key, value]) => settingsPayload.push({ key, value }));
      Object.entries(seo).forEach(([key, value]) =>
        settingsPayload.push({ key: `meta_${key}`, value: JSON.stringify(value) })
      );
      settingsPayload.push({ key: "ota_partners", value: JSON.stringify(otaPartners) });
      settingsPayload.push({ key: "associations", value: JSON.stringify(associations) });
      settingsPayload.push({ key: "about_content", value: JSON.stringify(aboutContent) });
      settingsPayload.push({ key: "partner_network", value: JSON.stringify(partnerNetwork) });

      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ settings: settingsPayload }),
      });

      if (!res.ok) throw new Error("Save failed");

      // Update snapshot
      const newSnap: Record<string, string> = {};
      settingsPayload.forEach((item) => { newSnap[item.key] = item.value; });
      savedSnapshot.current = { ...savedSnapshot.current, ...newSnap };

      setConfirmOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────

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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        changes={pendingChanges}
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
        saving={saving}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-100 gap-4 mb-6 overflow-x-auto">
        {[
          { id: "general", label: "General & Brand", icon: Globe },
          { id: "social", label: "Socials & OG Banner", icon: Share2 },
          { id: "seo", label: "SEO Page Metadata", icon: BookOpen },
          { id: "rewards", label: "Growth & Rewards", icon: Ticket },
          { id: "partners", label: "OTA & Partners", icon: Building2 },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${
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

        {/* ── Main Content Area ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── TAB 1: General & Brand ── */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Brand Identity */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Brand Identity</h3>
                    <p className="text-xs text-gray-500">Site name, tagline, and logo</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: "Site Name", key: "siteName", icon: Globe, placeholder: "Sampooran Holidays" },
                    { label: "Tagline", key: "tagline", icon: Hash, placeholder: "Your Dream Holiday, Planned Perfectly" },
                    { label: "Logo URL (optional)", key: "logoUrl", icon: ImageIcon, placeholder: "https://your-cdn.com/logo.png" },
                    { label: "Default OG Banner URL (1200×630 px)", key: "og_banner", icon: ImageIcon, placeholder: "https://your-cdn.com/og-banner.jpg" },
                  ].map(({ label, key, icon: Icon, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                          value={(general as any)[key]}
                          onChange={(e) => setGeneral({ ...general, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/10 focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                  {/* OG Preview */}
                  {general.og_banner && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-2xl flex items-center gap-4">
                      <img
                        src={general.og_banner}
                        alt="OG Preview"
                        className="w-20 h-12 object-cover rounded-lg border border-gray-200 shrink-0 bg-white"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
                      />
                      <div className="text-[10px] text-gray-500 leading-normal">
                        Social media thumbnail when your links are shared on Facebook, WhatsApp, or LinkedIn.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Contact Information</h3>
                    <p className="text-xs text-gray-500">Phone, email, address — displayed on website header and footer</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: "Primary Phone", key: "phone", icon: Phone, placeholder: "+91-85955-13009", type: "tel" },
                    { label: "Secondary / Alternate Phone", key: "phone2", icon: Phone, placeholder: "+91-XXXXX-XXXXX (optional)", type: "tel" },
                    { label: "Email Address", key: "email", icon: Mail, placeholder: "info@sampooranholidays.com", type: "email" },
                    { label: "WhatsApp Number (digits only, with country code)", key: "whatsapp", icon: MessageCircle, placeholder: "918595513009", type: "tel" },
                    { label: "Support Hours", key: "supportHours", icon: Clock, placeholder: "Mon–Sat, 9am–7pm", type: "text" },
                  ].map(({ label, key, icon: Icon, placeholder, type }) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                          type={type}
                          value={(general as any)[key]}
                          onChange={(e) => setGeneral({ ...general, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/10 focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                  {/* Address (textarea) */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Office Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300" />
                      <textarea
                        rows={2}
                        value={general.address}
                        onChange={(e) => setGeneral({ ...general, address: e.target.value })}
                        placeholder="Mall Road, Manali, Himachal Pradesh — 175131"
                        className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/10 focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800 resize-none"
                      />
                    </div>
                  </div>
                  {/* Map Embed URL */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Google Maps Embed URL (optional)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        value={general.mapEmbedUrl}
                        onChange={(e) => setGeneral({ ...general, mapEmbedUrl: e.target.value })}
                        placeholder="https://www.google.com/maps/embed?pb=..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/10 focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1 ml-1">Paste the src from Google Maps → Share → Embed a map</p>
                  </div>
                </div>
              </div>

              {/* Legal & Compliance */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Legal & Compliance</h3>
                    <p className="text-xs text-gray-500">GST and company registration numbers for invoices and compliance</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "GST Number", key: "gstNumber", icon: Building, placeholder: "22AAAAA0000A1Z5" },
                    { label: "CIN Number", key: "cinNumber", icon: FileText, placeholder: "U63040DL2024PTC000000" },
                  ].map(({ label, key, icon: Icon, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                          value={(general as any)[key]}
                          onChange={(e) => setGeneral({ ...general, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/10 focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Socials & OG Banner ── */}
          {activeTab === "social" && (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <Share2 className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Social Media & Messaging</h3>
                  <p className="text-xs text-gray-500">All links update live in the website footer and header</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Facebook Page URL", key: "social_facebook", color: "text-[#1877F2]", placeholder: "https://facebook.com/yourpage" },
                  { label: "Instagram Profile URL", key: "social_instagram", color: "text-[#E1306C]", placeholder: "https://instagram.com/yourprofile" },
                  { label: "YouTube Channel URL", key: "social_youtube", color: "text-[#FF0000]", placeholder: "https://youtube.com/@yourchannel" },
                  { label: "LinkedIn Company URL", key: "social_linkedin", color: "text-[#0A66C2]", placeholder: "https://linkedin.com/company/yourcompany" },
                  { label: "Twitter / X Profile URL", key: "social_twitter", color: "text-[#1DA1F2]", placeholder: "https://twitter.com/yourhandle (optional)" },
                  { label: "WhatsApp Channel / Community URL", key: "social_whatsapp_channel", color: "text-[#25D366]", placeholder: "https://whatsapp.com/channel/... (optional)" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
                    <div className="relative">
                      <Share2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        value={(social as any)[key]}
                        onChange={(e) => setSocial({ ...social, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-gray-50/30 transition-all font-medium text-slate-800"
                      />
                    </div>
                  </div>
                ))}

                {/* Live preview tip */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 mt-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    These links appear in the website footer's <strong>"Follow Us"</strong> section and the contact bar. Leave a field empty to hide that platform's icon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: SEO Page Metadata ── */}
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
                  { id: "customized-holidays", label: "Plan Custom Trip Form" },
                ].map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wide">{p.label}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">SEO Title</label>
                        <input
                          value={(seo as any)[p.id]?.title || ""}
                          onChange={(e) => setSeo({ ...seo, [p.id]: { ...(seo as any)[p.id], title: e.target.value } })}
                          placeholder="Leave blank for fallback default"
                          className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Keywords</label>
                        <input
                          value={(seo as any)[p.id]?.keywords || ""}
                          onChange={(e) => setSeo({ ...seo, [p.id]: { ...(seo as any)[p.id], keywords: e.target.value } })}
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
                        onChange={(e) => setSeo({ ...seo, [p.id]: { ...(seo as any)[p.id], description: e.target.value } })}
                        placeholder="Limit to 150-160 characters for best Google snippet display."
                        className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs bg-white text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: Growth & Rewards ── */}
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
                    <span className="text-[10px] font-bold text-[#1B3A6B] px-2 py-0.5 bg-[#1B3A6B]/10 rounded-full">One-time Credit</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">₹</div>
                    <input
                      type="number"
                      value={enterprise.SIGNUP_BONUS_INR}
                      onChange={(e) => setEnterprise({ ...enterprise, SIGNUP_BONUS_INR: e.target.value })}
                      className="w-full pl-9 pr-4 py-4 border border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-[#1B3A6B]/5 focus:border-[#1B3A6B] transition-all bg-gray-50/50 text-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Referrer Earn (%)", key: "REFERRAL_PERCENT_REFERRER" },
                    { label: "Referee Earn (%)", key: "REFERRAL_PERCENT_REFEREE" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">{label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={(enterprise as any)[key]}
                          onChange={(e) => setEnterprise({ ...enterprise, [key]: e.target.value })}
                          className="w-full pl-4 pr-10 py-3 border border-gray-100 rounded-2xl text-md font-bold focus:outline-none focus:border-[#1B3A6B] bg-gray-50/30 text-slate-800"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-[#1B3A6B]" />
                    <label className="text-[10px] uppercase font-bold text-gray-400">Agent Max Markup (%)</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      max="100"
                      value={enterprise.AGENT_MARKUP_MAX}
                      onChange={(e) => setEnterprise({ ...enterprise, AGENT_MARKUP_MAX: e.target.value })}
                      className="w-full pl-4 pr-10 py-4 border border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-[#1B3A6B]/5 focus:border-[#1B3A6B] transition-all bg-gray-50/50 text-slate-800"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic px-1">Sets the hard cap for all agents regardless of badge.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: OTA & Partners ── */}
          {activeTab === "partners" && (
            <div className="space-y-6">

              {/* ── OTA Booking Companies ── */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-gray-900">OTA & Booking Companies</h3>
                      <p className="text-xs text-gray-500">Top platforms where your packages are listed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOtaPartners([...otaPartners, {
                      id: uid(), name: "", logoUrl: "", websiteUrl: "",
                      category: "B2C_OTA", isActive: true,
                    }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1B3A6B] bg-[#1B3A6B]/10 rounded-xl hover:bg-[#1B3A6B]/15 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Partner
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {otaPartners.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No OTA partners added yet. Click "Add Partner" to start.</p>
                    </div>
                  )}
                  {otaPartners.map((ota, idx) => (
                    <div key={ota.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30 hover:bg-white transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-300" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Partner #{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOtaPartners(otaPartners.map((o, i) => i === idx ? { ...o, isActive: !o.isActive } : o))}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${ota.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}
                          >
                            {ota.isActive ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                            {ota.isActive ? "Active" : "Hidden"}
                          </button>
                          <button
                            onClick={() => setOtaPartners(otaPartners.filter((_, i) => i !== idx))}
                            className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Company Name *</label>
                          <input
                            value={ota.name}
                            onChange={(e) => setOtaPartners(otaPartners.map((o, i) => i === idx ? { ...o, name: e.target.value } : o))}
                            placeholder="e.g. MakeMyTrip"
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Category</label>
                          <select
                            value={ota.category}
                            onChange={(e) => setOtaPartners(otaPartners.map((o, i) => i === idx ? { ...o, category: e.target.value as any } : o))}
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          >
                            <option value="B2C_OTA">B2C OTA</option>
                            <option value="B2B_WHOLESALER">B2B Wholesaler</option>
                            <option value="META_SEARCH">Meta Search</option>
                            <option value="OFFLINE_AGENCY">Offline Agency</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Website URL</label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                            <input
                              value={ota.websiteUrl}
                              onChange={(e) => setOtaPartners(otaPartners.map((o, i) => i === idx ? { ...o, websiteUrl: e.target.value } : o))}
                              placeholder="https://makemytrip.com"
                              className="w-full pl-9 pr-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Logo URL (optional)</label>
                          <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                            <input
                              value={ota.logoUrl}
                              onChange={(e) => setOtaPartners(otaPartners.map((o, i) => i === idx ? { ...o, logoUrl: e.target.value } : o))}
                              placeholder="https://cdn.example.com/logo.png"
                              className="w-full pl-9 pr-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                            />
                          </div>
                        </div>
                      </div>
                      {ota.logoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={ota.logoUrl} alt={ota.name} className="h-6 object-contain max-w-[80px] border border-gray-100 rounded p-0.5 bg-white"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <span className="text-[9px] text-gray-400">Logo Preview</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Industry Associations ── */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="font-bold text-gray-900">Industry Associations</h3>
                      <p className="text-xs text-gray-500">Shown in the footer "Associated with" badge row</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAssociations([...associations, { id: uid(), name: "", url: "", isActive: true }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Association
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {associations.map((assoc, idx) => (
                    <div key={assoc.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30 flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Association Name</label>
                          <input
                            value={assoc.name}
                            onChange={(e) => setAssociations(associations.map((a, i) => i === idx ? { ...a, name: e.target.value } : a))}
                            placeholder="e.g. IATA"
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Website URL (optional)</label>
                          <input
                            value={assoc.url}
                            onChange={(e) => setAssociations(associations.map((a, i) => i === idx ? { ...a, url: e.target.value } : a))}
                            placeholder="https://iata.org"
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setAssociations(associations.map((a, i) => i === idx ? { ...a, isActive: !a.isActive } : a))}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${assoc.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}
                        >
                          {assoc.isActive ? "Visible" : "Hidden"}
                        </button>
                        <button
                          onClick={() => setAssociations(associations.filter((_, i) => i !== idx))}
                          className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {associations.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No associations added yet.</p>
                  )}
                </div>
              </div>

              {/* ── About Page Content ── */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <Edit3 className="w-5 h-5 text-violet-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">About Page Content</h3>
                    <p className="text-xs text-gray-500">Story, founding details, and "Why Choose Us" points</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Founding Year</label>
                      <input
                        value={aboutContent.foundingYear}
                        onChange={(e) => setAboutContent({ ...aboutContent, foundingYear: e.target.value })}
                        placeholder="2014"
                        className="w-full px-4 py-3 border border-gray-100 rounded-2xl text-sm bg-gray-50/30 text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Founder Name (optional)</label>
                      <input
                        value={aboutContent.founderName}
                        onChange={(e) => setAboutContent({ ...aboutContent, founderName: e.target.value })}
                        placeholder="e.g. Raman Kumar"
                        className="w-full px-4 py-3 border border-gray-100 rounded-2xl text-sm bg-gray-50/30 text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Mission Statement (hero tagline)</label>
                    <textarea
                      rows={2}
                      value={aboutContent.missionStatement}
                      onChange={(e) => setAboutContent({ ...aboutContent, missionStatement: e.target.value })}
                      placeholder="A short mission sentence shown below the page hero title."
                      className="w-full px-4 py-3 border border-gray-100 rounded-2xl text-sm bg-gray-50/30 text-slate-800 focus:outline-none focus:border-[#1B3A6B] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Our Story (full paragraph)</label>
                    <textarea
                      rows={5}
                      value={aboutContent.story}
                      onChange={(e) => setAboutContent({ ...aboutContent, story: e.target.value })}
                      placeholder="Full company story paragraph shown on the About page..."
                      className="w-full px-4 py-3 border border-gray-100 rounded-2xl text-sm bg-gray-50/30 text-slate-800 focus:outline-none focus:border-[#1B3A6B] resize-none"
                    />
                  </div>

                  {/* Why Choose Us items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Why Choose Us Points</label>
                      <button
                        onClick={() => setAboutContent({
                          ...aboutContent,
                          whyChooseUs: [...aboutContent.whyChooseUs, { title: "", description: "" }]
                        })}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl hover:bg-violet-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Point
                      </button>
                    </div>
                    <div className="space-y-3">
                      {aboutContent.whyChooseUs.map((item, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Point #{idx + 1}</span>
                            <button
                              onClick={() => setAboutContent({
                                ...aboutContent,
                                whyChooseUs: aboutContent.whyChooseUs.filter((_, i) => i !== idx)
                              })}
                              className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <input
                              value={item.title}
                              onChange={(e) => setAboutContent({
                                ...aboutContent,
                                whyChooseUs: aboutContent.whyChooseUs.map((w, i) => i === idx ? { ...w, title: e.target.value } : w)
                              })}
                              placeholder="Title (e.g. Local Expertise)"
                              className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 font-semibold focus:outline-none focus:border-[#1B3A6B]"
                            />
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => setAboutContent({
                                ...aboutContent,
                                whyChooseUs: aboutContent.whyChooseUs.map((w, i) => i === idx ? { ...w, description: e.target.value } : w)
                              })}
                              placeholder="Short description..."
                              className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs bg-white text-slate-600 focus:outline-none focus:border-[#1B3A6B] resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Partner Network Section (Homepage) ── */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-[#1B3A6B]" />
                    <div>
                      <h3 className="font-bold text-gray-900">Partner Network (Homepage)</h3>
                      <p className="text-xs text-gray-500">Edit dynamic register & login cards shown in the Partner Network section on Homepage</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPartnerNetwork([...partnerNetwork, {
                      title: "", subtitle: "", detail: "", tag: "",
                      iconName: "Handshake", imageSrc: "", imageAlt: "",
                      ctaLabel: "", ctaHref: "", secondaryCtaLabel: "", secondaryCtaHref: ""
                    }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1B3A6B] bg-[#1B3A6B]/10 rounded-xl hover:bg-[#1B3A6B]/15 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Program Card
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {partnerNetwork.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No partner cards added yet. Click "Add Program Card" to start.</p>
                    </div>
                  )}
                  {partnerNetwork.map((card, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30 hover:bg-white transition-all">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-300" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Card #{idx + 1}</span>
                        </div>
                        <button
                          onClick={() => setPartnerNetwork(partnerNetwork.filter((_, i) => i !== idx))}
                          className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Title *</label>
                          <input
                            value={card.title}
                            onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, title: e.target.value } : c))}
                            placeholder="e.g. Verified Property Listings"
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Subtitle *</label>
                          <input
                            value={card.subtitle}
                            onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, subtitle: e.target.value } : c))}
                            placeholder="e.g. Hotel & Resort Partners"
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Detail / Description *</label>
                          <textarea
                            rows={2}
                            value={card.detail}
                            onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, detail: e.target.value } : c))}
                            placeholder="Briefly describe this partner program..."
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B] resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Tag *</label>
                          <input
                            value={card.tag}
                            onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, tag: e.target.value } : c))}
                            placeholder="e.g. Property Vendor"
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Icon *</label>
                          <select
                            value={card.iconName}
                            onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, iconName: e.target.value } : c))}
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          >
                            <option value="Building2">Building2 (Property/Hotel)</option>
                            <option value="Truck">Truck (Transport/Fleet)</option>
                            <option value="Handshake">Handshake (Partnerships/B2B)</option>
                            <option value="Globe">Globe</option>
                            <option value="Users">Users</option>
                            <option value="Shield">Shield</option>
                            <option value="Award">Award</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Image URL *</label>
                          <input
                            value={card.imageSrc}
                            onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, imageSrc: e.target.value } : c))}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Image Alt Text *</label>
                          <input
                            value={card.imageAlt}
                            onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, imageAlt: e.target.value } : c))}
                            placeholder="Describe the image for accessibility..."
                            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="border border-indigo-50/50 p-2.5 rounded-xl bg-indigo-50/10 space-y-2">
                          <h5 className="text-[9px] font-black uppercase text-indigo-600">Primary CTA Action</h5>
                          <div>
                            <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Button Label *</label>
                            <input
                              value={card.ctaLabel}
                              onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, ctaLabel: e.target.value } : c))}
                              placeholder="e.g. Register Property"
                              className="w-full px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Button Href *</label>
                            <input
                              value={card.ctaHref}
                              onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, ctaHref: e.target.value } : c))}
                              placeholder="e.g. /partner/register"
                              className="w-full px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B] font-mono"
                            />
                          </div>
                        </div>
                        
                        <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/30 space-y-2">
                          <h5 className="text-[9px] font-black uppercase text-slate-500">Secondary CTA Action</h5>
                          <div>
                            <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Button Label *</label>
                            <input
                              value={card.secondaryCtaLabel}
                              onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, secondaryCtaLabel: e.target.value } : c))}
                              placeholder="e.g. Partner Login"
                              className="w-full px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Button Href *</label>
                            <input
                              value={card.secondaryCtaHref}
                              onChange={(e) => setPartnerNetwork(partnerNetwork.map((c, i) => i === idx ? { ...c, secondaryCtaHref: e.target.value } : c))}
                              placeholder="e.g. /partner/login"
                              className="w-full px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B] font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Banner */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  All changes here update the <strong>About page</strong>, <strong>footer associations bar</strong>, and any section that shows OTA partner logos. Click <strong>Commit Changes</strong> (right panel) to publish.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Side Controls ── */}
        <div className="space-y-6">

          {/* Commit Button Panel */}
          <div className="bg-white rounded-3xl border-2 border-[#1B3A6B]/10 overflow-hidden shadow-xl shadow-[#1B3A6B]/5 p-6">
            <h3 className="font-bold text-gray-900 mb-1">Settings Operations</h3>
            <p className="text-xs text-gray-500 mb-4">Review changes before committing to the live database.</p>

            {saveError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-medium">{saveError}</p>
              </div>
            )}

            <button
              onClick={handleCommitClick}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              style={{ background: saved ? "#059669" : "linear-gradient(135deg, #1B3A6B, #2a519b)" }}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saved ? (
                <><CheckCircle2 className="w-5 h-5" /> SETTINGS SAVED!</>
              ) : (
                <><Save className="w-4 h-4" /> COMMIT CHANGES</>
              )}
            </button>
            {saved && (
              <p className="text-[10px] text-emerald-600 font-bold text-center mt-2">✓ Live website will update within 60 seconds</p>
            )}
          </div>

          {/* Live Update Info */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#1B3A6B]" /> What Updates on Site
            </h4>
            <div className="space-y-2">
              {[
                { dot: "bg-emerald-500", text: "Header contact bar phone & email" },
                { dot: "bg-emerald-500", text: "Footer social media icons & links" },
                { dot: "bg-emerald-500", text: "Footer copyright site name" },
                { dot: "bg-emerald-500", text: "WhatsApp click-to-chat button" },
                { dot: "bg-emerald-500", text: "Contact page — all info dynamic" },
                { dot: "bg-blue-500", text: "OG banner for social sharing" },
                { dot: "bg-blue-500", text: "SEO titles & meta descriptions" },
                { dot: "bg-violet-500", text: "About page content & story" },
                { dot: "bg-violet-500", text: "Footer association badges" },
                { dot: "bg-violet-500", text: "OTA partner grid on About page" },
                { dot: "bg-amber-500", text: "Agent markup & referral rewards" },
              ].map(({ dot, text }, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                  <span className="text-[10px] text-gray-500">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* API Sync Panel */}
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-24 h-24" />
            </div>
            <h4 className="text-xl font-black mb-1">API Sync Active</h4>
            <p className="text-xs text-gray-400 mb-4">Connected to enterprise cluster `sampooran-holidays-core`</p>
            <button className="text-[10px] font-bold uppercase tracking-widest text-[#1B3A6B] bg-white px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
              Force Global Sync
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
