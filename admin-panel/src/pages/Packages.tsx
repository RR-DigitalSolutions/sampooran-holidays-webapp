import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Search, Filter, Edit, Trash2, Eye, Star, Tag, Globe,
  Mountain, CheckCircle, XCircle, MoreVertical, Copy, Loader2
} from "lucide-react";
import { customFetch } from "../utils/api";
import { getApiUrl } from "@/utils/api-url";
import { toast } from "sonner";
import { useLocation } from "wouter";

const DEFAULT_CATEGORIES = ["All", "Adventure", "Luxury", "Honeymoon", "Family", "Cultural", "International", "Leisure"];

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [, setLocation] = useLocation();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const data = await customFetch("/api/admin/packages");
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchConfig() {
      try {
        const API_BASE = getApiUrl();
        const res = await fetch(`${API_BASE}/ota/home/config`);
        if (res.ok) {
          const data = await res.json();
          const cats = data.categories?.filter((c:any) => c.isActive).map((c: any) => c.label) || [];
          const themes = data.themes?.map((t: any) => t.name) || [];
          const unique = Array.from(new Set([...cats, ...themes]));
          if (unique.length > 0) {
            setDynamicCategories(["All", ...unique]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic categories", err);
      }
    }
    fetchPackages();
    fetchConfig();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      await customFetch(`/api/admin/packages/${id}`, { method: "DELETE" });
      toast.success("Package deleted successfully");
      fetchPackages();
    } catch (err) {
      toast.error("Failed to delete package");
    }
  };

  const filtered = packages.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.destinationName?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || (p.category && (p.category.toLowerCase().trim().includes(category.toLowerCase().trim()) || category.toLowerCase().trim().includes(p.category.toLowerCase().trim())));
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <AdminLayout title="Packages" subtitle={`${filtered.length} packages found`}>
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search packages..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1B3A6B]">
          {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <a href="/packages/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shrink-0 shadow"
          style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
          <Plus className="w-4 h-4" /> Add Package
        </a>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
             <Loader2 className="w-8 h-8 animate-spin text-[#1B3A6B] mb-2" />
             <p className="text-sm font-medium">Fetching packages...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100" style={{ background: "#F8FAFC" }}>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3.5 uppercase tracking-wide">Package</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Category</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Duration</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Price</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3.5 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)" }}>
                          <Mountain className="w-5 h-5 text-[#1B3A6B]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{pkg.name}</p>
                            {pkg.isFeatured && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: "#FEF3C7", color: "#92400E" }}>FEATURED</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="w-3 h-3" />{pkg.destinationName || pkg.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ background: "#EEF2FF", color: "#1B3A6B" }}>{pkg.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{pkg.duration}D/{pkg.nights}N</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-sm text-gray-900">₹{pkg.pricePerPerson?.toLocaleString() || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => window.open(`http://localhost:3000/packages/${pkg.slug}`, "_blank")} 
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="View on Site">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setLocation(`/packages/${pkg.id}/edit`)} 
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} 
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Mountain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No packages found</p>
            <p className="text-sm">Start by adding your first travel package</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

