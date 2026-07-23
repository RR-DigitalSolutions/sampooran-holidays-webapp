import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { useAuth, API_BASE } from "../context/AuthContext";
import { useChatContext, ChatMsg } from "../context/ChatContext";
import {
  MessageSquare, Send, Search, CheckCheck, Check,
  Phone, Mail, Headset, Shield, AlertTriangle, Calendar,
  MapPin, Users, DollarSign, Clock, RefreshCw, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = `${API_BASE}/api`;

function getToken(): string {
  try { return JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token || ""; }
  catch { return ""; }
}

function authHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface VendorConv {
  id: number;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  status: string;
  category?: string;
  priority?: string;
  requirementData?: Record<string, string> | null;
  lastMessage?: string;
  lastMessageRole?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export default function VendorChat() {
  const { user } = useAuth();
  const { socket, isConnected } = useChatContext();

  const [convs, setConvs]               = useState<VendorConv[]>([]);
  const [selected, setSelected]         = useState<VendorConv | null>(null);
  const [messages, setMessages]         = useState<ChatMsg[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [search, setSearch]             = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRef    = useRef<VendorConv | null>(null);
  selectedRef.current  = selected;

  /* ── Auto-scroll ──────────────────────────────────────────────────────── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* ── Fetch Vendor Conversations ───────────────────────────────────────── */
  const fetchVendorConvs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendor/conversations`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConvs(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchVendorConvs(); }, [fetchVendorConvs]);

  /* ── Fetch Messages for Selected Chat ─────────────────────────────────── */
  const loadMessages = useCallback(async (conv: VendorConv) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await fetch(`${API}/vendor/conversations/${conv.id}/messages`, { headers: authHeaders() });
      if (res.ok) {
        setMessages(await res.json());
        setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      }
    } catch {}
    setLoadingMsgs(false);
  }, []);

  /* ── Listen for Socket Events ─────────────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg: ChatMsg) => {
      const cur = selectedRef.current;
      if (!cur || msg.conversationId !== cur.id) return;
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        const filtered = prev.filter(m => !(m.local && m.senderRole === msg.senderRole && (m.content || m.text) === (msg.content || msg.text)));
        return [...filtered, msg];
      });
      setConvs(prev => prev.map(c => c.id === cur.id ? { ...c, unreadCount: 0, lastMessage: msg.content || msg.text || "" } : c));
    };

    socket.on("chat:message", onMessage);
    return () => { socket.off("chat:message", onMessage); };
  }, [socket]);

  /* ── Handle Select Conversation ───────────────────────────────────────── */
  const handleSelect = (conv: VendorConv) => {
    setSelected(conv);
    loadMessages(conv);
  };

  /* ── Handle Send Message ──────────────────────────────────────────────── */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected) return;

    const optimistic: ChatMsg = {
      senderRole: "AGENT", content: text, text,
      createdAt: new Date().toISOString(), conversationId: selected.id, local: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch(`${API}/vendor/conversations/${selected.id}/messages`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const saved = await res.json();
        // Emit via socket so client widget receives message in real time
        socket?.emit("chat:message", {
          conversationId: selected.id,
          role: "AGENT",
          senderId: user?.id,
          text,
        });
      }
    } catch {}
  };

  const filtered = convs.filter(c => (
    (c.guestName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.guestPhone || "").includes(search) ||
    (c.category || "").toLowerCase().includes(search.toLowerCase())
  ));

  const vendorTypeLabel = user?.role === "HOTEL_OWNER" ? "Hotel Partner" : "Transport Partner";

  return (
    <AdminLayout title={`${vendorTypeLabel} Live Chat Support`} subtitle="Direct communication with client inquiries assigned to your business">
      <div className="space-y-4">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-[#1B3A6B] to-slate-900 text-white rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              {user?.role === "HOTEL_OWNER" ? "🏨" : "🚗"}
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{(user as any)?.name || user?.email || "Vendor Partner"} — Chat Support Portal</h3>
              <p className="text-xs text-white/70 mt-0.5">Assigned customer conversations for your properties & services</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border",
              isConnected ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" : "bg-orange-500/20 border-orange-400/30 text-orange-300")}>
              <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-400" : "bg-orange-400 animate-pulse")} />
              {isConnected ? "Live Connected" : "Connecting..."}
            </span>
            <button onClick={fetchVendorConvs} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Chat Layout */}
        <div className="flex h-[calc(100vh-210px)] min-h-[500px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xl">

          {/* Sidebar */}
          <div className="w-[300px] xl:w-[320px] border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/50">
            <div className="p-3.5 border-b border-gray-100 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Assigned Inquiries ({filtered.length})</h4>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  placeholder="Search customer name or phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-primary bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading assigned chats...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">No assigned chats found</p>
                  <p className="text-[10px] mt-1">Sampooran Holidays support will assign relevant client chats to you here.</p>
                </div>
              ) : (
                filtered.map(c => {
                  const isSel = selected?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={cn(
                        "p-3.5 border-b border-gray-100 cursor-pointer transition-all hover:bg-white relative",
                        isSel ? "bg-white border-l-4 border-l-[#1B3A6B] shadow-xs" : "bg-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-xs text-gray-900 truncate">{c.guestName || `Client #${c.id}`}</h4>
                        <span className="text-[9px] text-gray-400 shrink-0">{formatTime(c.lastMessageAt)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mb-1.5">{c.lastMessage || "No messages yet"}</p>
                      <div className="flex items-center justify-between">
                        {c.category && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {c.category}
                          </span>
                        )}
                        {c.unreadCount ? (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                            {c.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat & Requirements Panel */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {(selected.guestName || "C")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-gray-900">{selected.guestName || `Client #${selected.id}`}</h3>
                    <p className="text-[10px] text-gray-400">{selected.guestPhone || selected.guestEmail || "Direct Inquirer"}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  ✅ Assigned to You ({vendorTypeLabel})
                </span>
              </div>

              {/* Requirement Summary Card (if AI collected data) */}
              {selected.requirementData && Object.keys(selected.requirementData).length > 0 && (
                <div className="bg-amber-50/70 border-b border-amber-200/60 px-5 py-2.5 flex items-center gap-4 text-xs text-amber-900 shrink-0 flex-wrap">
                  <span className="font-bold flex items-center gap-1">📋 Trip Brief:</span>
                  {Object.entries(selected.requirementData).map(([k, v]) => (
                    <span key={k} className="bg-white border border-amber-200 rounded-md px-2 py-0.5 text-[10px] font-semibold">
                      <strong>{k.replace(/([A-Z])/g, " $1")}:</strong> {v}
                    </span>
                  ))}
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5 bg-[#eef1f8]">
                {loadingMsgs && (
                  <div className="text-center py-8 text-xs text-gray-400">Loading message thread...</div>
                )}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-xs">No messages yet.</div>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.senderRole === "ADMIN" || msg.senderRole === "AGENT";
                  const isBot = msg.senderRole === "BOT" || msg.isBot;
                  const text = msg.content || msg.text || "";
                  if (!text) return null;

                  return (
                    <div key={i} className={cn("flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                      {!isMe && (
                        <span className="text-[9px] font-bold text-gray-400 px-1">
                          {isBot ? "🤖 AI Assistant" : "👤 Client"}
                        </span>
                      )}
                      <div className={cn("max-w-[72%] px-3 py-2 rounded-xl text-xs leading-relaxed shadow-xs break-words",
                        isMe ? "bg-[#1B3A6B] text-white rounded-tr-none" :
                        isBot ? "bg-amber-50 text-slate-800 border border-amber-200/60 rounded-tl-none" :
                        "bg-white text-slate-900 border border-slate-200/80 rounded-tl-none")}>
                        <p className="whitespace-pre-line">{text}</p>
                        <div className={cn("flex items-center gap-1 mt-0.5 justify-end select-none text-[9px]", isMe ? "text-white/60" : "text-slate-400")}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && (msg.local ? <Check className="w-2.5 h-2.5 opacity-50" /> : <CheckCheck className="w-2.5 h-2.5 text-blue-300" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Bar */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Reply to ${selected.guestName || "client"} as ${vendorTypeLabel}…`}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-xs focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <Headset className="w-16 h-16 opacity-20 mb-3" />
              <h3 className="font-bold text-gray-700 text-sm">Select an assigned chat from the list</h3>
              <p className="text-xs max-w-xs mt-1 text-gray-400">
                Chats assigned to your property or vehicle fleet will appear on the left panel.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
