import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  Phone, Mail, MessageSquare, Search, 
  CheckCircle, Clock, XCircle, Calendar, 
  Users, MapPin, ArrowUpRight, Download, 
  RefreshCw, Loader2, Trash2, Filter, AlertCircle 
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

interface Inquiry {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  inquiryType: string;
  packageId: number | null;
  hotelId: number | null;
  transportId: number | null;
  vendorId: number | null;
  destination: string | null;
  travelDate: string | null;
  numberOfPersons: number | null;
  message: string;
  budget: number | null;
  status: string;
  createdAt: string;
}

interface B2CBooking {
  id: number;
  status: string;
  paymentStatus: string;
  travelDate: string | null;
  travelersCount: number | null;
  adultsCount: number | null;
  childrenCount: number | null;
  infantsCount: number | null;
  totalAmount: number | null;
  finalPaidAmount: number | null;
  specialRequests: string | null;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestPhoneNumber: string | null;
  packageName: string | null;
  packageCode: string | null;
  duration: string | null;
  nights: string | null;
}

const statusConfig = {
  new: { label: "New", bg: "#FEF3C7", color: "#92400E", icon: Clock },
  contacted: { label: "Contacted", bg: "#D1FAE5", color: "#065F46", icon: CheckCircle },
  closed: { label: "Closed", bg: "#F3F4F6", color: "#6B7280", icon: XCircle },
};

const budgetLabels: Record<string, string> = {
  budget: "₹10k–25k",
  standard: "₹25k–50k",
  premium: "₹50k–1L",
  luxury: "₹1L+",
};

