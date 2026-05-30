import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { Plus, Search, Edit, Trash2, MapPin, Utensils, Save, X, Loader2, CheckCircle, XCircle, Upload, Star, Coffee, Image as ImageIcon } from "lucide-react";
import { customFetch } from "../utils/api";
import { getApiUrl } from "@/utils/api-url";
import { toast } from "sonner";

const TYPES = ["restaurant","cafe","fast_food","dhaba","bakery","street_food","rooftop","fine_dining","buffet","food_court"];
const TYPE_LABELS: Record<string, string> = {
  restaurant:"Restaurant", cafe:"Café", fast_food:"Fast Food", dhaba:"Dhaba",
  bakery:"Bakery", street_food:"Street Food", rooftop:"Rooftop", fine_dining:"Fine Dining",
  buffet:"Buffet", food_court:"Food Court",
};
const TYPE_COLORS: Record<string, string> = {
  restaurant:"bg-orange-100 text-orange-700", cafe:"bg-amber-100 text-amber-700",
  fast_food:"bg-red-100 text-red-700", dhaba:"bg-lime-100 text-lime-700",
  bakery:"bg-yellow-100 text-yellow-700", street_food:"bg-rose-100 text-rose-700",
  rooftop:"bg-sky-100 text-sky-700", fine_dining:"bg-purple-100 text-purple-700",
  buffet:"bg-indigo-100 text-indigo-700", food_court:"bg-teal-100 text-teal-700",
};
const MEAL_TYPES = ["breakfast","lunch","dinner","snack","tea"];

const API = getApiUrl();

async function uploadFile(file: File, folder = "dining"): Promise<string> {
  const fd = new FormData(); fd.append("file", file);
  const stored = localStorage.getItem("sh_admin_token");
  const token = stored ? JSON.parse(stored).token : "";
  const r = await fetch(`${API}/media/upload?folder=${folder}`, {
    method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
  });
  if (!r.ok) throw new Error("Upload failed");
  return (await r.json()).url;
}

function MediaUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { onChange(await uploadFile(f)); toast.success("Uploaded ✓"); }
    catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="URL or upload →" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B]" />
        <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer text-sm font-bold min-w-[90px]">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-3.5 h-3.5 mr-1" />Upload</>}
          <input type="file" className="hidden" accept="image/*" onChange={handle} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

function GalleryUpload({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f)));
      onChange([...images, ...urls]); toast.success(`${urls.length} uploaded ✓`);
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-500 uppercase">Gallery ({images.length})</label>
        <label className="flex items-center gap-1 text-xs font-bold text-[#1B3A6B] cursor-pointer hover:underline">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" />Add Photos</>}
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-4 border-2 border-dashed border-gray-100 rounded-xl p-5 text-center text-gray-400 text-sm">
            <ImageIcon className="w-7 h-7 mx-auto mb-2 opacity-30" />No photos yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B]" />
    </div>
  );
}
function FieldTA({ label, value, onChange, rows = 3, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <textarea value={value || ""} rows={rows} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none" />
    </div>
  );
}

