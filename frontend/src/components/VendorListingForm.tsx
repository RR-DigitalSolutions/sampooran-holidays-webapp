"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, Save, Building2, Car, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { toast } from "sonner";

interface ListingFormProps {
  item?: any;
  type: 'HOTEL' | 'TRANSPORT';
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorListingForm({ item, type, onClose, onSuccess }: ListingFormProps) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    address: item?.address || "",
    starRating: item?.starRating || 3,
    type: item?.type || (type === 'HOTEL' ? 'Boutique Hotel' : 'SUV'),
    images: item?.images || [],
    amenities: item?.amenities || [],
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'HOTEL' ? '/api/vendor/hotels' : '/api/vendor/transport';
      const method = item?.id ? 'PATCH' : 'POST';
      const url = item?.id ? `${API_BASE}${endpoint}/${item.id}` : `${API_BASE}${endpoint}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          // If it's a new transport, it has slightly different fields in schema (ownerId is handled by backend)
        })
      });

      if (!res.ok) throw new Error("Failed to save listing");
      
      toast.success(item?.id ? "Content updated successfully" : "Listing submitted for approval");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append("file", file);

    // Vendor-uploaded images go to misc/ (staging area for admin review)
    const folder = "misc";

    toast.loading("Uploading image...", { id: "upload" });
    try {
      const res = await fetch(`${API_BASE}/api/media/upload?folder=${folder}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, data.url] }));
        toast.success("Image uploaded successfully", { id: "upload" });
      }
    } catch (err) {
      toast.error("Upload failed", { id: "upload" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-primary text-white p-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-serif flex items-center gap-3">
                {type === 'HOTEL' ? <Building2 /> : <Car />}
                {item?.id ? 'Edit Content' : 'Add New Listing'}
              </CardTitle>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close form"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Property Name</label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Grand Himalayan Resort"
                    className="rounded-xl border-primary/10 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Category / Type</label>
                  <Input 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    placeholder={type === 'HOTEL' ? 'Resort, Boutique...' : 'Innova, Tempo...'}
                    className="rounded-xl border-primary/10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Detailed Description</label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Tell customers about your unique value proposition..."
                  className="rounded-xl border-primary/10 min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Location Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Full postal address"
                    className="rounded-xl border-primary/10 h-12 pl-12"
                  />
                </div>
              </div>

              {/* Image Manager */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Gallery (Images)</label>
                <div className="grid grid-cols-4 gap-3">
                  {formData.images.map((img: string, i: number) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                      <img src={img} className="w-full h-full object-cover" alt={`Listing image ${i + 1}`} />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_: any, idx: number) => idx !== i) }))}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                        aria-label={`Remove image ${i + 1}`}
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
                    <Upload className="w-5 h-5 text-primary mb-1" />
                    <span className="text-[9px] font-bold uppercase">Upload</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-8 bg-muted/50 border-t flex gap-4">
             <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={onClose}>
               Discard Changes
             </Button>
             <Button 
               className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90"
               onClick={handleSave}
               disabled={loading}
             >
               {loading ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
               Save & Update
             </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