export default function Inquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [b2cBookings, setB2cBookings] = useState<B2CBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<"all" | "travel" | "package" | "b2c_bookings" | "newsletter">("all");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<B2CBooking | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState<B2CBooking | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchInquiries();
    fetchB2CBookings();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/inquiries`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      const data: Inquiry[] = await res.json();
      setInquiries(data);
      if (data.length > 0) {
        setSelected(data[0]);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchB2CBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/b2c-bookings`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (res.ok) {
        const data: B2CBooking[] = await res.json();
        setB2cBookings(data);
      }
    } catch (error) {
      console.error("Error fetching B2C bookings:", error);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated: Inquiry = await res.json();
      
      setInquiries(prev => prev.map(i => i.id === id ? updated : i));
      if (selected?.id === id) {
        setSelected(updated);
      }
    } catch (error) {
      alert("Error updating status");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    setUpdating(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/inquiries/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      
      setInquiries(prev => prev.filter(i => i.id !== id));
      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (error) {
      alert("Error deleting inquiry");
    } finally {
      setUpdating(null);
    }
  };

  const exportCSV = () => {
    if (inquiries.length === 0) return;
    const headers = ["ID", "Name", "Email", "Phone", "Type", "Destination", "Travel Date", "Pax", "Budget", "Message", "Status", "Created At"];
    const rows = inquiries.map(i => [
      i.id,
      i.name,
      i.email || "",
      i.phone,
      i.inquiryType,
      i.destination || "",
      i.travelDate || "",
      i.numberOfPersons || "",
      i.budget || "",
      i.message.replace(/"/g, '""'),
      i.status,
      i.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inquiries_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filtered = inquiries.filter(i => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      i.name.toLowerCase().includes(searchLower) ||
      (i.destination && i.destination.toLowerCase().includes(searchLower)) ||
      i.phone.includes(search) ||
      (i.email && i.email.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "All" || i.status === statusFilter;

    let matchesType = true;
    if (typeFilter === "travel") {
      matchesType = i.inquiryType !== "newsletter";
    } else if (typeFilter === "package") {
      matchesType = !!i.packageId || i.inquiryType === "customization" || i.inquiryType === "package" || (!!i.message && i.message.toLowerCase().includes("customization"));
    } else if (typeFilter === "newsletter") {
      matchesType = i.inquiryType === "newsletter";
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredBookings = b2cBookings.filter(b => {
    const searchLower = search.toLowerCase();
    return (
      (b.guestName && b.guestName.toLowerCase().includes(searchLower)) ||
      (b.packageName && b.packageName.toLowerCase().includes(searchLower)) ||
      (b.guestPhone && b.guestPhone.includes(search)) ||
      (b.guestEmail && b.guestEmail.toLowerCase().includes(searchLower)) ||
      (b.packageCode && b.packageCode.toLowerCase().includes(searchLower))
    );
  });

  const counts = {
    new: inquiries.filter(i => i.status === "new").length,
    contacted: inquiries.filter(i => i.status === "contacted").length,
    closed: inquiries.filter(i => i.status === "closed").length,
  };

  if (loading) {
    return (
      <AdminLayout title="Inquiries" subtitle="Loading customer leads...">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
           <RefreshCw className="w-8 h-8 animate-spin mb-2" />
           <p className="text-sm font-medium">Syncing inquiries from backend cluster...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="B2C Leads & Confirmed Bookings" subtitle="Manage customer inquiries & generate official travel vouchers">
      
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {(["new", "contacted", "closed"] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${statusFilter === s ? "border-[#1B3A6B] bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{counts[s]}</p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and type tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        {/* Type tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap">
          {[
            { id: "all", label: "All Leads" },
            { id: "travel", label: "General Leads" },
            { id: "package", label: "Package Inquiries 📦" },
            { id: "b2c_bookings", label: "Confirmed Bookings 🎟️" },
            { id: "newsletter", label: "Newsletter Subscribers" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                typeFilter === tab.id 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-gray-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action button */}
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 bg-[#059669] shadow-sm hover:brightness-105"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search and Grid */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, destination, phone, email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-slate-800" />
        </div>
      </div>

      {/* View Switcher: B2C Confirmed Bookings vs Inquiries */}
      {typeFilter === "b2c_bookings" ? (
        /* ── B2C CONFIRMED BOOKINGS TABLE & DYNAMIC VOUCHER GENERATOR ── */
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Confirmed B2C Package Bookings 🎟️</h3>
              <p className="text-xs text-gray-500">View customer reservations and generate official dynamic vouchers</p>
            </div>
            <span className="text-xs font-bold font-mono bg-blue-50 text-[#1B3A6B] px-3 py-1 rounded-full border border-blue-100">
              Total: {filteredBookings.length} Bookings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Booking Ref</th>
                  <th className="py-3 px-3">Customer / Guest</th>
                  <th className="py-3 px-3">Package Details</th>
                  <th className="py-3 px-3">Travel Date &amp; Pax</th>
                  <th className="py-3 px-3">Financials</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredBookings.map((b) => {
                  const guestPhone = b.guestPhone || b.guestPhoneNumber || "";
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#1B3A6B]">
                        SH-BK-{b.id}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{b.guestName || "Valued Customer"}</p>
                        <p className="text-[11px] text-slate-500">{b.guestEmail || "No Email"}</p>
                        <p className="text-[11px] text-slate-500">{guestPhone ? `+91 ${guestPhone}` : ""}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{b.packageName || "Custom Package"}</p>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          Code: {b.packageCode || "SH-RDS-GEN"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">📅 {b.travelDate || "Flexible"}</p>
                        <p className="text-[11px] text-slate-500">👥 {b.travelersCount || 2} Travelers ({b.adultsCount || 2} Adults)</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-black text-emerald-700">Paid: ₹{(b.finalPaidAmount || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[11px] text-slate-400">Total: ₹{(b.totalAmount || 0).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {b.status || "CONFIRMED"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setShowVoucherModal(b)}
                          className="px-3 py-1.5 rounded-lg bg-[#1B3A6B] hover:bg-[#285294] text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition"
                        >
                          <span>📄 View Voucher</span>
                        </button>
                        {guestPhone && (
                          <a
                            href={`https://wa.me/91${guestPhone}?text=Hello%20${encodeURIComponent(b.guestName || 'Valued Guest')},%20Greetings%20from%20Sampooran%20Holidays!%20Here%20is%20your%20Official%20Travel%20Voucher%20for%20${encodeURIComponent(b.packageName || 'Package')}%20(Ref:%20SH-VCR-${b.id}).%20Travel%20Date:%20${b.travelDate}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:brightness-105 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No confirmed B2C package bookings found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── ORIGINAL INQUIRIES LIST & DETAIL PANEL ── */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Inquiries list */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="divide-y divide-gray-50">
              {filtered.map(inq => {
                const cfg = statusConfig[inq.status as keyof typeof statusConfig] || statusConfig.new;
                const StatusIcon = cfg.icon;
                return (
                  <div key={inq.id}
                    onClick={() => setSelected(inq)}
                    className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-all ${selected?.id === inq.id ? "bg-blue-50/50 border-l-4 border-[#1B3A6B]" : "hover:bg-gray-50/30"}`}>
                    <div className="w-10 h-10 rounded-xl font-bold text-white text-sm flex items-center justify-center shrink-0"
                      style={{ background: inq.inquiryType === "newsletter" ? "linear-gradient(135deg, #059669, #10B981)" : "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                      {inq.name[0]?.toUpperCase() || "N"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900">{inq.name}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {inq.inquiryType === "newsletter" ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Newsletter</span>
                        ) : (
                          <>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{inq.destination || "Custom"}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" />{inq.numberOfPersons || 0} pax</span>
                            {inq.travelDate && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{inq.travelDate}</span>}
                            {inq.budget && <span className="text-xs font-bold text-primary">{budgetLabels[inq.budget.toString()] || `₹${inq.budget}`}</span>}
                          </>
                        )}
                      </div>
                      {inq.message && <p className="text-xs text-gray-400 mt-1 truncate">"{inq.message}"</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(inq.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No inquiries match your search</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-fit" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {selected ? (
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl font-bold text-white text-lg flex items-center justify-center shrink-0"
                    style={{ background: selected.inquiryType === "newsletter" ? "linear-gradient(135deg, #059669, #10B981)" : "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                    {selected.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selected.name}</h3>
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                      {selected.inquiryType === "newsletter" ? "Newsletter Subscriber" : `${selected.inquiryType} Inquiry`}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { label: "Phone", val: selected.phone ? `+91 ${selected.phone}` : "Not provided", href: selected.phone ? `tel:+91${selected.phone}` : undefined, icon: Phone },
                    { label: "Email", val: selected.email || "Not provided", href: selected.email ? `mailto:${selected.email}` : undefined, icon: Mail },
                    ...(selected.inquiryType !== "newsletter" ? [
                      { label: "Destination", val: selected.destination || "Flexible", icon: MapPin },
                      { label: "Travellers", val: `${selected.numberOfPersons || 0} pax`, icon: Users },
                      { label: "Travel Date", val: selected.travelDate || "Flexible", icon: Calendar },
                      { label: "Budget", val: selected.budget ? (budgetLabels[selected.budget.toString()] || `₹${selected.budget}`) : "Not provided", icon: ArrowUpRight },
                    ] : []),
                  ].map(({ label, val, href, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{label}</span>
                        {href ? <a href={href} className="block text-sm font-semibold" style={{ color: "#1B3A6B" }}>{val}</a>
                          : <p className="text-sm text-gray-700">{val}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {selected.message && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
                    <p className="text-xs font-bold text-amber-900 mb-1">
                      {selected.inquiryType === "newsletter" ? "Subscription Status" : "Message / Special Request"}
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">{selected.message}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  {selected.phone && (
                    <a href={`https://wa.me/91${selected.phone}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm text-white bg-[#25D366] hover:brightness-105 shadow-sm transition-transform hover:scale-[1.01]"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp Client
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(selected.id, "contacted")}
                      disabled={updating === selected.id}
                      className="py-2.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      Mark Contacted
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selected.id, "closed")}
                      disabled={updating === selected.id}
                      className="py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Mark Closed
                    </button>
                  </div>
                  <button 
                    onClick={() => handleDeleteInquiry(selected.id)}
                    disabled={updating === selected.id}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Lead
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium text-sm">Select an inquiry</p>
                <p className="text-xs text-center mt-1 px-6">Click any inquiry on the left to see full details and actions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           PRINTABLE DYNAMIC TRAVEL VOUCHER MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-8">
            
            {/* Printable Voucher Content */}
            <div id="printable-voucher" className="p-6 sm:p-8 space-y-6 text-xs text-slate-800 bg-white">
              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-[#1B3A6B] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌄</span>
                    <h2 className="text-xl font-black tracking-tight text-[#1B3A6B]">SAMPOORAN HOLIDAYS</h2>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Official Travel Confirmation &amp; Service Voucher</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-[#1B3A6B] text-amber-300 font-mono font-black text-xs px-3 py-1 rounded shadow-xs">
                    SH-VCR-{showVoucherModal.id}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Issued: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Guest & Package Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Traveler Details</h4>
                  <p className="font-bold text-slate-900 text-sm">{showVoucherModal.guestName || "Valued Customer"}</p>
                  <p className="text-slate-600">Email: {showVoucherModal.guestEmail || "N/A"}</p>
                  <p className="text-slate-600">Phone: {showVoucherModal.guestPhone || showVoucherModal.guestPhoneNumber || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Reservation Info</h4>
                  <p className="font-bold text-[#1B3A6B] text-sm">{showVoucherModal.packageName || "Tour Package"}</p>
                  <p className="text-slate-600">Code: <strong className="font-mono text-slate-900">{showVoucherModal.packageCode || "SH-RDS-GEN"}</strong></p>
                  <p className="text-slate-600">Departure: <strong className="text-slate-900">{showVoucherModal.travelDate || "As Confirmed"}</strong></p>
                  <p className="text-slate-600">Occupancy: <strong className="text-slate-900">{showVoucherModal.travelersCount || 2} Pax</strong> ({showVoucherModal.adultsCount || 2} Adults)</p>
                </div>
              </div>

              {/* Financial Status Summary */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between text-emerald-950">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment Status</p>
                  <p className="text-sm font-black text-emerald-900">CONFIRMED &amp; GUARANTEED</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs font-bold text-emerald-800">Amount Paid: ₹{(showVoucherModal.finalPaidAmount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-slate-500">Total Contract: ₹{(showVoucherModal.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Inclusions & Highlights */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">Voucher Inclusions &amp; Assistance</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <p>✓ All sightseeing as per itinerary</p>
                  <p>✓ Hotel Accommodations included</p>
                  <p>✓ Daily Breakfast &amp; Dinner Plan</p>
                  <p>✓ Private Transfers &amp; Drivers</p>
                  <p>✓ Tolls, Parking &amp; Driver Allowances</p>
                  <p>✓ 24/7 Ground Manager Assistance</p>
                </div>
              </div>

              {showVoucherModal.specialRequests && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <h4 className="text-[10px] font-bold text-amber-900 uppercase">Special Notes &amp; Requests</h4>
                  <p className="text-xs text-amber-800 mt-0.5">{showVoucherModal.specialRequests}</p>
                </div>
              )}

              {/* Footer Helpline Notice */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                <p>Official Voucher issued by Sampooran Holidays Pvt Ltd • Support: +91 900 000 0000</p>
                <p className="font-mono font-bold text-slate-500">VERIFIED AUTH 🔒</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-100 p-4 flex items-center justify-between border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowVoucherModal(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {showVoucherModal.guestPhone && (
                  <a
                    href={`https://wa.me/91${showVoucherModal.guestPhone}?text=Hello%20${encodeURIComponent(showVoucherModal.guestName || 'Valued Guest')},%20Here%20is%20your%20Official%20Travel%20Voucher%20for%20${encodeURIComponent(showVoucherModal.packageName || 'Package')}%20(Ref:%20SH-VCR-${showVoucherModal.id}).%20Travel%20Date:%20${showVoucherModal.travelDate}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#25D366] hover:brightness-105 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>💬 Send on WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-[#1B3A6B] hover:bg-[#285294] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>🖨️ Print / Save PDF Voucher</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
