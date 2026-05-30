import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  Plus, Trash2, Edit3, Save, Layers, Image as ImageIcon, 
  Grid, MoveUp, MoveDown, Check, X, AlertCircle, 
  ChevronRight, ArrowRight, Eye, Palette, Upload, Link as LinkIcon, File, Percent, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/utils/api-url";

const API_URL = getApiUrl();

interface Slide {
  id?: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl?: string;
  tag?: string;
  ctaText?: string;
  ctaLink?: string;
  displayOrder: number;
  isActive: boolean;
}

interface Category {
  id?: number;
  label: string;
  slug?: string;
  description?: string;
  content?: string;
  iconName?: string;
  imageUrl?: string;
  href: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

interface Offer {
  id?: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  termsAndConditions?: string;
  displayOrder: number;
  isActive: boolean;
}

interface Section {
  id: number;
  sectionType: string;
  title?: string;
  subtitle?: string;
  displayOrder: number;
  isActive: boolean;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function HomePageManager() {
  const [activeTab, setActiveTab] = useState<"slides" | "themes" | "offers" | "ads" | "sections">("slides");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const smallAds = offers.filter(o => o.category === "SPONSORED_SMALL");
  const bannerAds = offers.filter(o => o.category === "SPONSORED_BANNER");
  
  // Modal states
  const [editingTheme, setEditingTheme] = useState<Category | null>(null);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [imageSource, setImageSource] = useState<"link" | "upload">("link");
  const [activeModalTab, setActiveModalTab] = useState<"General" | "Content" | "SEO">("General");
  const [uploading, setUploading] = useState(false);

  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/ota/home/config`);
      const data = await res.json();
      
      // Normalize slides
      const normalizedSlides = (data.slides || []).map((s: any) => ({
        ...s,
        imageUrl: s.imageUrl || s.image_url,
        ctaText: s.ctaText || s.cta_text,
        ctaLink: s.ctaLink || s.cta_link
      }));
      setSlides(normalizedSlides);

      // Normalize snake_case to camelCase
      const normalizedCats = (data.categories || []).map((c: any) => ({
        ...c,
        imageUrl: c.imageUrl || c.image_url,
        metaTitle: c.metaTitle || c.meta_title,
        metaDescription: c.metaDescription || c.meta_description,
        metaKeywords: c.metaKeywords || c.meta_keywords
      }));
      setCategories(normalizedCats);
      setSections(data.sections || []);
      setOffers(data.offers || []);
    } catch (err) {
      console.error("Failed to fetch home config", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const token = JSON.parse(localStorage.getItem("sh_admin_token") || "{}")?.token;

      // Determine the correct Cloudinary subfolder based on the active modal context
      let folder = "misc";
      if (editingSlide) {
        folder = "hero_slides";
      } else if (editingTheme) {
        folder = "themes";
      } else if (editingOffer) {
        // Sponsored banner ads go to their own subfolder; regular offers go to offers/
        folder = editingOffer.category === "SPONSORED_BANNER" ? "sponsored_ads" : "offers";
      }

      const res = await fetch(`${API_URL}/media/upload?folder=${folder}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (editingTheme) {
          setEditingTheme({ ...editingTheme, imageUrl: data.url });
        } else if (editingSlide) {
          setEditingSlide({ ...editingSlide, imageUrl: data.url });
        } else if (editingOffer) {
          setEditingOffer({ ...editingOffer, imageUrl: data.url });
        }
        addToast('success', `Image uploaded to ${data.folder?.split('/').slice(1).join('/')} ✓`);
      } else {
        addToast('error', "Upload failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error", err);
      addToast('error', "A network error occurred during upload");
    } finally {
      setUploading(false);
    }
  };


