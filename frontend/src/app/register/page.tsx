"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Mail, Lock, Loader2, ArrowRight, User, Phone, Ticket, Briefcase, CheckCircle2, Building2, Car } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function RegisterContent() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState("USER");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    referredByCode: searchParams.get("ref") || "",
    companyName: "",
    gstNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      login(data.user, data.token);
      toast.success("Account created! Enjoy your ₹1,000 welcome bonus.");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-linear-to-br from-background via-background to-secondary/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        {/* Marketing Banner for ₹1000 Bonus */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 p-4 rounded-2xl bg-accent/20 border border-accent/30 backdrop-blur-md flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="bg-accent p-2 rounded-full">
              <Ticket className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-accent-foreground">Special Welcome Offer</p>
              <p className="text-xs text-muted-foreground">Sign up now and get <span className="text-foreground font-bold">₹1,000</span> for your first booking!</p>
            </div>
          </div>
          <div className="hidden sm:block">
             <CheckCircle2 className="w-5 h-5 text-accent" />
          </div>
        </motion.div>

        <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-serif tracking-tight">Create Account</CardTitle>
            <CardDescription>Join Sampooran Holidays for a premium travel experience</CardDescription>
            
            <div className="pt-4">
              <Tabs defaultValue="USER" onValueChange={setRole} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 rounded-xl bg-muted/50 p-1 h-auto">
                  <TabsTrigger value="USER" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md py-2 text-[10px] md:text-sm">
                    <User className="w-4 h-4 mr-2 hidden md:block" />
                    Traveler
                  </TabsTrigger>
                  <TabsTrigger value="AGENT" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md py-2 text-[10px] md:text-sm">
                    <Briefcase className="w-4 h-4 mr-2 hidden md:block" />
                    Agent
                  </TabsTrigger>
                  <TabsTrigger value="HOTEL_OWNER" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md py-2 text-[10px] md:text-sm">
                    <Building2 className="w-4 h-4 mr-2 hidden md:block" />
                    Hotel
                  </TabsTrigger>
                  <TabsTrigger value="TRANSPORTER" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md py-2 text-[10px] md:text-sm">
                    <Car className="w-4 h-4 mr-2 hidden md:block" />
                    Transport
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          
          <form onSubmit={handleRegister}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-10 h-11 bg-background/50 border-muted-border/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10 h-11 bg-background/50 border-muted-border/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    placeholder="+91 00000 00000"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="pl-10 h-11 bg-background/50 border-muted-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-10 h-11 bg-background/50 border-muted-border/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="referredByCode">Referral Code (Optional)</Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="referredByCode"
                    placeholder="SAM123"
                    value={formData.referredByCode}
                    onChange={(e) => setFormData({...formData, referredByCode: e.target.value})}
                    className="pl-10 h-11 bg-background/50 border-muted-border/50"
                  />
                </div>
              </div>

              <AnimatePresence>
                {role === "AGENT" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Agency/Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="RR Digital Solutions"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="h-11 bg-background/50 border-muted-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                      <Input
                        id="gstNumber"
                        placeholder="07AAAAA0000A1Z5"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                        className="h-11 bg-background/50 border-muted-border/50"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-lg shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Create My Account
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[90vh] flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
