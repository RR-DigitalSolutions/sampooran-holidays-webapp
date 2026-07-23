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
  const { user, isSuperAdmin } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN", permissions: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Access Denied" subtitle="Unauthorized access">
        <div className="p-12 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Area</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            You do not have permission to view this page. Only Super Admins can manage Staff & Access.
          </p>
        </div>
      </AdminLayout>
    );
  }


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
      setForm({ name: "", email: "", password: "", role: "ADMIN", permissions: [] });
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
            onClick={() => { setForm(f => ({ ...f, role: "ADMIN", permissions: ["SUPPORT", "INQUIRIES"] })); setShowForm(true); }}
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

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Account Role</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-lg border border-gray-200 flex-1 hover:border-blue-400 transition-all">
                  <input type="radio" name="role" value="ADMIN" checked={form.role === "ADMIN"} onChange={() => setForm(f => ({ ...f, role: "ADMIN" }))} className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-gray-700">Staff / Support Agent</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-lg border border-amber-200 flex-1 hover:border-amber-400 transition-all shadow-sm">
                  <input type="radio" name="role" value="SUPERADMIN" checked={form.role === "SUPERADMIN"} onChange={() => setForm(f => ({ ...f, role: "SUPERADMIN", permissions: ["ALL"] }))} className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600">⭐ Super Admin (Full Access)</span>
                </label>
              </div>
            </div>

            {form.role === "ADMIN" && (
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
            )}

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

      {/* Chat Agent & Department Assignments Section */}
      <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Headset className="w-5 h-5 text-primary" /> Chat Department Assignments & Agent Roster
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Assign staff members to specific chat departments (TOURS, HOTELS, TAXI, B2B, B2C). Department agents see their assigned department chats.
            </p>
          </div>
        </div>

        <ChatAgentsManager staffList={staff} />
      </div>
    </AdminLayout>
  );
}

interface ChatAgent {
  id: number;
  userId: number;
  department: string;
  isSupervisor: boolean;
  isAvailable: boolean;
  maxConcurrentChats: number;
  displayName: string;
  name?: string;
  email?: string;
}

function ChatAgentsManager({ staffList }: { staffList: StaffMember[] }) {
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(0);
  const [department, setDepartment] = useState("TOUR");
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [maxChats, setMaxChats] = useState(5);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/chat-agents`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) { setErr("Please select a staff member"); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/chat-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          userId: selectedStaffId,
          department,
          isSupervisor,
          displayName,
          maxConcurrentChats: maxChats,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error || "Failed to assign chat agent");
        return;
      }
      setShowAddModal(false);
      setSelectedStaffId(0);
      setDisplayName("");
      fetchAgents();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailable = async (agent: ChatAgent) => {
    try {
      await fetch(`${API_BASE}/api/admin/chat-agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ isAvailable: !agent.isAvailable }),
      });
      fetchAgents();
    } catch {}
  };

  const handleDeleteAgent = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/admin/chat-agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchAgents();
    } catch {}
  };

  const DEPT_BADGES: Record<string, string> = {
    TOUR: "bg-emerald-50 text-emerald-700 border-emerald-200",
    HOTEL: "bg-purple-50 text-purple-700 border-purple-200",
    TAXI: "bg-amber-50 text-amber-700 border-amber-200",
    B2B: "bg-sky-50 text-sky-700 border-sky-200",
    B2C: "bg-indigo-50 text-indigo-700 border-indigo-200",
    GENERAL: "bg-gray-50 text-gray-700 border-gray-200",
    ALL: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Active Chat Agents ({agents.length})
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1B3A6B] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-[#1B3A6B]/90 transition"
        >
          <Plus className="w-4 h-4" /> Assign Staff to Chat Dept
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleCreateAgent} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
          <h4 className="font-bold text-sm text-gray-900">Assign Chat Department to Staff</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Select Staff Member</label>
              <select
                value={selectedStaffId}
                onChange={e => {
                  const id = Number(e.target.value);
                  setSelectedStaffId(id);
                  const st = staffList.find(s => s.id === id);
                  if (st) setDisplayName(st.name);
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
              >
                <option value={0}>-- Select Staff --</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Chat Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
              >
                <option value="TOUR">🏔️ TOUR — Tour Packages & Honeymoon</option>
                <option value="HOTEL">🏨 HOTEL — Hotel Bookings & Stays</option>
                <option value="TAXI">🚗 TAXI — Transport & Vehicle Hires</option>
                <option value="B2B">🤝 B2B — Agency & Corporate Partnerships</option>
                <option value="B2C">💬 B2C — General Customer Inquiries</option>
                <option value="GENERAL">📍 GENERAL — Helpdesk</option>
                <option value="ALL">⭐ ALL — All Departments</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Display Name (shown to clients)</label>
              <input
                type="text" value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul - Senior Concierge"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
              <input
                type="checkbox" checked={isSupervisor}
                onChange={e => setIsSupervisor(e.target.checked)}
                className="w-4 h-4 accent-[#1B3A6B] rounded"
              />
              ⭐ Supervisor Access (Can view ALL chats & reassign)
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Max Concurrent Chats:</span>
              <input
                type="number" min={1} max={20} value={maxChats}
                onChange={e => setMaxChats(Number(e.target.value))}
                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center bg-white"
              />
            </div>
          </div>

          {err && <p className="text-xs text-red-500 font-semibold">{err}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#1B3A6B] text-white rounded-xl text-xs font-bold hover:bg-[#1B3A6B]/90 transition">
              {saving ? "Assigning..." : "Confirm Assignment"}
            </button>
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-xs text-gray-400">Loading chat department assignments...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-2xl">
          No chat department assignments yet. Click "+ Assign Staff to Chat Dept" above to configure your team.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Display Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {agents.map(ag => (
                <tr key={ag.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-bold text-gray-900">
                    {ag.name || `User #${ag.userId}`}
                    <span className="block text-[10px] text-gray-400 font-normal">{ag.email}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{ag.displayName || ag.name || " Concierge"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${DEPT_BADGES[ag.department] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {ag.department}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {ag.isSupervisor ? (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">⭐ Supervisor</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Agent</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleAvailable(ag)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 transition ${
                        ag.isAvailable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${ag.isAvailable ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {ag.isAvailable ? "Available" : "Away"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteAgent(ag.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

