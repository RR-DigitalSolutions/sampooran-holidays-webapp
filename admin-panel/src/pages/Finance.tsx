import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  BarChart3, TrendingUp, DollarSign, 
  ArrowUpRight, ArrowDownRight, 
  Search, RefreshCw, Calendar, 
  Filter, Download, ChevronRight,
  Ticket, Users, Wallet
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

interface LedgerEntry {
  id: number;
  userId: number;
  userName?: string; // We'll map this from a user join or secondary fetch
  amount: number;
  type: 'BONUS' | 'REFERRAL' | 'REDEEMED';
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export default function FinancePage() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ledger`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setLedger(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = ledger.filter(l => 
    l.description.toLowerCase().includes(search.toLowerCase()) || 
    l.userId.toString().includes(search)
  );

  const stats = {
    totalBonus: ledger.filter(l => l.type === 'BONUS').reduce((acc, curr) => acc + Number(curr.amount), 0),
    totalReferrals: ledger.filter(l => l.type === 'REFERRAL').reduce((acc, curr) => acc + Number(curr.amount), 0),
    activeUsers: new Set(ledger.map(l => l.userId)).size
  };

  return (
    <AdminLayout title="Financial Intelligence" subtitle="Audit and track platform-wide rewards and loyalty liability">
      <div className="space-y-8">
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Signup Bonuses</p>
              <h3 className="text-3xl font-black tracking-tighter text-gray-900">₹{stats.totalBonus.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Referral Commissions</p>
              <h3 className="text-3xl font-black tracking-tighter text-gray-900">₹{stats.totalReferrals.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Active Reward Accounts</p>
              <h3 className="text-3xl font-black tracking-tighter text-gray-900">{stats.activeUsers}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Audit Trail Section */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg">
                 <Wallet className="w-6 h-6" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-gray-900">Reward Ledger Audit</h2>
                 <p className="text-xs text-gray-400 font-medium">Full transparency of point-based liabilities</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs w-64 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              <button className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-all">
                <Download className="w-4 h-4" /> Export Audit
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 font-bold text-[10px] uppercase text-gray-400 tracking-[0.2em] border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5">Transaction ID</th>
                  <th className="px-8 py-5">User</th>
                  <th className="px-8 py-5">Event Type</th>
                  <th className="px-8 py-5">Amount (INR)</th>
                  <th className="px-8 py-5">Audit Description</th>
                  <th className="px-8 py-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center text-gray-400">
                       <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 opacity-20" />
                       <p className="font-bold text-sm tracking-widest uppercase">Fetching Financial Data...</p>
                    </td>
                  </tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm font-mono font-medium text-gray-400">#TXN-{t.id.toString().padStart(5, '0')}</td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                         <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center text-[10px] font-black">
                           ID
                         </div>
                         <span className="text-xs font-bold text-gray-900">User_{t.userId}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                         t.type === 'BONUS' ? 'bg-emerald-100 text-emerald-700' : 
                         t.type === 'REFERRAL' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                       }`}>
                         {t.type}
                       </span>
                    </td>
                    <td className={`px-8 py-5 text-sm font-black ${t.type === 'REDEEMED' ? 'text-rose-500' : 'text-gray-900'}`}>
                       {t.type === 'REDEEMED' ? '-' : '+'}₹{t.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-500 max-w-[250px] truncate italic">{t.description}</td>
                    <td className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">
                       {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
             <p className="text-xs text-gray-400 italic">Financial data is processed in real-time. Contact DevOps for database audit access.</p>
             <div className="flex items-center gap-2">
                <button className="p-2 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">Previous</button>
                <button className="p-2 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">Next</button>
             </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
