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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<"all" | "travel" | "newsletter">("all");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchInquiries();
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
    } else if (typeFilter === "newsletter") {
      matchesType = i.inquiryType === "newsletter";
    }

    return matchesSearch && matchesStatus && matchesType;
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
    <AdminLayout title="Inquiries" subtitle="Manage and respond to customer inquiries & newsletters">
      
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
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { id: "all", label: "All Leads" },
            { id: "travel", label: "Travel Leads" },
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
    </AdminLayout>
  );
}
