"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, DollarSign, TrendingUp, AlertCircle, RefreshCw, 
  ArrowUpRight, ArrowDownRight, CreditCard, Calendar, Building2
} from "lucide-react";
import { useVendorAuth, vendorAuthHeader } from "@/context/VendorAuthContext";
import VendorSidebar from "@/components/VendorSidebar";
import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

interface RevenueSummary {
  grossEarnings: number;
  commission: number;
  netShare: number;
  settledAmount: number;
  pendingAmount: number;
}

interface Transaction {
  bookingId: number;
  hotelName: string;
  date: string | null;
  grossAmount: number;
  commission: number;
  netAmount: number;
  status: string;
}

interface Payout {
  referenceId: string;
  date: string;
  amount: number;
  status: string;
  channel: string;
}

interface RevenueData {
  summary: RevenueSummary;
  transactions: Transaction[];
  payouts: Payout[];
}

export default function VendorRevenuePage() {
  const { vendor, token, isLoading } = useVendorAuth();
  const router = useRouter();
  
  const [data, setData] = useState<RevenueData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/partner/login");
    }
  }, [vendor, isLoading, router]);

  const fetchRevenue = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/vendor/revenue`, {
        headers: vendorAuthHeader(token)
      });
      if (!res.ok) throw new Error("Failed to load financial data");
      const result = await res.json();
      setData(result);
    } catch (e: any) {
      setError(e.message || "Failed to load financial records");
    } finally {
      setFetching(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchRevenue(); }, [token, fetchRevenue]);

  if (isLoading || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || {
    grossEarnings: 0,
    commission: 0,
    netShare: 0,
    settledAmount: 0,
    pendingAmount: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-black text-gray-900 text-lg">Revenue & Payouts</h1>
            <p className="text-xs text-gray-400">Track and manage your property earnings and payouts accountability</p>
          </div>
          <button onClick={fetchRevenue}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-bold text-gray-600 hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-all">
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 text-sm">Error Loading Records</p>
                <p className="text-red-700 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gross earnings</p>
                <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-[#1B3A6B]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">₹{summary.grossEarnings.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">Total revenue generated</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Commission (15%)</p>
                <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600">₹{summary.commission.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">Platform fee share</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Net share (85%)</p>
                <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">₹{summary.netShare.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">Your total net payout share</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending settlement</p>
                <div className="w-8 h-8 rounded-md bg-violet-50 flex items-center justify-center text-violet-600">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-violet-600">₹{summary.pendingAmount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">Confirmed but unsettled bookings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payouts Ledger */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#1B3A6B]" /> Settlements History
                </h2>
              </div>
              {fetching ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-50 rounded-md" />
                  ))}
                </div>
              ) : !data?.payouts || data.payouts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-100 rounded-lg">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-xs text-gray-400">No payouts processed yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.payouts.map(p => (
                    <div key={p.referenceId} className="border border-gray-50 rounded-md p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{p.referenceId}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {p.date} · {p.channel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#1B3A6B]">₹{p.amount.toLocaleString()}</p>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${
                          p.status === "PAID" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transactions Ledger */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#1B3A6B]" /> Booking Transactions
                </h2>
              </div>
              {fetching ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-50 rounded-md" />
                  ))}
                </div>
              ) : !data?.transactions || data.transactions.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-100 rounded-lg">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-xs text-gray-400">No transactions recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 font-bold">Booking ID</th>
                        <th className="py-2.5 font-bold">Hotel</th>
                        <th className="py-2.5 font-bold">Stay Date</th>
                        <th className="py-2.5 font-bold text-right">Gross</th>
                        <th className="py-2.5 font-bold text-right">Comm (15%)</th>
                        <th className="py-2.5 font-bold text-right">Net Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.transactions.map(t => (
                        <tr key={t.bookingId} className="hover:bg-gray-50/50">
                          <td className="py-3 font-bold text-[#1B3A6B]">#{t.bookingId}</td>
                          <td className="py-3 font-semibold text-gray-800 truncate max-w-[150px]">{t.hotelName}</td>
                          <td className="py-3 text-gray-400">{t.date || "—"}</td>
                          <td className="py-3 text-right font-medium text-gray-900">₹{t.grossAmount.toLocaleString()}</td>
                          <td className="py-3 text-right text-amber-600 font-medium">₹{t.commission.toLocaleString()}</td>
                          <td className="py-3 text-right font-black text-emerald-600">₹{t.netAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
