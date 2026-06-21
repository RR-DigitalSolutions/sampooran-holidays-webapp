"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2, Bed, Calendar, BookOpen, Star, MapPin, Plus, Trash2, Edit2,
  Save, X, Check, AlertTriangle, Clock, ArrowLeft, Eye, Settings,
  Image as ImageIcon, Plane, BarChart3, Wallet, User, LogOut, ChevronRight, ChevronLeft,
  DollarSign, Users, CheckCircle, XCircle, MessageSquare, RefreshCw, Utensils
} from "lucide-react";
import { useVendorAuth, vendorAuthHeader } from "@/context/VendorAuthContext";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api-url";
import { AmenitiesSelector } from "@/components/AmenitiesSelector";

const API_BASE = getApiUrl();

const BED_TYPES = ["Single", "Twin", "Double", "King", "Queen", "Bunk", "Sofa"];
const ROOM_TYPES = ["Standard", "Deluxe", "Super Deluxe", "Suite", "Dormitory", "Cottage", "Tent", "Villa"];
const MEAL_PLANS = ["CP", "MAP", "AP"];
const MEAL_LABELS: Record<string, string> = { CP: "With Breakfast", MAP: "Half Board (Breakfast+Dinner)", AP: "All Inclusive" };
const MEAL_EMOJIS: Record<string, string> = { CP: "☕", MAP: "🍽️", AP: "⭐" };
const DEFAULT_MEAL_OPTIONS = [
  { code: "CP", label: "With Breakfast", adultPrice: 500, childPrice: 250, enabled: false },
  { code: "MAP", label: "Half Board (Breakfast+Dinner)", adultPrice: 1000, childPrice: 500, enabled: false },
  { code: "AP", label: "All Inclusive", adultPrice: 2000, childPrice: 1000, enabled: false },
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const RATE_MODES = [
  { key: "session", label: "Session Rates (Peak)", icon: "☀️", color: "border-amber-200 hover:border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-50", activeColor: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20" },
  { key: "off_session", label: "Off Session (Low)", icon: "❄️", color: "border-sky-200 hover:border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-50", activeColor: "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20" },
  { key: "mid_session", label: "Mid Session", icon: "🍂", color: "border-emerald-200 hover:border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50", activeColor: "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20" },
  { key: "blackout", label: "Festival / Blackout", icon: "🎆", color: "border-indigo-200 hover:border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50", activeColor: "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" },
  { key: "stop_sales", label: "Stop Sales", icon: "🚫", color: "border-rose-200 hover:border-rose-300 text-rose-700 bg-rose-50/50 hover:bg-rose-50", activeColor: "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20" },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  APPROVED: { label: "Live", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  PENDING_APPROVAL: { label: "Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  PENDING: { label: "Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  SUSPENDED: { label: "Suspended", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
  DRAFT: { label: "Draft", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: Settings },
};

function VendorSidebar({ active }: { active: string }) {
  const { vendor, logout } = useVendorAuth();
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-gradient-to-b from-[#0B1F4E] to-[#1B3A6B] shrink-0">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10">
        <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center"><Plane className="w-4 h-4 text-white" /></div>
        <div><p className="text-white font-black text-xs">SAMPOORAN</p><p className="text-[#F5A623] text-[9px] font-bold tracking-widest">PARTNER</p></div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {[
          { label: "Dashboard", icon: BarChart3, href: "/partner/dashboard" },
          { label: "Properties", icon: Building2, href: "/partner/properties" },
          { label: "Bookings", icon: BookOpen, href: "/partner/bookings" },
          { label: "Revenue", icon: Wallet, href: "/partner/revenue" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
              active === item.href ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white")}>
            <item.icon className={cn("w-4 h-4", active === item.href && "text-[#F5A623]")} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={logout} className="flex items-center gap-2.5 w-full px-3 py-2 text-white/60 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all text-sm">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Inline editable field ───────────────────────────────────────────────────
function EditableField({ label, value, type = "text", onChange, options }: {
  label: string; value: string | number; type?: string; onChange: (v: any) => void; options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) return (
    <div className="flex items-center gap-2">
      {options ? (
        <select aria-label={label} title={label} value={String(draft)} onChange={e => setDraft(e.target.value)}
          className="border border-[#1B3A6B] rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input aria-label={label} title={label} placeholder={label} type={type} value={String(draft)} onChange={e => setDraft(e.target.value)}
          className="border border-[#1B3A6B] rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1" />
      )}
      <button aria-label="Confirm Edit" title="Confirm Edit" onClick={() => { onChange(draft); setEditing(false); }} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
      <button aria-label="Cancel Edit" title="Cancel Edit" onClick={() => { setDraft(value); setEditing(false); }} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
    </div>
  );
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
      </div>
      <button aria-label="Edit Field" title="Edit Field" onClick={() => { setDraft(value); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-[#1B3A6B]">
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Room Form ───────────────────────────────────────────────────────────────
// ─── Browser Image Compressor & Cloudinary Uploader Helper ──────────────────
const compressAndUploadFile = async (file: File, hotelId: number, token: string | null): Promise<string> => {
  const compressedFile = await new Promise<File>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context is null"));
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        const getBlob = (q: number): Promise<Blob | null> => {
          return new Promise((res) => canvas.toBlob(res, "image/webp", q));
        };

        const compress = async () => {
          let blob = await getBlob(quality);
          while (blob && blob.size > 250 * 1024 && quality > 0.1) {
            quality -= 0.1;
            blob = await getBlob(quality);
          }
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }));
          } else {
            reject(new Error("Compression failed"));
          }
        };
        compress();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });

  const formData = new FormData();
  formData.append("file", compressedFile);

  const uploadRes = await fetch(`${API_BASE}/media/upload?folder=vendors/hotel_${hotelId}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.json().catch(() => ({}));
    throw new Error(uploadErr.message || "Failed to upload image to server");
  }

  const uploadData = await uploadRes.json();
  return uploadData.url;
};

// ─── Accordion Section ───────────────────────────────────────────────────────
function AccordionSection({ title, icon, defaultOpen = false, children, accentColor = "text-[#1B3A6B]" }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/70 hover:bg-gray-100/60 transition-colors">
        <span className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wide", accentColor)}>
          {icon} {title}
        </span>
        <span className={cn("text-gray-400 transition-transform duration-200 text-[10px]", open ? "rotate-180" : "")}>▼</span>
      </button>
      {open && <div className="p-4 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

// ─── Room Form ───────────────────────────────────────────────────────────────
function RoomForm({ room, hotelId, token, onSave, onCancel }: {
  room?: any; hotelId: number; token: string | null; onSave: (data: any) => void; onCancel: () => void;
}) {
  // ── Build initial meal plan options from existing or defaults ───────────────
  const buildInitialMealOptions = () => {
    const existing = room?.mealPlanOptions || [];
    return DEFAULT_MEAL_OPTIONS.map(o => {
      const found = existing.find((x: any) => x.code === o.code);
      if (o.code === "EP") {
        return { ...o, enabled: true, adultPrice: 0, childPrice: 0 };
      }
      return found ? { ...found } : { ...o };
    });
  };

  const [form, setForm] = useState({
    name: room?.name || "",
    type: room?.type || "Standard",
    bedType: room?.bedType || "Double",
    basePrice: room?.basePrice || "",
    // Occupancy
    baseAdults: room?.baseAdults ?? 2,
    baseChildren: room?.baseChildren ?? 0,
    maxAdults: room?.maxAdults ?? 3,
    maxChildren: room?.maxChildren ?? 2,
    maxOccupancy: room?.maxOccupancy || 4,
    // Extra Person Charges
    extraAdultPrice: room?.extraAdultPrice || "",
    extraChildWithBedPrice: room?.extraChildWithBedPrice || "",
    extraChildWithoutBedPrice: room?.extraChildWithoutBedPrice || "",
    extraChildPrice: room?.extraChildPrice || "", // legacy
    // Weekend Pricing
    weekendPrice: room?.weekendPrice || "",
    weekendDays: Array.isArray(room?.weekendDays) && room.weekendDays.length > 0
      ? room.weekendDays : ["Friday", "Saturday"],
    // Inventory
    totalRooms: room?.totalRooms || 1,
    // Default Meal Plan
    mealPlan: room?.mealPlan || "EP",
    // Room Details
    sizeSqft: room?.sizeSqft || "",
    description: room?.description || "",
    discountType: room?.discountType || "PERCENT",
    discountPercent: room?.discountPercent || 0,
    discountFlat: room?.discountFlat || 0,
    refundable: room?.refundable !== false,
    cancellationHours: room?.cancellationHours || 24,
    amenities: room?.amenities || [],
    images: room?.images || [],
    viewType: room?.viewType || "",
    highlights: room?.highlights || [],
    facilities: room?.facilities || [],
  });

  const [mealPlanOptions, setMealPlanOptions] = useState<any[]>(buildInitialMealOptions);

  const [cancellationVal, setCancellationVal] = useState(() => {
    const hrs = room?.cancellationHours ?? 24;
    if (hrs % 168 === 0) return hrs / 168;
    if (hrs % 24 === 0) return hrs / 24;
    return hrs;
  });
  const [cancellationUnit, setCancellationUnit] = useState(() => {
    const hrs = room?.cancellationHours ?? 24;
    if (hrs % 168 === 0) return "Weeks";
    if (hrs % 24 === 0) return "Days";
    return "Hours";
  });
  const [uploading, setUploading] = useState(false);

  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleWeekendDay = (day: string) => {
    setForm(f => ({
      ...f,
      weekendDays: f.weekendDays.includes(day)
        ? f.weekendDays.filter((d: string) => d !== day)
        : [...f.weekendDays, day],
    }));
  };

  const updateMealOption = (code: string, key: string, value: any) => {
    setMealPlanOptions(prev => prev.map(o => o.code === code ? { ...o, [key]: value } : o));
  };

  return (
    <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#0f2548] px-5 py-3.5 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Bed className="w-4 h-4 text-[#F5A623]" />
          {room ? `Edit: ${room.name}` : "Add New Room Type"}
        </h3>
        <button onClick={onCancel} className="text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* ── Core Identity (always visible) ─────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Name *</label>
            <input value={form.name} onChange={e => u("name", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] font-medium"
              placeholder="e.g. Deluxe Mountain View Room" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Type</label>
            <select aria-label="Room Type" title="Room Type" value={form.type} onChange={e => u("type", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
              {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bed Type</label>
            <select aria-label="Bed Type" title="Bed Type" value={form.bedType} onChange={e => u("bedType", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
              {BED_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total Rooms (Inventory)</label>
            <input type="number" min="1" value={form.totalRooms} onChange={e => u("totalRooms", Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Base Price (₹/night) *</label>
            <input type="number" value={form.basePrice} onChange={e => u("basePrice", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] font-medium"
              placeholder="3500" />
          </div>
        </div>

        {/* ── Occupancy ──────────────────────────────────────────── */}
        <AccordionSection title="Occupancy Configuration" icon={<Users className="w-3.5 h-3.5" />} accentColor="text-blue-700" defaultOpen={!!room}>
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2 mb-3 text-[10px] text-blue-700 font-medium leading-relaxed">
            <strong>How it works:</strong> Base price covers <strong>{form.baseAdults} adult{form.baseAdults !== 1 ? "s" : ""}</strong> + <strong>{form.baseChildren} child{form.baseChildren !== 1 ? "ren" : ""}</strong>.
            Max room capacity = <strong>{Number(form.maxAdults) + Number(form.maxChildren)} persons</strong> ({form.maxAdults} adults + {form.maxChildren} children).
            Extra charges apply beyond the base count.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Adults Included in Base Price</label>
              <input type="number" min="1" max="10" value={form.baseAdults} onChange={e => u("baseAdults", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              <p className="text-[9px] text-blue-600 mt-0.5">Included in base price, no extra charge</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Children Included in Base Price</label>
              <input type="number" min="0" max="10" value={form.baseChildren} onChange={e => u("baseChildren", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              <p className="text-[9px] text-blue-600 mt-0.5">Included in base price, no extra charge</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Adults Allowed</label>
              <input type="number" min="1" max="20" value={form.maxAdults} onChange={e => u("maxAdults", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Children Allowed</label>
              <input type="number" min="0" max="10" value={form.maxChildren} onChange={e => u("maxChildren", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>
        </AccordionSection>

        {/* ── Extra Person Charges ─────────────────────────────────── */}
        <AccordionSection title="Extra Person Charges" icon={<DollarSign className="w-3.5 h-3.5" />} accentColor="text-emerald-700">
          <p className="text-[9px] text-emerald-600 -mt-1 mb-2">Charges applied per night for guests beyond the base occupancy count</p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Extra Adult (₹/night)</label>
              <input type="number" value={form.extraAdultPrice} onChange={e => u("extraAdultPrice", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                placeholder="e.g. 1000" />
              <p className="text-[9px] text-emerald-700 mt-0.5">Per adult beyond base count of {form.baseAdults}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">🛏️ Child WITH Extra Bed (₹)</label>
                <input type="number" value={form.extraChildWithBedPrice} onChange={e => u("extraChildWithBedPrice", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                  placeholder="e.g. 600" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">🤝 Child Sharing Bed (₹)</label>
                <input type="number" value={form.extraChildWithoutBedPrice} onChange={e => u("extraChildWithoutBedPrice", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                  placeholder="e.g. 250" />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-[9px] text-amber-700">
              💡 <strong>Tip:</strong> Weekend & seasonal price overrides are managed in the <strong>Inventory &amp; Rates</strong> tab. Promotional discounts are also set there.
            </div>
          </div>
        </AccordionSection>


        {/* ── Meal Plans ──────────────────────────────────────────── */}
        <AccordionSection title="Meal Plan Options" icon={<Utensils className="w-3.5 h-3.5" />} accentColor="text-purple-700">
          <p className="text-[9px] text-purple-500 -mt-1 mb-2">Guests choose their meal plan during booking</p>
          <div className="space-y-2">
            {mealPlanOptions.filter((opt: any) => opt.code !== "EP").map((opt: any) => (
              <div key={opt.code}
                className={cn(
                  "border rounded-xl p-3 transition-all",
                  opt.enabled ? "bg-white border-purple-200" : "bg-gray-50 border-gray-200 opacity-60"
                )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{MEAL_EMOJIS[opt.code]}</span>
                    <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                    <span className="text-[9px] font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{opt.code}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={opt.enabled}
                      onChange={e => updateMealOption(opt.code, "enabled", e.target.checked)}
                      className="w-4 h-4 accent-purple-600" />
                    <span className="text-xs font-semibold text-gray-600">{opt.enabled ? "Offered" : "Off"}</span>
                  </label>
                </div>
                {opt.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Adult (₹/night)</label>
                      <input type="number" min="0" value={opt.adultPrice}
                        onChange={e => updateMealOption(opt.code, "adultPrice", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-300 bg-purple-50"
                        placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Child (₹/night)</label>
                      <input type="number" min="0" value={opt.childPrice}
                        onChange={e => updateMealOption(opt.code, "childPrice", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-300 bg-purple-50"
                        placeholder="0" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ── Description, Highlights, Facilities, Media ──────────── */}
        <AccordionSection title="Description, Highlights & Media" icon={<ImageIcon className="w-3.5 h-3.5" />} accentColor="text-gray-600">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">View Type</label>
              <input value={form.viewType} onChange={e => u("viewType", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                placeholder="e.g. Mountain View, Pool View, Garden View" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Size (sq.ft)</label>
              <input type="number" value={form.sizeSqft} onChange={e => u("sizeSqft", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                placeholder="250" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Description</label>
              <textarea value={form.description} onChange={e => u("description", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none"
                rows={2} placeholder="Describe the room..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Add Highlight</label>
              <div className="flex gap-2">
                <input id="new-room-highlight" placeholder="e.g. King-size bed" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                <button type="button" onClick={() => {
                  const el = document.getElementById("new-room-highlight") as HTMLInputElement;
                  if (el && el.value.trim()) { u("highlights", [...form.highlights, el.value.trim()]); el.value = ""; }
                }} className="bg-[#1B3A6B] text-white hover:bg-[#0f2548] px-4 py-2 rounded-xl text-xs font-bold transition-colors">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 mt-1.5 bg-slate-50 border border-gray-100 rounded-xl">
                {form.highlights.length === 0
                  ? <span className="text-xs text-gray-400 italic">No highlights yet.</span>
                  : form.highlights.map((h: string, idx: number) => (
                    <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                      {h}
                      <button type="button" onClick={() => u("highlights", form.highlights.filter((_: any, i: number) => i !== idx))} className="text-amber-500 hover:text-amber-700 font-bold">&times;</button>
                    </span>
                  ))
                }
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Add Facility</label>
                <div className="flex gap-2">
                  <input id="new-room-facility" placeholder="e.g. Mini Bar" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  <button type="button" onClick={() => {
                    const el = document.getElementById("new-room-facility") as HTMLInputElement;
                    if (el && el.value.trim()) { u("facilities", [...form.facilities, el.value.trim()]); el.value = ""; }
                  }} className="bg-[#1B3A6B] text-white hover:bg-[#0f2548] px-3 py-2 rounded-xl text-xs font-bold transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 mt-1.5 bg-slate-50 border border-gray-100 rounded-xl">
                  {form.facilities.length === 0 ? <span className="text-xs text-gray-400 italic">None.</span>
                    : form.facilities.map((f: string, idx: number) => (
                      <span key={idx} className="bg-sky-50 text-sky-800 border border-sky-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">{f}
                        <button type="button" onClick={() => u("facilities", form.facilities.filter((_: any, i: number) => i !== idx))} className="text-sky-500 hover:text-sky-700 font-bold">&times;</button>
                      </span>
                    ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Add Amenity</label>
                <div className="flex gap-2">
                  <input id="new-room-amenity" placeholder="e.g. Wi-Fi" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  <button type="button" onClick={() => {
                    const el = document.getElementById("new-room-amenity") as HTMLInputElement;
                    if (el && el.value.trim()) { u("amenities", [...form.amenities, el.value.trim()]); el.value = ""; }
                  }} className="bg-[#1B3A6B] text-white hover:bg-[#0f2548] px-3 py-2 rounded-xl text-xs font-bold transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 mt-1.5 bg-slate-50 border border-gray-100 rounded-xl">
                  {form.amenities.length === 0 ? <span className="text-xs text-gray-400 italic">None.</span>
                    : form.amenities.map((a: string, idx: number) => (
                      <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">{a}
                        <button type="button" onClick={() => u("amenities", form.amenities.filter((_: any, i: number) => i !== idx))} className="text-emerald-500 hover:text-emerald-700 font-bold">&times;</button>
                      </span>
                    ))}
                </div>
              </div>
            </div>
            {/* Room Images */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Images (Max 5)</label>
              <div className="flex flex-wrap gap-3 mt-1 mb-2">
                {form.images.map((img: string, idx: number) => (
                  <div key={idx} className="relative w-24 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={img} alt="Room preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => u("images", form.images.filter((_: any, i: number) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {form.images.length < 5 && (
                  <label className="w-24 h-16 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#1B3A6B] hover:bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all relative">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{uploading ? "Uploading" : "Add Image"}</span>
                    <input type="file" accept="image/*" disabled={uploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const url = await compressAndUploadFile(file, hotelId, token);
                        u("images", [...form.images, url]);
                      } catch (err: any) {
                        alert(err.message || "Upload failed");
                      } finally {
                        setUploading(false);
                      }
                    }} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* ── Cancellation Policy ─────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
          <input type="checkbox" checked={form.refundable} onChange={e => u("refundable", e.target.checked)} className="w-4 h-4 accent-[#1B3A6B]" id="refundable-check" />
          <label htmlFor="refundable-check" className="font-medium text-gray-700 text-sm cursor-pointer flex-1">Free Cancellation</label>
          {form.refundable && (
            <div className="flex items-center gap-1">
              <input type="number" value={cancellationVal} onChange={e => setCancellationVal(Number(e.target.value))} min="1"
                className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs" />
              <select value={cancellationUnit} onChange={e => setCancellationUnit(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                <option>Hours</option>
                <option>Days</option>
                <option>Weeks</option>
              </select>
              <span className="text-xs text-gray-400">before check-in</span>
            </div>
          )}
        </div>

        {/* ── Save / Cancel ────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => {
            let hrs = Number(cancellationVal);
            if (cancellationUnit === "Days") hrs *= 24;
            else if (cancellationUnit === "Weeks") hrs *= 168;
            onSave({
              ...form,
              cancellationHours: hrs,
              basePrice: Number(form.basePrice),
              extraAdultPrice: Number(form.extraAdultPrice || 0),
              extraChildWithBedPrice: Number(form.extraChildWithBedPrice || 0),
              extraChildWithoutBedPrice: Number(form.extraChildWithoutBedPrice || 0),
              extraChildPrice: Number(form.extraChildWithBedPrice || 0),
              baseAdults: Number(form.baseAdults),
              baseChildren: Number(form.baseChildren),
              maxAdults: Number(form.maxAdults),
              maxChildren: Number(form.maxChildren),
              sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : undefined,
              mealPlanOptions: mealPlanOptions.filter((o: any) => o.enabled),
              mealPlan: mealPlanOptions.find((o: any) => o.enabled && o.code === "EP") ? "EP" : (mealPlanOptions.find((o: any) => o.enabled)?.code || "EP"),
            });
          }}
            className="px-5 py-2 bg-[#1B3A6B] text-white rounded-xl text-sm font-bold hover:bg-[#0f2548] transition-colors flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> {room ? "Save Changes" : "Add Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Property Management Page ──────────────────────────────────────────

export default function VendorPropertyManagerPage() {
  const { vendor, token, isLoading } = useVendorAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const hotelId = Number(params?.id);

  const [tab, setTab] = useState<"overview" | "rooms" | "inventory" | "bookings" | "policies" | "photos">((searchParams?.get("tab") as any) || "overview");
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Inventory state
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [selectedRoomForInv, setSelectedRoomForInv] = useState<string>("");
  const [invStartDate, setInvStartDate] = useState<string>("");
  const [invEndDate, setInvEndDate] = useState<string>("");
  const [invRateType, setInvRateType] = useState<string>("session");
  const [invAvailableCount, setInvAvailableCount] = useState<string>("1");
  const [invPriceOverride, setInvPriceOverride] = useState<string>("");
  const [invIsBlocked, setInvIsBlocked] = useState<boolean>(false);
  const [invDiscountType, setInvDiscountType] = useState<string>("PERCENT");
  const [invDiscountPercent, setInvDiscountPercent] = useState<string>("0");
  const [invDiscountFlat, setInvDiscountFlat] = useState<string>("0");
  const [invWeekendPrice, setInvWeekendPrice] = useState<string>("");
  const [invWeekendDays, setInvWeekendDays] = useState<string[]>(["Friday", "Saturday"]);
  const [invExtraAdultPrice, setInvExtraAdultPrice] = useState<string>("");
  const [invExtraChildWithBedPrice, setInvExtraChildWithBedPrice] = useState<string>("");
  const [invExtraChildWithoutBedPrice, setInvExtraChildWithoutBedPrice] = useState<string>("");
  const [invMealPlanOptions, setInvMealPlanOptions] = useState<any[]>(DEFAULT_MEAL_OPTIONS);
  const [savingInv, setSavingInv] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [editedHotel, setEditedHotel] = useState<any>({});
  const [savingField, setSavingField] = useState(false);

  // Geolocation State for Location dropdowns
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [locCountryId, setLocCountryId] = useState<number | "">("");
  const [locStateId, setLocStateId] = useState<number | "">("");
  const [locDestinationId, setLocDestinationId] = useState<number | "">("");
  const [locCustomCity, setLocCustomCity] = useState("");
  const [useLocCustomCity, setUseLocCustomCity] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  // Photo management state
  const [photos, setPhotos] = useState<any[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoCategory, setNewPhotoCategory] = useState("EXTERIOR");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  // Policies state
  const [policies, setPolicies] = useState<any>({});
  const [savingPolicies, setSavingPolicies] = useState(false);

  useEffect(() => { if (!isLoading && !vendor) router.replace("/partner/login"); }, [vendor, isLoading, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    try {
      const [hotelRes, roomsRes, bookingsRes, photosRes] = await Promise.all([
        fetch(`${API_BASE}/vendor/hotels/${hotelId}`, { headers: vendorAuthHeader(token) }),
        fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms`, { headers: vendorAuthHeader(token) }),
        fetch(`${API_BASE}/vendor/hotels/${hotelId}/bookings`, { headers: vendorAuthHeader(token) }),
        fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, { headers: vendorAuthHeader(token) }),
      ]);
      if (hotelRes.ok) {
        const h = await hotelRes.json();
        setHotel(h);
        setEditedHotel(h);
        // Load policies from hotel detail response
        if (h.policies) setPolicies(h.policies);
      }
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (photosRes.ok) setPhotos(await photosRes.json());
    } catch { }
    finally { setFetching(false); }
  }, [token, hotelId]);

  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  // Fetch countries on mount
  useEffect(() => {
    fetch(`${API_BASE}/destinations/countries`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCountries(Array.isArray(data) ? data : (data.countries || [])))
      .catch(() => { });
  }, []);

  // Fetch states when selected country (or hotel country) is active
  const activeCountryId = isEditingLocation ? locCountryId : hotel?.countryId;
  useEffect(() => {
    if (!activeCountryId) {
      setStates([]);
      setCities([]);
      return;
    }
    fetch(`${API_BASE}/destinations/states?countryId=${activeCountryId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setStates(Array.isArray(data) ? data : (data.states || [])))
      .catch(() => { });
  }, [activeCountryId]);

  // Fetch cities when selected state (or hotel state) is active
  const activeStateId = isEditingLocation ? locStateId : hotel?.stateId;
  useEffect(() => {
    if (!activeStateId) {
      setCities([]);
      return;
    }
    fetch(`${API_BASE}/destinations?stateId=${activeStateId}&limit=200`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCities(Array.isArray(data) ? data : (data.destinations || [])))
      .catch(() => { });
  }, [activeStateId]);

  const startEditingLocation = () => {
    setLocCountryId(hotel?.countryId || "");
    setLocStateId(hotel?.stateId || "");
    setLocDestinationId(hotel?.destinationId || "");
    setLocCustomCity(hotel?.customCity || "");
    setUseLocCustomCity(!!hotel?.customCity);
    setIsEditingLocation(true);
  };

  const saveLocation = async () => {
    if (!locCountryId) {
      alert("Please select a Country");
      return;
    }
    if (!locStateId) {
      alert("Please select a State / Region");
      return;
    }
    if (!useLocCustomCity && !locDestinationId) {
      alert("Please select a City / Place");
      return;
    }
    if (useLocCustomCity && !locCustomCity.trim()) {
      alert("Please enter your custom city name");
      return;
    }

    setSavingField(true);
    try {
      const payload: any = {
        countryId: locCountryId ? Number(locCountryId) : null,
        stateId: locStateId ? Number(locStateId) : null,
        destinationId: useLocCustomCity ? null : (locDestinationId ? Number(locDestinationId) : null),
        customCity: useLocCustomCity && locCustomCity.trim() ? locCustomCity.trim() : null,
      };

      if (useLocCustomCity) {
        payload.city = locCustomCity.trim();
        const selectedStateObj = states.find(s => s.id === Number(locStateId));
        const selectedCountryObj = countries.find(c => c.id === Number(locCountryId));
        payload.customStateName = selectedStateObj ? selectedStateObj.name : null;
        payload.customCountryName = selectedCountryObj ? selectedCountryObj.name : null;
      } else {
        const selectedCityObj = cities.find(c => c.id === Number(locDestinationId));
        payload.city = selectedCityObj ? selectedCityObj.name : "";
      }

      const selectedStateObj = states.find(s => s.id === Number(locStateId));
      payload.state = selectedStateObj ? selectedStateObj.name : "";

      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}`, {
        method: "PATCH",
        headers: vendorAuthHeader(token),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setHotel(updated);
        setEditedHotel(updated);
        setIsEditingLocation(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to update location");
      }
    } catch {
      alert("Error saving location");
    } finally {
      setSavingField(false);
    }
  };

  const fetchInventory = useCallback(async () => {
    if (!token || !selectedRoomForInv) return;
    try {
      const year = currentCalendarMonth.getFullYear();
      const month = currentCalendarMonth.getMonth();
      const startDay = new Date(year, month, 1);
      const endDay = new Date(year, month + 1, 0);
      const startDateStr = startDay.toISOString().split("T")[0];
      const endDateStr = endDay.toISOString().split("T")[0];

      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/inventory?roomId=${selectedRoomForInv}&startDate=${startDateStr}&endDate=${endDateStr}`, {
        headers: vendorAuthHeader(token),
      });
      if (res.ok) setInventoryData(await res.json());
    } catch { }
  }, [token, hotelId, selectedRoomForInv, currentCalendarMonth]);

  useEffect(() => {
    if (tab === "inventory") fetchInventory();
  }, [tab, fetchInventory]);

  const saveHotelField = async (field: string, value: any) => {
    setSavingField(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}`, {
        method: "PATCH",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) { const updated = await res.json(); setHotel(updated); setEditedHotel(updated); }
    } catch { } finally { setSavingField(false); }
  };

  const addRoom = async (data: any) => {
    const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms`, {
      method: "POST", headers: vendorAuthHeader(token), body: JSON.stringify(data),
    });
    if (res.ok) { const room = await res.json(); setRooms(r => [...r, room]); setShowRoomForm(false); }
  };

  const updateRoom = async (roomId: number, data: any) => {
    const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms/${roomId}`, {
      method: "PATCH", headers: vendorAuthHeader(token), body: JSON.stringify(data),
    });
    if (res.ok) { const updated = await res.json(); setRooms(r => r.map(x => x.id === roomId ? updated : x)); setEditingRoom(null); }
  };

  const deleteRoom = async (roomId: number) => {
    if (!confirm("Delete this room type?")) return;
    await fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms/${roomId}`, { method: "DELETE", headers: vendorAuthHeader(token) });
    setRooms(r => r.filter(x => x.id !== roomId));
  };

  const updateBookingStatus = async (bookingId: number, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    // Use the unified vendor bookings endpoint that supports all statuses
    const res = await fetch(`${API_BASE}/vendor/bookings/${bookingId}/status`, {
      method: "PATCH", headers: vendorAuthHeader(token), body: JSON.stringify({ status }),
    });
    if (res.ok) setBookings(b => b.map(x => x.id === bookingId ? { ...x, status } : x));
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to update booking status");
    }
  };

  // ─── Photo Management Functions ───────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 15) {
      alert("You have reached the limit of 15 photos max for this property.");
      return;
    }

    setAddingPhoto(true);
    try {
      // Compress and convert image to WebP under 250KB in the browser
      const compressedFile = await new Promise<File>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new window.Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              if (width > height) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              } else {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas context is null"));
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.8;
            const getBlob = (q: number): Promise<Blob | null> => {
              return new Promise((res) => canvas.toBlob(res, "image/webp", q));
            };

            const compress = async () => {
              let blob = await getBlob(quality);
              while (blob && blob.size > 250 * 1024 && quality > 0.1) {
                quality -= 0.1;
                blob = await getBlob(quality);
              }
              if (blob) {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }));
              } else {
                reject(new Error("Compression failed"));
              }
            };
            compress();
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });

      const formData = new FormData();
      formData.append("file", compressedFile);

      const uploadRes = await fetch(`${API_BASE}/media/upload?folder=vendors/hotel_${hotelId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(uploadErr.message || "Failed to upload image to server");
      }

      const uploadData = await uploadRes.json();

      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, {
        method: "POST",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({
          url: uploadData.url,
          caption: newPhotoCaption.trim() || null,
          category: newPhotoCategory,
          isPrimary: photos.length === 0,
          displayOrder: photos.length,
        }),
      });

      if (res.ok) {
        const photo = await res.json();
        setPhotos(p => [...p, photo]);
        setNewPhotoCaption("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save photo record");
      }
    } catch (err: any) {
      alert(err.message || "Error uploading file.");
    } finally {
      setAddingPhoto(false);
    }
  };

  const addPhoto = async () => {
    if (photos.length >= 15) {
      alert("You have reached the limit of 15 photos max for this property.");
      return;
    }
    if (!newPhotoUrl.trim()) return;
    setAddingPhoto(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, {
        method: "POST",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({
          url: newPhotoUrl.trim(),
          caption: newPhotoCaption.trim() || null,
          category: newPhotoCategory,
          isPrimary: photos.length === 0,
          displayOrder: photos.length,
        }),
      });
      if (res.ok) {
        const photo = await res.json();
        setPhotos(p => [...p, photo]);
        setNewPhotoUrl("");
        setNewPhotoCaption("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to add photo");
      }
    } catch { alert("Error adding photo."); }
    finally { setAddingPhoto(false); }
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm("Remove this photo?")) return;
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos/${photoId}`, {
        method: "DELETE", headers: vendorAuthHeader(token),
      });
      if (res.ok) setPhotos(p => p.filter(x => x.id !== photoId));
    } catch { }
    finally { setDeletingPhotoId(null); }
  };

  const setPrimaryPhoto = async (photoId: number) => {
    const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos/${photoId}`, {
      method: "PATCH", headers: vendorAuthHeader(token),
      body: JSON.stringify({ isPrimary: true }),
    });
    if (res.ok) {
      // Refetch photos to reflect primary change
      const r = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, { headers: vendorAuthHeader(token) });
      if (r.ok) setPhotos(await r.json());
    }
  };

  // ─── Policies Save ────────────────────────────────────────────────────────
  const savePolicies = async () => {
    setSavingPolicies(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/policies`, {
        method: "PATCH",
        headers: vendorAuthHeader(token),
        body: JSON.stringify(policies),
      });
      if (res.ok) {
        const updated = await res.json();
        setPolicies(updated);
        alert("Policies saved successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save policies");
      }
    } catch { alert("Error saving policies."); }
    finally { setSavingPolicies(false); }
  };

  const submitProperty = async () => {
    if (!confirm("Are you sure you want to submit this property for verification? Make sure all details, photos, and rooms are added.")) return;
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/submit`, {
        method: "POST", headers: vendorAuthHeader(token),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit property.");
      } else {
        alert("Property submitted successfully!");
        setHotel(data.hotel);
        setEditedHotel(data.hotel);
      }
    } catch (e: any) {
      alert("Error submitting property.");
    }
  };

  const renderCalendar = () => {
    if (!selectedRoomForInv) return null;
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const today = new Date().toISOString().split("T")[0];

    const days: React.ReactNode[] = [];

    // Padding cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`pad-${i}`} />);
    }

    const selectedRoom = rooms.find(r => r.id === Number(selectedRoomForInv));
    const baseRoomPrice = selectedRoom?.basePrice || 0;
    const baseTotalRooms = selectedRoom?.totalRooms || 0;
    // Room-level defaults for discount
    const roomDiscountType = selectedRoom?.discountType || "PERCENT";
    const roomDiscountPercent = Number(selectedRoom?.discountPercent ?? 0);
    const roomDiscountFlat = Number(selectedRoom?.discountFlat ?? 0);

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const inv = inventoryData.find(x => x.date.split("T")[0] === dateStr);
      const isPast = dateStr < today;
      const isToday = dateStr === today;

      // Determine values – fall back to room-level defaults when no inventory override
      const isBlocked = inv ? Boolean(inv.isBlocked) : false;
      const availableCount = inv ? Number(inv.availableCount) : baseTotalRooms;
      const price = inv && inv.priceOverride != null ? Number(inv.priceOverride) : baseRoomPrice;
      const isPriceOverride = inv && inv.priceOverride != null;

      const discountType = inv ? (inv.discountType || roomDiscountType) : roomDiscountType;
      const discountPercent = inv ? Number(inv.discountPercent ?? 0) : roomDiscountPercent;
      const discountFlat = inv ? Number(inv.discountFlat ?? 0) : roomDiscountFlat;

      let discountedPrice = price;
      if (!isBlocked) {
        if (discountType === "PERCENT" && discountPercent > 0) {
          discountedPrice = Math.max(0, price - (price * discountPercent) / 100);
        } else if (discountType === "FLAT" && discountFlat > 0) {
          discountedPrice = Math.max(0, price - discountFlat);
        }
      }
      const hasDiscount = !isBlocked && discountedPrice < price;
      const savedAmount = price - discountedPrice;

      // Status determination
      type StatusKey = "past" | "today" | "blocked" | "soldout" | "lowstock" | "discount" | "peakprice" | "session" | "off_session" | "mid_session" | "blackout" | "available";
      let status: StatusKey = "available";
      const rateType = inv?.customPricing?.rateType;

      if (isPast) status = "past";
      else if (isBlocked) status = "blocked";
      else if (availableCount === 0) status = "soldout";
      else if (availableCount <= 2) status = "lowstock";
      else if (rateType === "blackout") status = "blackout";
      else if (rateType === "session") status = "session";
      else if (rateType === "mid_session") status = "mid_session";
      else if (rateType === "off_session") status = "off_session";
      else if (hasDiscount) status = "discount";
      else if (isPriceOverride && price > baseRoomPrice) status = "peakprice";
      else if (isToday) status = "today";

      const STYLES: Record<StatusKey, { cell: string; dayNum: string; badge: string; badgeText: string }> = {
        past: { cell: "bg-gray-50 border-gray-100 opacity-50 cursor-default", dayNum: "text-gray-300", badge: "", badgeText: "" },
        today: { cell: "bg-blue-50 border-blue-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5", dayNum: "text-blue-700 bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px]", badge: "bg-blue-600", badgeText: "Today" },
        blocked: { cell: "bg-rose-50/70 border-rose-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5", dayNum: "text-rose-700", badge: "bg-rose-500", badgeText: "Blocked" },
        soldout: { cell: "bg-slate-100 border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5", dayNum: "text-slate-500", badge: "bg-slate-500", badgeText: "Sold Out" },
        lowstock: { cell: "bg-amber-50 border-amber-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5", dayNum: "text-amber-950", badge: "bg-amber-500", badgeText: `${availableCount} Left!` },
        session: { cell: "bg-amber-50/70 border-amber-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400", dayNum: "text-amber-950", badge: "bg-amber-500", badgeText: "Session" },
        off_session: { cell: "bg-sky-50/70 border-sky-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-sky-400", dayNum: "text-sky-950", badge: "bg-sky-500", badgeText: "Off-Low" },
        mid_session: { cell: "bg-emerald-50/70 border-emerald-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-400", dayNum: "text-emerald-950", badge: "bg-emerald-500", badgeText: "Mid-Season" },
        blackout: { cell: "bg-indigo-50/70 border-indigo-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-400", dayNum: "text-indigo-950", badge: "bg-indigo-600", badgeText: "Festival" },
        discount: { cell: "bg-emerald-50 border-emerald-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5", dayNum: "text-emerald-950", badge: "bg-emerald-500", badgeText: "Deal" },
        peakprice: { cell: "bg-sky-50 border-sky-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5", dayNum: "text-sky-950", badge: "bg-sky-500", badgeText: "Peak" },
        available: { cell: "bg-white border-gray-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-[#1B3A6B]/40", dayNum: "text-gray-800", badge: "bg-teal-600", badgeText: "Open" },
      };
      const s = STYLES[status];

      // Discount label: show both % and ₹ savings
      const discountBadge = hasDiscount
        ? (discountType === "PERCENT"
          ? `${discountPercent}% · ₹${Math.round(savedAmount).toLocaleString()}`
          : `₹${Math.round(savedAmount).toLocaleString()} off`)
        : null;

      days.push(
        <div
          key={d}
          onClick={() => {
            if (isPast) return;
            setInvStartDate(dateStr);
            setInvEndDate(dateStr);
            setInvAvailableCount(String(availableCount));
            setInvPriceOverride(inv && inv.priceOverride != null ? String(inv.priceOverride) : "");
            setInvIsBlocked(isBlocked);
            setInvDiscountType(inv ? (inv.discountType || "PERCENT") : "PERCENT");
            setInvDiscountPercent(inv ? String(inv.discountPercent || 0) : "0");
            setInvDiscountFlat(inv ? String(inv.discountFlat || 0) : "0");

            const cp = inv?.customPricing || {};
            setInvRateType(cp.rateType || (isBlocked ? "stop_sales" : "session"));
            setInvWeekendPrice(cp.weekendPrice !== undefined && cp.weekendPrice !== null ? String(cp.weekendPrice) : "");
            setInvWeekendDays(Array.isArray(cp.weekendDays) ? cp.weekendDays : (selectedRoom?.weekendDays || ["Friday", "Saturday"]));
            setInvExtraAdultPrice(cp.extraAdultPrice !== undefined && cp.extraAdultPrice !== null ? String(cp.extraAdultPrice) : "");
            setInvExtraChildWithBedPrice(cp.extraChildWithBedPrice !== undefined && cp.extraChildWithBedPrice !== null ? String(cp.extraChildWithBedPrice) : "");
            setInvExtraChildWithoutBedPrice(cp.extraChildWithoutBedPrice !== undefined && cp.extraChildWithoutBedPrice !== null ? String(cp.extraChildWithoutBedPrice) : "");

            const roomMealPlans = selectedRoom?.mealPlanOptions || DEFAULT_MEAL_OPTIONS;
            const activeMealPlans = Array.isArray(cp.mealPlanOptions) && cp.mealPlanOptions.length > 0
              ? cp.mealPlanOptions
              : roomMealPlans;
            const mergedMealPlans = DEFAULT_MEAL_OPTIONS.map(defOpt => {
              const matched = activeMealPlans.find((x: any) => x.code === defOpt.code);
              return matched ? { ...defOpt, ...matched } : defOpt;
            });
            setInvMealPlanOptions(mergedMealPlans);
          }}
          className={cn(
            "rounded-xl border transition-all duration-150 flex flex-col select-none overflow-hidden",
            "min-h-[92px]",
            s.cell
          )}
        >
          {/* Row 1: Day number + status badge */}
          <div className="flex items-start justify-between px-2 pt-2 pb-1 gap-1">
            <span className={cn("text-[11px] font-black leading-none shrink-0", s.dayNum)}>{d}</span>
            {!isPast && s.badge && (
              <span className={cn("text-white text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none shrink-0", s.badge)}>
                {s.badgeText}
              </span>
            )}
          </div>

          {/* Row 2: Price with strikethrough and discounted */}
          <div className="px-2 flex-1 flex flex-col justify-center">
            {!isBlocked && !isPast ? (
              <>
                {hasDiscount ? (
                  <>
                    <span className="text-[9px] text-gray-400 line-through leading-none">₹{price.toLocaleString()}</span>
                    <span className="text-[12px] font-black text-emerald-700 leading-tight mt-0.5">
                      ₹{Math.round(discountedPrice).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-[12px] font-black text-gray-800 leading-tight">
                    ₹{price.toLocaleString()}
                  </span>
                )}
                <span className="text-[8px] text-gray-400 leading-none mt-0.5">/night</span>
              </>
            ) : (
              <span className="text-[9px] italic text-current opacity-50">
                {isBlocked ? "Blocked" : "Sold Out"}
              </span>
            )}
          </div>

          {/* Row 3: Discount detail badge + rooms count */}
          <div className="px-2 pb-2 flex items-end justify-between gap-1">
            {!isPast && !isBlocked && discountBadge && (
              <span className="text-[7px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full leading-none">
                {discountBadge}
              </span>
            )}
            {!isPast && !isBlocked && inv?.customPricing && (
              <span className="text-[7px] font-black text-[#1B3A6B] bg-blue-50 border border-blue-100 px-1 py-0.5 rounded leading-none shrink-0" title="Custom pricing override active">
                ⚡ Rates
              </span>
            )}
            {!isPast && !isBlocked && (
              <span className="text-[7px] text-gray-400 font-bold ml-auto">
                {availableCount > 0 ? `${availableCount}/${baseTotalRooms}` : "0"}
              </span>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const handleBulkUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForInv || !invStartDate || !invEndDate) return alert("Select room and date range.");
    setSavingInv(true);
    try {
      const isBlockedSubmit = invRateType === "stop_sales";
      const customPricing = {
        rateType: invRateType,
        weekendPrice: !isBlockedSubmit && invWeekendPrice ? parseInt(invWeekendPrice, 10) : null,
        weekendDays: !isBlockedSubmit ? invWeekendDays : [],
        extraAdultPrice: !isBlockedSubmit && invExtraAdultPrice ? parseInt(invExtraAdultPrice, 10) : null,
        extraChildWithBedPrice: !isBlockedSubmit && invExtraChildWithBedPrice ? parseInt(invExtraChildWithBedPrice, 10) : null,
        extraChildWithoutBedPrice: !isBlockedSubmit && invExtraChildWithoutBedPrice ? parseInt(invExtraChildWithoutBedPrice, 10) : null,
        mealPlanOptions: !isBlockedSubmit ? invMealPlanOptions : [],
      };

      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/inventory`, {
        method: "POST",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({
          roomId: selectedRoomForInv,
          startDate: invStartDate,
          endDate: invEndDate,
          availableCount: isBlockedSubmit ? 0 : parseInt(invAvailableCount, 10),
          priceOverride: isBlockedSubmit ? null : (invPriceOverride ? parseInt(invPriceOverride, 10) : null),
          isBlocked: isBlockedSubmit,
          discountType: isBlockedSubmit ? "PERCENT" : invDiscountType,
          discountPercent: isBlockedSubmit ? 0 : (parseInt(invDiscountPercent, 10) || 0),
          discountFlat: isBlockedSubmit ? 0 : (parseInt(invDiscountFlat, 10) || 0),
          customPricing,
        }),
      });
      if (res.ok) {
        alert("Inventory updated successfully!");
        fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update inventory.");
      }
    } catch {
      alert("Error updating inventory.");
    } finally {
      setSavingInv(false);
    }
  };

  if (isLoading || !vendor || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">Property not found or access denied.</p>
          <Link href="/partner/properties" className="mt-3 inline-block text-[#1B3A6B] font-bold hover:underline text-sm">← Back to Properties</Link>
        </div>
      </div>
    );
  }

  const cfg = STATUS_BADGE[hotel.status] || STATUS_BADGE.DRAFT;
  const StatusIcon = cfg.icon;
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar active="/partner/properties" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/partner/properties" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Properties
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <h1 className="font-black text-gray-900 text-base truncate max-w-48">{hotel.name}</h1>
              <span className={cn("flex items-center gap-1 border px-2.5 py-1 rounded-full text-[10px] font-bold", cfg.bg, cfg.color)}>
                <StatusIcon className="w-3 h-3" /> {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {savingField && <span className="text-xs text-gray-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</span>}
              {hotel.status === "DRAFT" && (
                <button onClick={submitProperty} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-[#F5A623] text-white rounded-xl hover:bg-amber-600 transition-colors">
                  Submit for Verification
                </button>
              )}
              <Link href={`/hotels/${hotel.slug}`} target="_blank"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 border border-gray-200 rounded-xl hover:border-[#1B3A6B] text-gray-600 hover:text-[#1B3A6B] transition-colors">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-2 -mx-2 px-2 overflow-x-auto no-scrollbar">
            {[
              { key: "overview", label: "Overview", icon: Settings },
              { key: "rooms", label: `Rooms (${rooms.length})`, icon: Bed },
              { key: "inventory", label: "Inventory & Rates", icon: Calendar },
              { key: "bookings", label: `Bookings${pendingBookings > 0 ? ` (${pendingBookings} pending)` : ""}`, icon: BookOpen },
              { key: "photos", label: "Photos", icon: ImageIcon },
              { key: "policies", label: "Policies", icon: CheckCircle },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all",
                  tab === t.key ? "bg-[#1B3A6B] text-white" : "text-gray-500 hover:bg-gray-100")}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.key === "bookings" && pendingBookings > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ml-0.5">
                    {pendingBookings}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* ─── Overview Tab ─── */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick stats */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Rooms", value: rooms.length, icon: Bed, color: "bg-[#1B3A6B]" },
                  { label: "Total Bookings", value: bookings.length, icon: BookOpen, color: "bg-violet-500" },
                  { label: "Pending Bookings", value: pendingBookings, icon: Clock, color: "bg-amber-500" },
                  { label: "Starting Price", value: hotel.minPrice ? `₹${hotel.minPrice.toLocaleString()}` : "—", icon: DollarSign, color: "bg-emerald-500" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editable Details */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-[#1B3A6B]" /> Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <EditableField label="Property Name" value={hotel.name || ""} onChange={v => saveHotelField("name", v)} />
                  <EditableField label="Type" value={hotel.type || ""} options={["Hotel", "Resort", "Cottage", "Homestay", "Villa", "Camp"]} onChange={v => saveHotelField("type", v)} />
                  {isEditingLocation ? (
                    <div className="col-span-2 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                      <p className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">Edit Location Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Country Selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">Country *</label>
                          <select
                            value={locCountryId || ""}
                            onChange={e => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              setLocCountryId(val);
                              setLocStateId("");
                              setLocDestinationId("");
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white h-9"
                          >
                            <option value="">-- Select Country --</option>
                            {countries.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* State Selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">State / Region *</label>
                          <select
                            value={locStateId || ""}
                            onChange={e => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              setLocStateId(val);
                              setLocDestinationId("");
                            }}
                            disabled={!locCountryId || states.length === 0}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white disabled:opacity-50 h-9"
                          >
                            <option value="">
                              {!locCountryId ? "Select country first" : states.length === 0 ? "Loading..." : "-- Select State --"}
                            </option>
                            {states.map((s: any) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* City Selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">City / Place *</label>
                          {!useLocCustomCity ? (
                            <select
                              value={locDestinationId || ""}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === "__custom__") {
                                  setUseLocCustomCity(true);
                                  setLocDestinationId("");
                                } else {
                                  setLocDestinationId(val ? Number(val) : "");
                                }
                              }}
                              disabled={!locStateId || cities.length === 0}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white disabled:opacity-50 h-9"
                            >
                              <option value="">
                                {!locStateId ? "Select state first" : cities.length === 0 ? "Loading..." : "-- Select City --"}
                              </option>
                              {cities.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                              <option value="__custom__">✏️ City not listed</option>
                            </select>
                          ) : (
                            <div className="flex gap-1">
                              <input
                                value={locCustomCity}
                                onChange={e => setLocCustomCity(e.target.value)}
                                placeholder="Enter city name"
                                className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#1B3A6B] bg-white h-9"
                              />
                              <button
                                type="button"
                                onClick={() => { setUseLocCustomCity(false); setLocCustomCity(""); setLocDestinationId(""); }}
                                className="h-9 rounded-lg border border-gray-200 px-2 text-xs hover:bg-gray-50 text-gray-500 font-bold shrink-0"
                              >
                                List
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={saveLocation}
                          disabled={savingField}
                          className="flex items-center gap-1.5 bg-[#1B3A6B] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1B3A6B]/90 transition-all disabled:opacity-50"
                        >
                          {savingField ? "Saving..." : "Save Location"}
                        </button>
                        <button
                          onClick={() => setIsEditingLocation(false)}
                          disabled={savingField}
                          className="border border-gray-200 text-gray-500 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between group">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Country</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {countries.find(c => c.id === hotel.countryId)?.name || hotel.customCountryName || "—"}
                          </p>
                        </div>
                        <button onClick={startEditingLocation}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-[#1B3A6B]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">State / Region</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {states.find(s => s.id === hotel.stateId)?.name || hotel.customStateName || "—"}
                          </p>
                        </div>
                        <button onClick={startEditingLocation}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-[#1B3A6B]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">City / Place</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {cities.find(c => c.id === hotel.destinationId)?.name || hotel.customCity || hotel.city || "—"}
                          </p>
                        </div>
                        <button onClick={startEditingLocation}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-[#1B3A6B]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                  <EditableField label="Location Address" value={hotel.address || ""} onChange={v => saveHotelField("address", v)} />
                  <EditableField label="PIN Code" value={hotel.pincode || ""} onChange={v => saveHotelField("pincode", v)} />
                  <EditableField label="Hotel Email" value={hotel.email || ""} type="email" onChange={v => saveHotelField("email", v)} />
                  <EditableField label="Hotel Phone" value={hotel.phone || ""} type="tel" onChange={v => saveHotelField("phone", v)} />
                  <EditableField label="Latitude" value={hotel.latitude ?? ""} type="number" onChange={v => saveHotelField("latitude", v ? parseFloat(v) : null)} />
                  <EditableField label="Longitude" value={hotel.longitude ?? ""} type="number" onChange={v => saveHotelField("longitude", v ? parseFloat(v) : null)} />
                  <EditableField label="Check-in Time" value={hotel.checkInTime || ""} type="time" onChange={v => saveHotelField("checkInTime", v)} />
                  <EditableField label="Check-out Time" value={hotel.checkOutTime || ""} type="time" onChange={v => saveHotelField("checkOutTime", v)} />
                  <EditableField label="Starting Price (₹)" value={hotel.minPrice || ""} type="number" onChange={v => saveHotelField("minPrice", Number(v))} />
                  <EditableField label="Booking Type" value={hotel.bookingType || ""} options={["INSTANT", "REQUEST"]} onChange={v => saveHotelField("bookingType", v)} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Description</p>
                  <textarea
                    defaultValue={hotel.description || ""}
                    onBlur={e => { if (e.target.value !== hotel.description) saveHotelField("description", e.target.value); }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors resize-none"
                    rows={3} placeholder="Describe your property..." />
                </div>

                {/* Amenities */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Amenities</h3>
                  <AmenitiesSelector
                    selected={hotel.amenities || []}
                    onChange={(amenities) => saveHotelField("amenities", amenities)}
                    compact={false}
                  />
                </div>
              </div>

              {/* Proximity Location Points */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#1B3A6B]" /> Proximity & Nearby Places</h3>
                <p className="text-xs text-gray-400 mb-4">Add nearby airports, transit stations, and medical clinics to guide guests on their travel proximity.</p>

                {/* Form to add a new point */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
                    <select id="new-proximity-category" aria-label="Surroundings Category" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B3A6B]">
                      <option value="Airports">Airports</option>
                      <option value="Public transportation">Public transportation</option>
                      <option value="Hospital or clinic">Hospital or clinic</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Place Name</label>
                    <input id="new-proximity-name" placeholder="e.g. Manali Bus Depot" type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Distance</label>
                      <input id="new-proximity-distance" placeholder="e.g. 5.0 km" type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B3A6B]" />
                    </div>
                    <button type="button" onClick={() => {
                      const catEl = document.getElementById("new-proximity-category") as HTMLSelectElement;
                      const nameEl = document.getElementById("new-proximity-name") as HTMLInputElement;
                      const distEl = document.getElementById("new-proximity-distance") as HTMLInputElement;
                      if (!nameEl || !distEl || !nameEl.value.trim() || !distEl.value.trim()) return;
                      const newPoint = { category: catEl.value, name: nameEl.value.trim(), distance: distEl.value.trim() };
                      const current = hotel.proximity || [];
                      const updated = [...current, newPoint];
                      saveHotelField("proximity", updated);
                      nameEl.value = "";
                      distEl.value = "";
                    }} className="bg-[#1B3A6B] text-white hover:bg-[#0f2548] px-3.5 py-2 rounded-lg text-xs font-bold transition-colors shrink-0">
                      Add
                    </button>
                  </div>
                </div>

                {/* List of current proximity points */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {(hotel.proximity || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No proximity locations added yet.</p>
                  ) : (
                    (hotel.proximity || []).map((point: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className={cn("px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider",
                            point.category === "Airports" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                              point.category === "Public transportation" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                "bg-rose-50 text-rose-700 border border-rose-100"
                          )}>
                            {point.category}
                          </span>
                          <span className="font-semibold text-gray-700">{point.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-[#1B3A6B]">{point.distance}</span>
                          <button type="button" onClick={() => {
                            const updated = (hotel.proximity || []).filter((_: any, idx: number) => idx !== index);
                            saveHotelField("proximity", updated);
                          }} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Property FAQs */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#1B3A6B]" /> Property FAQs</h3>
                <p className="text-xs text-gray-400 mb-4">Add questions and answers to help guests understand property policies, rules, and facilities.</p>

                {/* Form to add a new FAQ */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Question</label>
                    <input id="new-faq-question" placeholder="e.g. Is early check-in available?" type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Answer</label>
                    <textarea id="new-faq-answer" placeholder="e.g. Yes, subject to availability. Extra charges may apply." rows={2} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B3A6B] resize-none" />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => {
                      const qEl = document.getElementById("new-faq-question") as HTMLInputElement;
                      const aEl = document.getElementById("new-faq-answer") as HTMLTextAreaElement;
                      if (!qEl || !aEl || !qEl.value.trim() || !aEl.value.trim()) return;
                      const newFaq = { question: qEl.value.trim(), answer: aEl.value.trim() };
                      const current = hotel.faqs || [];
                      const updated = [...current, newFaq];
                      saveHotelField("faqs", updated);
                      qEl.value = "";
                      aEl.value = "";
                    }} className="bg-[#1B3A6B] text-white hover:bg-[#0f2548] px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                      Add FAQ
                    </button>
                  </div>
                </div>

                {/* List of current FAQs */}
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {(hotel.faqs || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No FAQs added yet.</p>
                  ) : (
                    (hotel.faqs || []).map((faq: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-100 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-800 flex-1 pr-4">Q: {faq.question}</p>
                          <button type="button" onClick={() => {
                            const updated = (hotel.faqs || []).filter((_: any, idx: number) => idx !== index);
                            saveHotelField("faqs", updated);
                          }} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-gray-600 pl-4 border-l-2 border-slate-100">A: {faq.answer}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Rooms Tab ─── */}
          {tab === "rooms" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Room Types</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{rooms.length} room type{rooms.length !== 1 ? "s" : ""} configured</p>
                </div>
                {!showRoomForm && !editingRoom && (
                  <button onClick={() => { setShowRoomForm(true); setEditingRoom(null); }}
                    className="flex items-center gap-1.5 bg-[#1B3A6B] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0f2548] transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Room Type
                  </button>
                )}
              </div>

              {showRoomForm && !editingRoom && (
                <RoomForm hotelId={hotelId} token={token} onSave={addRoom} onCancel={() => setShowRoomForm(false)} />
              )}

              {rooms.length === 0 && !showRoomForm ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
                  <Bed className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-500 font-medium mb-1">No rooms added yet</p>
                  <p className="text-gray-400 text-sm mb-4">Add room types with pricing to start accepting bookings</p>
                  <button onClick={() => setShowRoomForm(true)}
                    className="inline-flex items-center gap-1.5 bg-[#1B3A6B] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#0f2548] text-sm transition-colors">
                    <Plus className="w-4 h-4" /> Add First Room
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map(room => (
                    <div key={room.id}>
                      {editingRoom?.id === room.id ? (
                        <RoomForm room={editingRoom} hotelId={hotelId} token={token} onSave={d => updateRoom(room.id, d)} onCancel={() => setEditingRoom(null)} />
                      ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
                          {/* Room Card Header */}
                          <div className="flex gap-4 p-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                              {room.images?.[0] ? (
                                <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Bed className="w-7 h-7 text-gray-200" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-bold text-gray-900 truncate">{room.name}</h3>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-[9px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 font-bold uppercase tracking-wide">{room.type}</span>
                                    {room.bedType && <span className="text-[9px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-0.5"><Bed className="w-2 h-2" /> {room.bedType}</span>}
                                    {room.sizeSqft && <span className="text-[9px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{room.sizeSqft} sqft</span>}
                                    {room.viewType && <span className="text-[9px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">{room.viewType}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button aria-label="Edit Room" title="Edit Room" onClick={() => { setEditingRoom(room); setShowRoomForm(false); }}
                                    className="p-1.5 hover:bg-[#1B3A6B]/5 rounded-lg text-gray-400 hover:text-[#1B3A6B] transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button aria-label="Delete Room" title="Delete Room" onClick={() => deleteRoom(room.id)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {room.description && <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-1">{room.description}</p>}
                            </div>
                          </div>

                          {/* Room Stats Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-px border-t border-gray-100 bg-gray-100 rounded-b-2xl overflow-hidden">
                            {/* Price */}
                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Base Price</p>
                              <p className="text-base font-black text-[#1B3A6B] leading-tight">₹{room.basePrice?.toLocaleString()}</p>
                              <p className="text-[9px] text-gray-400">/night</p>
                            </div>
                            {/* Inventory */}
                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Inventory</p>
                              <p className="text-base font-black text-gray-800 leading-tight">{room.totalRooms}</p>
                              <p className="text-[9px] text-gray-400">room{room.totalRooms > 1 ? "s" : ""}</p>
                            </div>
                            {/* Occupancy */}
                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Occupancy</p>
                              <p className="text-sm font-black text-gray-800 leading-tight">{room.baseAdults ?? 2}+{room.baseChildren ?? 0}</p>
                              <p className="text-[9px] text-gray-400">adults+kids</p>
                            </div>
                            {/* Weekend Rate */}
                            <div className="bg-white px-3 py-2.5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Weekend</p>
                              <p className="text-sm font-black text-amber-700 leading-tight">
                                {room.weekendPrice ? `₹${room.weekendPrice.toLocaleString()}` : "Same"}
                              </p>
                              <p className="text-[9px] text-gray-400">/night</p>
                            </div>
                            {/* Status badges */}
                            <div className="bg-white px-3 py-2.5 sm:col-span-4 lg:col-span-1">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-1">Features</p>
                              <div className="flex flex-wrap gap-1">
                                {room.refundable && <span className="text-[8px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 font-bold">Free Cancel</span>}
                                {room.discountPercent > 0 && <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 font-bold">{room.discountPercent}% OFF</span>}
                                {room.discountFlat > 0 && <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 font-bold">₹{room.discountFlat} OFF</span>}
                                {(room.mealPlanOptions || []).filter((m: any) => m.enabled).map((m: any) => (
                                  <span key={m.code} className="text-[8px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100 font-bold">{MEAL_EMOJIS[m.code]} {m.code}</span>
                                ))}
                                {!(room.mealPlanOptions || []).some((m: any) => m.enabled) && room.mealPlan && (
                                  <span className="text-[8px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100 font-bold">{MEAL_EMOJIS[room.mealPlan]} {room.mealPlan}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* â”€â”€â”€ Inventory & Rates Tab â”€â”€â”€ */}
          {tab === "inventory" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Inventory &amp; Rates Calendar</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Set seasonal prices, availability counts, and blackout dates per room type.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 items-start">
                {/* ── Bulk Update Form ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 w-full">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1B3A6B]" /> Bulk Rate &amp; Availability Update
                  </h3>
                  <form onSubmit={handleBulkUpdateInventory} className="space-y-3">
                    {/* Compact Top Row: Room, Rate Type, Session Price, Discount */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Room Type *</label>
                        <select aria-label="Select Room Type" title="Select Room Type" required value={selectedRoomForInv}
                          onChange={e => {
                            const roomIdVal = e.target.value;
                            setSelectedRoomForInv(roomIdVal);
                            const r = rooms.find(x => String(x.id) === roomIdVal);
                            if (r) {
                              setInvAvailableCount(String(r.totalRooms));
                              setInvWeekendPrice(r.weekendPrice !== undefined && r.weekendPrice !== null ? String(r.weekendPrice) : "");
                              setInvWeekendDays(Array.isArray(r.weekendDays) ? r.weekendDays : ["Friday", "Saturday"]);
                              setInvExtraAdultPrice(r.extraAdultPrice !== undefined && r.extraAdultPrice !== null ? String(r.extraAdultPrice) : "");
                              setInvExtraChildWithBedPrice(r.extraChildWithBedPrice !== undefined && r.extraChildWithBedPrice !== null ? String(r.extraChildWithBedPrice) : "");
                              setInvExtraChildWithoutBedPrice(r.extraChildWithoutBedPrice !== undefined && r.extraChildWithoutBedPrice !== null ? String(r.extraChildWithoutBedPrice) : "");
                              const roomMealPlans = r.mealPlanOptions || DEFAULT_MEAL_OPTIONS;
                              const mergedMealPlans = DEFAULT_MEAL_OPTIONS.map(defOpt => {
                                const matched = roomMealPlans.find((x: any) => x.code === defOpt.code);
                                return matched ? { ...defOpt, ...matched } : defOpt;
                              });
                              setInvMealPlanOptions(mergedMealPlans);
                            }
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B3A6B]">
                          <option value="" disabled>-- Select a room --</option>
                          {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Base: ₹{r.basePrice})</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate Type / Season</label>
                        <div className="relative">
                          <select
                            aria-label="Rate Type"
                            value={invRateType}
                            onChange={e => setInvRateType(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#1B3A6B] appearance-none bg-white cursor-pointer"
                          >
                            {RATE_MODES.map(mode => (
                              <option key={mode.key} value={mode.key}>{mode.icon} {mode.label}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <span className="text-gray-400 text-xs">▼</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price Override (₹)</label>
                        <input type="number" min="0" value={invPriceOverride} onChange={e => setInvPriceOverride(e.target.value)}
                          placeholder="Blank = base price"
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B3A6B]" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Discount</label>
                        <div className="flex gap-2">
                          <select aria-label="Discount Type" title="Discount Type" value={invDiscountType} onChange={e => setInvDiscountType(e.target.value)}
                            className="w-1/2 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B3A6B]">
                            <option value="PERCENT">%</option>
                            <option value="FLAT">₹</option>
                          </select>
                          <input type="number" min="0" value={invDiscountType === 'PERCENT' ? invDiscountPercent : invDiscountFlat}
                            onChange={e => { if (invDiscountType === 'PERCENT') { setInvDiscountPercent(e.target.value); setInvDiscountFlat('0'); } else { setInvDiscountFlat(e.target.value); setInvDiscountPercent('0'); } }}
                            className="w-1/2 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B3A6B]" placeholder="0" />
                        </div>
                      </div>
                    </div>

                    {/* Dates + Availability row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 mt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                        <input aria-label="Start Date" title="Start Date" type="date" required value={invStartDate} onChange={e => setInvStartDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B3A6B]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                        <input aria-label="End Date" title="End Date" type="date" required value={invEndDate} onChange={e => setInvEndDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B3A6B]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Rooms Available</label>
                        <input aria-label="Daily Available Rooms" title="Daily Available Rooms" type="number" required min="0" value={invAvailableCount} onChange={e => setInvAvailableCount(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1B3A6B]" />
                      </div>
                      {/* price override moved to the top row to avoid duplicate inputs */}
                    </div>

                    <div className="mt-1 space-y-1">
                      {invRateType === "session" && <p className="text-[9px] text-amber-600 font-medium">☀️ Peak/high season — set a premium rate for popular travel dates</p>}
                      {invRateType === "off_session" && <p className="text-[9px] text-sky-600 font-medium">❄️ Low season — attract bookings with a reduced rate</p>}
                      {invRateType === "mid_session" && <p className="text-[9px] text-emerald-600 font-medium">🍂 Shoulder season — moderate rates between peak and off-season</p>}
                      {invRateType === "blackout" && <p className="text-[9px] text-indigo-600 font-medium">🎆 Festivals & events — special pricing for high demand periods</p>}
                      {invRateType === "stop_sales" && <p className="text-[9px] text-rose-600 font-medium">🚫 Stop Sales — blocks all bookings for the selected date range</p>}
                    </div>

                    <p className="text-[10px] text-gray-500 mt-1">Price override applies to the selected <strong>Rate Type / Season</strong>; leave blank to use the base price.</p>

                    {invRateType === "stop_sales" ? (
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Stop Sales Mode Active</p>
                          <p className="text-[11px] text-rose-600 mt-1 font-medium leading-relaxed">
                            This will block booking requests and close sales for the selected room type during this date range.
                            Pricing and discounts are disabled.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>

                        <div className="border-t border-gray-100 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-xs font-bold text-[#1B3A6B] hover:text-[#0f2548] transition-colors select-none focus:outline-none cursor-pointer"
                          >
                            <span className="text-[10px] transform transition-transform duration-200">
                              {showAdvanced ? "▼" : "▶"}
                            </span>
                            <span>Advanced Overrides (Weekend, Occupancy & Meals)</span>
                          </button>

                          {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 mt-3 animate-in fade-in duration-200">
                              {/* Weekend Pricing override */}
                              <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-2">
                                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Weekend pricing override
                                </p>
                                <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Weekend Price (₹/night)</label>
                                  <input type="number" min="0" value={invWeekendPrice} onChange={e => setInvWeekendPrice(e.target.value)}
                                    placeholder="Leave blank to use base"
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-400 bg-slate-50" />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Weekend Days</label>
                                  <div className="flex flex-wrap gap-1">
                                    {WEEKDAYS.map(day => (
                                      <button type="button" key={day}
                                        onClick={() => {
                                          setInvWeekendDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
                                        }}
                                        className={cn(
                                          "px-2 py-1 rounded text-[10px] font-bold border transition-all",
                                          invWeekendDays.includes(day)
                                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-amber-200"
                                        )}>
                                        {day.slice(0, 3)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Occupancy Prices override */}
                              <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-2">
                                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-emerald-500" /> Occupant prices override
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                  <div>
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Extra Adult Price (₹)</label>
                                    <input type="number" min="0" value={invExtraAdultPrice} onChange={e => setInvExtraAdultPrice(e.target.value)}
                                      placeholder="Leave blank to use default"
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-400 bg-slate-50" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Child with bed (₹)</label>
                                      <input type="number" min="0" value={invExtraChildWithBedPrice} onChange={e => setInvExtraChildWithBedPrice(e.target.value)}
                                        placeholder="Use default"
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-400 bg-slate-50" />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Child no bed (₹)</label>
                                      <input type="number" min="0" value={invExtraChildWithoutBedPrice} onChange={e => setInvExtraChildWithoutBedPrice(e.target.value)}
                                        placeholder="Use default"
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-400 bg-slate-50" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Meal plans card */}
                              <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-2">
                                <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <Utensils className="w-3.5 h-3.5 text-purple-500" /> Meal plan rates override
                                </p>
                                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                                  {invMealPlanOptions.map((opt: any) => (
                                    <div key={opt.code} className="border border-purple-50 p-2 rounded-lg bg-slate-50 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-700">{MEAL_EMOJIS[opt.code]} {opt.label}</span>
                                        <input type="checkbox" checked={opt.enabled}
                                          onChange={e => {
                                            setInvMealPlanOptions(prev => prev.map(o => o.code === opt.code ? { ...o, enabled: e.target.checked } : o));
                                          }}
                                          className="w-3.5 h-3.5 accent-purple-600 cursor-pointer" />
                                      </div>
                                      {opt.enabled && (
                                        <div className="grid grid-cols-2 gap-1">
                                          <div>
                                            <label className="block text-[7px] text-gray-400 font-bold uppercase">Adult price</label>
                                            <input type="number" min="0" value={opt.adultPrice}
                                              onChange={e => {
                                                setInvMealPlanOptions(prev => prev.map(o => o.code === opt.code ? { ...o, adultPrice: Number(e.target.value) } : o));
                                              }}
                                              placeholder="Adult ₹"
                                              className="w-full border border-gray-100 rounded px-1.5 py-0.5 text-[10px] bg-white focus:outline-none" />
                                          </div>
                                          <div>
                                            <label className="block text-[7px] text-gray-400 font-bold uppercase">Child price</label>
                                            <input type="number" min="0" value={opt.childPrice}
                                              onChange={e => {
                                                setInvMealPlanOptions(prev => prev.map(o => o.code === opt.code ? { ...o, childPrice: Number(e.target.value) } : o));
                                              }}
                                              placeholder="Child ₹"
                                              className="w-full border border-gray-100 rounded px-1.5 py-0.5 text-[10px] bg-white focus:outline-none" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex justify-stretch pt-1">
                      <button type="submit" disabled={savingInv}
                        className="w-full px-5 py-2 bg-[#1B3A6B] text-white rounded-xl text-sm font-bold hover:bg-[#0f2548] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                        {savingInv ? <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</> : <><Calendar className="w-4 h-4" /> Update Calendar</>}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ── Right: Calendar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 w-full min-w-0">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Availability &amp; Rate Calendar</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {selectedRoomForInv ? "Click any date to prefill the update form" : "Select a room type to view its calendar"}
                      </p>
                    </div>
                    {selectedRoomForInv && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                            const prev = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1);
                            if (prev >= minMonth) setCurrentCalendarMonth(prev);
                          }}
                          disabled={
                            currentCalendarMonth.getFullYear() === new Date().getFullYear() &&
                            currentCalendarMonth.getMonth() === new Date().getMonth()
                          }
                          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold text-gray-800 min-w-32 text-center">
                          {currentCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const maxMonth = new Date(today.getFullYear(), today.getMonth() + 11, 1);
                            const next = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1);
                            if (next <= maxMonth) setCurrentCalendarMonth(next);
                          }}
                          disabled={
                            currentCalendarMonth.getFullYear() === new Date(new Date().getFullYear(), new Date().getMonth() + 11, 1).getFullYear() &&
                            currentCalendarMonth.getMonth() === new Date(new Date().getFullYear(), new Date().getMonth() + 11, 1).getMonth()
                          }
                          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedRoomForInv ? (
                    <>
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1.5 mb-4">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                          <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase py-1 select-none">
                            {day}
                          </div>
                        ))}
                        {renderCalendar()}
                      </div>

                      {/* Calendar Legend */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4 mt-3 border-t border-gray-100">
                        {[
                          { color: "bg-white border-gray-200", text: "Open" },
                          { color: "bg-amber-50/70 border-amber-200", text: "Session Rates (Peak)" },
                          { color: "bg-emerald-50/70 border-emerald-200", text: "Mid-Season Rates" },
                          { color: "bg-sky-50/70 border-sky-200", text: "Off-Low Rates" },
                          { color: "bg-indigo-50/70 border-indigo-200", text: "Festival Rates" },
                          { color: "bg-emerald-50 border-emerald-300", text: "Discounted" },
                          { color: "bg-amber-50 border-amber-300", text: "Low Stock" },
                          { color: "bg-rose-50/70 border-rose-200", text: "Blocked (Stop Sales)" },
                          { color: "bg-slate-100 border-slate-200", text: "Sold Out" },
                          { color: "bg-gray-50 border-gray-100 opacity-60", text: "Past" },
                        ].map(item => (
                          <div key={item.text} className="flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded border ${item.color}`} />
                            <span className="text-[9px] font-bold text-gray-500">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Calendar className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="text-gray-500 font-medium text-sm">No room selected</p>
                      <p className="text-gray-400 text-xs mt-1">Select a room type in the form to view its rate calendar</p>
                    </div>
                  )}
                </div>
              </div>{/* flex row end */}
            </div>
          )}

          {/* ─── Bookings Tab ─── */}
          {tab === "bookings" && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900">Booking Requests</h2>
              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-500 font-medium">No bookings yet</p>
                  <p className="text-gray-400 text-sm mt-1">Bookings will appear here once your property is live</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(booking => (
                    <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border",
                            booking.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              booking.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                booking.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                                  "bg-gray-50 text-gray-500 border-gray-200"
                          )}>
                            {booking.status}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">#{booking.bookingRef || booking.id}</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{booking.guestName || "Guest"}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                            {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                            {" → "}
                            {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {booking.adults || 2} guests</span>
                          {booking.roomName && <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {booking.roomName}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-xl font-black text-[#1B3A6B]">₹{(booking.totalAmount || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">{booking.rooms || 1} room</p>
                        </div>
                        {booking.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
                              <CheckCircle className="w-3 h-3" /> Confirm
                            </button>
                            <button onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">
                              <XCircle className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Photos Tab ─── */}
          {tab === "photos" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Property Photos</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{photos.length} photos · First photo is the main cover shown in search results</p>
                </div>
              </div>

              {/* Photo Grid */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                {photos.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl mb-5">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-500 font-medium mb-1">No photos yet</p>
                    <p className="text-gray-400 text-sm">Add high-quality photos to attract more bookings. Properties with 10+ photos get 3x more views.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                    {photos.map((photo: any, i: number) => (
                      <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                        <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {photo.isPrimary && (
                            <span className="bg-[#1B3A6B] text-white text-[9px] font-black px-2 py-0.5 rounded-full">Cover</span>
                          )}
                          {photo.category && photo.category !== "EXTERIOR" && (
                            <span className="bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{photo.category}</span>
                          )}
                        </div>

                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          {!photo.isPrimary && (
                            <button
                              aria-label="Set as cover photo"
                              title="Set as cover photo"
                              onClick={() => setPrimaryPhoto(photo.id)}
                              className="w-8 h-8 bg-[#1B3A6B] text-white rounded-lg flex items-center justify-center hover:bg-[#0f2548] transition-colors"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            aria-label="Delete photo"
                            title="Delete photo"
                            onClick={() => deletePhoto(photo.id)}
                            disabled={deletingPhotoId === photo.id}
                            className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Photo Form */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Add New Photo</h3>

                  {photos.length >= 15 ? (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl mb-4">
                      ⚠️ Limit Reached: You have uploaded the maximum allowed 15 photos for this property. Delete existing photos to upload new ones.
                    </div>
                  ) : (
                    <div className="mb-4">
                      {/* Drag & Drop File Upload */}
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer group text-center">
                        <ImageIcon className="w-10 h-10 text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold text-gray-700">Upload Image</p>
                        <p className="text-xs text-gray-400 mt-1">Accepts any format. Non-WebP/Non-AVIF will auto-compress to optimized WebP.</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={addingPhoto || photos.length >= 15}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                      <select
                        value={newPhotoCategory}
                        onChange={e => setNewPhotoCategory(e.target.value)}
                        aria-label="Photo Category"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                      >
                        {["EXTERIOR", "INTERIOR", "ROOM", "BATHROOM", "DINING", "POOL", "OTHER"].map(c => (
                          <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Caption (optional)</label>
                      <input
                        type="text"
                        value={newPhotoCaption}
                        onChange={e => setNewPhotoCaption(e.target.value)}
                        placeholder="e.g. Mountain view from lobby"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                      />
                    </div>
                  </div>

                  {newPhotoUrl && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-xl flex items-center gap-3">
                      <img src={newPhotoUrl} alt="preview" className="w-16 h-12 rounded-lg object-cover border border-gray-200" onError={e => (e.currentTarget.style.display = "none")} />
                      <p className="text-xs text-gray-500">Preview</p>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3">⭐ Tip: Set one photo as Cover (star icon) to make it the main listing image.</p>
                </div>
              </div>
            </div>
          )}
          {/* ─── Policies Tab ─── */}
          {tab === "policies" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Hotel Policies</h2>
                <button
                  onClick={savePolicies}
                  disabled={savingPolicies}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-xl text-sm font-bold hover:bg-[#0f2548] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPolicies ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Policies
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Policies */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Check-in / Check-out</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-in Time</label>
                        <input
                          type="time"
                          value={policies.checkInTime || "14:00"}
                          onChange={e => setPolicies({ ...policies, checkInTime: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-out Time</label>
                        <input
                          type="time"
                          value={policies.checkOutTime || "12:00"}
                          onChange={e => setPolicies({ ...policies, checkOutTime: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cancellation */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Cancellation Policy</h3>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Policy Type</label>
                      <select
                        value={policies.cancellationPolicy || "FREE"}
                        onChange={e => setPolicies({ ...policies, cancellationPolicy: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                      >
                        <option value="FREE">Free Cancellation</option>
                        <option value="PARTIAL">Partial Refund</option>
                        <option value="STRICT">Strict</option>
                        <option value="NON_REFUNDABLE">Non-Refundable</option>
                      </select>
                    </div>
                    {policies.cancellationPolicy !== "NON_REFUNDABLE" && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cancellation Deadline</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={
                              (() => {
                                const hrs = policies.cancellationDeadlineHours || 24;
                                if (hrs % 168 === 0) return hrs / 168;
                                if (hrs % 24 === 0) return hrs / 24;
                                return hrs;
                              })()
                            }
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const hrs = policies.cancellationDeadlineHours || 24;
                              let unit = "Hours";
                              if (hrs % 168 === 0) unit = "Weeks";
                              else if (hrs % 24 === 0) unit = "Days";

                              let targetHrs = val;
                              if (unit === "Days") targetHrs *= 24;
                              else if (unit === "Weeks") targetHrs *= 168;

                              setPolicies({ ...policies, cancellationDeadlineHours: targetHrs });
                            }}
                            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                          />
                          <select
                            value={
                              (() => {
                                const hrs = policies.cancellationDeadlineHours || 24;
                                if (hrs % 168 === 0) return "Weeks";
                                if (hrs % 24 === 0) return "Days";
                                return "Hours";
                              })()
                            }
                            onChange={e => {
                              const unit = e.target.value;
                              const hrs = policies.cancellationDeadlineHours || 24;
                              let val = hrs;
                              const oldUnit = hrs % 168 === 0 ? "Weeks" : (hrs % 24 === 0 ? "Days" : "Hours");
                              if (oldUnit === "Weeks") val = hrs / 168;
                              else if (oldUnit === "Days") val = hrs / 24;

                              let targetHrs = val;
                              if (unit === "Days") targetHrs *= 24;
                              else if (unit === "Weeks") targetHrs *= 168;

                              setPolicies({ ...policies, cancellationDeadlineHours: targetHrs });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                          >
                            <option>Hours</option>
                            <option>Days</option>
                            <option>Weeks</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Cancellation deadline before check-in.</p>
                      </div>
                    )}
                  </div>

                  {/* Rules */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Property Rules</h3>
                    <div className="space-y-3">
                      {[
                        { key: "childrenAllowed", label: "Children Allowed" },
                        { key: "petsAllowed", label: "Pets Allowed" },
                        { key: "smokingAllowed", label: "Smoking Allowed" },
                        { key: "unmarriedCouplesAllowed", label: "Unmarried Couples Allowed" },
                        { key: "alcoholAllowed", label: "Alcohol Allowed" },
                        { key: "payAtHotelAllowed", label: "Pay at Hotel Allowed" },
                      ].map(rule => (
                        <label key={rule.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policies[rule.key] !== false} // Default to true for most unless set to false
                            onChange={e => setPolicies({ ...policies, [rule.key]: e.target.checked })}
                            className="w-4 h-4 accent-[#1B3A6B] rounded"
                          />
                          {rule.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* House Rules Text */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">House Rules & Important Info</h3>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">House Rules</label>
                      <textarea
                        value={policies.houseRules || ""}
                        onChange={e => setPolicies({ ...policies, houseRules: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none"
                        rows={3}
                        placeholder="e.g. Quiet hours from 10 PM to 6 AM"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Important Information</label>
                      <textarea
                        value={policies.importantInfo || ""}
                        onChange={e => setPolicies({ ...policies, importantInfo: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none"
                        rows={3}
                        placeholder="e.g. Valid ID required for all guests at check-in"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
