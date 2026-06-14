"use client";

import { useState, useEffect } from "react";
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
    countryId: item?.countryId || "",
    stateId: item?.stateId || "",
    destinationId: item?.destinationId || "",
  });

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [customCity, setCustomCity] = useState(item?.customCity || "");
  const [useCustomCity, setUseCustomCity] = useState(!!item?.customCity);

  // Load countries on mount
  useEffect(() => {
    if (type !== 'HOTEL') return;
    fetch(`${API_BASE}/destinations/countries`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCountries(Array.isArray(data) ? data : (data.countries || [])))
      .catch(() => {});
  }, [type]);

  // Load states when countryId changes
  useEffect(() => {
    if (type !== 'HOTEL' || !formData.countryId) { setStates([]); setCities([]); return; }
    fetch(`${API_BASE}/destinations/states?countryId=${formData.countryId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setStates(Array.isArray(data) ? data : (data.states || [])))
      .catch(() => {});
  }, [formData.countryId, type]);

  // Load cities when stateId changes
  useEffect(() => {
    if (type !== 'HOTEL' || !formData.stateId) { setCities([]); return; }
    fetch(`${API_BASE}/destinations?stateId=${formData.stateId}&limit=200`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCities(Array.isArray(data) ? data : (data.destinations || [])))
      .catch(() => {});
  }, [formData.stateId, type]);

  const handleCountryChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      countryId: val ? Number(val) : "",
      stateId: "",
      destinationId: "",
    }));
    setStates([]);
    setCities([]);
  };

  const handleStateChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      stateId: val ? Number(val) : "",
      destinationId: "",
    }));
    setCities([]);
  };

  const handleCityChange = (val: string) => {
    if (val === "__custom__") {
      setUseCustomCity(true);
      setFormData(prev => ({ ...prev, destinationId: "" }));
    } else {
      setFormData(prev => ({
        ...prev,
        destinationId: val ? Number(val) : "",
      }));
    }
  };

  const handleSave = async () => {
    if (type === 'HOTEL') {
      if (!formData.countryId) {
        toast.error("Please select a Country");
        return;
      }
      if (!formData.stateId) {
        toast.error("Please select a State / Region");
        return;
      }
      if (!useCustomCity && !formData.destinationId) {
        toast.error("Please select a City / Place");
        return;
      }
      if (useCustomCity && !customCity.trim()) {
        toast.error("Please enter your custom city name");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = type === 'HOTEL' ? '/api/vendor/hotels' : '/api/vendor/transport';
      const method = item?.id ? 'PATCH' : 'POST';
      const url = item?.id ? `${API_BASE}${endpoint}/${item.id}` : `${API_BASE}${endpoint}`;

      const payload: any = {
        ...formData,
      };

      if (type === 'HOTEL') {
        payload.countryId = formData.countryId ? Number(formData.countryId) : null;
        payload.stateId = formData.stateId ? Number(formData.stateId) : null;
        payload.destinationId = useCustomCity ? null : (formData.destinationId ? Number(formData.destinationId) : null);
        payload.customCity = useCustomCity && customCity.trim() ? customCity.trim() : null;
        
        if (useCustomCity) {
          payload.city = customCity.trim();
          const selectedStateObj = states.find(s => s.id === Number(formData.stateId));
          const selectedCountryObj = countries.find(c => c.id === Number(formData.countryId));
          payload.customStateName = selectedStateObj ? selectedStateObj.name : null;
          payload.customCountryName = selectedCountryObj ? selectedCountryObj.name : null;
        } else {
          const selectedCityObj = cities.find(c => c.id === Number(formData.destinationId));
          payload.city = selectedCityObj ? selectedCityObj.name : "";
        }
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
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
      const res = await fetch(`${API_BASE}/media/upload?folder=${folder}`, {
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

              {type === 'HOTEL' && (
                <div className="space-y-4 p-4 bg-muted/40 rounded-2xl border border-primary/5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Country Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Country *</label>
                      <select
                        value={formData.countryId || ""}
                        onChange={e => handleCountryChange(e.target.value)}
                        className="w-full border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-background h-12"
                      >
                        <option value="">-- Select Country --</option>
                        {countries.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* State Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">State / Region *</label>
                      <select
                        value={formData.stateId || ""}
                        onChange={e => handleStateChange(e.target.value)}
                        disabled={!formData.countryId || states.length === 0}
                        className="w-full border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-background disabled:opacity-50 h-12 text-ellipsis overflow-hidden"
                      >
                        <option value="">
                          {!formData.countryId ? "Select country first" : states.length === 0 ? "Loading states..." : "-- Select State --"}
                        </option>
                        {states.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* City Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">City / Place *</label>
                      {!useCustomCity ? (
                        <select
                          value={formData.destinationId || ""}
                          onChange={e => handleCityChange(e.target.value)}
                          disabled={!formData.stateId || cities.length === 0}
                          className="w-full border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-background disabled:opacity-50 h-12 text-ellipsis overflow-hidden"
                        >
                          <option value="">
                            {!formData.stateId ? "Select state first" : cities.length === 0 ? "Loading cities..." : "-- Select City --"}
                          </option>
                          {cities.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                          <option value="__custom__">✏️ City not listed</option>
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={customCity}
                            onChange={e => setCustomCity(e.target.value)}
                            placeholder="Enter city name"
                            className="flex-1 rounded-xl border-amber-300 h-12"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setUseCustomCity(false); setCustomCity(""); setFormData(prev => ({ ...prev, destinationId: "" })); }}
                            className="h-12 rounded-xl text-xs px-2 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            Existing
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
