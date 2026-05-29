import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { Plus, Search, Edit, Trash2, MapPin, Camera, Save, X, Loader2, CheckCircle, XCircle, Upload, Star, Clock, Tag, Image as ImageIcon } from "lucide-react";
import { customFetch } from "../utils/api";
import { toast } from "sonner";

const TYPES = ["adventure", "water-sports", "cultural", "relaxation", "shopping", "dining", "trekking", "photography", "yoga", "wellness", "cooking", "workshop"];
const TYPE_COLORS: Record<string, string> = {
  adventure: "bg-orange-100 text-orange-700",
  "water-sports": "bg-cyan-100 text-cyan-700",
  cultural: "bg-purple-100 text-purple-700",
  relaxation: "bg-pink-100 text-pink-700",
  shopping: "bg-yellow-100 text-yellow-700",
  dining: "bg-amber-100 text-amber-700",
  trekking: "bg-green-100 text-green-700",
  photography: "bg-indigo-100 text-indigo-700",
  yoga: "bg-rose-100 text-rose-700",
  wellness: "bg-lime-100 text-lime-700",
  cooking: "bg-fuchsia-100 text-fuchsia-700",
  workshop: "bg-slate-100 text-slate-700",
};

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

async function uploadFile(file: File, folder = "activities"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const stored = localStorage.getItem("sh_admin_token");
  const token = stored ? JSON.parse(stored).token : "";
  const r = await fetch(`${API}/media/upload?folder=${folder}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!r.ok) throw new Error("Upload failed");
  return (await r.json()).url;
}

function MediaUpload({ label, value, onChange, folder = "activities" }: { label: string; value: string; onChange: (v: string) => void; folder?: string }) {
  const [uploading, setUploading] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      onChange(await uploadFile(f, folder));
      toast.success("Uploaded ✓");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL or upload →" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B]" />
        <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer text-sm font-bold min-w-[90px]">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-3.5 h-3.5 mr-1" />Upload</>}
          <input type="file" className="hidden" accept="image/*" onChange={handle} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

function GalleryUpload({ images, onChange, folder = "activities" }: { images: string[]; onChange: (v: string[]) => void; folder?: string }) {
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadFile(f, folder)));
      onChange([...images, ...urls]);
      toast.success(`${urls.length} image(s) uploaded ✓`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
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
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-4 border-2 border-dashed border-gray-100 rounded-xl p-6 text-center text-gray-400 text-sm">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No images yet. Upload gallery photos above.
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
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B]" />
    </div>
  );
}

function FieldTA({ label, value, onChange, rows = 3, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
      <textarea value={value || ""} rows={rows} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none" />
    </div>
  );
}

function ActivityModal({ item, destinations, onClose, onSave }: { item?: any; destinations: any[]; onClose: () => void; onSave: () => void }) {
  const isEdit = !!item?.id;
  const arr = (v: any, sep = "\n") => (Array.isArray(v) ? v.join(sep) : v || "");
  const [form, setForm] = useState<Record<string, any>>({
    destinationId: "",
    name: "",
    slug: "",
    type: "adventure",
    shortDescription: "",
    longDescription: "",
    coverImage: "",
    images: [],
    timingInfo: "",
    entryFee: "",
    duration: "",
    bestTimeToVisit: "",
    priceMin: null,
    priceMax: null,
    currency: "INR",
    address: "",
    latitude: "",
    longitude: "",
    highlights: "",
    tips: "",
    famousFor: "",
    isActive: true,
    isFeatured: false,
    displayOrder: 0,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ...(item
      ? {
          ...item,
          highlights: arr(item.highlights),
          tips: arr(item.tips),
          famousFor: arr(item.famousFor, ", "),
          images: item.images || [],
        }
      : {}),
  });
  const [loading, setLoading] = useState(false);
  const toArr = (v: string, sep = "\n") => v.split(sep).map((s: string) => s.trim()).filter(Boolean);

  const save = async () => {
    if (!form.destinationId || !form.name) return toast.error("Destination and Name are required");

    const priceMin = form.priceMin ? Number(form.priceMin) : null;
    const priceMax = form.priceMax ? Number(form.priceMax) : null;
    if ((priceMin || priceMax) && priceMin && priceMax && priceMin > priceMax) {
      return toast.error("Price Min must be less than or equal to Price Max");
    }

    setLoading(true);
    try {
      const payload: any = {
        ...form,
        destinationId: Number(form.destinationId),
        displayOrder: Number(form.displayOrder || 0),
        priceMin,
        priceMax,
        highlights: toArr(form.highlights),
        tips: toArr(form.tips),
        famousFor: toArr(form.famousFor, ","),
      };
      if (!payload.slug && payload.name) payload.slug = String(payload.name).toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
      if (isEdit) await customFetch(`/api/admin/activities/${item.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await customFetch("/api/admin/activities", { method: "POST", body: JSON.stringify(payload) });
      toast.success(isEdit ? "Activity updated!" : "Activity added!");
      onSave();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const f = (k: string) => (v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? `Edit: ${item.name}` : "Add New Activity"}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* Destination & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Destination (City) *</label>
              <select value={form.destinationId} onChange={(e) => f("destinationId")(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                <option value="">Select Destination…</option>
                {destinations.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.stateName}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Activity Name *" value={form.name} onChange={f("name")} />
            <Field label="Slug (auto)" value={form.slug} onChange={f("slug")} />
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => f("type")(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white">
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                  </option>
                ))}
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
              <Field label="Duration (e.g. 2–3 hrs)" value={form.duration} onChange={f("duration")} />
              <Field label="Best Time to Visit" value={form.bestTimeToVisit} onChange={f("bestTimeToVisit")} />
              <Field label="Price Min (₹)" value={String(form.priceMin || "")} onChange={(v: string) => f("priceMin")(v ? Number(v) : null)} type="number" />
              <Field label="Price Max (₹)" value={String(form.priceMax || "")} onChange={(v: string) => f("priceMax")(v ? Number(v) : null)} type="number" />
              <Field label="Address" value={form.address} onChange={f("address")} className="col-span-2" />
              <Field label="Latitude" value={form.latitude} onChange={f("latitude")} />
              <Field label="Longitude" value={form.longitude} onChange={f("longitude")} />
            </div>
          </div>

          {/* Rich Content */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">🎯 Rich Content</p>
            <div className="grid grid-cols-2 gap-4">
              <FieldTA label="Highlights (one per line)" value={form.highlights} onChange={f("highlights")} />
              <FieldTA label="Tips for Visitors (one per line)" value={form.tips} onChange={f("tips")} />
              <Field label="Famous For (comma separated)" value={form.famousFor} onChange={f("famousFor")} className="col-span-2" />
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
              <input type="checkbox" checked={form.isActive} onChange={(e) => f("isActive")(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">✅ Active / Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => f("isFeatured")(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">⭐ Featured</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1B3A6B] text-white text-sm font-bold disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Activity
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Activities() {
  const [search, setSearch] = useState("");
  const [filterDest, setFilterDest] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modal, setModal] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([customFetch("/api/admin/activities"), customFetch("/api/admin/destinations")]);
      setActivities(Array.isArray(a) ? a : []);
      setDestinations(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await customFetch(`/api/admin/activities/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const q = search.toLowerCase();
  const filtered = activities.filter(
    (a) =>
      (a.name?.toLowerCase().includes(q) || a.destinationName?.toLowerCase().includes(q)) &&
      (!filterDest || String(a.destinationId) === filterDest) &&
      (!filterType || a.type === filterType)
  );

  return (
    <AdminLayout title="Activities" subtitle="Manage detailed activities with images, descriptions, and pricing">
      {modal !== undefined && modal !== false && <ActivityModal item={modal || undefined} destinations={destinations} onClose={() => setModal(false)} onSave={() => { setModal(false); reload(); }} />}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities…" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>
        <select value={filterDest} onChange={(e) => setFilterDest(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1B3A6B]">
          <option value="">All Destinations</option>
          {destinations.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1B3A6B]">
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
            </option>
          ))}
        </select>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B3A6B] text-white text-sm font-bold hover:bg-[#2a519b]">
          <Plus className="w-4 h-4" /> Add Activity
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No activities found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition">
              <div className="flex items-center gap-4 flex-1">
                {activity.coverImage && <img src={activity.coverImage} alt={activity.name} className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <p className="font-bold text-gray-900">{activity.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${TYPE_COLORS[activity.type] || "bg-gray-100 text-gray-700"}`}>{activity.type}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-bold">{activity.destinationName}</span>
                    {activity.isActive && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {activity.isFeatured && <Star className="w-4 h-4 text-amber-600" />}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal(activity)} className="p-2 hover:bg-gray-50 rounded-lg transition">
                  <Edit className="w-4 h-4 text-blue-600" />
                </button>
                <button onClick={() => handleDelete(activity.id, activity.name)} className="p-2 hover:bg-gray-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
