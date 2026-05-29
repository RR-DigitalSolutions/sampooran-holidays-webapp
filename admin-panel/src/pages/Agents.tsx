import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  Users, Mail, Phone, Globe, Shield, 
  CheckCircle, XCircle, Star, Plus, 
  Search, RefreshCw, ChevronRight,
  TrendingUp, Wallet, Award
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

interface Agent {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  role: string;
  badge: string;
  pointsBalance: number;
  lifetimeSalesCount: number;
  status: string;
}

const badgeConfig: Record<string, { bg: string; border: string; color: string; label: string }> = {
  GOLD: { bg: "bg-amber-50", border: "border-amber-100", color: "text-amber-700", label: "Gold Partner" },
  SILVER: { bg: "bg-slate-50", border: "border-slate-100", color: "text-slate-700", label: "Silver Partner" },
  BRONZE: { bg: "bg-orange-50", border: "border-orange-100", color: "text-orange-700", label: "Bronze Partner" },
  PLATINUM: { bg: "bg-indigo-50", border: "border-indigo-100", color: "text-indigo-700", label: "Platinum Elite" },
};

export default function Agents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data: Agent[] = await res.json();
      // Filter for Agents only
      setAgents(data.filter(u => u.role === 'AGENT'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = agents.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="B2B Agent Ecosystem" subtitle="Track and manage your corporate agency partners">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agencies..."
            className="w-full pl-11 pr-4 py-3.5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary shadow-sm bg-white"
          />
        </div>
        <button className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-gray-200 hover:bg-black transition-all">
          <Plus className="w-4 h-4" /> Recruit New Agent
        </button>
      </div>

      {loading ? (
        <div className="p-32 text-center text-gray-400">
           <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 opacity-20" />
           <p className="font-black tracking-widest uppercase">Syncing B2B Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(agent => {
            const badge = badgeConfig[agent.badge || 'BRONZE'];
            return (
              <div key={agent.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-3xl bg-primary/5 text-primary flex items-center justify-center font-black text-xl border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                      {agent.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">{agent.name}</h3>
                      <div className={`mt-2 text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.color} w-fit`}>
                        {badge.label}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-300 hover:text-gray-600">
                    <TrendingUp className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <Mail className="w-4 h-4 text-gray-300" /> {agent.email}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <Phone className="w-4 h-4 text-gray-300" /> {agent.phoneNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-4 bg-gray-50 rounded-2xl">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Lifetime Sales</p>
                     <p className="text-xl font-black text-gray-900">{agent.lifetimeSalesCount || 0}</p>
                   </div>
                   <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                     <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-1">Credits</p>
                     <p className="text-xl font-black text-primary">₹{agent.pointsBalance?.toLocaleString()}</p>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                  <a href={`https://wa.me/91${agent.phoneNumber}`} target="_blank" rel="noreferrer"
                    className="flex-1 text-center py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                    style={{ background: "#25D366" }}>
                    WhatsApp
                  </a>
                  <button className="flex-1 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors">
                    Manage Tier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