function DiningModal({ item, destinations, onClose, onSave }: { item?: any; destinations: any[]; onClose: () => void; onSave: () => void }) {
  const isEdit = !!item?.id;
  const arr = (v: any, sep = ", ") => Array.isArray(v) ? v.join(sep) : (v || "");
  const [form, setForm] = useState<Record<string, any>>({
    destinationId: "", name: "", slug: "", type: "restaurant", shortDescription: "", longDescription: "",
    coverImage: "", images: [], cuisine: "", specialItems: "", address: "", timingInfo: "", priceRange: "",
    phone: "", website: "", isEnrouteStop: false, suitableFor: [], isActive: true, isFeatured: false, displayOrder: 0,
    latitude: "", longitude: "",
    ...(item ? { ...item, cuisine: arr(item.cuisine), specialItems: arr(item.specialItems), suitableFor: item.suitableFor || [], images: item.images || [] } : {}),
  });
  const [loading, setLoading] = useState(false);
  const toArr = (v: string) => v.split(",").map((s: string) => s.trim()).filter(Boolean);
  const f = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }));

  const toggleMeal = (meal: string) => {
    setForm(p => ({ ...p, suitableFor: p.suitableFor.includes(meal) ? p.suitableFor.filter((m: string) => m !== meal) : [...p.suitableFor, meal] }));
  };

  const save = async () => {
    if (!form.destinationId || !form.name) return toast.error("Destination and Name are required");
    setLoading(true);
    try {
      const payload: any = { ...form, destinationId: Number(form.destinationId), displayOrder: Number(form.displayOrder || 0), cuisine: toArr(form.cuisine), specialItems: toArr(form.specialItems) };
      if (!payload.slug && payload.name) payload.slug = String(payload.name).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      if (isEdit) await customFetch(`/api/admin/dining/${item.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await customFetch("/api/admin/dining", { method: "POST", body: JSON.stringify(payload) });
      toast.success(isEdit ? "Dining point updated!" : "Dining point added!");
      onSave();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? `Edit: ${item.name}` : "Add Dining Point"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">

          {/* Core */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Destination (City) *</label>
              <select value={form.destinationId} onChange={e => f("destinationId")(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                <option value="">Select Destination…</option>
                {destinations.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.stateName}</option>)}
              </select>
            </div>
            <Field label="Dining Point Name *" value={form.name} onChange={f("name")} />
            <Field label="Slug (auto)" value={form.slug} onChange={f("slug")} />
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Type</label>
              <select value={form.type} onChange={e => f("type")(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <Field label="Display Order" value={String(form.displayOrder || 0)} onChange={(v: string) => f("displayOrder")(Number(v))} />
          </div>

          {/* Enroute & Meal Suitability */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">🗺️ Package Integration</p>
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isEnrouteStop} onChange={e => f("isEnrouteStop")(e.target.checked)} className="w-4 h-4 rounded" />
                <div>
                  <span className="text-sm font-bold text-[#1B3A6B] block">🚌 Mark as Enroute Stop</span>
                  <span className="text-xs text-gray-500">Appears in package day-wise itinerary as a dining stop option</span>
                </div>
              </label>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Suitable For (Meal Times)</p>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPES.map(m => (
                    <button key={m} type="button" onClick={() => toggleMeal(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${form.suitableFor.includes(m) ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B3A6B]"}`}>
                      {m === "breakfast" ? "🌅" : m === "lunch" ? "☀️" : m === "dinner" ? "🌙" : m === "snack" ? "☕" : "🍵"} {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="border-t border-gray-50 pt-4 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase">📸 Media</p>
            <MediaUpload label="Cover Image" value={form.coverImage} onChange={f("coverImage")} />
            {form.coverImage && <img src={form.coverImage} alt="" className="w-full h-40 object-cover rounded-xl border" />}
            <GalleryUpload images={form.images || []} onChange={f("images")} />
          </div>

          {/* Description */}
          <div className="border-t border-gray-50 pt-4 space-y-3">
            <FieldTA label="Short Description" value={form.shortDescription} onChange={f("shortDescription")} rows={2} />
            <FieldTA label="Long Description" value={form.longDescription} onChange={f("longDescription")} rows={3} />
          </div>

          {/* Food Details */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">🍽️ Food Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cuisine Types (comma sep.)" value={form.cuisine} onChange={f("cuisine")} className="col-span-2" />
              <Field label="Must-Try Dishes (comma sep.)" value={form.specialItems} onChange={f("specialItems")} className="col-span-2" />
              <Field label="Price Range (e.g. ₹150–₹400/person)" value={form.priceRange} onChange={f("priceRange")} />
              <Field label="Timing (e.g. 8 AM – 11 PM)" value={form.timingInfo} onChange={f("timingInfo")} />
            </div>
          </div>

          {/* Contact & Location */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">📍 Contact & Location</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Address" value={form.address} onChange={f("address")} className="col-span-2" />
              <Field label="Phone" value={form.phone} onChange={f("phone")} />
              <Field label="Website" value={form.website} onChange={f("website")} />
              <Field label="Latitude" value={form.latitude} onChange={f("latitude")} />
              <Field label="Longitude" value={form.longitude} onChange={f("longitude")} />
            </div>
          </div>

          {/* Flags */}
          <div className="border-t border-gray-50 pt-4 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => f("isActive")(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">✅ Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => f("isFeatured")(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">⭐ Featured</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1B3A6B] text-white text-sm font-bold disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Dining Point
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DiningPoints() {
  const [search, setSearch] = useState("");
  const [filterDest, setFilterDest] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterEnroute, setFilterEnroute] = useState(false);
  const [modal, setModal] = useState<any>(false);
  const [dining, setDining] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [d, dest] = await Promise.all([customFetch("/api/admin/dining"), customFetch("/api/admin/destinations")]);
      setDining(Array.isArray(d) ? d : []);
      setDestinations(Array.isArray(dest) ? dest : []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await customFetch(`/api/admin/dining/${id}`, { method: "DELETE" }); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const q = search.toLowerCase();
  const filtered = dining.filter(d =>
    (d.name?.toLowerCase().includes(q) || d.destinationName?.toLowerCase().includes(q)) &&
    (!filterDest || String(d.destinationId) === filterDest) &&
    (!filterType || d.type === filterType) &&
    (!filterEnroute || d.isEnrouteStop)
  );

  return (
    <AdminLayout title="Dining Points" subtitle="Manage restaurants, cafes, dhabas & enroute food stops">
      {modal !== false && (
        <DiningModal item={modal || undefined} destinations={destinations} onClose={() => setModal(false)} onSave={() => { setModal(false); reload(); }} />
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dining points…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>
        <select value={filterDest} onChange={e => setFilterDest(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none">
          <option value="">All Destinations</option>
          {destinations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <button onClick={() => setFilterEnroute(p => !p)} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${filterEnroute ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B3A6B]"}`}>
          🚌 Enroute Only
        </button>
        <button onClick={() => setModal(null)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow" style={{ background: "linear-gradient(135deg,#1B3A6B,#2a519b)" }}>
          <Plus className="w-4 h-4" /> Add Dining Point
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: dining.length, icon: Utensils, color: "bg-orange-50 text-orange-600" },
          { label: "Active", value: dining.filter(d => d.isActive).length, icon: CheckCircle, color: "bg-green-50 text-green-600" },
          { label: "Enroute Stops", value: dining.filter(d => d.isEnrouteStop).length, icon: Coffee, color: "bg-blue-50 text-blue-600" },
          { label: "Featured", value: dining.filter(d => d.isFeatured).length, icon: Star, color: "bg-amber-50 text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <div><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1B3A6B]" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
              <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-100">
                {item.coverImage
                  ? <img src={item.coverImage} alt={item.name} className="w-full h-full object-cover" />
                  : <Utensils className="absolute inset-0 m-auto w-10 h-10 text-orange-400 opacity-30" />}
                <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type] || "bg-gray-100 text-gray-600"}`}>{TYPE_LABELS[item.type] || item.type}</span>
                {item.isEnrouteStop && <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">🚌 Enroute</span>}
                {item.isFeatured && <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">⭐ Featured</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{item.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{item.destinationName || "—"}</p>
                {item.priceRange && <p className="text-xs text-green-600 font-medium mb-2">{item.priceRange}</p>}
                {item.suitableFor?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {item.suitableFor.map((m: string) => (
                      <span key={m} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">{m}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setModal(item)} className="flex-1 py-1.5 rounded-lg text-xs font-bold border border-[#1B3A6B]/20 text-[#1B3A6B] hover:bg-blue-50 transition-colors">
                    <Edit className="w-3 h-3 inline mr-1" />Edit
                  </button>
                  <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-400">
              <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No dining points found</p>
              <p className="text-sm">Click "Add Dining Point" to get started</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
