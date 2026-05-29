import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { Plus, Search, Edit, Trash2, MapPin, Camera, Save, X, Loader2, CheckCircle, XCircle, Upload, Star, Clock, Tag, Image as ImageIcon } from "lucide-react";
import { customFetch } from "../utils/api";
import { toast } from "sonner";

const TYPES = ["sightseeing","adventure","cultural","religious","nature","beach","museum","wildlife","waterfall","lake","valley","pass","fort","temple","market","viewpoint"];
const TYPE_COLORS: Record<string, string> = {
  sightseeing:"bg-blue-100 text-blue-700", adventure:"bg-orange-100 text-orange-700",
  cultural:"bg-purple-100 text-purple-700", religious:"bg-yellow-100 text-yellow-700",
  nature:"bg-green-100 text-green-700", beach:"bg-cyan-100 text-cyan-700",
  museum:"bg-indigo-100 text-indigo-700", wildlife:"bg-lime-100 text-lime-700",
  waterfall:"bg-teal-100 text-teal-700", lake:"bg-sky-100 text-sky-700",
  valley:"bg-emerald-100 text-emerald-700", pass:"bg-slate-100 text-slate-700",
  fort:"bg-stone-100 text-stone-700", temple:"bg-rose-100 text-rose-700",
  market:"bg-amber-100 text-amber-700", viewpoint:"bg-violet-100 text-violet-700",
};

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

async function uploadFile(file: File, folder = "attractions"): Promise<string> {
  const fd = new FormData(); fd.append("file", file);
  const stored = localStorage.getItem("sh_admin_token");
  const token = stored ? JSON.parse(stored).token : "";
  const r = await fetch(`${API}/media/upload?folder=${folder}`, {
    method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!r.ok) throw new Error("Upload failed");
  return (await r.json()).url;
}

function MediaUpload({ label, value, onChange, folder = "attractions" }: { label: string; value: string; onChange: (v: string) => void; folder?: string }) {
  const [uploading, setUploading] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { onChange(await uploadFile(f, folder)); toast.success("Uploaded ✓"); }
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

function GalleryUpload({ images, onChange, folder = "attractions" }: { images: string[]; onChange: (v: string[]) => void; folder?: string }) {
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f, folder)));
      onChange([...images, ...urls]);
      toast.success(`${urls.length} image(s) uploaded ✓`);
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-500 uppercase">Gallery Images ({images.length})</label>
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#1B3A6B] cursor-pointer hover:underline">
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
          <div className="col-span-4 border-2 border-dashed border-gray-100 rounded-xl p-6 text-center text-gray-400 text-sm">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />No images yet. Upload gallery photos above.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B]" />
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