  const handleSaveSlide = async (slide: Slide) => {
    try {
      setSaving(true);
      const method = slide.id ? "PATCH" : "POST";
      const url = slide.id ? `${API_URL}/admin/home/slides/${slide.id}` : `${API_URL}/admin/home/slides`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token}`
        },
        body: JSON.stringify(slide)
      });
      
      if (res.ok) {
        addToast('success', slide.id ? 'Slide updated successfully!' : 'Slide created successfully!');
        setEditingSlide(null);
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast('error', "Failed to save slide: " + (errData.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save slide failed", err);
      addToast('error', 'A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    try {
      await fetch(`${API_URL}/admin/home/slides/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token}` }
      });
      fetchData();
    } catch (err) {
      console.error("Delete slide failed", err);
    }
  };

  const handleSaveTheme = async (cat: Category) => {
    if (!cat.label) {
      addToast('error', 'Please enter a theme label');
      return;
    }
    try {
      setSaving(true);
      const method = cat.id ? "PATCH" : "POST";
      const url = cat.id ? `${API_URL}/admin/home/categories/${cat.id}` : `${API_URL}/admin/home/categories`;
      
      const token = JSON.parse(localStorage.getItem("sh_admin_token") || "{}")?.token;
      if (!token) {
        addToast('error', 'Session expired. Please login again.');
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(cat)
      });
      
      if (res.ok) {
        addToast('success', cat.id ? 'Theme updated successfully!' : 'Theme created successfully!');
        setEditingTheme(null);
        fetchData();
      } else {
        const errData = await res.json();
        addToast('error', `Save failed: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save theme failed", err);
      addToast('error', 'A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTheme = async (id: number) => {
    if (!confirm("Are you sure you want to delete this theme?")) return;
    try {
      await fetch(`${API_URL}/admin/home/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token}` }
      });
      fetchData();
    } catch (err) {
      console.error("Delete theme failed", err);
    }
  };

  const handleUpdateSection = async (section: Section) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/admin/home/sections/${section.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token}`
        },
        body: JSON.stringify(section)
      });
      
      if (res.ok) {
        addToast('success', 'Section configuration saved!');
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast('error', "Failed to update section: " + (errData.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Update section failed", err);
      addToast('error', 'A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOffer = async (offer: Offer) => {
    try {
      setSaving(true);
      const method = offer.id ? "PATCH" : "POST";
      const url = offer.id ? `${API_URL}/admin/home/offers/${offer.id}` : `${API_URL}/admin/home/offers`;
      
      const tokenData = JSON.parse(localStorage.getItem("sh_admin_token") || "{}");
      const token = tokenData?.token;
      
      if (!token) {
        addToast('error', 'Session expired. Please login again.');
        window.location.href = "/login";
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(offer)
      });

      if (res.ok) {
        addToast('success', offer.id ? '✓ Offer updated successfully!' : '✓ Offer created successfully!');
        setEditingOffer(null);
        await fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Save offer failed server-side", errData);
        addToast('error', `Failed: ${errData.error || "Server error occurred"}`);
      }
    } catch (err) {
      console.error("Save offer failed", err);
      addToast('error', 'A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/home/offers/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token}` }
      });
      if (res.ok) {
        addToast('success', 'Offer deleted.');
      }
      fetchData();
    } catch (err) {
      console.error("Delete offer failed", err);
      addToast('error', 'Failed to delete offer.');
    }
  };

  if (loading) return (
    <AdminLayout title="Home Page Manager">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Home Page Manager" subtitle="Manage Hero slides, themes and section layout">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right-8 fade-in duration-300 ${
              toast.type === 'success' ? 'bg-green-500 text-white shadow-green-200' :
              toast.type === 'error' ? 'bg-red-500 text-white shadow-red-200' :
              'bg-primary text-white'
            }`}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
            {toast.message}
          </div>
        ))}
      </div>
      <div className="space-y-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
        
        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit">
          {[
            { id: "slides", label: "Hero Slides", icon: ImageIcon },
            { id: "themes", label: "Travel Themes", icon: Grid },
            { id: "offers", label: "Promotional Offers", icon: Percent },
            { id: "ads", label: "Sponsored Ads", icon: Tag },
            { id: "sections", label: "Sections Layout", icon: Layers }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? "bg-primary text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
          
          {activeTab === "slides" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-primary">Hero Carousel Slides</h3>
                <button 
                  onClick={() => handleSaveSlide({ title: "New Slide", subtitle: "", imageUrl: "", displayOrder: slides.length + 1, isActive: true })}
                  className="bg-accent text-accent-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-accent/90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Slide
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map(slide => (
                  <div key={slide.id} className="group border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-50/50">
                    <div className="relative h-40 bg-gray-200">
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon className="w-12 h-12" /></div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingSlide(slide)}
                          className="bg-white p-2 rounded-full shadow-lg text-primary hover:text-accent transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSlide(slide.id!)} className="bg-white p-2 rounded-full shadow-lg text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                        Order #{slide.displayOrder}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-primary truncate">{slide.title}</h4>
                        <span className={`w-2 h-2 rounded-full ${slide.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{slide.subtitle || "No subtitle"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "themes" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary leading-none">Travel Themes</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total {categories.length} Active Themes</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setEditingTheme({ 
                      label: "", 
                      slug: "",
                      description: "",
                      content: "",
                      href: "/themes/", 
                      displayOrder: categories.length + 1, 
                      isActive: true,
                      metaTitle: "",
                      metaDescription: "",
                      metaKeywords: ""
                    });
                    setActiveModalTab("General");
                    setImageSource("link");
                  }}
                  className="bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-accent/20"
                >
                  <Plus className="w-4 h-4" /> Add New Theme
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-50">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-6 py-4">Theme Image</th>
                      <th className="px-6 py-4">Title & SEO Slug</th>
                      <th className="px-6 py-4">Sort Order</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categories.map(cat => (
                      <tr key={cat.id} className="hover:bg-gray-50/80 transition-all group">
                        <td className="px-6 py-4">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md ${!cat.imageUrl ? (cat.color || "bg-slate-100 text-slate-400") : ""}`}>
                             {cat.imageUrl ? (
                               <img src={cat.imageUrl} className="w-full h-full object-cover" alt="" />
                             ) : (
                               <ImageIcon className="w-6 h-6" />
                             )}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <p className="font-bold text-primary text-sm">{cat.label}</p>
                           <p className="text-[10px] text-accent font-mono mt-0.5">/{cat.slug || cat.label.toLowerCase().replace(/\s+/g, '-')}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <span className="font-black text-accent text-lg">#{cat.displayOrder}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {cat.isActive ? "ACTIVE" : "HIDDEN"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTheme(cat);
                                setActiveModalTab("General");
                                // Show upload tab if imageUrl looks like a cloudinary URL, otherwise link
                                setImageSource(cat.imageUrl && (cat.imageUrl.includes("cloudinary") || cat.imageUrl.includes("res.cloudinary")) ? "upload" : "link");
                              }} 
                              className="p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-primary transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTheme(cat.id!)} className="p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-red-500 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "offers" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary leading-none">Promotional Offers</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage platform-wide deals & coupons</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingOffer({ 
                    title: "", 
                    description: "", 
                    category: "ALL", 
                    imageUrl: "", 
                    ctaText: "BOOK NOW", 
                    ctaLink: "/", 
                    displayOrder: offers.length + 1, 
                    isActive: true 
                  })}
                  className="bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-accent/20"
                >
                  <Plus className="w-4 h-4" /> New Offer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {offers.map(offer => (
                  <div key={offer.id} className="group border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 bg-white flex h-36">
                    <div className="relative w-36 h-full bg-slate-100 shrink-0 border-r border-slate-50">
                      {offer.imageUrl ? (
                        <img src={offer.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300"><ImageIcon className="w-8 h-8" /></div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-[8px] font-black px-2.5 py-1 rounded-lg text-primary uppercase tracking-widest border border-slate-100 shadow-sm">
                        {offer.category}
                      </div>
                    </div>
                    <div className="p-5 flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-primary truncate text-sm tracking-tight uppercase">{offer.title}</h4>
                          <span className={cn("w-2 h-2 rounded-full", offer.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-300")} />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">{offer.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                           <span className="w-1 h-1 rounded-full bg-accent" />
                           <span className="font-black text-accent text-[10px] tracking-widest uppercase">Order {offer.displayOrder}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <button 
                            onClick={() => setEditingOffer(offer)}
                            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 transition-all border border-slate-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteOffer(offer.id!)}
                            className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary leading-none">Sponsored Banner Ads</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Wide Carousel Banners · Displayed on Homepage</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingOffer({ 
                    title: "", description: "", category: "SPONSORED_BANNER", 
                    imageUrl: "", ctaText: "Explore Now", ctaLink: "/", 
                    displayOrder: bannerAds.length + 1, isActive: true 
                  })}
                  className="bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
                >
                  <Plus className="w-4 h-4" /> Add Banner Ad
                </button>
              </div>

              {/* Info bar */}
              <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black">i</span>
                </div>
                <div>
                  <p className="text-blue-800 text-xs font-bold">How Banner Ads Work</p>
                  <p className="text-blue-600 text-[11px] mt-0.5">Each banner is displayed one at a time in a wide auto-sliding carousel on the homepage. Add multiple banners — they will loop automatically every 5 seconds. Use a <strong>wide landscape image</strong> (recommended: 1600×280px or 6:1 ratio) for best results.</p>
                </div>
              </div>

              {/* Banner Ads Grid */}
              <div className="space-y-5">
                {bannerAds.map((ad, idx) => (
                  <div key={ad.id} className="relative rounded-2xl overflow-hidden border border-slate-200 group shadow-sm hover:shadow-xl transition-all">
                    {/* Preview */}
                    <div className="relative aspect-[6/1] bg-slate-800">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} className="w-full h-full object-cover opacity-90" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm italic">No image set</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-10 text-white">
                        {ad.termsAndConditions && (
                          <span className="inline-block bg-accent text-accent-foreground text-[9px] font-black px-2 py-0.5 rounded-full mb-2 w-max tracking-widest uppercase">{ad.termsAndConditions}</span>
                        )}
                        <h5 className="text-lg md:text-2xl font-black leading-tight">{ad.title || "Untitled Banner"}</h5>
                        <p className="text-xs opacity-70 max-w-sm line-clamp-1 mt-1">{ad.description}</p>
                      </div>
                      {/* Slide number badge */}
                      <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-black px-2.5 py-1 rounded-lg tracking-widest">
                        SLIDE {idx + 1}
                      </div>
                      {/* Actions */}
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingOffer(ad)} className="bg-white p-2 rounded-xl text-primary shadow-lg hover:bg-primary hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteOffer(ad.id!)} className="bg-white p-2 rounded-xl text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {/* Meta row */}
                    <div className="bg-white px-6 py-3 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                      <span className="font-bold text-primary truncate max-w-xs">{ad.title || "—"}</span>
                      <span className="text-slate-300">|</span>
                      <span>CTA: <strong className="text-slate-700">{ad.ctaText || "Explore Now"}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Link: <strong className="text-slate-700 font-mono truncate max-w-[120px] inline-block">{ad.ctaLink || "/"}</strong></span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${ad.isActive ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                        {ad.isActive ? "LIVE" : "HIDDEN"}
                      </span>
                    </div>
                  </div>
                ))}
                {bannerAds.length === 0 && (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Tag className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">No banner ads yet</p>
                    <p className="text-slate-300 text-xs mt-1">Click "Add Banner Ad" to create your first sponsored carousel slide.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "sections" && (
            <div className="p-6">
              <div className="mb-8">
                <h3 className="font-bold text-xl text-primary mb-1">Landing Page Architecture</h3>
                <p className="text-sm text-gray-400">Control the visual flow and component hierarchy of your website.</p>
              </div>
              
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={section.id} className="p-6 rounded-[2.5rem] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-2xl transition-all group">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex flex-col gap-1">
                         <button 
                          disabled={index === 0}
                          onClick={() => handleUpdateSection({ ...section, displayOrder: section.displayOrder - 1.5 })}
                          className="text-gray-300 hover:text-primary disabled:opacity-10 transition-all p-1"
                         ><MoveUp className="w-4 h-4" /></button>
                         <button 
                          disabled={index === sections.length - 1}
                          onClick={() => handleUpdateSection({ ...section, displayOrder: section.displayOrder + 1.5 })}
                          className="text-gray-300 hover:text-primary disabled:opacity-10 transition-all p-1"
                         ><MoveDown className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center font-black text-primary shadow-sm text-lg">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-primary tracking-tight uppercase text-xs">{section.sectionType.replace(/_/g, ' ')}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${section.isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {section.isActive ? "LIVE" : "DRAFT"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <button 
                          onClick={() => handleUpdateSection({ ...section, isActive: !section.isActive })}
                          className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition-all ${section.isActive ? "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600" : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"}`}
                         >
                           {section.isActive ? "Disable" : "Publish"}
                         </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-20">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Display Title</label>
                          <input 
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                            value={section.title || ""}
                            placeholder="Enter section title..."
                            onChange={(e) => {
                              const newSections = [...sections];
                              newSections[index].title = e.target.value;
                              setSections(newSections);
                            }}
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Sub-heading / Tagline</label>
                          <input 
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                            value={section.subtitle || ""}
                            placeholder="Enter section subtitle..."
                            onChange={(e) => {
                              const newSections = [...sections];
                              newSections[index].subtitle = e.target.value;
                              setSections(newSections);
                            }}
                          />
                       </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end ml-20">
                       <button 
                         onClick={() => handleUpdateSection(section)}
                         className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:text-primary transition-all"
                       >
                         <Save className="w-3.5 h-3.5" /> Save Section Config
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Theme Edit Modal */}
          {editingTheme && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
               <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20 my-8">
                  <div className="p-10 pb-6 flex justify-between items-start bg-slate-50/50">
                     <div>
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Palette className="w-5 h-5" />
                         </div>
                         <h3 className="text-3xl font-black text-primary tracking-tight uppercase">{editingTheme.id ? "Edit Theme" : "Create Theme"}</h3>
                       </div>
                       <p className="text-sm text-gray-400 font-medium">Configure travel categories and SEO landing pages</p>
                     </div>
                     <button onClick={() => setEditingTheme(null)} className="bg-white p-3 rounded-2xl text-gray-400 hover:text-primary hover:shadow-xl transition-all border border-gray-100"><X className="w-5 h-5" /></button>
                  </div>

                  {/* Tabs within Modal */}
                  <div className="px-10 py-4 border-b border-gray-100 flex gap-8">
                     {["General", "Content", "SEO"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveModalTab(tab as any)} // Using a temporary global for simple tab state in this refactor
                          className={cn(
                            "text-xs font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-all",
                            activeModalTab === tab
                              ? "text-accent border-accent" 
                              : "text-gray-400 border-transparent hover:text-gray-600"
                          )}
                        >
                          {tab}
                        </button>
                     ))}
                  </div>
                  
                  <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                     {/* General Tab */}
                     {(activeModalTab === "General") && (
                       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Display Label</label>
                                <input 
                                   className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
                                   value={editingTheme.label}
                                   onChange={(e) => setEditingTheme({...editingTheme, label: e.target.value})}
                                   placeholder="e.g. Adventure & Fun"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">URL Slug</label>
                                <input 
                                   className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-accent font-mono focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
                                   value={editingTheme.slug || ""}
                                   onChange={(e) => setEditingTheme({...editingTheme, slug: e.target.value})}
                                   placeholder="adventure-tours"
                                />
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cover Image</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                   <button 
                                     onClick={() => setImageSource("upload")}
                                     className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", imageSource === "upload" ? "bg-white text-primary shadow-sm" : "text-gray-400")}
                                   >Upload</button>
                                   <button 
                                     onClick={() => setImageSource("link")}
                                     className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", imageSource === "link" ? "bg-white text-primary shadow-sm" : "text-gray-400")}
                                   >Link</button>
                                </div>
                             </div>

                             {imageSource === "upload" ? (
                               <div className="relative group">
                                 <input 
                                   type="file" 
                                   id="theme-upload" 
                                   className="hidden" 
                                   accept="image/*"
                                   onChange={handleImageUpload}
                                 />
                                 <label 
                                   htmlFor="theme-upload"
                                   className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 hover:bg-white hover:border-accent cursor-pointer transition-all group"
                                 >
                                    {uploading ? (
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
                                    ) : editingTheme.imageUrl ? (
                                      <div className="flex items-center gap-3">
                                         <img src={editingTheme.imageUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                         <div className="text-left">
                                            <p className="text-xs font-bold text-primary">Image Uploaded</p>
                                            <p className="text-[10px] text-accent font-black uppercase tracking-widest">Click to Change</p>
                                         </div>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="w-8 h-8 text-slate-300 group-hover:text-accent mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drag & Drop or Click to Upload</p>
                                      </>
                                    )}
                                 </label>
                               </div>
                             ) : (
                               <div className="relative">
                                  <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                  <input 
                                     className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-12 pr-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all font-mono"
                                     value={editingTheme.imageUrl || ""}
                                     onChange={(e) => setEditingTheme({...editingTheme, imageUrl: e.target.value})}
                                     placeholder="https://images.unsplash.com/..."
                                  />
                               </div>
                             )}
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Display Order</label>
                                <input 
                                   type="number"
                                   className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                                   value={editingTheme.displayOrder}
                                   onChange={(e) => setEditingTheme({...editingTheme, displayOrder: parseInt(e.target.value)})}
                                />
                             </div>
                             <div className="flex items-end pb-1 px-1">
                                <button 
                                  onClick={() => setEditingTheme({...editingTheme, isActive: !editingTheme.isActive})}
                                  className={cn(
                                    "flex items-center gap-2 px-6 py-4 rounded-[1.5rem] text-[10px] font-black tracking-[0.2em] uppercase transition-all w-full justify-center",
                                    editingTheme.isActive ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-slate-100 text-slate-400"
                                  )}
                                >
                                  {editingTheme.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                  {editingTheme.isActive ? "Published" : "Draft Mode"}
                                </button>
                             </div>
                          </div>
                       </div>
                     )}

                     {/* Content Tab */}
                     {activeModalTab === "Content" && (
                       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Short Summary (SEO Snippet)</label>
                             <textarea 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all min-h-[100px]"
                                value={editingTheme.description || ""}
                                onChange={(e) => setEditingTheme({...editingTheme, description: e.target.value})}
                                placeholder="A brief overview of this theme for listing pages..."
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Main Page Content (AIO/AEO Data)</label>
                             <textarea 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all min-h-[200px] font-medium"
                                value={editingTheme.content || ""}
                                onChange={(e) => setEditingTheme({...editingTheme, content: e.target.value})}
                                placeholder="Detailed information, highlights, and travel tips for this theme..."
                             />
                          </div>
                          <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex items-start gap-4">
                             <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                             <div>
                                <p className="text-xs font-black text-orange-700 uppercase tracking-widest mb-1">Professional Pro-Tip</p>
                                <p className="text-[11px] text-orange-600/80 leading-relaxed font-medium">
                                   Detailed content helps search engines understand your theme better. Use relevant keywords naturally in the description and main content areas to improve visibility.
                                </p>
                             </div>
                          </div>
                       </div>
                     )}

                     {/* SEO Tab */}
                     {activeModalTab === "SEO" && (
                       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Meta Browser Title</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                                value={editingTheme.metaTitle || ""}
                                onChange={(e) => setEditingTheme({...editingTheme, metaTitle: e.target.value})}
                                placeholder="e.g. Best Adventure Tours in India | Sampooran Holidays"
                             />
                             <p className="text-[9px] text-gray-400 px-1 italic">Recommended length: 50-60 characters</p>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Meta Description</label>
                             <textarea 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all min-h-[100px]"
                                value={editingTheme.metaDescription || ""}
                                onChange={(e) => setEditingTheme({...editingTheme, metaDescription: e.target.value})}
                                placeholder="Enter a compelling description for search results..."
                             />
                             <p className="text-[9px] text-gray-400 px-1 italic">Recommended length: 150-160 characters</p>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Meta Keywords</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                                value={editingTheme.metaKeywords || ""}
                                onChange={(e) => setEditingTheme({...editingTheme, metaKeywords: e.target.value})}
                                placeholder="adventure, trekking, river rafting, bungee jumping"
                             />
                          </div>
                       </div>
                     )}
                  </div>

                  <div className="p-10 bg-slate-50 border-t border-gray-100 flex gap-6">
                     <button onClick={() => setEditingTheme(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-all">Cancel Changes</button>
                     <button 
                       onClick={() => handleSaveTheme(editingTheme)}
                       disabled={saving}
                       className="flex-[2] bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                     >
                       {saving ? "Saving Data..." : editingTheme.id ? "Update Theme" : "Create Theme"} 
                       {!saving && <Check className="w-4 h-4" />}
                     </button>
                  </div>
               </div>
            </div>
          )}

          {/* Slide Edit Modal */}
          {editingSlide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
                  <div className="p-8 pb-0 flex justify-between items-start">
                     <div>
                       <h3 className="text-2xl font-black text-primary tracking-tight">{editingSlide.id ? "Edit Hero Slide" : "Create New Slide"}</h3>
                       <p className="text-sm text-gray-400 mt-1 font-medium">Manage main landing page carousel content</p>
                     </div>
                     <button onClick={() => setEditingSlide(null)} className="bg-gray-50 p-3 rounded-2xl text-gray-400 hover:text-primary hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="p-8 space-y-5">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Slide Title</label>
                        <input 
                           className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                           value={editingSlide.title}
                           onChange={(e) => setEditingSlide({...editingSlide, title: e.target.value})}
                           placeholder="e.g. Discover Manali"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Slide Subtitle</label>
                        <textarea 
                           className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                           value={editingSlide.subtitle}
                           onChange={(e) => setEditingSlide({...editingSlide, subtitle: e.target.value})}
                           placeholder="Enter short description..."
                           rows={2}
                        />
                     </div>

                     {/* ── Hero Image: upload or paste URL ───────────── */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hero Background Image *</label>

                        {/* Live preview */}
                        {editingSlide.imageUrl && (
                          <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                            <img
                              src={editingSlide.imageUrl}
                              alt="Slide preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <button
                              type="button"
                              onClick={() => setEditingSlide({ ...editingSlide, imageUrl: '' })}
                              className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors"
                              title="Clear image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Preview</span>
                          </div>
                        )}

                        {/* URL input + Upload button */}
                        <div className="flex gap-2">
                          <input
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold text-primary focus:outline-none focus:border-accent transition-all font-mono"
                            value={editingSlide.imageUrl}
                            onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                            placeholder="Paste URL  or  click Upload Image →"
                          />
                          <label
                            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all select-none ${
                              uploading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                            }`}
                          >
                            {uploading ? (
                              <>
                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Uploading…
                              </>
                            ) : (
                              <><Upload className="w-3.5 h-3.5" /> Upload Image</>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp,image/avif"
                              disabled={uploading}
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>
                        <p className="text-[9px] text-gray-400 px-1">
                          Recommended: 1920×1080 px · JPG/PNG/WebP · max 10 MB · saved to <code className="bg-gray-100 px-1 rounded">hero_slides/</code>
                        </p>
                     </div>

                     {/* ── Background Video (optional) ────────────────── */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          Background Video URL
                          <span className="ml-2 font-normal normal-case tracking-normal text-gray-300">(optional — overrides image when set)</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold text-primary focus:outline-none focus:border-accent transition-all font-mono"
                            value={editingSlide.videoUrl || ''}
                            onChange={(e) => setEditingSlide({ ...editingSlide, videoUrl: e.target.value })}
                            placeholder="https://res.cloudinary.com/.../video.mp4"
                          />
                          {editingSlide.videoUrl && (
                            <button
                              type="button"
                              onClick={() => setEditingSlide({ ...editingSlide, videoUrl: '' })}
                              className="px-4 py-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-2xl transition-all"
                              title="Clear video URL"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 px-1">Paste a Cloudinary or direct MP4 URL · keep under 10 MB for fast loading.</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">CTA Button Text</label>
                           <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                              value={editingSlide.ctaText || ""}
                              onChange={(e) => setEditingSlide({...editingSlide, ctaText: e.target.value})}
                              placeholder="e.g. Explore Now"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">CTA Button Link</label>
                           <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all font-mono"
                              value={editingSlide.ctaLink || ""}
                              onChange={(e) => setEditingSlide({...editingSlide, ctaLink: e.target.value})}
                              placeholder="/packages"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tag / Badge</label>
                           <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                              value={editingSlide.tag || ""}
                              onChange={(e) => setEditingSlide({...editingSlide, tag: e.target.value})}
                              placeholder="e.g. TRENDING"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Display Order</label>
                           <input 
                              type="number"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                              value={editingSlide.displayOrder}
                              onChange={(e) => setEditingSlide({...editingSlide, displayOrder: parseInt(e.target.value)})}
                           />
                        </div>
                     </div>

                     <div className="flex items-center gap-3 pt-2">
                        <button 
                          onClick={() => setEditingSlide({...editingSlide, isActive: !editingSlide.isActive})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${editingSlide.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          {editingSlide.isActive ? "Slide Visible" : "Slide Hidden"}
                        </button>
                     </div>
                  </div>

                  <div className="p-8 bg-gray-50 flex gap-4">
                     <button onClick={() => setEditingSlide(null)} className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all">Cancel</button>
                     <button 
                       onClick={() => {
                         handleSaveSlide(editingSlide);
                         setEditingSlide(null);
                       }}
                       disabled={saving}
                       className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                     >
                       {saving ? "Saving..." : editingSlide.id ? "Update Slide" : "Create Slide"} <Check className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
          )}
          {editingOffer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => setEditingOffer(null)} />
               <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in duration-500 border border-slate-100">
                  <div className="p-10 pb-6 flex justify-between items-center bg-slate-50/50">
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                              <Percent className="w-5 h-5" />
                           </div>
                           <h2 className="text-3xl font-black text-primary tracking-tight uppercase">
                             {editingOffer.id ? "Edit Offer" : "New Promotion"}
                           </h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Configure your marketing deal & platform-wide discounts</p>
                     </div>
                     <button onClick={() => setEditingOffer(null)} className="bg-white p-3 rounded-2xl text-gray-400 hover:text-primary hover:shadow-xl transition-all border border-gray-100"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="p-10 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Offer Title</label>
                            <input 
                              className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
                              value={editingOffer.title}
                              onChange={(e) => setEditingOffer({...editingOffer, title: e.target.value})}
                              placeholder="e.g. Summer Vacation Sale"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Target Category</label>
                            <div className="relative">
                              <select 
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all appearance-none"
                                value={editingOffer.category}
                                onChange={(e) => setEditingOffer({...editingOffer, category: e.target.value})}
                              >
                                <option value="ALL">All Offers</option>
                                <option value="HOTELS">Hotels</option>
                                <option value="FLIGHTS">Flights</option>
                                <option value="HOLIDAYS">Holidays</option>
                                <option value="TRAINS">Trains</option>
                                <option value="CABS">Cabs</option>
                                <option value="BANK">Bank Offers</option>
                                <option value="SPONSORED_BANNER">Sponsored Ad (Banner)</option>
                              </select>
                              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Offer Description</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                            value={editingOffer.description}
                            onChange={(e) => setEditingOffer({...editingOffer, description: e.target.value})}
                            placeholder="Briefly describe the offer..."
                            rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                             <div className="flex items-center justify-between px-1 mb-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Offer Image</label>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                  <button type="button" onClick={() => setImageSource("link")} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${imageSource === "link" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}>Link</button>
                                  <button type="button" onClick={() => setImageSource("upload")} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${imageSource === "upload" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}>Upload</button>
                                </div>
                             </div>
                             {imageSource === "upload" ? (
                                <div className="relative group">
                                   <input type="file" id="offer-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                   <label htmlFor="offer-upload" className="flex flex-col items-center justify-center w-full bg-slate-50 border border-slate-100 border-dashed rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-400 hover:bg-white hover:border-accent transition-all cursor-pointer">
                                     {uploading ? (
                                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent" />
                                     ) : editingOffer.imageUrl ? (
                                       <div className="flex items-center gap-3">
                                          <img src={editingOffer.imageUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                          <span className="text-[10px] font-black uppercase tracking-widest text-accent">Change Image</span>
                                       </div>
                                     ) : (
                                       <div className="flex items-center gap-2">
                                         <Upload className="w-4 h-4" />
                                         <span className="text-[10px] font-black uppercase tracking-widest">Upload Image</span>
                                       </div>
                                     )}
                                   </label>
                                </div>
                             ) : (
                                <div className="relative">
                                   <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                   <input 
                                     className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-12 pr-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all font-mono"
                                     value={editingOffer.imageUrl}
                                     onChange={(e) => setEditingOffer({...editingOffer, imageUrl: e.target.value})}
                                     placeholder="https://..."
                                   />
                                </div>
                             )}
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Display Order</label>
                             <input 
                               type="number"
                               className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                               value={editingOffer.displayOrder}
                               onChange={(e) => setEditingOffer({...editingOffer, displayOrder: parseInt(e.target.value)})}
                             />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">CTA Button Text</label>
                             <input 
                               className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                               value={editingOffer.ctaText}
                               onChange={(e) => setEditingOffer({...editingOffer, ctaText: e.target.value})}
                               placeholder="e.g. BOOK NOW"
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">CTA Redirect Link</label>
                             <input 
                               className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all font-mono"
                               value={editingOffer.ctaLink}
                               onChange={(e) => setEditingOffer({...editingOffer, ctaLink: e.target.value})}
                               placeholder="/"
                             />
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Promotion Badge (Tag)</label>
                        <input 
                          className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all"
                          value={editingOffer.termsAndConditions || ""}
                          onChange={(e) => setEditingOffer({...editingOffer, termsAndConditions: e.target.value})}
                          placeholder="e.g. LIMITED OFFER"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                         <button 
                           onClick={() => setEditingOffer({...editingOffer, isActive: !editingOffer.isActive})}
                           className={cn(
                             "px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2",
                             editingOffer.isActive ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-slate-100 text-slate-400"
                           )}
                         >
                           {editingOffer.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                           {editingOffer.isActive ? "Offer Active" : "Offer Hidden"}
                         </button>
                       </div>
                  </div>

                  <div className="p-10 bg-slate-50 border-t border-gray-100 flex gap-6">
                      <button onClick={() => setEditingOffer(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-all">Cancel</button>
                      <button 
                        onClick={() => handleSaveOffer(editingOffer)}
                        disabled={saving}
                        className="flex-[2] bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {saving ? "Saving Data..." : editingOffer.id ? "Update Offer" : "Create Offer"} 
                      </button>
                   </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
