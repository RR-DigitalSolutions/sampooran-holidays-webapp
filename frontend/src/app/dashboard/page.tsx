"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { 
  User, Mail, Phone, Ticket, MapPin, 
  History, Heart, Settings, Briefcase, 
  ChevronRight, ChevronDown, Award, Users, Share2,
  Copy, CheckCircle2, Building2, Car
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import VendorDashboard from "@/components/VendorDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const isVendor = user?.role === 'HOTEL_OWNER' || user?.role === 'TRANSPORTER';

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif">Please log in to view your dashboard</h2>
      </div>
    );
  }

  const copyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast.success("Referral code copied!");
  };

  const getBadgeColor = (badge: string) => {
    switch (badge?.toUpperCase()) {
      case 'BRONZE': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'SILVER': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'GOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PLATINUM': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="bg-linear-to-b from-secondary/20 to-background min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-inner ${isVendor ? 'bg-primary text-white border-primary/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
              {isVendor ? (user.role === 'HOTEL_OWNER' ? <Building2 className="w-10 h-10" /> : <Car className="w-10 h-10" />) : <User className="w-10 h-10" />}
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-serif tracking-tight">{user.name}</h1>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${getBadgeColor(isVendor ? user.role : (user.badge || 'New Member'))}`}>
                  {isVendor ? user.role?.replace('_', ' ') : (user.badge || 'Explorer')}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl font-bold">
              <Settings className="w-4 h-4 mr-2" />
              {isVendor ? 'Business Settings' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {isVendor ? (
          <VendorDashboard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Stats Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
                   <CardHeader className="pb-2">
                     <CardDescription className="flex items-center gap-2">
                       <Ticket className="w-4 h-4 text-accent" /> Available Points
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <p className="text-3xl font-bold font-serif">₹{user.pointsBalance.toLocaleString()}</p>
                     <p className="text-xs text-muted-foreground mt-1 text-green-600 font-medium">+₹1,000 signup bonus added</p>
                   </CardContent>
                 </Card>
                 <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
                   <CardHeader className="pb-2">
                     <CardDescription className="flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-primary" /> Trips Completed
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <p className="text-3xl font-bold font-serif">0</p>
                     <p className="text-xs text-muted-foreground mt-1">Start your journey today!</p>
                   </CardContent>
                 </Card>
                 <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
                   <CardHeader className="pb-2">
                     <CardDescription className="flex items-center gap-2">
                       <Award className="w-4 h-4 text-indigo-500" /> Experiences
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <p className="text-3xl font-bold font-serif">0</p>
                     <p className="text-xs text-muted-foreground mt-1">Collect badges from trips</p>
                   </CardContent>
                 </Card>
              </div>

              {/* Travel History Placeholder */}
              <Card className="border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">Your Travel History</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary font-bold">
                      View All <ChevronDown className="ml-1 w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                  <h3 className="text-lg font-bold">No trips booked yet</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Your amazing Himalayan adventure is just one click away. Explore our featured packages!
                  </p>
                  <Button className="rounded-xl px-8 font-bold mt-4 shadow-lg shadow-primary/20">
                    Explore Packages
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              {/* Referral Widget */}
              <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Share2 className="w-32 h-32" />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" /> Refer & Earn
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    Invite friends and earn points when they book their first trip.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-2">Your Referral Code</p>
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-2xl font-black tracking-tighter">{user.referralCode}</code>
                      <button 
                        onClick={copyReferral}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Copy Referral Code"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium bg-green-500/20 text-white p-3 rounded-xl border border-green-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    Earn up to 5% commission on friend's bookings
                  </div>
                </CardContent>
              </Card>

              {/* Agent Sidebar (Conditional) */}
              {user.role === 'AGENT' && (
                <Card className="border-none shadow-2xl bg-linear-to-br from-indigo-900 via-indigo-950 to-black text-white">
                  <CardHeader>
                     <div className="flex items-center gap-2 mb-2">
                       <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                         <Briefcase className="w-4 h-4" />
                       </div>
                       <span className="text-xs font-bold uppercase tracking-widest">Agent Console</span>
                     </div>
                     <CardTitle className="text-xl">B2B Dashboard</CardTitle>
                     <CardDescription className="text-indigo-200">Exclusive tools for your agency</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="secondary" className="w-full justify-between rounded-xl font-bold h-11 bg-white/10 hover:bg-white/20 border-white/10 text-white">
                      Markup Settings <ChevronRight className="w-4 h-4 opacity-50" />
                    </Button>
                    <Button variant="secondary" className="w-full justify-between rounded-xl font-bold h-11 bg-white/10 hover:bg-white/20 border-white/10 text-white">
                      Agent Net Rates <ChevronRight className="w-4 h-4 opacity-50" />
                    </Button>
                    <Button variant="secondary" className="w-full justify-between rounded-xl font-bold h-11 bg-white/10 hover:bg-white/20 border-white/10 text-white">
                      Invoices & Ledger <ChevronRight className="w-4 h-4 opacity-50" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Loyalty/Wishlist Widget */}
              <Card className="border-none shadow-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 font-serif">
                     <Heart className="w-5 h-5 text-rose-500" /> Wishlist
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-muted-foreground italic">Your favorite holiday destinations will appear here.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