function AttractionModal({ item, destinations, onClose, onSave }: { item?: any; destinations: any[]; onClose: () => void; onSave: () => void }) {
  const isEdit = !!item?.id;
  const arr = (v: any, sep = "\n") => Array.isArray(v) ? v.join(sep) : (v || "");
  const [form, setForm] = useState<Record<string, any>>({
    destinationId: "", name: "", slug: "", type: "sightseeing", shortDescription: "", longDescription: "",
    coverImage: "", images: [], timingInfo: "", entryFee: "", duration: "", bestTimeToVisit: "",
    address: "", latitude: "", longitude: "", highlights: "", tips: "", famousFor: "", activities: "",
    isActive: true, isFeatured: false, displayOrder: 0, metaTitle: "", metaDescription: "", metaKeywords: "",
    ...(item ? { ...item, highlights: arr(item.highlights), tips: arr(item.tips), famousFor: arr(item.famousFor, ", "), activities: arr(item.activities), images: item.images || [] } : {}),
  });
  const [loading, setLoading] = useState(false);
  const toArr = (v: string, sep = "\n") => v.split(sep).map((s: string) => s.trim()).filter(Boolean);

  const save = async () => {
    if (!form.destinationId || !form.name) return toast.error("Destination and Name are required");
    setLoading(true);
    try {
      const payload: any = {
        ...form,
        destinationId: Number(form.destinationId), displayOrder: Number(form.displayOrder || 0), highlights: toArr(form.highlights), tips: toArr(form.tips), famousFor: toArr(form.famousFor, ","), activities: toArr(form.activities) };
      if (!payload.slug && payload.name) payload.slug = String(payload.name).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      if (isEdit) await customFetch(`/api/admin/attractions/${item.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await customFetch("/api/admin/attractions", { method: "POST", body: JSON.stringify(payload) });
      toast.success(isEdit ? "Attraction updated!" : "Attraction added!");
      onSave();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const f = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? `Edit: ${item.name}` : "Add New Attraction / Sightseeing"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">

          {/* Destination & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Destination (City) *</label>
              <select value={form.destinationId} onChange={e => f("destinationId")(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                <option value="">Select Destination…</option>
                {destinations.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.stateName}</option>)}
              </select>
            </div>
            <Field label="Attraction Name *" value={form.name} onChange={f("name")} />
            <Field label="Slug (auto)" value={form.slug} onChange={f("slug")} />
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Type</label>
              <select value={form.type} onChange={e => f("type")(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Field label="Display Order" value={String(form.displayOrder || 0)} onChange={(v: string) => f("displayOrder")(Number(v))} type="number" />
          </div>

          {/* Media */}
          <div className="border-t border-gray-50 pt-4 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase">📸 Media</p>
            <MediaUpload label="Cover Image" value={form.coverImage} onChange={f("coverImage")} />
            {form.coverImage && <img src={form.coverImage} alt="" className="w-full h-40 object-cover rounded-xl border" />}
            <GalleryUpload images={form.images || []} onChange={f("images")} />
          </div>

          {/* Descriptions */}
          <div className="border-t border-gray-50 pt-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase">📝 Content</p>
            <FieldTA label="Short Description" value={form.shortDescription} onChange={f("shortDescription")} rows={2} />
            <FieldTA label="Long Description" value={form.longDescription} onChange={f("longDescription")} rows={4} />
          </div>

          {/* Practical Info */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">⏰ Practical Info</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Timing (e.g. 9 AM – 5 PM)" value={form.timingInfo} onChange={f("timingInfo")} />
              <Field label="Entry Fee (e.g. ₹500/person)" value={form.entryFee} onChange={f("entryFee")} />
              <Field label="Visit Duration (e.g. 2–3 hrs)" value={form.duration} onChange={f("duration")} />
              <Field label="Best Time to Visit" value={form.bestTimeToVisit} onChange={f("bestTimeToVisit")} />
              <Field label="Address" value={form.address} onChange={f("address")} className="col-span-2" />
              <Field label="Latitude" value={form.latitude} onChange={f("latitude")} />
              <Field label="Longitude" value={form.longitude} onChange={f("longitude")} />
            </div>
          </div>

          {/* Rich Content */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">🏔 Rich Content</p>
            <div className="grid grid-cols-2 gap-4">
              <FieldTA label="Highlights (one per line)" value={form.highlights} onChange={f("highlights")} />
              <FieldTA label="Tips for Visitors (one per line)" value={form.tips} onChange={f("tips")} />
              <FieldTA label="Activities at this place (one per line)" value={form.activities} onChange={f("activities")} />
              <Field label="Famous For (comma separated)" value={form.famousFor} onChange={f("famousFor")} />
            </div>
          </div>

          {/* SEO */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">🔍 SEO</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Meta Title" value={form.metaTitle} onChange={f("metaTitle")} className="col-span-2" />
              <FieldTA label="Meta Description" value={form.metaDescription} onChange={f("metaDescription")} rows={2} className="col-span-2" />
              <Field label="Meta Keywords" value={form.metaKeywords} onChange={f("metaKeywords")} className="col-span-2" />
            </div>
          </div>

          {/* Flags */}
          <div className="border-t border-gray-50 pt-4 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => f("isActive")(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">✅ Active / Published</span>
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Attraction
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Attractions() {
  const [search, setSearch] = useState("");
  const [filterDest, setFilterDest] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modal, setModal] = useState<any | null>(null);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([customFetch("/api/admin/attractions"), customFetch("/api/admin/destinations")]);
      setAttractions(Array.isArray(a) ? a : []);
      setDestinations(Array.isArray(d) ? d : []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await customFetch(`/api/admin/attractions/${id}`, { method: "DELETE" }); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const q = search.toLowerCase();
  const filtered = attractions.filter(a =>
    (a.name?.toLowerCase().includes(q) || a.destinationName?.toLowerCase().includes(q)) &&
    (!filterDest || String(a.destinationId) === filterDest) &&
    (!filterType || a.type === filterType)
  );

  return (
    <AdminLayout title="Attractions & Sightseeing" subtitle="Manage sightseeing spots, adventure points & cultural landmarks">
      {modal !== undefined && modal !== false && (
        <AttractionModal item={modal || undefined} destinations={destinations} onClose={() => setModal(false)} onSave={() => { setModal(false); reload(); }} />
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search attractions…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>
        <select value={filterDest} onChange={e => setFilterDest(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1B3A6B]">
          <option value="">All Destinations</option>
          {destinations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1B3A6B]">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <button onClick={() => setModal(null)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow" style={{ background: "linear-gradient(135deg,#1B3A6B,#2a519b)" }}>
          <Plus className="w-4 h-4" /> Add Attraction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: attractions.length, icon: Camera, color: "bg-blue-50 text-blue-600" },
          { label: "Active", value: attractions.filter(a => a.isActive).length, icon: CheckCircle, color: "bg-green-50 text-green-600" },
          { label: "Featured", value: attractions.filter(a => a.isFeatured).length, icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: "With Gallery", value: attractions.filter(a => a.images?.length > 0).length, icon: ImageIcon, color: "bg-purple-50 text-purple-600" },
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
              <div className="relative h-36 bg-gradient-to-br from-blue-50 to-indigo-100">
                {item.coverImage
                  ? <img src={item.coverImage} alt={item.name} className="w-full h-full object-cover" />
                  : <Camera className="absolute inset-0 m-auto w-10 h-10 text-[#1B3A6B] opacity-20" />}
                <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[item.type] || "bg-gray-100 text-gray-600"}`}>{item.type}</span>
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.isActive ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}{item.isActive ? "Active" : "Draft"}
                </span>
                {item.isFeatured && <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">⭐ Featured</span>}
                {item.images?.length > 0 && <span className="absolute bottom-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white">{item.images.length} photos</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{item.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />{item.destinationName || "—"}</p>
                <div className="flex gap-1 flex-wrap mb-3">
                  {item.entryFee && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full"><Tag className="w-2.5 h-2.5 inline mr-0.5" />{item.entryFee}</span>}
                  {item.duration && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5 inline mr-0.5" />{item.duration}</span>}
                </div>
                <div className="flex gap-2">
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
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No attractions found</p>
              <p className="text-sm">Click "Add Attraction" to create your first entry</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
