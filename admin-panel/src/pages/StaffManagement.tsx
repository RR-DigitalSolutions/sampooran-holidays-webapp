import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { useAuth, API_BASE } from "../context/AuthContext";
import {
  UserCog, Plus, Trash2, RefreshCw, Shield, CheckSquare, Square,
  Mail, User, Headset, MessageSquare
} from "lucide-react";

function getToken(): string {
  try { return JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token || ""; }
  catch { return ""; }
}

const PERMISSION_MODULES = [
  { key: "PACKAGES",     label: "Packages",         dept: "Content" },
  { key: "DESTINATIONS", label: "Destinations",     dept: "Content" },
  { key: "BLOGS",        label: "Blog / SEO",       dept: "Content" },
  { key: "INQUIRIES",    label: "Inquiries",        dept: "Operations" },
  { key: "SUPPORT",      label: "Live Support",     dept: "Operations" },
  { key: "BOOKINGS",     label: "Bookings",         dept: "Operations" },
  { key: "USERS",        label: "Travelers & Agents", dept: "Operations" },
  { key: "FINANCE",      label: "Finance / Ledger", dept: "Accounts" },
  { key: "TRANSPORT",    label: "Transport",        dept: "Transport" },
  { key: "SETTINGS",     label: "System Settings",  dept: "Super" },
];

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  adminPermissions: string | null;
}

export default function StaffManagement() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", permissions: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const togglePermission = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to create staff");
        return;
      }
      setForm({ name: "", email: "", password: "", permissions: [] });
      setShowForm(false);
      fetchStaff();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const getPermissions = (member: StaffMember): string[] => {
    try { return JSON.parse(member.adminPermissions || "[]"); } catch { return []; }
  };

  const deptColors: Record<string, string> = {
    Content: "from-violet-500 to-purple-600",
    Operations: "from-blue-500 to-cyan-600",
    Accounts: "from-green-500 to-emerald-600",
    Transport: "from-orange-500 to-amber-600",
    Super: "from-red-500 to-rose-600",
  };

  return (
    <AdminLayout title="Staff & Access Control" subtitle="Manage sub-admin accounts and their permissions per department">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Headset className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-gray-700">Support SOP: Create a "Chat Support Agent" account so staff can log in to the CMS and respond to live chats.</span>
          </div>
          <p className="text-xs text-gray-400 ml-7">Each agent gets access to Live Support + Inquiries only — secure, role-based.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setForm(f => ({ ...f, permissions: ["SUPPORT", "INQUIRIES"] })); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 transition-all"
          >
            <Headset className="w-4 h-4" /> + Support Agent
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all"
          >
            <Plus className="w-4 h-4" /> Custom Staff
          </button>
        </div>
      </div>

      {/* Create Staff Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" /> New Staff Account
          </h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Full Name</label>
                <input
                  required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rahul Verma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Email</label>
                <input
                  required type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="rahul@sampooran.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Password</label>
                <input
                  type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Leave blank for default"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">Module Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {PERMISSION_MODULES.map(mod => {
                  const active = form.permissions.includes(mod.key);
                  const gradient = deptColors[mod.dept] || "from-gray-400 to-gray-500";
                  return (
                    <button
                      key={mod.key} type="button"
                      onClick={() => togglePermission(mod.key)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                        active ? `bg-gradient-to-r ${gradient} text-white border-transparent shadow-lg` : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200"
                      }`}
                    >
                      {active ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                      {mod.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">⚠️ {error}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all disabled:opacity-60">
                {saving ? "Creating..." : "Create Staff Account"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-8 py-3.5 border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="p-32 text-center text-gray-400">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 opacity-20" />
          <p className="font-black tracking-widest uppercase">Loading Staff Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {staff.map(member => {
            const perms = getPermissions(member);
            const isSuper = member.role === "SUPERADMIN";
            return (
              <div key={member.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
                    isSuper ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                    perms.includes("SUPPORT") ? "bg-gradient-to-br from-primary to-blue-700" :
                    "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}>
                    {isSuper ? <Shield className="w-6 h-6" /> : perms.includes("SUPPORT") ? <Headset className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{member.name}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isSuper ? "bg-amber-50 text-amber-700" :
                      perms.includes("SUPPORT") ? "bg-primary/10 text-primary" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {isSuper ? "Super Admin" : perms.includes("SUPPORT") ? "Support Agent" : "Staff"}
                    </span>
                  </div>
                </div>
              </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <Mail className="w-4 h-4" /> {member.email}
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Module Access</p>
                  {isSuper || perms.includes("ALL") ? (
                    <span className="inline-block bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-100">⭐ Full Access — All Modules</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {perms.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                      ) : perms.map(p => (
                        <span key={p} className="text-[11px] font-bold bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
