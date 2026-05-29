import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Phone, Mail, MessageSquare, Search, Eye, CheckCircle, Clock, XCircle, Calendar, Users, MapPin, Filter, ArrowUpRight, Download } from "lucide-react";

const INQUIRIES = [
  { id: 1, name: "Rajesh Sharma", phone: "9876543210", email: "rajesh@gmail.com", destination: "Manali", tripType: "Family", adults: 4, children: 2, month: "June", budget: "standard", status: "new", note: "Need AC deluxe rooms, vegetarian meals only", createdAt: "2026-04-13 09:15 AM" },
  { id: 2, name: "Priya Jain", phone: "9012345678", email: "priya.jain@email.com", destination: "Kashmir", tripType: "Honeymoon", adults: 2, children: 0, month: "May", budget: "premium", status: "contacted", note: "Anniversary trip, want a surprise experience", createdAt: "2026-04-13 08:00 AM" },
  { id: 3, name: "Suresh Patel", phone: "9123456789", email: "", destination: "Ladakh", tripType: "Group", adults: 12, children: 0, month: "July", budget: "budget", status: "new", note: "Bike trip group 12 persons", createdAt: "2026-04-13 07:30 AM" },
  { id: 4, name: "Kavita Singh", phone: "9234567890", email: "kavita.s@gmail.com", destination: "Goa", tripType: "Family", adults: 3, children: 1, month: "March", budget: "standard", status: "closed", note: "School holiday trip", createdAt: "2026-04-12 06:00 PM" },
  { id: 5, name: "Arun Kumar", phone: "9345678901", email: "", destination: "Thailand", tripType: "Couple", adults: 2, children: 0, month: "August", budget: "premium", status: "contacted", note: "First international trip", createdAt: "2026-04-12 04:30 PM" },
  { id: 6, name: "Deepak Gupta", phone: "9456789012", email: "deepak@yahoo.com", destination: "Himachal", tripType: "Family", adults: 5, children: 3, month: "May", budget: "standard", status: "new", note: "", createdAt: "2026-04-12 02:00 PM" },
];

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
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("All");
  const [selected, setSelected] = useState<typeof INQUIRIES[0] | null>(null);

  const filtered = INQUIRIES.filter(i => {
    const matchS = i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.destination.toLowerCase().includes(search.toLowerCase()) ||
      i.phone.includes(search);
    const matchSt = statusF === "All" || i.status === statusF;
    return matchS && matchSt;
  });

  const counts = {
    new: INQUIRIES.filter(i => i.status === "new").length,
    contacted: INQUIRIES.filter(i => i.status === "contacted").length,
    closed: INQUIRIES.filter(i => i.status === "closed").length,
  };

  return (
    <AdminLayout title="Inquiries" subtitle="Manage and respond to customer inquiries">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {(["new", "contacted", "closed"] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setStatusF(statusF === s ? "All" : s)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${statusF === s ? "border-[#1B3A6B] bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                <Icon className="w-4.5 h-4.5" style={{ color: cfg.color, width: "18px", height: "18px" }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{counts[s]}</p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, destination, phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#059669" }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Inquiries list */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="divide-y divide-gray-50">
            {filtered.map(inq => {
              const cfg = statusConfig[inq.status as keyof typeof statusConfig];
              const StatusIcon = cfg.icon;
              return (
                <div key={inq.id}
                  onClick={() => setSelected(inq)}
                  className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${selected?.id === inq.id ? "bg-blue-50 border-l-4 border-[#1B3A6B]" : "hover:bg-gray-50"}`}>
                  <div className="w-10 h-10 rounded-xl font-bold text-white text-sm flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                    {inq.name[0]}
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
                      <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{inq.destination}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" />{inq.adults + inq.children} pax</span>
                      {inq.month && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{inq.month}</span>}
                      <span className="text-xs font-medium" style={{ color: "#1B3A6B" }}>{budgetLabels[inq.budget] || inq.budget}</span>
                    </div>
                    {inq.note && <p className="text-xs text-gray-400 mt-1 truncate">"{inq.note}"</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{inq.createdAt}</p>
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
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {selected ? (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-12 h-12 rounded-2xl font-bold text-white text-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                  {selected.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selected.name}</h3>
                  <span className="text-xs text-gray-400">{selected.tripType} trip</span>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: "Phone", val: `+91 ${selected.phone}`, href: `tel:+91${selected.phone}`, icon: Phone },
                  { label: "Email", val: selected.email || "Not provided", href: selected.email ? `mailto:${selected.email}` : undefined, icon: Mail },
                  { label: "Destination", val: selected.destination, icon: MapPin },
                  { label: "Travellers", val: `${selected.adults} adults, ${selected.children} children`, icon: Users },
                  { label: "Travel Month", val: selected.month || "Flexible", icon: Calendar },
                  { label: "Budget", val: budgetLabels[selected.budget] || selected.budget, icon: ArrowUpRight },
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

              {selected.note && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
                  <p className="text-xs font-bold text-amber-900 mb-1">Special Request</p>
                  <p className="text-xs text-amber-800">{selected.note}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                <a href={`https://wa.me/91${selected.phone}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "#25D366" }}>
                  <MessageSquare className="w-4 h-4" /> WhatsApp Now
                </a>
                <a href={`tel:+91${selected.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                  <Phone className="w-4 h-4" /> Call Client
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700">Mark Contacted</button>
                  <button className="py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600">Mark Closed</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium text-sm">Select an inquiry</p>
              <p className="text-xs text-center mt-1 px-6">Click any inquiry on the left to see full details and actions</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
