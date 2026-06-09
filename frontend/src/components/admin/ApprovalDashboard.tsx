"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Building2, MapPin, Eye, Clock, Hotel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PendingProperty {
  id: number;
  name: string;
  type: string;
  city: string;
  address: string;
  ownerId: number;
  createdAt: string;
  status: string;
}

export default function ApprovalDashboard() {
  const [properties, setProperties] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const fetchPendingProperties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/approvals/hotels", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch approvals");
      const data = await res.json();
      setProperties(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load pending properties");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/approvals/hotels/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      
      toast.success(`Property ${status.toLowerCase()} successfully!`);
      // Remove from list
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-slate-900">Property Approvals</h1>
        <p className="text-slate-500 mt-1">Review and approve vendor property listings.</p>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-3">
            <Hotel className="w-5 h-5 text-indigo-600" />
            <CardTitle>Pending Hotels & Resorts</CardTitle>
          </div>
          <CardDescription>
            These properties have been submitted by vendors and are awaiting your verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading pending properties...</div>
          ) : properties.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
              <p className="text-slate-500">There are no properties awaiting approval right now.</p>
            </div>
          ) : (
            <div className="divide-y">
              {properties.map((prop) => (
                <div key={prop.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        {prop.name}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      </h4>
                      <div className="text-sm text-slate-500 mt-1 space-y-1">
                        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {prop.city} • {prop.address}</p>
                        <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Submitted on {new Date(prop.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="gap-2 flex-1 md:flex-none">
                      <Eye className="w-4 h-4" /> View Details
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 gap-2 flex-1 md:flex-none"
                      onClick={() => handleApproval(prop.id, "REJECTED")}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 gap-2 flex-1 md:flex-none"
                      onClick={() => handleApproval(prop.id, "APPROVED")}
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
