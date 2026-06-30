import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  Users, Search, User, Mail, Phone, 
  MapPin, Ticket, Award, Edit3, 
  ShieldCheck, AlertCircle, RefreshCw,
  Plus, Minus, Save, X, Building2
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

interface Traveler {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  badge: string;
  pointsBalance: number;
  createdAt: string;
  vendorVerified?: boolean;
  vendorBusinessName?: string | null;
  vendorBusinessAddress?: string | null;
}

export default function UsersPage({ mode = "TRAVELERS" }: { mode?: "TRAVELERS" | "HOTELS" | "TRANSPORT" }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Traveler | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");

  useEffect(() => {
    fetchUsers();
    setSelectedUser(null);
    setIsEditing(false);
  }, [mode]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedData: Partial<Traveler>) => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` 
        },
        body: JSON.stringify(updatedData),
      });
      const updated = await res.json();
      setUsers(users.map(u => u.id === updated.id ? updated : u));
      setSelectedUser(updated);
      setIsEditing(false);
      setAdjustAmount("");
    } catch (error) {
      alert("Failed to update user");
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(search));

    if (!matchesSearch) return false;

    if (mode === "HOTELS") {
      return u.role === "HOTEL_OWNER";
    }
    if (mode === "TRANSPORT") {
      return u.role === "TRANSPORTER";
    }
    // Travelers mode: show standard users and agents, filter out hoteliers and transporters
    return u.role !== "HOTEL_OWNER" && u.role !== "TRANSPORTER";
  });

  const getBadgeColor = (badge: string) => {
    switch(badge?.toUpperCase()) {
      case 'BRONZE': return 'bg-orange-100 text-orange-700';
      case 'SILVER': return 'bg-slate-100 text-slate-700';
      case 'GOLD': return 'bg-yellow-100 text-yellow-700';
      case 'PLATINUM': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTitle = () => {
    if (mode === "HOTELS") return "Hotel Partners";
    if (mode === "TRANSPORT") return "Transport Partners";
    return "Travelers & Agents";
  };

  const getSubtitle = () => {
    if (mode === "HOTELS") return "Manage hoteliers, property owners, and hosts";
    if (mode === "TRANSPORT") return "Manage drivers, transport fleets, and logistics partners";
    return "Manage global traveler community and B2B booking agents";
  };

  const getPlaceholderIcon = (role: string) => {
    if (role === "HOTEL_OWNER") return <Building2 className="w-5 h-5" />;
    return <User className="w-5 h-5" />;
  };

  return (
    <AdminLayout title={getTitle()} subtitle={getSubtitle()}>
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* User List Section */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or mobile..."
              className="w-full pl-11 pr-4 py-3.5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary shadow-sm bg-white"
            />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-20 text-center text-gray-400 flex flex-col items-center">
                <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
                <p className="font-medium animate-pulse">Syncing Registry...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500 tracking-widest">Identity</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500 tracking-widest">Type</th>
                    {mode === "TRAVELERS" && (
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500 tracking-widest">Balance</th>
                    )}
                    {(mode === "HOTELS" || mode === "TRANSPORT") && (
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500 tracking-widest">Business Detail</th>
                    )}
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500 tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(u => (
                    <tr 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)}
                      className={`cursor-pointer transition-colors ${selectedUser?.id === u.id ? 'bg-primary/5' : 'hover:bg-gray-50/50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 font-medium">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                            {getPlaceholderIcon(u.role)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{u.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase w-fit ${
                            u.role === 'AGENT' ? 'bg-indigo-100 text-indigo-700' : 
                            u.role === 'HOTEL_OWNER' ? 'bg-amber-100 text-amber-700' :
                            u.role === 'TRANSPORTER' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {u.role}
                          </span>
                          {u.badge && mode === "TRAVELERS" && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border w-fit ${getBadgeColor(u.badge)}`}>
                              {u.badge}
                            </span>
                          )}
                          {(u.role === 'HOTEL_OWNER' || u.role === 'TRANSPORTER') && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border w-fit ${
                              u.vendorVerified ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-amber-100 border-amber-200 text-amber-700'
                            }`}>
                              {u.vendorVerified ? 'VERIFIED' : 'PENDING'}
                            </span>
                          )}
                        </div>
                      </td>
                      {mode === "TRAVELERS" && (
                        <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900">
                          ₹{u.pointsBalance?.toLocaleString()}
                        </td>
                      )}
                      {(mode === "HOTELS" || mode === "TRANSPORT") && (
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-900">{u.vendorBusinessName || "N/A"}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{u.vendorBusinessAddress || "N/A"}</p>
                        </td>
                      )}
                      <td className="px-6 py-4">
                         <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                           <Edit3 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="w-full lg:w-[400px]">
          {selectedUser ? (
            <div className="bg-white rounded-3xl border-2 border-primary/10 shadow-2xl p-6 sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                     {getPlaceholderIcon(selectedUser.role)}
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                     <p className="text-xs text-gray-400">UUID: {selectedUser.id}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-primary transition-colors"
                >
                  {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                   <div className="flex items-center gap-3 text-xs">
                     <Mail className="w-4 h-4 text-gray-400" /> <span className="font-medium text-gray-600">{selectedUser.email}</span>
                   </div>
                   <div className="flex items-center gap-3 text-xs">
                     <Phone className="w-4 h-4 text-gray-400" /> <span className="font-medium text-gray-600">{selectedUser.phoneNumber || "No phone"}</span>
                   </div>
                   {(selectedUser.role === 'HOTEL_OWNER' || selectedUser.role === 'TRANSPORTER') && (
                     <>
                       <div className="flex items-center gap-3 text-xs border-t border-gray-200/50 pt-2 mt-2">
                         <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                         <span className="font-bold text-gray-700 truncate">{selectedUser.vendorBusinessName || "No business name registered"}</span>
                       </div>
                       <div className="flex items-center gap-3 text-xs">
                         <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                         <span className="font-medium text-gray-500 break-words">{selectedUser.vendorBusinessAddress || "No address registered"}</span>
                       </div>
                     </>
                   )}
                </div>

                <div className="p-6 bg-linear-to-br from-gray-900 to-black rounded-[2rem] text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-10">
                     <Ticket className="w-20 h-20" />
                   </div>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Balance Available</p>
                   <h4 className="text-3xl font-black tracking-tighter">₹{selectedUser.pointsBalance?.toLocaleString()}</h4>
                   
                   {isEditing ? (
                     <div className="mt-4 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase">Manual Point Adjustment</label>
                        <div className="flex gap-2">
                           <input 
                             type="number"
                             value={adjustAmount}
                             onChange={e => setAdjustAmount(e.target.value)}
                             placeholder="Amount"
                             className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary text-white"
                           />
                           <button 
                             onClick={() => updateUser({ pointsBalance: (selectedUser.pointsBalance || 0) + Number(adjustAmount) })}
                             className="bg-primary hover:bg-primary/90 text-white p-2 rounded-xl transition-colors cursor-pointer"
                           >
                             <Plus className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => updateUser({ pointsBalance: Math.max(0, (selectedUser.pointsBalance || 0) - Number(adjustAmount)) })}
                             className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition-colors cursor-pointer"
                           >
                             <Minus className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                   ) : (
                     (selectedUser.role === 'HOTEL_OWNER' || selectedUser.role === 'TRANSPORTER') ? (
                       <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold w-fit px-2.5 py-1 rounded-lg ${
                         selectedUser.vendorVerified 
                           ? 'text-emerald-400 bg-emerald-400/10' 
                           : 'text-amber-400 bg-amber-400/10'
                       }`}>
                         <ShieldCheck className="w-3.5 h-3.5" /> 
                         {selectedUser.vendorVerified ? "VERIFIED PARTNER" : "PENDING VERIFICATION"}
                       </div>
                     ) : (
                       <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 w-fit px-2.5 py-1 rounded-lg">
                          <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED GENUINE
                       </div>
                     )
                   )}
                </div>

                {isEditing && (
                  <div className="space-y-4 pt-2">
                    {(selectedUser.role === 'HOTEL_OWNER' || selectedUser.role === 'TRANSPORTER') ? (
                      <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block ml-1">Manage Vendor Verification</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateUser({ vendorVerified: true })}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${
                              selectedUser.vendorVerified 
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-500/30 hover:bg-emerald-50/20'
                            }`}
                          >
                            VERIFIED
                          </button>
                          <button
                            onClick={() => updateUser({ vendorVerified: false })}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${
                              !selectedUser.vendorVerified 
                                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'bg-white border-gray-200 text-gray-400 hover:border-amber-500/30 hover:bg-amber-50/20'
                            }`}
                          >
                            PENDING
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Change Identity Role</label>
                        <select 
                          value={selectedUser.role}
                          onChange={e => updateUser({ role: e.target.value })}
                          className="w-full mt-1.5 p-3 border border-gray-100 rounded-2xl text-sm font-bold bg-white"
                        >
                          <option value="USER">Standard Traveler</option>
                          <option value="AGENT">B2B Travel Agent</option>
                          <option value="ADMIN">System Administrator</option>
                        </select>
                      </div>
                    )}

                    {selectedUser.role === 'AGENT' && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Update Agent Badge (Tier)</label>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(b => (
                            <button
                              key={b}
                              onClick={() => updateUser({ badge: b })}
                              className={`py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${selectedUser.badge === b ? 'bg-primary border-primary text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/30'}`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[400px]">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <AlertCircle className="w-8 h-8 opacity-20" />
               </div>
               <p className="font-bold text-sm">Select a Profile</p>
               <p className="text-xs max-w-[150px] mt-1">Select a record from the list to manage their profile and rewards.</p>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
