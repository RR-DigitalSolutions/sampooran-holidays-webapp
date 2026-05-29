"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, Car, TrendingUp, HandCoins, 
  MessageSquare, CalendarCheck, Plus, 
  ChevronRight, ArrowUpRight, Image as ImageIcon,
  Edit, Trash2, Eye, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth, API_BASE } from "@/context/AuthContext";
import VendorListingForm from "./VendorListingForm";

export default function VendorDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  
  // Editor State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      // Fetch dynamic stats and listings from our new /vendor API
      const statsRes = await fetch(`${API_BASE}/api/vendor/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      const type = user?.role === 'HOTEL_OWNER' ? 'hotels' : 'transport';
      const listRes = await fetch(`${API_BASE}/api/vendor/${type}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const listData = await listRes.json();
      setListings(listData);

    } catch (error) {
      console.error("Dashboard sync error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Syncing your enterprise metrics...</div>;

  return (
    <div className="space-y-8">
      {/* 1. KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Bookings", val: stats?.totalBookings || 0, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "New Inquiries", val: stats?.totalInquiries || 0, icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Payout", val: `₹${stats?.payoutPending || 0}`, icon: HandCoins, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Active Yield", val: "0%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl">
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-30" />
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-black mt-1 font-serif">{stat.val}</h3>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. LISTINGS MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif tracking-tight flex items-center gap-3">
              {user?.role === 'HOTEL_OWNER' ? <Building2 className="text-primary" /> : <Car className="text-primary" />}
              Your Managed Assets
            </h2>
            <Button onClick={() => setIsAdding(true)} className="rounded-xl font-bold gap-2">
              <Plus className="w-4 h-4" /> List New {user?.role === 'HOTEL_OWNER' ? 'Property' : 'Vehicle'}
            </Button>
          </div>

          {listings.length === 0 ? (
            <Card className="border-dashed py-20 text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold">No assets found</p>
              <p className="text-xs text-muted-foreground mt-1">Submit your first listing to start receiving bookings.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {listings.map((item) => (
                <Card key={item.id} className="overflow-hidden shadow-lg border-primary/5 hover:border-primary/20 transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-32 h-32 bg-muted relative group overflow-hidden shrink-0">
                      {item.images?.[0] || item.imageUrl ? (
                        <img 
                          src={item.images?.[0] || item.imageUrl} 
                          alt={item.name} 
                          title={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="opacity-20" /></div>
                      )}
                      <div className="absolute top-2 left-2">
                         <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase border ${item.status === 'APPROVED' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-amber-500 text-white border-amber-600'}`}>
                           {item.status}
                         </span>
                      </div>
                    </div>
                    <CardContent className="flex-1 p-4 md:p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <span>{item.type}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>ID: #{item.id}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-xl hover:text-primary"
                          aria-label={`View ${item.name}`}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-xl hover:text-blue-600"
                          onClick={() => setEditingItem(item)}
                          aria-label={`Edit ${item.name}`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-xl hover:text-rose-600"
                          aria-label={`Delete ${item.name}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 3. SIDEBAR: RECENT LEADS & ACTIONS */}
        <div className="space-y-6">
          <Card className="border-none shadow-2xl bg-linear-to-br from-gray-900 to-black text-white rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Enterprise Console</CardTitle>
              <CardDescription className="text-white/40">Manage your business settings</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <Button className="w-full justify-between rounded-2xl bg-white/10 hover:bg-white/20 text-white border-none font-bold">
                Payout Settings <ChevronRight className="w-4 h-4 opacity-30" />
              </Button>
              <Button className="w-full justify-between rounded-2xl bg-white/10 hover:bg-white/20 text-white border-none font-bold">
                Tax Information <ChevronRight className="w-4 h-4 opacity-30" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-primary" /> Active Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="p-8 text-center text-muted-foreground">
                 <p className="text-xs font-medium">New inquiries will appear here as soon as customers express interest in your listings.</p>
               </div>
            </CardContent>
            <CardFooter className="bg-muted px-6 py-3 border-t">
               <Button variant="link" size="sm" className="w-full font-bold text-primary">View Inquiry Center</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Editor Modal Overlay */}
      {(isAdding || editingItem) && (
        <VendorListingForm 
          type={user?.role === 'HOTEL_OWNER' ? 'HOTEL' : 'TRANSPORT'}
          item={editingItem}
          onClose={() => { setEditingItem(null); setIsAdding(false); }}
          onSuccess={fetchVendorData}
        />
      )}
    </div>
  );
}
