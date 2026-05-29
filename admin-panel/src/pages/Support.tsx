/**
 * Live Support Page — uses global ChatContext for Socket.io connection.
 * Staff can see all conversations and reply in real-time like WhatsApp.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  MessageSquare, Send, Search,
  CheckCheck, Check, XCircle, Phone, Mail, RefreshCw
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";
import { useChatContext, ChatMsg, Conversation } from "../context/ChatContext";
import { cn } from "@/lib/utils";

/* ─── Helpers ────────────────────────────────────────────────── */
const API = `${API_BASE}/api`;

function getToken(): string {
  try { return JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token || ""; }
  catch { return ""; }
}

function authHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function msgText(m: ChatMsg) { return m.content || m.text || ""; }

/* ─── Component ──────────────────────────────────────────────── */
export default function SupportPage() {
  const { user } = useAuth();
  const { conversations, setConversations, socket, isConnected, fetchConversations } = useChatContext();

  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [guestTyping, setGuestTyping] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRef = useRef<Conversation | null>(null);
  selectedRef.current = selected;

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, guestTyping]);

  // Listen to incoming messages from the global socket and route to this conversation
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg: ChatMsg) => {
      const cur = selectedRef.current;
      if (!cur || msg.conversationId !== cur.id) return;

      setMessages(prev => {
        // Remove matching optimistic message
        const filtered = prev.filter(m => !(m.local && msgText(m) === msgText(msg)));
        return [...filtered, msg];
      });
      // Clear unread for open conversation
      setConversations(prev => prev.map(c => c.id === cur.id ? { ...c, unreadCount: 0 } : c));
    };

    const onTyping = (data: { isTyping: boolean }) => {
      if (!selectedRef.current) return;
      setGuestTyping(data.isTyping);
      if (data.isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setGuestTyping(false), 3000);
      }
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
    };
  }, [socket, setConversations]);

  // Load message history when a conversation is selected
  const loadMessages = useCallback(async (conv: Conversation) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await fetch(`${API}/admin/conversations/${conv.id}/messages`, { headers: authHeaders() });
      if (res.ok) {
        setMessages(await res.json());
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      }
    } catch (_) {}
    setLoadingMsgs(false);
  }, [setConversations]);

  // Emit admin typing to guest
  const emitAdminTyping = useCallback((isTyping: boolean) => {
    if (!selected || !socket) return;
    socket.emit("admin:typing", {
      conversationId: selected.id,
      targetSessionId: selected.guestSessionId,
      targetUserId: selected.userId ? String(selected.userId) : undefined,
      isTyping,
    });
  }, [selected, socket]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selected || !socket) return;

    // Optimistic message
    const optimistic: ChatMsg = {
      senderRole: "ADMIN",
      content: text,
      text,
      createdAt: new Date().toISOString(),
      conversationId: selected.id,
      local: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");
    emitAdminTyping(false);

    socket.emit("chat:message", {
      userId: selected.userId || 0,
      sessionId: selected.guestSessionId,
      senderId: user?.id,
      role: "ADMIN",
      text,
      conversationId: selected.id,
    });

    // Update sidebar last message
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, lastMessage: text, lastMessageRole: "ADMIN", lastMessageAt: new Date().toISOString() } : c
    ));
  };

  const handleClose = async (id: number) => {
    await fetch(`${API}/admin/conversations/${id}/status`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ status: "CLOSED" }),
    });
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: "CLOSED" } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "CLOSED" } : null);
  };

  const filtered = conversations.filter(c =>
    (c.guestName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.guestEmail || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.guestPhone || "").includes(search)
  );
  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <AdminLayout title="Live Support" subtitle="Real-time chat with travelers — WhatsApp style">
      <div className="flex h-[calc(100vh-148px)] min-h-[520px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xl">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className="w-[280px] xl:w-[310px] border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/50">

          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm text-gray-900">Conversations</h2>
                {totalUnread > 0 && (
                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                  isConnected ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-600")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-emerald-500" : "bg-orange-400 animate-pulse")} />
                  {isConnected ? "Live" : "Offline"}
                </div>
                <button onClick={fetchConversations} title="Refresh" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                placeholder="Search name, email, phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-primary bg-white"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold">No conversations yet</p>
                <p className="text-[10px] mt-1 opacity-60">Waiting for visitors to start a chat…</p>
              </div>
            )}
            {filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => { setSelected(conv); loadMessages(conv); }}
                className={cn(
                  "w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all hover:bg-gray-50 border-b border-gray-50",
                  selected?.id === conv.id && "bg-primary/5 border-r-[3px] border-r-primary"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center font-black text-sm">
                    {(conv.guestName || "G")[0].toUpperCase()}
                  </div>
                  {conv.status === "OPEN" && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={cn("text-xs truncate", (conv.unreadCount || 0) > 0 ? "font-black text-gray-900" : "font-bold text-gray-700")}>
                      {conv.guestName || `Chat #${conv.id}`}
                    </p>
                    <span className="text-[9px] text-gray-400 shrink-0">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className={cn("text-[11px] truncate", (conv.unreadCount || 0) > 0 ? "text-gray-800 font-semibold" : "text-gray-400")}>
                    {conv.lastMessageRole === "ADMIN" && <span className="text-primary/60">You: </span>}
                    {conv.lastMessage || "Conversation started"}
                  </p>
                </div>

                {(conv.unreadCount || 0) > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-primary rounded-full text-white text-[9px] font-black flex items-center justify-center mt-1">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat Area ──────────────────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat Header */}
            <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-3 shrink-0 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                  {(selected.guestName || "G")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{selected.guestName || `Chat #${selected.id}`}</h3>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full shrink-0",
                      selected.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {selected.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {selected.guestPhone && (
                      <a href={`tel:${selected.guestPhone}`} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-primary transition-colors">
                        <Phone className="w-3 h-3" /> {selected.guestPhone}
                      </a>
                    )}
                    {selected.guestEmail && (
                      <a href={`mailto:${selected.guestEmail}`} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-primary transition-colors">
                        <Mail className="w-3 h-3" /> {selected.guestEmail}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {selected.status === "OPEN" && (
                <button
                  onClick={() => handleClose(selected.id)}
                  className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                >
                  <XCircle className="w-3.5 h-3.5" /> Close
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5 bg-[#eef1f8]">
              {loadingMsgs && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xs">No messages yet. Be the first to say hello!</p>
                </div>
              )}

              {messages.map((msg, i) => {
                const isMe = msg.senderRole === "ADMIN";
                const text = msgText(msg);
                if (!text) return null;
                return (
                  <div key={i} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                      isMe ? "bg-[#1B3A6B] text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                    )}>
                      <p>{text}</p>
                      <div className={cn("flex items-center gap-1 mt-1 justify-end", isMe ? "text-white/60" : "text-gray-400")}>
                        <span className="text-[9px]">{formatTime(msg.createdAt)}</span>
                        {isMe && (msg.local
                          ? <Check className="w-3 h-3 opacity-50" />
                          : <CheckCheck className="w-3 h-3 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {guestTyping && (
                <div className="flex items-start">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 border border-gray-100">
                    {[0, 1, 2].map(j => (
                      <span key={j} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selected.status === "OPEN" ? (
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                <input
                  value={input}
                  onChange={e => { setInput(e.target.value); emitAdminTyping(true); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Reply to ${selected.guestName || "visitor"}…`}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !isConnected}
                  className="w-10 h-10 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400 font-semibold">This conversation is closed.</p>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center bg-[#eef1f8] text-gray-400">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mb-5 border border-gray-100">
              <MessageSquare className="w-10 h-10 opacity-10" />
            </div>
            <p className="text-sm font-black text-gray-700">Select a conversation</p>
            <p className="text-xs mt-2 max-w-[220px] text-center leading-relaxed text-gray-400">
              Pick a chat from the sidebar to start replying in real-time.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
