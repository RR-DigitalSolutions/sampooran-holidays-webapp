import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Edit, Trash2, Globe, MapPin, Mountain,
  BookOpen, Save, X, Loader2, Eye, EyeOff, CheckCircle,
  XCircle, Info, FileText, Star, ChevronDown, ChevronUp,
} from "lucide-react";
import { customFetch } from "../utils/api";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type EntityType = "country" | "state" | "place";

interface TravelGuide {
  id: number;
  slug: string;
  title: string;
  entityType: EntityType;
  entityId?: number;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  shortDescription?: string;
  fullContent?: string;
  bestTimeToVisit?: string;
  howToReach?: string;
  nearestAirport?: string;
  nearestRailway?: string;
  localLanguage?: string;
  currency?: string;
  timezone?: string;
  highlights?: string[];
  thingsToDo?: string[];
  topAttractions?: string[];
  localCuisine?: string[];
  activities?: string[];
  festivals?: string[];
  famousFor?: string[];
  packingList?: string[];
  travelTips?: string[];
  historyAndCulture?: string;
  geography?: string;
  weatherAndClimate?: string;
  transportation?: string;
  currencyAndPayments?: string;
  languageAndCommunication?: string;
  localEtiquette?: string;
  healthTips?: string;
  safetyInfo?: string;
  emergencyNumbers?: string;
  shopping?: string;
  visaInfo?: string;
  faqs?: { question: string; answer: string }[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished: boolean;
  displayOrder: number;
}

// ─── FIELD HELPERS ─────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChange, placeholder = "", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">{label}</label>
      <input
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 bg-white transition"
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows = 4, placeholder = "", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">{label}</label>
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 bg-white transition resize-none"
      />
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="col-span-2 flex items-center gap-2 border-t border-gray-100 pt-5 mt-2">
      <Icon className="w-4 h-4 text-[#1B3A6B]" />
      <h3 className="font-bold text-[#1B3A6B] text-sm uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function MediaUploadField({ label, value, onChange, className = "", folder = "travel-guides" }: {
  label: string; value: string; onChange: (v: string) => void; className?: string; folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const stored = localStorage.getItem("sh_admin_token");
      let token = "";
      if (stored) { try { token = JSON.parse(stored).token; } catch { } }
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/media/upload?folder=${folder}`, {
        method: "POST",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
      toast.success("Uploaded ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload");
    } finally { setUploading(false); }
  };
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="URL or upload..." className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl cursor-pointer text-sm font-bold min-w-[90px]">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
          <input type="file" className="hidden" accept="image/*,video/mp4" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

// ─── FAQ EDITOR ────────────────────────────────────────────────────────────────

function FaqEditor({ faqs, onChange }: { faqs: { question: string; answer: string }[]; onChange: (v: any[]) => void }) {
  const add = () => onChange([...faqs, { question: "", answer: "" }]);
  const remove = (i: number) => onChange(faqs.filter((_, idx) => idx !== i));
  const update = (i: number, field: "question" | "answer", val: string) => {
    const updated = [...faqs];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };
  return (
    <div className="col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">FAQs (Traveller Q&A)</label>
        <button onClick={add} className="flex items-center gap-1 text-xs font-bold text-[#1B3A6B] px-3 py-1.5 rounded-lg border border-[#1B3A6B]/20 hover:bg-blue-50 transition">
          <Plus className="w-3 h-3" /> Add FAQ
        </button>
      </div>
      {faqs.map((faq, i) => (
        <div key={i} className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2 relative">
          <button onClick={() => remove(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
            <X className="w-3.5 h-3.5" />
          </button>
          <input
            value={faq.question}
            onChange={e => update(i, "question", e.target.value)}
            placeholder={`Q${i + 1}: e.g. What is the best time to visit?`}
            className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white font-medium"
          />
          <textarea
            value={faq.answer}
            onChange={e => update(i, "answer", e.target.value)}
            placeholder="Answer..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white resize-none"
          />
        </div>
      ))}
      {faqs.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
          No FAQs yet. Click "Add FAQ" to add traveller Q&A.
        </p>
      )}
    </div>
  );
}

// ─── COLLAPSIBLE SECTION ──────────────────────────────────────────────────────

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="col-span-2 border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-bold text-gray-700 text-sm">
          <Icon className="w-4 h-4 text-[#1B3A6B]" />
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="p-5 grid grid-cols-2 gap-4 bg-white">{children}</div>}
    </div>
  );
}

// ─── GUIDE FORM MODAL ─────────────────────────────────────────────────────────

function GuideFormModal({ item, countries, states, places, onClose, onSave }: {
  item?: TravelGuide;
  countries: any[];
  states: any[];
  places: any[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!item?.id;
  const arrStr = (v: any) => Array.isArray(v) ? v.join("\n") : (v || "");

  const getInitial = (): Record<string, any> => ({
    title: "", slug: "", entityType: "place", entityId: "",
    heroImageUrl: "", heroVideoUrl: "", shortDescription: "",
    fullContent: "", bestTimeToVisit: "", howToReach: "",
    nearestAirport: "", nearestRailway: "", localLanguage: "",
    currency: "", timezone: "", visaInfo: "",
    highlights: "", thingsToDo: "", topAttractions: "", localCuisine: "",
    activities: "", festivals: "", famousFor: "", packingList: "", travelTips: "",
    historyAndCulture: "", geography: "", weatherAndClimate: "",
    transportation: "", currencyAndPayments: "", languageAndCommunication: "",
    localEtiquette: "", healthTips: "", safetyInfo: "", emergencyNumbers: "", shopping: "",
    faqs: [],
    metaTitle: "", metaDescription: "", metaKeywords: "",
    isPublished: false, displayOrder: 0,
    ...(item ? {
      ...item,
      highlights: arrStr(item.highlights),
      thingsToDo: arrStr(item.thingsToDo),
      topAttractions: arrStr(item.topAttractions),
      localCuisine: arrStr(item.localCuisine),
      activities: arrStr(item.activities),
      festivals: arrStr(item.festivals),
      famousFor: arrStr(item.famousFor),
      packingList: arrStr(item.packingList),
      travelTips: arrStr(item.travelTips),
      faqs: Array.isArray(item.faqs) ? item.faqs : [],
      entityId: item.entityId || "",
    } : {}),
  });

  const [form, setForm] = useState<Record<string, any>>(getInitial);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const entityOptions = form.entityType === "country" ? countries
    : form.entityType === "state" ? states
    : places;

  const save = async () => {
    if (!form.title?.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const toArr = (v: string) => v ? v.split("\n").map(s => s.trim()).filter(Boolean) : [];
      const payload: any = {
        ...form,
        entityId: form.entityId ? Number(form.entityId) : null,
        highlights: toArr(form.highlights),
        thingsToDo: toArr(form.thingsToDo),
        topAttractions: toArr(form.topAttractions),
        localCuisine: toArr(form.localCuisine),
        activities: toArr(form.activities),
        festivals: toArr(form.festivals),
        famousFor: toArr(form.famousFor),
        packingList: toArr(form.packingList),
        travelTips: toArr(form.travelTips),
        faqs: form.faqs,
        displayOrder: Number(form.displayOrder || 0),
      };
      if (!payload.slug && payload.title) {
        payload.slug = payload.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + '-travel-guide';
      }
      if (isEdit) {
        await customFetch(`/api/admin/travel-guides/${item!.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Travel guide updated!");
      } else {
        await customFetch("/api/admin/travel-guides", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Travel guide created!");
      }
      onSave();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full mx-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-[#1B3A6B] to-[#2a519b] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="font-bold text-white text-lg">{isEdit ? `Editing: ${item!.title}` : "Add New Travel Guide"}</h2>
              <p className="text-xs text-white/60 mt-0.5">Independent editorial content for travellers — separate from tour package pages</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="p-7 overflow-y-auto max-h-[75vh] space-y-5">
          <div className="grid grid-cols-2 gap-4">

            {/* ── Identity ── */}
            <SectionHeader title="Guide Identity" icon={BookOpen} />

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Entity Type *</label>
              <div className="flex gap-3">
                {(["country", "state", "place"] as EntityType[]).map(t => (
                  <button key={t} onClick={() => set("entityType", t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${form.entityType === t ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : "border-gray-200 text-gray-600 hover:border-[#1B3A6B]/30"}`}>
                    {t === "country" ? "🌍 Country" : t === "state" ? "📍 State / Region" : "🏙️ Place / City"}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">
                Link to {form.entityType === "country" ? "Country" : form.entityType === "state" ? "State" : "Place"} (optional — for organisational grouping only)
              </label>
              <select value={form.entityId} onChange={e => set("entityId", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                <option value="">— None (standalone guide) —</option>
                {entityOptions.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name}{e.countryName ? ` (${e.countryName})` : ""}{e.stateName ? ` – ${e.stateName}` : ""}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">This link is for grouping only. Guide content is always completely independent from the linked destination.</p>
            </div>

            <FieldInput label="Guide Title *" value={form.title} onChange={v => set("title", v)} placeholder="e.g. Complete Guide to Manali" className="col-span-2" />
            <FieldInput label="Slug (auto-generated)" value={form.slug} onChange={v => set("slug", v)} placeholder="manali-travel-guide" className="col-span-1" />
            <FieldInput label="Display Order" value={String(form.displayOrder || 0)} onChange={v => set("displayOrder", Number(v))} className="col-span-1" />

            {/* ── Hero / Media ── */}
            <CollapsibleSection title="Hero Media" icon={FileText} defaultOpen>
              <MediaUploadField label="Hero Image URL" value={form.heroImageUrl} onChange={v => set("heroImageUrl", v)} className="col-span-2" folder="travel-guides/hero" />
              <MediaUploadField label="Hero Video URL (MP4)" value={form.heroVideoUrl} onChange={v => set("heroVideoUrl", v)} className="col-span-2" folder="travel-guides/hero" />
              <FieldTextarea label="Short Description (shown in listings & hero)" value={form.shortDescription} onChange={v => set("shortDescription", v)} rows={3} className="col-span-2" />
            </CollapsibleSection>

            {/* ── Full Article ── */}
            <CollapsibleSection title="Full Article Content (HTML allowed)" icon={FileText} defaultOpen>
              <FieldTextarea label="Full Content (HTML / rich text)" value={form.fullContent} onChange={v => set("fullContent", v)} rows={12} placeholder="<h2>About Manali</h2><p>Nestled in the Beas River valley...</p>" className="col-span-2" />
            </CollapsibleSection>

            {/* ── Essential Travel Info ── */}
            <CollapsibleSection title="Essential Travel Information" icon={Info} defaultOpen>
              <FieldTextarea label="Best Time to Visit" value={form.bestTimeToVisit} onChange={v => set("bestTimeToVisit", v)} rows={2} />
              <FieldTextarea label="How to Reach" value={form.howToReach} onChange={v => set("howToReach", v)} rows={2} />
              <FieldInput label="Nearest Airport" value={form.nearestAirport} onChange={v => set("nearestAirport", v)} />
              <FieldInput label="Nearest Railway Station" value={form.nearestRailway} onChange={v => set("nearestRailway", v)} />
              <FieldInput label="Local Language" value={form.localLanguage} onChange={v => set("localLanguage", v)} />
              <FieldInput label="Currency" value={form.currency} onChange={v => set("currency", v)} />
              <FieldInput label="Timezone" value={form.timezone} onChange={v => set("timezone", v)} />
              <FieldTextarea label="Visa Information" value={form.visaInfo} onChange={v => set("visaInfo", v)} rows={2} />
            </CollapsibleSection>

            {/* ── Highlights & Lists ── */}
            <CollapsibleSection title="Highlights & Lists (one item per line)" icon={Star}>
              <FieldTextarea label="Highlights" value={form.highlights} onChange={v => set("highlights", v)} placeholder={"Beautiful Rohtang Pass\nSolang Valley adventure\nHadimba Temple"} />
              <FieldTextarea label="Top Things To Do" value={form.thingsToDo} onChange={v => set("thingsToDo", v)} placeholder={"Paragliding at Solang Valley\nVisit Old Manali\nRohtang Pass snow trip"} />
              <FieldTextarea label="Top Attractions" value={form.topAttractions} onChange={v => set("topAttractions", v)} />
              <FieldTextarea label="Activities" value={form.activities} onChange={v => set("activities", v)} />
              <FieldTextarea label="Famous For" value={form.famousFor} onChange={v => set("famousFor", v)} />
              <FieldTextarea label="Local Cuisine (must-try foods)" value={form.localCuisine} onChange={v => set("localCuisine", v)} />
              <FieldTextarea label="Festivals & Events" value={form.festivals} onChange={v => set("festivals", v)} />
              <FieldTextarea label="Packing List (suggestions)" value={form.packingList} onChange={v => set("packingList", v)} />
              <FieldTextarea label="Travel Tips" value={form.travelTips} onChange={v => set("travelTips", v)} className="col-span-2" />
            </CollapsibleSection>

            {/* ── Deep Knowledge ── */}
            <CollapsibleSection title="Deep Traveller Knowledge" icon={Globe}>
              <FieldTextarea label="History & Culture" value={form.historyAndCulture} onChange={v => set("historyAndCulture", v)} rows={4} />
              <FieldTextarea label="Geography" value={form.geography} onChange={v => set("geography", v)} rows={4} />
              <FieldTextarea label="Weather & Climate" value={form.weatherAndClimate} onChange={v => set("weatherAndClimate", v)} rows={3} />
              <FieldTextarea label="Getting Around (Transportation)" value={form.transportation} onChange={v => set("transportation", v)} rows={3} />
              <FieldTextarea label="Currency & Payments (ATMs, Tipping)" value={form.currencyAndPayments} onChange={v => set("currencyAndPayments", v)} rows={3} />
              <FieldTextarea label="Language & Useful Phrases" value={form.languageAndCommunication} onChange={v => set("languageAndCommunication", v)} rows={3} />
              <FieldTextarea label="Local Etiquette & Customs" value={form.localEtiquette} onChange={v => set("localEtiquette", v)} rows={3} />
              <FieldTextarea label="Health Tips (Vaccines, Water, Altitude)" value={form.healthTips} onChange={v => set("healthTips", v)} rows={3} />
              <FieldTextarea label="Safety Information" value={form.safetyInfo} onChange={v => set("safetyInfo", v)} rows={3} />
              <FieldTextarea label="Emergency Numbers" value={form.emergencyNumbers} onChange={v => set("emergencyNumbers", v)} rows={2} />
              <FieldTextarea label="Shopping (Souvenirs & Markets)" value={form.shopping} onChange={v => set("shopping", v)} rows={3} />
            </CollapsibleSection>

            {/* ── FAQs ── */}
            <CollapsibleSection title="FAQs (AI / AEO Optimised)" icon={Info}>
              <FaqEditor faqs={form.faqs || []} onChange={v => set("faqs", v)} />
            </CollapsibleSection>

            {/* ── SEO ── */}
            <CollapsibleSection title="SEO Settings" icon={Star}>
              <FieldInput label="Meta Title (60 chars)" value={form.metaTitle} onChange={v => set("metaTitle", v)} className="col-span-2" />
              <FieldTextarea label="Meta Description (160 chars)" value={form.metaDescription} onChange={v => set("metaDescription", v)} rows={2} className="col-span-2" />
              <FieldInput label="Meta Keywords" value={form.metaKeywords} onChange={v => set("metaKeywords", v)} className="col-span-2" />
            </CollapsibleSection>

            {/* ── Publish Status ── */}
            <SectionHeader title="Publication Status" icon={Eye} />
            <div className="col-span-2 flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <button
                onClick={() => set("isPublished", !form.isPublished)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${form.isPublished ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
              >
                {form.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {form.isPublished ? "Published (Live)" : "Draft (Hidden)"}
              </button>
              <p className="text-xs text-gray-500">
                {form.isPublished
                  ? "This guide is visible to website visitors."
                  : "This guide is saved as a draft and not visible to visitors yet."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={save} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1B3A6B] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#162f58] transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Guide" : "Create Guide"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GUIDE CARD ────────────────────────────────────────────────────────────────

function GuideCard({ guide, onEdit, onDelete }: { guide: TravelGuide; onEdit: () => void; onDelete: () => void }) {
  const entityIcon = guide.entityType === "country" ? Globe : guide.entityType === "state" ? MapPin : Mountain;
  const EntityIcon = entityIcon;
  const typeLabel = guide.entityType === "country" ? "Country" : guide.entityType === "state" ? "State/Region" : "Place/City";
  const typeColor = guide.entityType === "country" ? "bg-purple-100 text-purple-700" : guide.entityType === "state" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-lg transition-all" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-100 to-blue-100">
        {guide.heroImageUrl
          ? <img src={guide.heroImageUrl} alt={guide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-[#1B3A6B] opacity-20" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Status badge */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${guide.isPublished ? "bg-green-500 text-white" : "bg-gray-800/70 text-white"}`}>
          {guide.isPublished ? <CheckCircle className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
          {guide.isPublished ? "Live" : "Draft"}
        </div>
        {/* Entity type badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <EntityIcon className="w-4 h-4 text-[#1B3A6B] mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{guide.title}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">/{guide.slug}</p>
          </div>
        </div>
        {guide.shortDescription && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{guide.shortDescription}</p>
        )}
        {guide.bestTimeToVisit && (
          <p className="text-[11px] text-amber-600 font-medium mb-3">🕐 {guide.bestTimeToVisit}</p>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={onEdit} className="flex-1 py-2 rounded-lg text-xs font-bold border border-[#1B3A6B]/20 text-[#1B3A6B] hover:bg-blue-50 transition flex items-center justify-center gap-1.5">
            <Edit className="w-3 h-3" /> Edit Guide
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function TravelGuides() {
  const [guides, setGuides] = useState<TravelGuide[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<EntityType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [modal, setModal] = useState<{ guide?: TravelGuide } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [g, c, s, p] = await Promise.all([
        customFetch("/api/admin/travel-guides"),
        customFetch("/api/admin/countries"),
        customFetch("/api/admin/states"),
        customFetch("/api/admin/destinations"),
      ]);
      setGuides(Array.isArray(g) ? g : []);
      setCountries(Array.isArray(c) ? c : []);
      setStates(Array.isArray(s) ? s : []);
      setPlaces(Array.isArray(p) ? p : []);
    } catch {
      toast.error("Failed to load travel guides");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleDelete = async (guide: TravelGuide) => {
    if (!window.confirm(`Delete travel guide "${guide.title}"? This cannot be undone.`)) return;
    try {
      await customFetch(`/api/admin/travel-guides/${guide.id}`, { method: "DELETE" });
      toast.success("Travel guide deleted");
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = guides.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.title.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q);
    const matchType = filterType === "all" || g.entityType === filterType;
    const matchStatus = filterStatus === "all" || (filterStatus === "published" ? g.isPublished : !g.isPublished);
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: guides.length,
    published: guides.filter(g => g.isPublished).length,
    countries: guides.filter(g => g.entityType === "country").length,
    states: guides.filter(g => g.entityType === "state").length,
    places: guides.filter(g => g.entityType === "place").length,
  };

  return (
    <AdminLayout
      title="Travel Guides"
      subtitle="Create & manage editorial travel content for countries, states, and places — independent from tour packages"
    >
      {modal !== null && (
        <GuideFormModal
          item={modal.guide}
          countries={countries}
          states={states}
          places={places}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); reload(); }}
        />
      )}

      {/* Info Banner */}
      <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">Travel Guides are Independent from Destinations</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Guides here are long-form editorial content written <em>for travellers</em>. The <strong>Destinations</strong> page manages tour package landing pages (with SEO metadata and package links). These are stored in separate tables and do not share content.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: "Total Guides", value: stats.total, color: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" },
          { label: "Published", value: stats.published, color: "bg-green-50", border: "border-green-200", text: "text-green-700" },
          { label: "Drafts", value: stats.total - stats.published, color: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
          { label: "Countries", value: stats.countries, color: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
          { label: "States/Places", value: stats.states + stats.places, color: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
        ].map(s => (
          <div key={s.label} className={`${s.color} border ${s.border} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search guides by title or slug..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>

        {/* Filter by type */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {([["all", "All Types"], ["country", "🌍 Countries"], ["state", "📍 States"], ["place", "🏙️ Places"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilterType(k as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterType === k ? "bg-white text-[#1B3A6B] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Filter by status */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {([["all", "All"], ["published", "✅ Live"], ["draft", "📝 Draft"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilterStatus(k as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterStatus === k ? "bg-white text-[#1B3A6B] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={() => setModal({})}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow"
          style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
          <Plus className="w-4 h-4" /> New Travel Guide
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#1B3A6B]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-15" />
          <p className="font-bold text-lg text-gray-500">No travel guides found</p>
          <p className="text-sm mt-1">{guides.length === 0 ? "Click \"New Travel Guide\" to create your first editorial guide." : "Try changing your search or filters."}</p>
          {guides.length === 0 && (
            <button onClick={() => setModal({})}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
              <Plus className="w-4 h-4" /> Create First Guide
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(guide => (
            <GuideCard
              key={guide.id}
              guide={guide}
              onEdit={() => setModal({ guide })}
              onDelete={() => handleDelete(guide)}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
