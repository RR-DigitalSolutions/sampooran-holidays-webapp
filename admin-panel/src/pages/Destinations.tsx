import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Edit, Trash2, MapPin, Globe, ChevronRight,
  CheckCircle, XCircle, Star, Save, X, Loader2, Mountain,
  Info, FileText, Image as ImageIcon, HelpCircle, ToggleRight
} from "lucide-react";
import { customFetch } from "../utils/api";
import { toast } from "sonner";

type Tab = "countries" | "states" | "places";

// ─── FAQ EDITOR ────────────────────────────────────────────────────────────────
// Reusable component: manages a list of {question, answer} pairs

type FaqItem = { question: string; answer: string };

function FaqsEditor({ faqs, onChange }: { faqs: FaqItem[]; onChange: (v: FaqItem[]) => void }) {
  const add = () => onChange([...faqs, { question: "", answer: "" }]);
  const remove = (idx: number) => onChange(faqs.filter((_, i) => i !== idx));
  const update = (idx: number, field: "question" | "answer", value: string) => {
    const updated = faqs.map((faq, i) => i === idx ? { ...faq, [field]: value } : faq);
    onChange(updated);
  };

  return (
    <div className="col-span-2 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#1B3A6B]" />
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">FAQs — Frequently Asked Questions</p>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">SEO / AEO / AIO</span>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1B3A6B] text-white hover:bg-[#2a519b] transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
          <HelpCircle className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-xs font-semibold">No FAQs added yet</p>
          <p className="text-[10px] mt-1">FAQs improve SEO, AEO & AI visibility significantly</p>
          <button
            type="button"
            onClick={add}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1B3A6B]/10 text-[#1B3A6B] hover:bg-[#1B3A6B]/20 transition-colors"
          >
            + Add First FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="relative border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow group">
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <span className="text-[9px] font-black text-gray-300 uppercase">FAQ #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove FAQ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3 pr-12">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    ❓ Question
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => update(idx, "question", e.target.value)}
                    placeholder="e.g. What is the best time to visit?"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    💬 Answer
                  </label>
                  <textarea
                    value={faq.answer}
                    onChange={e => update(idx, "answer", e.target.value)}
                    placeholder="Provide a detailed, helpful answer..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-[#1B3A6B] hover:text-[#1B3A6B] hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Another FAQ
          </button>
        </div>
      )}
    </div>
  );
}

// ─── FORM MODALS ────────────────────────────────────────────────────────────

