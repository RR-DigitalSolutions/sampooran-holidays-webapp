import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Trash2, Edit3, Search, Filter,
  Star, MapPin, Globe, CheckCircle, XCircle,
  ChevronRight, ArrowRight, Navigation, LayoutGrid, List, Building2
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Hotel {
  id: number;
  name: string;
  slug: string;
  address: string;
  starRating: number;
  latitude?: number;
  longitude?: number;
  displayOrder: number;
  status: string;
  isFeatured: boolean;
  destinationName?: string;
  ownerName?: string;
}

export default function HotelsManager() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/hotels`, {
        headers: { "Authorization": `Bearer ${JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token}` }
      });
      const data = await res.json();
      setHotels(data);
    } catch (err) {
      console.error("Failed to fetch hotels", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHotel = async (id: number, data: Partial<Hotel>) => {
    try {
      await fetch(`${API_URL}/admin/hotels/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token}`
        },
        body: JSON.stringify(data)
      });
      fetchHotels();
    } catch (err) {
      console.error("Update hotel failed", err);
    }
  };

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <AdminLayout title="Hotel Management">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Hotel Management" subtitle="Manage property rankings, geolocation and featured status">
      <div className="space-y-6">

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl w-full md:w-96 border border-gray-100 focus-within:border-primary transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Search hotels or locations..."
              className="bg-transparent text-sm focus:outline-none w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-gray-400"}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-gray-400"}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
            <button className="bg-primary text-blue hover:bg-blue-300 px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        </div>

        {/* List View */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Ranking</th>
                  <th className="px-6 py-4">Coordinates</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredHotels.map(hotel => (
                  <tr key={hotel.id} className="hover:bg-gray-50/80 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm group-hover:text-accent transition-colors">{hotel.name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 font-medium">{hotel.destinationName || "N/A"}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{hotel.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={hotel.displayOrder}
                          onChange={(e) => handleUpdateHotel(hotel.id, { displayOrder: parseInt(e.target.value) })}
                          className="w-16 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-sm font-bold text-primary focus:outline-none focus:border-accent"
                        />
                        {hotel.isFeatured && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">FEATURED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
                          <Navigation className="w-3 h-3" /> {hotel.latitude?.toFixed(4) || "0.0000"}, {hotel.longitude?.toFixed(4) || "0.0000"}
                        </div>
                        <button className="text-[10px] font-bold text-primary hover:underline text-left">Update on Map</button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {hotel.status === "APPROVED" ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> LIVE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3 h-3" /> {hotel.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white rounded-xl shadow-sm text-gray-400 hover:text-primary transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-white rounded-xl shadow-sm text-gray-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredHotels.map(hotel => (
              <div key={hotel.id} className="bg-white rounded-[2rem] border border-gray-100 p-5 hover:shadow-xl transition-all duration-500 group">
                <div className="relative h-40 bg-gray-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-gray-200" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                    ORDER #{hotel.displayOrder}
                  </div>
                </div>
                <h3 className="font-bold text-primary mb-1 group-hover:text-accent transition-colors">{hotel.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{hotel.destinationName || "Global"}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex gap-1">
                    <button className="text-gray-300 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                    <button className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                    Details <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
