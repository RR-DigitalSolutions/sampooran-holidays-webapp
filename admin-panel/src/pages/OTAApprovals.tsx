import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  Building2, Truck, CheckCircle, XCircle, 
  ExternalLink, Clock, AlertCircle, Eye
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function OTAApprovals() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<any[]>([]);
  const [transport, setTransport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const hRes = await fetch(`${API_BASE}/api/admin/approvals/hotels`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const tRes = await fetch(`${API_BASE}/api/admin/approvals/transport`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      setHotels(await hRes.json());
      setTransport(await tRes.json());
    } catch (e) {
      toast.error("Failed to sync approval queue");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: 'hotels' | 'transport', id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/approvals/${type}/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error("Action failed");
      toast.success(`${type === 'hotels' ? 'Property' : 'Fleet'} ${status.toLowerCase()} successfully`);
      fetchPending();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminLayout title="OTA Approvals" subtitle="Verify and publish vendor submissions">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* HOTEL APPROVALS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-3">
             <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Building2 className="w-5 h-5" /></div>
             <h2 className="font-bold text-lg">Stay Submissions ({hotels.length})</h2>
          </div>
          
          {loading ? <div className="animate-pulse space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div> :
           hotels.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center text-gray-400">
               <CheckCircle className="w-10 h-10 opacity-20 mb-2" />
               <p className="text-sm font-medium">Hotel queue is clean</p>
            </div>
           ) : (
            <div className="space-y-3">
              {hotels.map(h => (
                <div key={h.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{h.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted {new Date(h.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase">PENDING</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-xs mb-4 flex items-center justify-between">
                     <span className="text-gray-600">Location: <b className="text-gray-900">{h.address}</b></span>
                     <button className="text-blue-600 hover:underline flex items-center gap-1 font-bold">
                       <Eye className="w-3 h-3" /> View Details
                     </button>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button 
                      onClick={() => handleAction('hotels', h.id, 'APPROVED')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve & List
                    </button>
                    <button 
                      onClick={() => handleAction('hotels', h.id, 'REJECTED')}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
           )}
        </section>

        {/* TRANSPORT APPROVALS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-3">
             <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Truck className="w-5 h-5" /></div>
             <h2 className="font-bold text-lg">Fleet Submissions ({transport.length})</h2>
          </div>
          
          {loading ? <div className="animate-pulse space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div> :
           transport.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center text-gray-400">
               <CheckCircle className="w-10 h-10 opacity-20 mb-2" />
               <p className="text-sm font-medium">Fleet queue is clean</p>
            </div>
           ) : (
            <div className="space-y-3">
              {transport.map(v => (
                <div key={v.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:border-orange-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{v.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{v.type}</p>
                    </div>
                    <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase">PENDING</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-gray-400" />
                     </div>
                     <div className="text-xs">
                        <p className="text-gray-500">Capacity: <b className="text-gray-900">{v.capacity || 0} seats</b></p>
                        <p className="text-gray-500">Price: <b className="text-gray-900">₹{v.pricePerDay || 0}/day</b></p>
                     </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button 
                      onClick={() => handleAction('transport', v.id, 'APPROVED')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction('transport', v.id, 'REJECTED')}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
           )}
        </section>

      </div>
    </AdminLayout>
  );
}
