import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  Search, RefreshCw, MessageSquare, Download, Ticket, CheckCircle, 
  DollarSign, Phone, Mail 
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";

interface B2CBooking {
  id: number;
  status: string;
  paymentStatus: string;
  travelDate: string | null;
  travelersCount: number | null;
  adultsCount: number | null;
  childrenCount: number | null;
  infantsCount: number | null;
  totalAmount: number | null;
  finalPaidAmount: number | null;
  specialRequests: string | null;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestPhoneNumber: string | null;
  packageName: string | null;
  packageCode: string | null;
  duration: string | null;
  nights: string | null;
}

export default function B2CConfirmedBookings() {
  const { user } = useAuth();
  const [b2cBookings, setB2cBookings] = useState<B2CBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showVoucherModal, setShowVoucherModal] = useState<B2CBooking | null>(null);

  useEffect(() => {
    fetchB2CBookings();
  }, []);

  const fetchB2CBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/b2c-bookings`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (res.ok) {
        const data: B2CBooking[] = await res.json();
        setB2cBookings(data);
      }
    } catch (error) {
      console.error("Error fetching B2C bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = b2cBookings.filter(b => {
    const searchLower = search.toLowerCase();
    const refStr = `sh-bk-${b.id}`.toLowerCase();
    return (
      refStr.includes(searchLower) ||
      (b.guestName && b.guestName.toLowerCase().includes(searchLower)) ||
      (b.packageName && b.packageName.toLowerCase().includes(searchLower)) ||
      (b.guestPhone && b.guestPhone.includes(search)) ||
      (b.guestPhoneNumber && b.guestPhoneNumber.includes(search)) ||
      (b.guestEmail && b.guestEmail.toLowerCase().includes(searchLower)) ||
      (b.packageCode && b.packageCode.toLowerCase().includes(searchLower))
    );
  });

  const totalPaidRevenue = b2cBookings.reduce((sum, b) => sum + (b.finalPaidAmount || 0), 0);
  const totalContractValue = b2cBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const exportCSV = () => {
    if (b2cBookings.length === 0) return;
    const headers = ["Booking Ref", "Guest Name", "Email", "Phone", "Package Name", "Package Code", "Travel Date", "Pax", "Total Amount", "Paid Amount", "Status", "Created At"];
    const rows = b2cBookings.map(b => [
      `SH-BK-${b.id}`,
      b.guestName || "",
      b.guestEmail || "",
      b.guestPhone || b.guestPhoneNumber || "",
      b.packageName || "",
      b.packageCode || "",
      b.travelDate || "",
      b.travelersCount || 0,
      b.totalAmount || 0,
      b.finalPaidAmount || 0,
      b.status || "CONFIRMED",
      b.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `b2c_confirmed_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <AdminLayout title="Confirmed B2C Bookings" subtitle="Loading customer package reservations...">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
           <RefreshCw className="w-8 h-8 animate-spin mb-2" />
           <p className="text-sm font-medium">Fetching confirmed bookings &amp; vouchers from backend...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Confirmed B2C Bookings 🎟️" subtitle="Manage customer reservations and generate official dynamic travel vouchers">
      
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1B3A6B] flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-black text-gray-900">{b2cBookings.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Collected Paid</p>
            <p className="text-2xl font-black text-emerald-700">₹{totalPaidRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Contract Value</p>
            <p className="text-2xl font-black text-slate-800">₹{totalContractValue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Controls: Search & CSV Export */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, booking ref (SH-BK-1), package, phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white text-slate-800" 
          />
        </div>

        <button 
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shrink-0 bg-[#059669] shadow-sm hover:brightness-105"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Active Reserved Packages</h3>
            <p className="text-xs text-gray-500">Generate or send dynamic travel vouchers directly to clients</p>
          </div>
          <span className="text-xs font-bold font-mono bg-blue-50 text-[#1B3A6B] px-3 py-1 rounded-full border border-blue-100">
            Showing {filteredBookings.length} of {b2cBookings.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-3">Booking Ref</th>
                <th className="py-3 px-3">Customer / Guest</th>
                <th className="py-3 px-3">Package Details</th>
                <th className="py-3 px-3">Travel Date &amp; Pax</th>
                <th className="py-3 px-3">Financials</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredBookings.map((b) => {
                const guestPhone = b.guestPhone || b.guestPhoneNumber || "";
                return (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-[#1B3A6B]">
                      SH-BK-{b.id}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">{b.guestName || "Valued Customer"}</p>
                      <p className="text-[11px] text-slate-500">{b.guestEmail || "No Email"}</p>
                      <p className="text-[11px] text-slate-500">{guestPhone ? `+91 ${guestPhone}` : ""}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">{b.packageName || "Custom Package"}</p>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        Code: {b.packageCode || "SH-RDS-GEN"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">📅 {b.travelDate || "Flexible"}</p>
                      <p className="text-[11px] text-slate-500">👥 {b.travelersCount || 2} Travelers ({b.adultsCount || 2} Adults)</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-black text-emerald-700">Paid: ₹{(b.finalPaidAmount || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-slate-400">Total: ₹{(b.totalAmount || 0).toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {b.status || "CONFIRMED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setShowVoucherModal(b)}
                        className="px-3 py-1.5 rounded-lg bg-[#1B3A6B] hover:bg-[#285294] text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <span>📄 View Voucher</span>
                      </button>
                      {guestPhone && (
                        <a
                          href={`https://wa.me/91${guestPhone}?text=Hello%20${encodeURIComponent(b.guestName || 'Valued Guest')},%20Greetings%20from%20Sampooran%20Holidays!%20Here%20is%20your%20Official%20Travel%20Voucher%20for%20${encodeURIComponent(b.packageName || 'Package')}%20(Ref:%20SH-VCR-${b.id}).%20Travel%20Date:%20${b.travelDate}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:brightness-105 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <span>💬 WhatsApp</span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No confirmed B2C package bookings found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           PRINTABLE DYNAMIC TRAVEL VOUCHER MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-8">
            
            {/* Printable Voucher Content */}
            <div id="printable-voucher" className="p-6 sm:p-8 space-y-6 text-xs text-slate-800 bg-white">
              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-[#1B3A6B] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌄</span>
                    <h2 className="text-xl font-black tracking-tight text-[#1B3A6B]">SAMPOORAN HOLIDAYS</h2>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Official Travel Confirmation &amp; Service Voucher</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-[#1B3A6B] text-amber-300 font-mono font-black text-xs px-3 py-1 rounded shadow-xs">
                    SH-VCR-{showVoucherModal.id}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Issued: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Guest & Package Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Traveler Details</h4>
                  <p className="font-bold text-slate-900 text-sm">{showVoucherModal.guestName || "Valued Customer"}</p>
                  <p className="text-slate-600">Email: {showVoucherModal.guestEmail || "N/A"}</p>
                  <p className="text-slate-600">Phone: {showVoucherModal.guestPhone || showVoucherModal.guestPhoneNumber || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Reservation Info</h4>
                  <p className="font-bold text-[#1B3A6B] text-sm">{showVoucherModal.packageName || "Tour Package"}</p>
                  <p className="text-slate-600">Code: <strong className="font-mono text-slate-900">{showVoucherModal.packageCode || "SH-RDS-GEN"}</strong></p>
                  <p className="text-slate-600">Departure: <strong className="text-slate-900">{showVoucherModal.travelDate || "As Confirmed"}</strong></p>
                  <p className="text-slate-600">Occupancy: <strong className="text-slate-900">{showVoucherModal.travelersCount || 2} Pax</strong> ({showVoucherModal.adultsCount || 2} Adults)</p>
                </div>
              </div>

              {/* Financial Status Summary */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between text-emerald-950">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment Status</p>
                  <p className="text-sm font-black text-emerald-900">CONFIRMED &amp; GUARANTEED</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs font-bold text-emerald-800">Amount Paid: ₹{(showVoucherModal.finalPaidAmount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-slate-500">Total Contract: ₹{(showVoucherModal.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Inclusions & Highlights */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">Voucher Inclusions &amp; Assistance</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <p>✓ All sightseeing as per itinerary</p>
                  <p>✓ Hotel Accommodations included</p>
                  <p>✓ Daily Breakfast &amp; Dinner Plan</p>
                  <p>✓ Private Transfers &amp; Drivers</p>
                  <p>✓ Tolls, Parking &amp; Driver Allowances</p>
                  <p>✓ 24/7 Ground Manager Assistance</p>
                </div>
              </div>

              {showVoucherModal.specialRequests && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <h4 className="text-[10px] font-bold text-amber-900 uppercase">Special Notes &amp; Requests</h4>
                  <p className="text-xs text-amber-800 mt-0.5">{showVoucherModal.specialRequests}</p>
                </div>
              )}

              {/* Footer Helpline Notice */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                <p>Official Voucher issued by Sampooran Holidays Pvt Ltd • Support: +91 900 000 0000</p>
                <p className="font-mono font-bold text-slate-500">VERIFIED AUTH 🔒</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-100 p-4 flex items-center justify-between border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowVoucherModal(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {showVoucherModal.guestPhone && (
                  <a
                    href={`https://wa.me/91${showVoucherModal.guestPhone}?text=Hello%20${encodeURIComponent(showVoucherModal.guestName || 'Valued Guest')},%20Here%20is%20your%20Official%20Travel%20Voucher%20for%20${encodeURIComponent(showVoucherModal.packageName || 'Package')}%20(Ref:%20SH-VCR-${showVoucherModal.id}).%20Travel%20Date:%20${showVoucherModal.travelDate}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#25D366] hover:brightness-105 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>💬 Send on WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-[#1B3A6B] hover:bg-[#285294] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>🖨️ Print / Save PDF Voucher</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
