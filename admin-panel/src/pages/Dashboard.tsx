import AdminLayout from "../components/AdminLayout";
import { Package, MapPin, MessageSquare, Users, TrendingUp, Star, ArrowUpRight, Clock, CheckCircle, XCircle, Phone } from "lucide-react";

const STATS = [
  { label: "Total Packages", value: "248", change: "+12", trend: "up", icon: Package, color: "#1B3A6B", bg: "#EEF2FF" },
  { label: "Destinations", value: "52", change: "+3", trend: "up", icon: MapPin, color: "#059669", bg: "#ECFDF5" },
  { label: "New Inquiries", value: "34", change: "+8", trend: "up", icon: MessageSquare, color: "#DC2626", bg: "#FEF2F2" },
  { label: "Active Agents", value: "18", change: "+2", trend: "up", icon: Users, color: "#7C3AED", bg: "#F5F3FF" },
];

const RECENT_INQUIRIES = [
  { name: "Rajesh Sharma", phone: "9876543210", dest: "Manali — 5N/6D", type: "Family", status: "new", time: "10 mins ago" },
  { name: "Priya Jain", phone: "9012345678", dest: "Kashmir — 7N/8D", type: "Honeymoon", status: "contacted", time: "1 hr ago" },
  { name: "Suresh Patel", phone: "9123456789", dest: "Ladakh — 8N/9D", type: "Group", status: "new", time: "2 hrs ago" },
  { name: "Kavita Singh", phone: "9234567890", dest: "Goa — 4N/5D", type: "Family", status: "closed", time: "3 hrs ago" },
  { name: "Arun Kumar", phone: "9345678901", dest: "Thailand — 6N/7D", type: "Couple", status: "contacted", time: "5 hrs ago" },
];

const TOP_PACKAGES = [
  { name: "Manali Volvo Tour", dest: "Himachal Pradesh", price: "₹12,500", bookings: 48, rating: 4.9 },
  { name: "Kashmir Paradise", dest: "Jammu & Kashmir", price: "₹28,000", bookings: 35, rating: 4.8 },
  { name: "Ladakh Bike Trip", dest: "Leh Ladakh", price: "₹35,000", bookings: 29, rating: 4.9 },
  { name: "Thailand Bangkok", dest: "International", price: "₹42,000", bookings: 21, rating: 4.7 },
];

const statusConfig = {
  new: { label: "New", bg: "#FEF3C7", color: "#92400E", icon: Clock },
  contacted: { label: "Contacted", bg: "#D1FAE5", color: "#065F46", icon: CheckCircle },
  closed: { label: "Closed", bg: "#F3F4F6", color: "#6B7280", icon: XCircle },
};

export default function Dashboard() {
  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />{change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Inquiries */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Recent Inquiries</h3>
              <p className="text-xs text-gray-500">Latest customer requests</p>
            </div>
            <a href="/inquiries" className="text-xs font-semibold flex items-center gap-1" style={{ color: "#1B3A6B" }}>
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {RECENT_INQUIRIES.map((inq) => {
              const cfg = statusConfig[inq.status as keyof typeof statusConfig];
              const StatusIcon = cfg.icon;
              return (
                <div key={inq.name} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl font-bold text-white text-sm flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
                    {inq.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{inq.name}</p>
                    <p className="text-xs text-gray-500 truncate">{inq.dest} · {inq.type}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`tel:+91${inq.phone}`} className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center hover:bg-green-100">
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                    </a>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 hidden sm:block">{inq.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Packages */}
        <div className="bg-white rounded-2xl border border-gray-100" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Top Packages</h3>
              <p className="text-xs text-gray-500">Most booked this month</p>
            </div>
            <a href="/packages" className="text-xs font-semibold flex items-center gap-1" style={{ color: "#1B3A6B" }}>
              All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="p-5 space-y-4">
            {TOP_PACKAGES.map((pkg, i) => (
              <div key={pkg.name} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0"
                  style={{
                    background: i === 0 ? "#FEF3C7" : i === 1 ? "#F3F4F6" : i === 2 ? "#FEE2E2" : "#F0F5FF",
                    color: i === 0 ? "#92400E" : i === 1 ? "#6B7280" : i === 2 ? "#991B1B" : "#1B3A6B"
                  }}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{pkg.name}</p>
                  <p className="text-xs text-gray-500">{pkg.dest}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[#1B3A6B]">{pkg.price}</span>
                    <span className="text-[10px] text-gray-400">{pkg.bookings} bookings</span>
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" />{pkg.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="px-5 pb-5">
            <div className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, #0B1F4E, #1B3A6B)" }}>
              <p className="text-white text-xs font-bold mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Add Package", href: "/packages/new" },
                  { label: "Add Destination", href: "/destinations/new" },
                  { label: "New Blog", href: "/blogs/new" },
                  { label: "View Inquiries", href: "/inquiries" },
                ].map(({ label, href }) => (
                  <a key={label} href={href}
                    className="text-[11px] font-semibold py-2 px-2 rounded-xl text-center transition-colors"
                    style={{ background: "rgba(255,255,255,0.12)", color: "#F5A623" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