function CountryModal({ item, onClose, onSave }: { item?: any; onClose: () => void; onSave: () => void }) {
  const isEdit = !!item?.id;
  const getInitial = (): Record<string, any> => {
    const arr = (v: any, sep = "\n") => Array.isArray(v) ? v.join(sep) : (v || "");
    const parseFaqs = (v: any): FaqItem[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(f => f && f.question !== undefined);
      try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    };
    const base: Record<string, any> = {
      name: "", code: "", slug: "", description: "", capital: "", currency: "", language: "", timezone: "",
      bestTimeToVisit: "", visaInfo: "", imageUrl: "", heroVideoUrl: "", metaTitle: "", metaDescription: "", metaKeywords: "",
      isFeatured: false, displayOrder: 0, faqs: [] as FaqItem[],
      howToReach: "", highlights: "", thingsToDo: "", localAttractions: "", famousFor: "", activities: "", localCuisine: "", travelTips: "", safetyInfo: "", festivals: "",
      historyAndCulture: "", geography: "", weatherAndClimate: "", transportation: "", currencyAndPayments: "", languageAndCommunication: "", localEtiquette: "", healthTips: "", emergencyNumbers: "", packingList: "", shopping: ""
    };
    if (!item) return base;
    return {
      ...base, ...item,
      highlights: arr(item.highlights),
      thingsToDo: arr(item.thingsToDo),
      localAttractions: arr(item.localAttractions),
      famousFor: arr(item.famousFor),
      activities: arr(item.activities),
      localCuisine: arr(item.localCuisine),
      travelTips: arr(item.travelTips),
      festivals: arr(item.festivals),
      faqs: parseFaqs(item.faqs),
    };
  };

  const [form, setForm] = useState<Record<string, any>>(getInitial);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const toArray = (v: string, sep = "\n") => (v || "").split(sep).map(s => s.trim()).filter(Boolean);
      // Filter out incomplete FAQs (must have at least a question)
      const cleanFaqs = (form.faqs as FaqItem[]).filter(f => f.question.trim());
      const payload = {
        ...form,
        highlights: toArray(form.highlights),
        thingsToDo: toArray(form.thingsToDo),
        localAttractions: toArray(form.localAttractions),
        famousFor: toArray(form.famousFor),
        activities: toArray(form.activities),
        localCuisine: toArray(form.localCuisine),
        travelTips: toArray(form.travelTips),
        festivals: toArray(form.festivals),
        faqs: cleanFaqs,
      };
      if (!payload.slug && payload.name) payload.slug = payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      if (isEdit) {
        await customFetch(`/api/admin/countries/${item.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await customFetch("/api/admin/countries", { method: "POST", body: JSON.stringify(payload) });
      }
      toast.success(isEdit ? "Country updated!" : "Country created!");
      onSave();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ModalWrapper title={isEdit ? "Edit Country" : "Add Country"} onClose={onClose} loading={loading} onSave={save} wide>
      <div className="grid grid-cols-2 gap-4">
        <FieldInput label="Country Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <FieldInput label="ISO Code (e.g. IN)" value={form.code} onChange={v => setForm({ ...form, code: v })} />
        <FieldInput label="Slug (Auto)" value={form.slug} onChange={v => setForm({ ...form, slug: v })} />
        <FieldInput label="Capital City" value={form.capital} onChange={v => setForm({ ...form, capital: v })} />
        <FieldInput label="Currency" value={form.currency} onChange={v => setForm({ ...form, currency: v })} />
        <FieldInput label="Language" value={form.language} onChange={v => setForm({ ...form, language: v })} />
        <MediaUploadField label="Cover Image URL" value={form.imageUrl} onChange={v => setForm({ ...form, imageUrl: v })} className="col-span-1" folder="destinations/countries" />
        <MediaUploadField label="Hero Video URL (MP4 Cloudinary)" value={form.heroVideoUrl} onChange={v => setForm({ ...form, heroVideoUrl: v })} className="col-span-1" folder="destinations/countries" />
        <FieldTextarea label="Short Description" value={form.description} onChange={v => setForm({ ...form, description: v })} className="col-span-2" />
        <FieldTextarea label="Visa Information" value={form.visaInfo} onChange={v => setForm({ ...form, visaInfo: v })} className="col-span-2" />

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">📍 Location Info</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldTextarea label="Best Time to Visit" value={form.bestTimeToVisit} onChange={v => setForm({ ...form, bestTimeToVisit: v })} />
            <FieldTextarea label="How to Reach" value={form.howToReach} onChange={v => setForm({ ...form, howToReach: v })} />
          </div>
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">🏔 Rich Content (for SEO & AI)</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldTextarea label="Highlights (one per line)" value={form.highlights} onChange={v => setForm({ ...form, highlights: v })} />
            <FieldTextarea label="Things To Do (one per line)" value={form.thingsToDo} onChange={v => setForm({ ...form, thingsToDo: v })} />
            <FieldTextarea label="Local Attractions (one per line)" value={form.localAttractions} onChange={v => setForm({ ...form, localAttractions: v })} />
            <FieldTextarea label="Activities (one per line)" value={form.activities} onChange={v => setForm({ ...form, activities: v })} />
            <FieldTextarea label="Famous For (one per line)" value={form.famousFor} onChange={v => setForm({ ...form, famousFor: v })} />
            <FieldTextarea label="Local Cuisine (one per line)" value={form.localCuisine} onChange={v => setForm({ ...form, localCuisine: v })} />
            <FieldTextarea label="Festivals (one per line)" value={form.festivals} onChange={v => setForm({ ...form, festivals: v })} />
            <FieldTextarea label="Travel Tips (one per line)" value={form.travelTips} onChange={v => setForm({ ...form, travelTips: v })} />
            <FieldTextarea label="Safety Information" value={form.safetyInfo} onChange={v => setForm({ ...form, safetyInfo: v })} className="col-span-2" />
          </div>
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">SEO / AEO Fields</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Meta Title" value={form.metaTitle} onChange={v => setForm({ ...form, metaTitle: v })} className="col-span-2" />
            <FieldTextarea label="Meta Description" value={form.metaDescription} onChange={v => setForm({ ...form, metaDescription: v })} className="col-span-2" />
            <FieldInput label="Meta Keywords" value={form.metaKeywords} onChange={v => setForm({ ...form, metaKeywords: v })} className="col-span-2" />
          </div>
        </div>

        {/* ── FAQs ── */}
        <FaqsEditor
          faqs={form.faqs as FaqItem[]}
          onChange={v => setForm({ ...form, faqs: v })}
        />
        
        <div className="col-span-2 flex gap-10 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">⭐ Featured on Homepage</span>
          </label>
          <div className="w-32">
            <FieldInput label="Display Order" value={String(form.displayOrder || 0)} onChange={v => setForm({ ...form, displayOrder: Number(v) })} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

function StateModal({ item, countries, onClose, onSave }: { item?: any; countries: any[]; onClose: () => void; onSave: () => void }) {
  const isEdit = !!item?.id;
  const getInitial = (): Record<string, any> => {
    const arr = (v: any, sep = "\n") => Array.isArray(v) ? v.join(sep) : (v || "");
    const parseFaqs = (v: any): FaqItem[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(f => f && f.question !== undefined);
      try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    };
    const base: Record<string, any> = {
      name: "", slug: "", countryId: "", description: "", capital: "", region: "", imageUrl: "", heroVideoUrl: "",
      bestTimeToVisit: "", howToReach: "", metaTitle: "", metaDescription: "", metaKeywords: "",
      isFeatured: false, displayOrder: 0, faqs: [] as FaqItem[],
      highlights: "", thingsToDo: "", localAttractions: "", famousFor: "", activities: "", localCuisine: "", travelTips: "", safetyInfo: "", festivals: "",
      historyAndCulture: "", geography: "", weatherAndClimate: "", transportation: "", currencyAndPayments: "", languageAndCommunication: "", localEtiquette: "", healthTips: "", emergencyNumbers: "", packingList: "", shopping: ""
    };
    if (!item) return base;
    return {
      ...base, ...item,
      highlights: arr(item.highlights),
      thingsToDo: arr(item.thingsToDo),
      localAttractions: arr(item.localAttractions),
      famousFor: arr(item.famousFor),
      activities: arr(item.activities),
      localCuisine: arr(item.localCuisine),
      travelTips: arr(item.travelTips),
      festivals: arr(item.festivals),
      faqs: parseFaqs(item.faqs),
    };
  };

  const [form, setForm] = useState<Record<string, any>>(getInitial);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const toArray = (v: string, sep = "\n") => (v || "").split(sep).map(s => s.trim()).filter(Boolean);
      const cleanFaqs = (form.faqs as FaqItem[]).filter(f => f.question.trim());
      const payload = {
        ...form,
        countryId: Number(form.countryId),
        highlights: toArray(form.highlights),
        thingsToDo: toArray(form.thingsToDo),
        localAttractions: toArray(form.localAttractions),
        famousFor: toArray(form.famousFor),
        activities: toArray(form.activities),
        localCuisine: toArray(form.localCuisine),
        travelTips: toArray(form.travelTips),
        festivals: toArray(form.festivals),
        faqs: cleanFaqs,
      };
      if (!payload.slug && payload.name) payload.slug = String(payload.name).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      if (isEdit) {
        await customFetch(`/api/admin/states/${item.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await customFetch("/api/admin/states", { method: "POST", body: JSON.stringify(payload) });
      }
      toast.success(isEdit ? "State updated!" : "State created!");
      onSave();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ModalWrapper title={isEdit ? "Edit State/Region" : "Add State/Region"} onClose={onClose} loading={loading} onSave={save} wide>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Parent Country *</label>
          <select value={form.countryId} onChange={e => setForm({ ...form, countryId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
            <option value="">Select Country...</option>
            {countries.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <FieldInput label="State / Region Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <FieldInput label="Slug (Auto)" value={form.slug} onChange={v => setForm({ ...form, slug: v })} />

        <FieldInput label="Capital City" value={form.capital} onChange={v => setForm({ ...form, capital: v })} />

        {/* Region Dropdown — matches the India nav menu regions. Only show if country is India */}
        {(() => {
          const selectedCountry = countries.find(c => String(c.id) === String(form.countryId));
          const isIndia = selectedCountry && (selectedCountry.slug === "india" || selectedCountry.name.toLowerCase() === "india");
          
          if (!isIndia) return null;

          return (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Region / Area</label>
              <select
                value={form.region || ""}
                onChange={e => setForm({ ...form, region: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 bg-white transition"
              >
                <option value="">— Select Region —</option>
                <optgroup label="📍 India Regions">
                  <option value="North India">North India</option>
                  <option value="South India">South India</option>
                  <option value="East &amp; North East India">East &amp; North East India</option>
                  <option value="Rajasthan, West &amp; Central India">Rajasthan, West &amp; Central India</option>
                </optgroup>
                <optgroup label="🏛️ Union Territories">
                  <option value="Union Territory">Union Territory</option>
                </optgroup>
                <optgroup label="🌐 Other">
                  <option value="Island Territory">Island Territory</option>
                  <option value="Other">Other</option>
                </optgroup>
              </select>
            </div>
          );
        })()}


        <MediaUploadField label="Cover Image URL" value={form.imageUrl} onChange={v => setForm({ ...form, imageUrl: v })} className="col-span-1" folder="destinations/states" />
        <MediaUploadField label="Hero Video URL (MP4 Cloudinary)" value={form.heroVideoUrl} onChange={v => setForm({ ...form, heroVideoUrl: v })} className="col-span-1" folder="destinations/states" />
        <FieldTextarea label="Short Description" value={form.description} onChange={v => setForm({ ...form, description: v })} className="col-span-2" />
        
        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">📍 Location Info</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldTextarea label="Best Time to Visit" value={form.bestTimeToVisit} onChange={v => setForm({ ...form, bestTimeToVisit: v })} />
            <FieldTextarea label="How to Reach" value={form.howToReach} onChange={v => setForm({ ...form, howToReach: v })} />
          </div>
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">🏔 Core Highlights (SEO)</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldTextarea label="Highlights (one per line)" value={form.highlights} onChange={v => setForm({ ...form, highlights: v })} />
            <FieldTextarea label="Things To Do (one per line)" value={form.thingsToDo} onChange={v => setForm({ ...form, thingsToDo: v })} />
            <FieldTextarea label="Local Attractions (one per line)" value={form.localAttractions} onChange={v => setForm({ ...form, localAttractions: v })} />
            <FieldTextarea label="Activities (one per line)" value={form.activities} onChange={v => setForm({ ...form, activities: v })} />
            <FieldTextarea label="Famous For (one per line)" value={form.famousFor} onChange={v => setForm({ ...form, famousFor: v })} />
            <FieldTextarea label="Local Cuisine (one per line)" value={form.localCuisine} onChange={v => setForm({ ...form, localCuisine: v })} />
            <FieldTextarea label="Festivals (one per line)" value={form.festivals} onChange={v => setForm({ ...form, festivals: v })} />
            <FieldTextarea label="Travel Tips (one per line)" value={form.travelTips} onChange={v => setForm({ ...form, travelTips: v })} />
          </div>
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">📚 General Knowledge Base (SEO)</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldTextarea label="History & Culture" value={form.historyAndCulture} onChange={v => setForm({ ...form, historyAndCulture: v })} />
            <FieldTextarea label="Geography" value={form.geography} onChange={v => setForm({ ...form, geography: v })} />
            <FieldTextarea label="Weather & Climate" value={form.weatherAndClimate} onChange={v => setForm({ ...form, weatherAndClimate: v })} />
            <FieldTextarea label="Transportation & Getting Around" value={form.transportation} onChange={v => setForm({ ...form, transportation: v })} />
            <FieldTextarea label="Currency & Payments (ATMs, Tipping)" value={form.currencyAndPayments} onChange={v => setForm({ ...form, currencyAndPayments: v })} />
            <FieldTextarea label="Language & Communication (Phrases)" value={form.languageAndCommunication} onChange={v => setForm({ ...form, languageAndCommunication: v })} />
            <FieldTextarea label="Local Etiquette & Customs" value={form.localEtiquette} onChange={v => setForm({ ...form, localEtiquette: v })} />
            <FieldTextarea label="Health Tips (Vaccines, Water)" value={form.healthTips} onChange={v => setForm({ ...form, healthTips: v })} />
            <FieldTextarea label="Safety Information" value={form.safetyInfo} onChange={v => setForm({ ...form, safetyInfo: v })} />
            <FieldTextarea label="Emergency Numbers" value={form.emergencyNumbers} onChange={v => setForm({ ...form, emergencyNumbers: v })} />
            <FieldTextarea label="Packing List (Suggestions)" value={form.packingList} onChange={v => setForm({ ...form, packingList: v })} />
            <FieldTextarea label="Shopping (Souvenirs, Markets)" value={form.shopping} onChange={v => setForm({ ...form, shopping: v })} />
          </div>
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">SEO / AEO Fields</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Meta Title" value={form.metaTitle} onChange={v => setForm({ ...form, metaTitle: v })} className="col-span-2" />
            <FieldTextarea label="Meta Description" value={form.metaDescription} onChange={v => setForm({ ...form, metaDescription: v })} className="col-span-2" />
            <FieldInput label="Meta Keywords" value={form.metaKeywords} onChange={v => setForm({ ...form, metaKeywords: v })} className="col-span-2" />
          </div>
        </div>

        {/* ── FAQs ── */}
        <FaqsEditor
          faqs={form.faqs as FaqItem[]}
          onChange={v => setForm({ ...form, faqs: v })}
        />
        
        <div className="col-span-2 flex gap-10 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">⭐ Featured State</span>
          </label>
          <div className="w-32">
            <FieldInput label="Display Order" value={String(form.displayOrder || 0)} onChange={v => setForm({ ...form, displayOrder: Number(v) })} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

function PlaceModal({ item, states, onClose, onSave }: { item?: any; states: any[]; onClose: () => void; onSave: () => void }) {
  const isEdit = !!item?.id;

  const getInitial = (): Record<string, any> => {
    const arr = (v: any, sep = "\n") =>
      Array.isArray(v) ? v.join(sep) : (v || "");
    const parseFaqs = (v: any): FaqItem[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(f => f && f.question !== undefined);
      try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    };
    const base: Record<string, any> = {
      name: "", slug: "", stateId: "", description: "", imageUrl: "", heroVideoUrl: "",
      bestTimeToVisit: "", altitude: "", temperature: "", howToReach: "",
      nearestAirport: "", nearestRailway: "", distanceFromCapital: "",
      highlights: "", thingsToDo: "", localAttractions: "", famousFor: "",
      activities: "", localCuisine: "", travelTips: "", safetyInfo: "",
      metaTitle: "", metaDescription: "", metaKeywords: "",
      latitude: "", longitude: "", isFeatured: false, isActive: true, showInMenu: false, displayOrder: 0,
      faqs: [] as FaqItem[],
    };
    if (!item) return base;
    return {
      ...base,
      ...item,
      showInMenu: !!item.showInMenu,
      highlights: arr(item.highlights),
      thingsToDo: arr(item.thingsToDo),
      localAttractions: arr(item.localAttractions),
      famousFor: arr(item.famousFor),
      activities: arr(item.activities),
      localCuisine: arr(item.localCuisine),
      travelTips: arr(item.travelTips),
      faqs: parseFaqs(item.faqs),
    };
  };

  const [form, setForm] = useState<Record<string, any>>(getInitial);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const toArray = (v: string, sep = "\n") => v.split(sep).map(s => s.trim()).filter(Boolean);
      const cleanFaqs = (form.faqs as FaqItem[]).filter(f => f.question.trim());
      const payload = {
        ...form,
        stateId: Number(form.stateId),
        highlights: toArray(form.highlights),
        thingsToDo: toArray(form.thingsToDo),
        localAttractions: toArray(form.localAttractions),
        famousFor: toArray(form.famousFor),
        activities: toArray(form.activities),
        localCuisine: toArray(form.localCuisine),
        travelTips: toArray(form.travelTips),
        faqs: cleanFaqs,
      };
      const p = payload as Record<string, any>;
      if (!p.slug && p.name) p.slug = String(p.name).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      if (isEdit) {
        await customFetch(`/api/admin/destinations/${item.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await customFetch("/api/admin/destinations", { method: "POST", body: JSON.stringify(payload) });
      }
      toast.success(isEdit ? "Place updated!" : "Place added!");
      onSave();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ModalWrapper title={isEdit ? `Edit Place: ${item.name}` : "Add New Place / City"} onClose={onClose} loading={loading} onSave={save} wide>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Parent State *</label>
          <select value={form.stateId} onChange={e => setForm({ ...form, stateId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
            <option value="">Select State/Region...</option>
            {states.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.countryName})</option>)}
          </select>
        </div>
        <FieldInput label="Place / City Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <FieldInput label="Slug (Auto)" value={form.slug} onChange={v => setForm({ ...form, slug: v })} />
        <MediaUploadField label="Cover Image URL" value={form.imageUrl} onChange={v => setForm({ ...form, imageUrl: v })} className="col-span-1" folder="destinations/places" />
        <MediaUploadField label="Hero Video URL (MP4 Cloudinary)" value={form.heroVideoUrl} onChange={v => setForm({ ...form, heroVideoUrl: v })} className="col-span-1" folder="destinations/places" />
        <FieldTextarea label="Short Description (2-3 lines)" value={form.description} onChange={v => setForm({ ...form, description: v })} className="col-span-2" />

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">📍 Location Info</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldTextarea label="Best Time to Visit" value={form.bestTimeToVisit} onChange={v => setForm({ ...form, bestTimeToVisit: v })} />
            <FieldInput label="Altitude" value={form.altitude} onChange={v => setForm({ ...form, altitude: v })} />
            <FieldInput label="Temperature Range" value={form.temperature} onChange={v => setForm({ ...form, temperature: v })} />
            <FieldInput label="Nearest Airport" value={form.nearestAirport} onChange={v => setForm({ ...form, nearestAirport: v })} />
            <FieldInput label="Nearest Railway" value={form.nearestRailway} onChange={v => setForm({ ...form, nearestRailway: v })} />
            <FieldInput label="Distance from Capital" value={form.distanceFromCapital} onChange={v => setForm({ ...form, distanceFromCapital: v })} />
            <FieldInput label="Latitude" value={form.latitude} onChange={v => setForm({ ...form, latitude: v })} />
            <FieldInput label="Longitude" value={form.longitude} onChange={v => setForm({ ...form, longitude: v })} />
          </div>
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">🏔 Rich Content (for SEO & AI)</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldTextarea label="Highlights (one per line)" value={form.highlights} onChange={v => setForm({ ...form, highlights: v })} />
            <FieldTextarea label="Things To Do (one per line)" value={form.thingsToDo} onChange={v => setForm({ ...form, thingsToDo: v })} />
            <FieldTextarea label="Local Attractions (one per line)" value={form.localAttractions} onChange={v => setForm({ ...form, localAttractions: v })} />
            <FieldTextarea label="Activities (one per line)" value={form.activities} onChange={v => setForm({ ...form, activities: v })} />
            <FieldTextarea label="Famous For (one per line)" value={form.famousFor} onChange={v => setForm({ ...form, famousFor: v })} />
            <FieldTextarea label="Local Cuisine (one per line)" value={form.localCuisine} onChange={v => setForm({ ...form, localCuisine: v })} />
            <FieldTextarea label="How to Reach" value={form.howToReach} onChange={v => setForm({ ...form, howToReach: v })} />
            <FieldTextarea label="Travel Tips (one per line)" value={form.travelTips} onChange={v => setForm({ ...form, travelTips: v })} />
            <FieldTextarea label="Safety Information" value={form.safetyInfo} onChange={v => setForm({ ...form, safetyInfo: v })} className="col-span-2" />
          </div>
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">🔍 SEO / AEO / AI Optimization</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Meta Title (60 chars)" value={form.metaTitle} onChange={v => setForm({ ...form, metaTitle: v })} className="col-span-2" />
            <FieldTextarea label="Meta Description (160 chars)" value={form.metaDescription} onChange={v => setForm({ ...form, metaDescription: v })} className="col-span-2" />
            <FieldInput label="Meta Keywords" value={form.metaKeywords} onChange={v => setForm({ ...form, metaKeywords: v })} className="col-span-2" />
          </div>
        </div>

        {/* ── FAQs ── */}
        <FaqsEditor
          faqs={form.faqs as FaqItem[]}
          onChange={v => setForm({ ...form, faqs: v })}
        />

        <div className="col-span-2 flex gap-10 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">⭐ Featured Destination</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">✅ Active / Published</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.showInMenu} onChange={e => setForm({ ...form, showInMenu: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">🧭 Show in Navbar</span>
          </label>
          <div className="w-32">
            <FieldInput label="Display Order" value={String(form.displayOrder || 0)} onChange={v => setForm({ ...form, displayOrder: Number(v) })} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── MODAL WRAPPER ───────────────────────────────────────────────────────────

function ModalWrapper({ title, children, onClose, loading, onSave, wide }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10">
      <div className={`bg-white rounded-2xl shadow-2xl w-full mx-4 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">{children}</div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onSave} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1B3A6B] text-white text-sm font-bold disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FIELD HELPERS ────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B]" />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none" />
    </div>
  );
}

function MediaUploadField({ label, value, onChange, className = "", folder = "misc" }: { label: string; value: string; onChange: (v: string) => void; className?: string; folder?: string }) {
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
      if (stored) {
        try { token = JSON.parse(stored).token; } catch { }
      }
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/media/upload?folder=${folder}`, {
        method: "POST",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: formData,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
      toast.success(`Uploaded to ${data.folder?.split('/').slice(1).join('/')} ✓`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload to Cloudinary");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="URL or Upload..." className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B]" />
        <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors text-sm font-bold min-w-[100px]">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
          <input type="file" className="hidden" accept="image/*,video/mp4" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Destinations() {
  const [tab, setTab] = useState<Tab>("places");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ type: Tab; item?: any } | null>(null);

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, p] = await Promise.all([
        customFetch("/api/admin/countries"),
        customFetch("/api/admin/states"),
        customFetch("/api/admin/destinations"),
      ]);
      setCountries(Array.isArray(c) ? c : []);
      setStates(Array.isArray(s) ? s : []);
      setPlaces(Array.isArray(p) ? p : []);
    } catch (e) {
      toast.error("Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleDelete = async (type: Tab, id: number) => {
    const map = { countries: "countries", states: "states", places: "destinations" };
    if (!window.confirm(`Delete this ${type.replace("places", "place")}?`)) return;
    try {
      await customFetch(`/api/admin/${map[type]}/${id}`, { method: "DELETE" });
      toast.success("Deleted successfully");
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const closeModal = () => setModal(null);
  const afterSave = () => { closeModal(); reload(); };

  const q = search.toLowerCase();
  const filtered = {
    countries: countries.filter(c => c.name?.toLowerCase().includes(q)),
    states: states.filter(s => s.name?.toLowerCase().includes(q) || s.countryName?.toLowerCase().includes(q)),
    places: places.filter(p => p.name?.toLowerCase().includes(q) || p.stateName?.toLowerCase().includes(q) || p.countryName?.toLowerCase().includes(q)),
  };

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "countries", label: "Countries", icon: Globe, count: countries.length },
    { key: "states", label: "States / Regions", icon: MapPin, count: states.length },
    { key: "places", label: "Places & Cities", icon: Mountain, count: places.length },
  ];


  return (
    <AdminLayout title="Destinations" subtitle="Manage Countries, States & Places">
      {modal?.type === "countries" && <CountryModal item={modal.item} onClose={closeModal} onSave={afterSave} />}
      {modal?.type === "states" && <StateModal item={modal.item} countries={countries} onClose={closeModal} onSave={afterSave} />}
      {modal?.type === "places" && <PlaceModal item={modal.item} states={states} onClose={closeModal} onSave={afterSave} />}

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-100 pb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-[#1B3A6B] text-white shadow" : "text-gray-500 hover:bg-gray-100"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}...`}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>
        <button onClick={() => setModal({ type: tab })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow"
          style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
          <Plus className="w-4 h-4" />
          Add {tab === "places" ? "Place" : tab === "states" ? "State" : "Country"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1B3A6B]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tab === "countries" && filtered.countries.map(item => (
            <DestCard key={item.id} title={item.name} sub={`${item.code || ""} • ${item.packageCount || 0} packages`}
              featured={item.isFeatured} active={item.isActive}
              onEdit={() => setModal({ type: "countries", item })}
              onDelete={() => handleDelete("countries", item.id)} />
          ))}
          {tab === "states" && filtered.states.map(item => (
            <DestCard key={item.id} title={item.name} sub={item.countryName || ""}
              featured={item.isFeatured} active={item.isActive}
              onEdit={() => setModal({ type: "states", item })}
              onDelete={() => handleDelete("states", item.id)} />
          ))}
          {tab === "places" && filtered.places.map(item => (
            <DestCard key={item.id} title={item.name} sub={`${item.stateName || ""}, ${item.countryName || ""}`}
              featured={item.isFeatured} active={item.isActive}
              badges={[item.altitude, item.bestTimeToVisit].filter(Boolean)}
              onEdit={() => setModal({ type: "places", item })}
              onDelete={() => handleDelete("places", item.id)} />
          ))}
          {filtered[tab]?.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-400">
              <Mountain className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No {tab} found</p>
              <p className="text-sm">Click "Add" to create your first entry</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

function DestCard({ title, sub, featured, active, badges, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-md transition-all" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="h-24 relative flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)" }}>
        <Mountain className="w-8 h-8 text-[#1B3A6B] opacity-30" />
        {featured && <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">FEATURED</span>}
        <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {active !== false ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
          {active !== false ? "Active" : "Draft"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{sub}</p>
        {badges?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {badges.map((b: string, i: number) => <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{b}</span>)}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button onClick={onEdit} className="flex-1 py-1.5 rounded-lg text-xs font-bold border border-[#1B3A6B]/20 text-[#1B3A6B] hover:bg-blue-50 transition-colors">
            <Edit className="w-3 h-3 inline mr-1" />Edit
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
