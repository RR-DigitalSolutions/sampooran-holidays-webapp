import AdminLayout from "../components/AdminLayout";
import { Plus, Truck, MapPin, Users, CheckCircle, Edit, Trash2, Search } from "lucide-react";
import { useState } from "react";

const VEHICLES = [
  { id: 1, name: "Volvo AC Sleeper Bus", type: "Bus", capacity: 32, route: "Delhi ↔ Manali", price: 1800, status: "active" },
  { id: 2, name: "Toyota Innova Crysta", type: "SUV", capacity: 6, route: "Local / Point-to-Point", price: 3200, status: "active" },
  { id: 3, name: "Tempo Traveller 12-Seater", type: "Minivan", capacity: 12, route: "Group Transfers", price: 4500, status: "active" },
  { id: 4, name: "Maruti Ertiga", type: "Hatchback", capacity: 6, route: "Airport Transfers", price: 2000, status: "active" },
  { id: 5, name: "Tata Sumo", type: "SUV", capacity: 7, route: "Spiti Valley / Off-Road", price: 3800, status: "draft" },
  { id: 6, name: "Mini Bus 20-Seater", type: "Bus", capacity: 20, route: "Group Tours", price: 5500, status: "active" },
];

export default function Transport() {
  const [search, setSearch] = useState("");
  const filtered = VEHICLES.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Transport" subtitle="Manage vehicle fleet and transfer options">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)" }}>
                <Truck className="w-5 h-5 text-[#1B3A6B]" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                v.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {v.status === "active" ? <CheckCircle className="w-2.5 h-2.5" /> : null}{v.status}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">{v.name}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 inline-block"
              style={{ background: "#EEF2FF", color: "#1B3A6B" }}>{v.type}</span>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" /> {v.capacity} passengers
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5" /> {v.route}
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <span className="font-bold text-[#1B3A6B]">₹{v.price.toLocaleString()}</span>
                <span className="text-xs text-gray-400">/day</span>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
