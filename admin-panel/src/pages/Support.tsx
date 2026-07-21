/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sampooran Holidays CRM — Advanced Live Support Dashboard v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * RBAC Architecture:
 *  - SUPERADMIN / ADMIN(ALL) = Supervisor: sees ALL conversations, can assign
 *  - ADMIN(SUPPORT) / AGENT(SUPPORT) = Agent: sees only ASSIGNED conversations
 *
 * Features:
 *  - Department tabs filter (All | Tours | Hotels | Taxi | B2B | B2C)
 *  - Priority badges (🔴 Urgent | 🟠 High | 🟡 Normal | 🟢 Low)
 *  - Category badges per conversation
 *  - Bot requirement summary panel (what AI collected)
 *  - Quick Assign dropdown (to department agent)
 *  - Spam/Ban controls (supervisor only)
 *  - Internal notes (staff-only, not visible to guest)
 *  - Status filters (Open | Assigned | Bot | Closed | Spam)
 *  - Real-time chat with agent-role awareness
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  MessageSquare, Send, Search, CheckCheck, Check,
  XCircle, Phone, Mail, RefreshCw, User2, Bot, Headset,
  Tag, Shield, AlertTriangle, ChevronDown, ClipboardList,
  StickyNote, PlusCircle, ChevronRight, Filter,
} from "lucide-react";
import { useAuth, API_BASE } from "../context/AuthContext";
import { useChatContext, ChatMsg, Conversation } from "../context/ChatContext";
import { cn } from "@/lib/utils";

/* ── Constants ─────────────────────────────────────────────────────────────── */
const API = `${API_BASE}/api`;

const DEPARTMENTS = [
  { key: "ALL",     label: "All",        emoji: "💬" },
  { key: "TOUR",    label: "Tours",      emoji: "🏔️" },
  { key: "HOTEL",   label: "Hotels",     emoji: "🏨" },
  { key: "TAXI",    label: "Transport",  emoji: "🚗" },
  { key: "B2B",     label: "B2B",        emoji: "🤝" },
  { key: "B2C",     label: "B2C",        emoji: "👤" },
  { key: "GENERAL", label: "General",    emoji: "💡" },
] as const;

const PRIORITIES = [
  { key: "URGENT", label: "Urgent", color: "text-red-600 bg-red-50 border-red-200" },
  { key: "HIGH",   label: "High",   color: "text-orange-600 bg-orange-50 border-orange-200" },
  { key: "NORMAL", label: "Normal", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { key: "LOW",    label: "Low",    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
];

const STATUS_FILTERS = ["ALL", "BOT", "OPEN", "ASSIGNED", "CLOSED", "SPAM"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const PRIORITY_EMOJI: Record<string, string> = { URGENT: "🔴", HIGH: "🟠", NORMAL: "🟡", LOW: "🟢" };

const CATEGORY_COLORS: Record<string, string> = {
  TOUR:    "text-violet-700 bg-violet-50 border-violet-200",
  HOTEL:   "text-sky-700 bg-sky-50 border-sky-200",
  TAXI:    "text-amber-700 bg-amber-50 border-amber-200",
  B2B:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  B2C:     "text-pink-700 bg-pink-50 border-pink-200",
  GENERAL: "text-slate-600 bg-slate-50 border-slate-200",
};

/* ── Extended Conversation type ──────────────────────────────────────────── */
interface ExtConversation extends Conversation {
  category?: string;
  priority?: string;
  assignedDepartment?: string;
  assignedStaffId?: number | null;
  assignedVendorId?: number | null;
  botEscalated?: boolean;
  requirementData?: Record<string, string> | null;
  spamScore?: number;
  isBanned?: boolean;
  tags?: string[];
}

interface Note { id: number; content: string; authorName: string; createdAt: string; }
interface Agent { id: number; userId: number; name: string; email: string; department: string; isSupervisor: boolean; isAvailable: boolean; displayName?: string; }

/* ── Helpers ─────────────────────────────────────────────────────────────── */
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

function msgText(m: ChatMsg) { return m.content || m.text || ""; }

/* ── Component ───────────────────────────────────────────────────────────── */
export default function SupportPage() {
  const { user, isSuperAdmin } = useAuth();
  const { conversations, setConversations, socket, isConnected, fetchConversations } = useChatContext();

  const [selected, setSelected]           = useState<ExtConversation | null>(null);
  const [messages, setMessages]           = useState<ChatMsg[]>([]);
  const [input, setInput]                 = useState("");
  const [guestTyping, setGuestTyping]     = useState(false);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [search, setSearch]               = useState("");
  const [deptFilter, setDeptFilter]       = useState<string>("ALL");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("ALL");
  const [showRequirements, setShowReq]    = useState(false);
  const [agents, setAgents]               = useState<Agent[]>([]);
  const [notes, setNotes]                 = useState<Note[]>([]);
  const [newNote, setNewNote]             = useState("");
  const [addingNote, setAddingNote]       = useState(false);
  const [assignDropdown, setAssignDrop]   = useState(false);
  const [priorityDrop, setPriorityDrop]   = useState(false);
  const [categoryDrop, setCategoryDrop]   = useState(false);
  const [banConfirm, setBanConfirm]       = useState(false);
  const [sidebarPanel, setSidebarPanel]   = useState<"chat" | "notes" | "requirements">("chat");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRef    = useRef<ExtConversation | null>(null);
  selectedRef.current  = selected;

  // Detect role: supervisor (sees all) vs agent (sees only assigned)
  const perms: string[] = JSON.parse((user as any)?.permissions ? JSON.stringify((user as any)?.permissions) : "[]");
  const isSupervisor = isSuperAdmin || perms.includes("ALL");

  /* ── Auto scroll ────────────────────────────────────────────────────── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, guestTyping]);

  /* ── Load agents for assignment dropdown ────────────────────────────── */
  useEffect(() => {
    fetch(`${API}/admin/chat-agents`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAgents(data); })
      .catch(() => {});
  }, []);

  /* ── Socket events ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg: ChatMsg) => {
      const cur = selectedRef.current;
      if (!cur || msg.conversationId !== cur.id) return;
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.local && msgText(m) === msgText(msg)));
        return [...filtered, msg];
      });
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

    const onNewConv = (conv: ExtConversation) => {
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) return prev.map(c => c.id === conv.id ? { ...c, ...conv } : c);
        return [conv as Conversation, ...prev];
      });
    };

    const onConvUpdated = (conv: ExtConversation) => {
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, ...conv } : c));
      if (selectedRef.current?.id === conv.id) setSelected(s => s ? { ...s, ...conv } : s);
    };

    socket.on("chat:message",              onMessage);
    socket.on("chat:typing",               onTyping);
    socket.on("chat:new_conversation",     onNewConv);
    socket.on("chat:conversation_updated", onConvUpdated);

    return () => {
      socket.off("chat:message",              onMessage);
      socket.off("chat:typing",               onTyping);
      socket.off("chat:new_conversation",     onNewConv);
      socket.off("chat:conversation_updated", onConvUpdated);
    };
  }, [socket, setConversations]);

  /* ── Load messages ──────────────────────────────────────────────────── */
  const loadMessages = useCallback(async (conv: ExtConversation) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await fetch(`${API}/admin/conversations/${conv.id}/messages`, { headers: authHeaders() });
      if (res.ok) {
        setMessages(await res.json());
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      }
    } catch {}
    setLoadingMsgs(false);
  }, [setConversations]);

  /* ── Load notes ─────────────────────────────────────────────────────── */
  const loadNotes = useCallback(async (convId: number) => {
    try {
      const res = await fetch(`${API}/admin/conversations/${convId}/notes`, { headers: authHeaders() });
      if (res.ok) setNotes(await res.json());
    } catch {}
  }, []);

  const handleSelectConv = (conv: ExtConversation) => {
    setSelected(conv);
    loadMessages(conv);
    loadNotes(conv.id);
    setSidebarPanel("chat");
    setAssignDrop(false);
  };

  /* ── Typing emitter ─────────────────────────────────────────────────── */
  const emitAdminTyping = useCallback((isTyping: boolean) => {
    if (!selected || !socket) return;
    socket.emit("admin:typing", {
      conversationId: selected.id,
      targetSessionId: selected.guestSessionId,
      targetUserId: selected.userId ? String(selected.userId) : undefined,
      isTyping,
    });
  }, [selected, socket]);

  /* ── Send message ───────────────────────────────────────────────────── */
  const handleSend = () => {
    const text = input.trim();
    if (!text || !selected || !socket) return;
    const optimistic: ChatMsg = {
      senderRole: "ADMIN", content: text, text,
      createdAt: new Date().toISOString(), conversationId: selected.id, local: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");
    emitAdminTyping(false);
    socket.emit("chat:message", {
      userId: selected.userId || 0, sessionId: selected.guestSessionId,
      senderId: user?.id, role: "ADMIN", text, conversationId: selected.id,
    });
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, lastMessage: text, lastMessageRole: "ADMIN", lastMessageAt: new Date().toISOString() } : c
    ));
  };

  /* ── Close conversation ─────────────────────────────────────────────── */
  const handleClose = async (id: number) => {
    await fetch(`${API}/admin/conversations/${id}/status`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status: "CLOSED" }),
    });
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: "CLOSED" } : c));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: "CLOSED" } : null);
  };

  /* ── Assign to agent ────────────────────────────────────────────────── */
  const handleAssign = async (agent: Agent) => {
    if (!selected || !isSupervisor) return;
    try {
      const res = await fetch(`${API}/admin/conversations/${selected.id}/assign`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ staffId: agent.userId, department: agent.department }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected(s => s ? { ...s, ...updated, assignedStaffName: agent.displayName || agent.name } : s);
        setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, ...updated } : c));
        // Also emit via socket for real-time
        socket?.emit("chat:assign", { conversationId: selected.id, staffId: agent.userId, department: agent.department });
      }
    } catch {}
    setAssignDrop(false);
  };

  /* ── Set priority ───────────────────────────────────────────────────── */
  const handlePriority = async (priority: string) => {
    if (!selected) return;
    await fetch(`${API}/admin/conversations/${selected.id}/priority`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ priority }),
    });
    setSelected(s => s ? { ...s, priority } : s);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, priority: priority as any } : c));
    setPriorityDrop(false);
  };

  /* ── Set category ───────────────────────────────────────────────────── */
  const handleCategory = async (category: string) => {
    if (!selected) return;
    await fetch(`${API}/admin/conversations/${selected.id}/category`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ category }),
    });
    setSelected(s => s ? { ...s, category } : s);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, category: category as any } : c));
    setCategoryDrop(false);
  };

  /* ── Takeover Chat (Stop AI Replies) ────────────────────────────────── */
  const handleTakeover = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/admin/conversations/${selected.id}/takeover`, {
        method: "POST", headers: authHeaders(),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected(s => s ? { ...s, ...updated, status: "OPEN", botEscalated: true } : s);
        setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: "OPEN", botEscalated: true } : c));
        if (updated.systemMessage) {
          setMessages(prev => [...prev, updated.systemMessage]);
        }
      }
    } catch {}
  };

  /* ── Ban guest ──────────────────────────────────────────────────────── */
  const handleBan = async () => {
    if (!selected || !isSupervisor) return;
    await fetch(`${API}/admin/conversations/${selected.id}/ban`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ type: "SESSION", value: selected.guestSessionId, reason: "Banned via Support Dashboard" }),
    });
    setSelected(s => s ? { ...s, status: "SPAM", isBanned: true } : s);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: "SPAM" } : c));
    setBanConfirm(false);
  };

  /* ── Add note ───────────────────────────────────────────────────────── */
  const handleAddNote = async () => {
    if (!newNote.trim() || !selected || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(`${API}/admin/conversations/${selected.id}/notes`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [...prev, note]);
        setNewNote("");
      }
    } catch {}
    setAddingNote(false);
  };

  /* ── Filtered conversations ─────────────────────────────────────────── */
  const extConvs = conversations as ExtConversation[];

  const filtered = extConvs.filter(c => {
    const matchSearch = (
      (c.guestName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.guestEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.guestPhone || "").includes(search)
    );
    const matchDept = deptFilter === "ALL" || c.category === deptFilter || c.assignedDepartment === deptFilter;
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  /* ── Client Online Status (300s threshold) ──────────────────────────── */
  const getClientStatus = (conv: ExtConversation) => {
    if (conv.status === "CLOSED" || conv.status === "SPAM") return { isOnline: false, text: conv.status };
    if (!conv.lastMessageAt) return { isOnline: false, text: "Offline" };
    const lastActive = new Date(conv.lastMessageAt).getTime();
    const diffSec = (Date.now() - lastActive) / 1000;
    if (diffSec <= 300) return { isOnline: true, text: "Online" };
    const mins = Math.floor(diffSec / 60);
    return { isOnline: false, text: `Away (${mins > 60 ? Math.floor(mins / 60) + 'h' : mins + 'm'})` };
  };

  /* ── Stats ───────────────────────────────────────────────────────────── */
  const totalBot    = extConvs.filter(c => c.status === "BOT").length;
  const totalOpen   = extConvs.filter(c => c.status === "OPEN" || c.status === "ASSIGNED").length;
  const totalUrgent = extConvs.filter(c => c.priority === "URGENT").length;
  const totalClosed = extConvs.filter(c => c.status === "CLOSED").length;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <AdminLayout title="Live Support CRM" subtitle="Sampooran Holidays SOP Chat & Department Routing">
      <div className="space-y-4">
        {/* KPI Stats Header Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Bot Active</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{totalBot}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">🤖</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Open / Escalated</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{totalOpen}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">💬</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Urgent Tickets</p>
              <p className="text-xl font-black text-red-600 mt-0.5">{totalUrgent}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">🚨</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Closed</p>
              <p className="text-xl font-black text-gray-500 mt-0.5">{totalClosed}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center font-bold">✅</div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-210px)] min-h-[520px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xl">

        {/* ════════════════════════════════════════════════════════════
            SIDEBAR
            ════════════════════════════════════════════════════════════ */}
        <div className="w-[300px] xl:w-[330px] border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/50">

          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 bg-white space-y-3">
            <div className="flex items-center justify-between">
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

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                placeholder="Search name, email, phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-primary bg-white"
              />
            </div>

            {/* Department tabs */}
            <div className="flex gap-1 flex-wrap">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.key}
                  onClick={() => setDeptFilter(dept.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                    deptFilter === dept.key
                      ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {dept.emoji} {dept.label}
                </button>
              ))}
            </div>

            {/* Status filter pills */}
            <div className="flex gap-1 flex-wrap">
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border transition-all",
                    statusFilter === s ? "bg-[#1B3A6B] text-white border-transparent" : "text-gray-400 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold">No conversations</p>
                <p className="text-[10px] mt-1 opacity-60">
                  {isSupervisor ? "Waiting for escalated chats…" : "No conversations assigned to you yet."}
                </p>
              </div>
            )}
            {filtered.map(conv => {
              const statusInfo = getClientStatus(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-all hover:bg-gray-50 border-b border-gray-50 relative",
                    conv.priority === "URGENT" && "border-l-4 border-l-red-500",
                    conv.priority === "HIGH" && "border-l-4 border-l-orange-500",
                    conv.priority === "NORMAL" && "border-l-4 border-l-sky-400",
                    conv.priority === "LOW" && "border-l-4 border-l-emerald-400",
                    selected?.id === conv.id && "bg-primary/5 border-r-2 border-r-primary"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center font-black text-xs">
                      {conv.botEscalated ? (conv.guestName || "G")[0].toUpperCase() : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    {statusInfo.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={cn("text-[11px] truncate", (conv.unreadCount || 0) > 0 ? "font-black text-gray-900" : "font-bold text-gray-700")}>
                        {conv.guestName || `Chat #${conv.id}`}
                      </p>
                      <span className="text-[8px] text-gray-400 shrink-0">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap mb-0.5">
                      {/* Priority */}
                      {conv.priority && conv.priority !== "NORMAL" && (
                        <span className="text-[8px]">{PRIORITY_EMOJI[conv.priority]}</span>
                      )}
                      {/* Category */}
                      {conv.category && (
                        <span className={cn("text-[8px] font-bold px-1.5 py-0.2 rounded-full border", CATEGORY_COLORS[conv.category])}>
                          {conv.category}
                        </span>
                      )}
                      {/* Status */}
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.2 rounded-full border",
                        conv.status === "OPEN" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                        conv.status === "BOT" ? "text-amber-700 bg-amber-50 border-amber-200" :
                        conv.status === "ASSIGNED" ? "text-sky-700 bg-sky-50 border-sky-200" :
                        conv.status === "SPAM" ? "text-red-700 bg-red-50 border-red-200" :
                        "text-gray-500 bg-gray-50 border-gray-200"
                      )}>
                        {conv.status === "BOT" ? "🤖 Bot" : conv.status}
                      </span>
                    </div>
                    <p className={cn("text-[10px] truncate", (conv.unreadCount || 0) > 0 ? "text-gray-800 font-semibold" : "text-gray-400")}>
                      {conv.lastMessage || "Conversation started"}
                    </p>
                  </div>

                  {(conv.unreadCount || 0) > 0 && (
                    <span className="shrink-0 min-w-[16px] h-[16px] px-1 bg-primary rounded-full text-white text-[8px] font-black flex items-center justify-center mt-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            MAIN CHAT AREA
            ════════════════════════════════════════════════════════════ */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white">

            {/* Chat Header — Clean 2-Row Non-Overlapping Layout */}
            <div className="bg-white border-b border-gray-100 shrink-0 shadow-sm">
              {/* Row 1: Profile & Actions */}
              <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-gray-50 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                    {(selected.guestName || "G")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-xs text-gray-900 truncate">{selected.guestName || `Chat #${selected.id}`}</h3>
                      {/* Client Online Status */}
                      {(() => {
                        const st = getClientStatus(selected);
                        return (
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border shrink-0",
                            st.isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", st.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
                            {st.text}
                          </span>
                        );
                      })()}
                      {/* Priority */}
                      {selected.priority && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0",
                          PRIORITIES.find(p => p.key === selected.priority)?.color || "text-gray-500 bg-gray-50 border-gray-200")}>
                          {PRIORITY_EMOJI[selected.priority]} {selected.priority}
                        </span>
                      )}
                      {/* Category */}
                      {selected.category && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", CATEGORY_COLORS[selected.category])}>
                          {selected.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* Takeover button */}
                  {selected.status !== "CLOSED" && (!selected.botEscalated || selected.status === "BOT") && (
                    <button
                      onClick={handleTakeover}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 transition shadow-sm flex items-center gap-1"
                      title="Stop AI replies and take over live chat"
                    >
                      ⚡ Stop AI
                    </button>
                  )}

                  {/* Priority dropdown */}
                  {isSupervisor && selected.status !== "CLOSED" && (
                    <div className="relative">
                      <button
                        onClick={() => { setPriorityDrop(d => !d); setCategoryDrop(false); setAssignDrop(false); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition"
                      >
                        {PRIORITY_EMOJI[selected.priority || "NORMAL"]} Priority <ChevronDown className="w-3 h-3" />
                      </button>
                      {priorityDrop && (
                        <div className="absolute right-0 top-7 z-30 bg-white border border-gray-100 rounded-xl shadow-xl py-1 min-w-[130px]">
                          {PRIORITIES.map(p => (
                            <button key={p.key} onClick={() => handlePriority(p.key)}
                              className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2",
                                selected.priority === p.key && "bg-primary/5 font-bold text-primary")}>
                              {PRIORITY_EMOJI[p.key]} {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category dropdown */}
                  {isSupervisor && selected.status !== "CLOSED" && (
                    <div className="relative">
                      <button
                        onClick={() => { setCategoryDrop(d => !d); setPriorityDrop(false); setAssignDrop(false); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition"
                      >
                        <Tag className="w-3 h-3" /> Category <ChevronDown className="w-3 h-3" />
                      </button>
                      {categoryDrop && (
                        <div className="absolute right-0 top-7 z-30 bg-white border border-gray-100 rounded-xl shadow-xl py-1 min-w-[140px]">
                          {["TOUR", "HOTEL", "TAXI", "B2B", "B2C", "GENERAL"].map(cat => (
                            <button key={cat} onClick={() => handleCategory(cat)}
                              className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50",
                                selected.category === cat && "bg-primary/5 font-bold text-primary")}>
                              {DEPARTMENTS.find(d => d.key === cat)?.emoji} {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assign dropdown */}
                  {isSupervisor && selected.status !== "CLOSED" && selected.botEscalated && (
                    <div className="relative">
                      <button
                        onClick={() => { setAssignDrop(d => !d); setPriorityDrop(false); setCategoryDrop(false); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1B3A6B] text-white text-[10px] font-bold hover:bg-[#1B3A6B]/90 transition-all"
                      >
                        <User2 className="w-3 h-3" /> Assign <ChevronDown className="w-3 h-3" />
                      </button>
                      {assignDropdown && (
                        <div className="absolute right-0 top-7 z-30 bg-white border border-gray-100 rounded-xl shadow-xl py-1 min-w-[190px] max-h-[220px] overflow-y-auto">
                          {agents.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-gray-400 text-center">No chat agents configured</p>
                          ) : (
                            agents.map(agent => (
                              <button key={agent.id} onClick={() => handleAssign(agent)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">
                                  {(agent.displayName || agent.name || "?")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">{agent.displayName || agent.name}</p>
                                  <p className="text-[9px] text-gray-400">{agent.department}</p>
                                </div>
                                {agent.isAvailable && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Close button */}
                  {selected.status === "OPEN" || selected.status === "ASSIGNED" ? (
                    <button
                      onClick={() => handleClose(selected.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg hover:bg-red-100 transition border border-red-100"
                    >
                      <XCircle className="w-3 h-3" /> Close
                    </button>
                  ) : null}

                  {/* Ban button */}
                  {isSupervisor && selected.status !== "SPAM" && selected.status !== "CLOSED" && (
                    <div className="relative">
                      <button
                        onClick={() => setBanConfirm(b => !b)}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50/80 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition"
                      >
                        <Shield className="w-3 h-3" /> Ban
                      </button>
                      {banConfirm && (
                        <div className="absolute right-0 top-7 z-30 bg-white border border-red-100 rounded-xl shadow-2xl p-3 min-w-[200px] text-center space-y-2">
                          <p className="text-xs font-bold text-gray-900">Ban this visitor?</p>
                          <p className="text-[10px] text-gray-500 leading-tight">Blocks IP and session permanently.</p>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setBanConfirm(false)} className="flex-1 py-1 text-xs border border-gray-200 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                            <button onClick={handleBan} className="flex-1 py-1 text-xs bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Ban</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Contact Info & Panel Switcher Bar */}
              <div className="px-4 py-1.5 bg-gray-50/60 flex items-center justify-between gap-2 text-[10px] text-gray-500 flex-wrap">
                <div className="flex items-center gap-3">
                  {selected.guestPhone && (
                    <a href={`tel:${selected.guestPhone}`} className="flex items-center gap-1 hover:text-primary transition-colors font-medium">
                      <Phone className="w-3 h-3 text-gray-400" /> {selected.guestPhone}
                    </a>
                  )}
                  {selected.guestEmail && (
                    <a href={`mailto:${selected.guestEmail}`} className="flex items-center gap-1 hover:text-primary transition-colors font-medium truncate max-w-[220px]">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" /> {selected.guestEmail}
                    </a>
                  )}
                  {selected.spamScore != null && selected.spamScore > 40 && (
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <AlertTriangle className="w-3 h-3" /> Spam: {selected.spamScore}
                    </span>
                  )}
                </div>

                {/* View panel switcher */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs">
                  {(["chat", "notes", "requirements"] as const).map(panel => (
                    <button
                      key={panel}
                      onClick={() => setSidebarPanel(panel)}
                      className={cn("px-2.5 py-1 text-[10px] font-bold capitalize transition-all",
                        sidebarPanel === panel ? "bg-[#1B3A6B] text-white" : "text-gray-500 hover:bg-gray-50")}
                    >
                      {panel === "chat" ? "💬 Chat" : panel === "notes" ? "📝 Notes" : "📋 Brief"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Panel: Chat ─────────────────────────────────────────── */}
            {sidebarPanel === "chat" && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5 bg-[#eef1f8]">
                  {loadingMsgs && <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                  {!loadingMsgs && messages.length === 0 && <div className="text-center py-12 text-gray-400"><p className="text-xs">No messages yet.</p></div>}

                  {messages.map((msg, i) => {
                    const isMe  = msg.senderRole === "ADMIN" || msg.senderRole === "AGENT";
                    const isBot = msg.senderRole === "BOT" || msg.isBot;
                    const text  = msgText(msg);
                    if (!text) return null;
                    return (
                      <div key={i} className={cn("flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                        {/* Role label */}
                        {!isMe && (
                          <div className="flex items-center gap-1 px-1">
                            {isBot ? <><Bot className="w-3 h-3 text-amber-500" /><span className="text-[9px] text-amber-600 font-bold">AI BOT</span></> : <><User2 className="w-3 h-3 text-slate-500" /><span className="text-[9px] text-slate-500 font-bold">GUEST</span></>}
                          </div>
                        )}
                        <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                          isMe ? "bg-[#1B3A6B] text-white rounded-tr-sm" :
                          isBot ? "bg-amber-50 text-slate-700 rounded-tl-sm border border-amber-100" :
                          "bg-white text-gray-800 rounded-tl-sm border border-gray-100")}>
                          <p className="whitespace-pre-line">{text}</p>
                          <div className={cn("flex items-center gap-1 mt-1 justify-end", isMe ? "text-white/60" : "text-gray-400")}>
                            <span className="text-[9px]">{formatTime(msg.createdAt)}</span>
                            {isMe && (msg.local ? <Check className="w-3 h-3 opacity-50" /> : <CheckCheck className="w-3 h-3 opacity-70" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {guestTyping && (
                    <div className="flex items-start">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 border border-gray-100">
                        {[0, 1, 2].map(j => <span key={j} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}
                        <span className="text-[9px] text-gray-400 ml-1">Guest typing…</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {(selected.status === "OPEN" || selected.status === "ASSIGNED") ? (
                  <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                    <input
                      value={input}
                      onChange={e => { setInput(e.target.value); emitAdminTyping(true); }}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Reply to ${selected.guestName || "guest"}…`}
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
                    <p className="text-xs text-gray-400 font-semibold">
                      {selected.status === "BOT" ? "🤖 AI Bot is handling this conversation." : "This conversation is closed."}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── Panel: Notes ────────────────────────────────────────── */}
            {sidebarPanel === "notes" && (
              <div className="flex-1 flex flex-col p-5 gap-4 overflow-hidden bg-[#f9fafb]">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-gray-800">Internal Staff Notes</h3>
                  <span className="text-[10px] text-gray-400">(Not visible to guest)</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {notes.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No notes yet. Add your first note below.</p>}
                  {notes.map(note => (
                    <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs text-gray-700 leading-relaxed">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-400">{note.authorName}</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400">{formatTime(note.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note…"
                    rows={3}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                    className="px-4 bg-[#1B3A6B] text-white rounded-xl text-xs font-bold hover:bg-[#1B3A6B]/90 disabled:opacity-40 transition shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Panel: Requirements Brief ────────────────────────────── */}
            {sidebarPanel === "requirements" && (
              <div className="flex-1 overflow-y-auto p-5 bg-[#f9fafb] space-y-4">
                {/* Customer Profile Card */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Client Profile</h4>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border",
                      selected.userId && selected.userId > 0
                        ? selected.category === "B2B"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                      {selected.userId && selected.userId > 0
                        ? selected.category === "B2B" ? "🤝 Registered B2B Partner" : "👤 Registered Traveler"
                        : "⚠️ Guest (Unregistered)"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700 space-y-1 pt-1">
                    <p><span className="font-semibold text-gray-500">Name:</span> {selected.guestName || "N/A"}</p>
                    <p><span className="font-semibold text-gray-500">Email:</span> {selected.guestEmail || "N/A"}</p>
                    <p><span className="font-semibold text-gray-500">Phone:</span> {selected.guestPhone || "N/A"}</p>
                    {selected.userId ? <p><span className="font-semibold text-gray-500">User ID:</span> #{selected.userId}</p> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-violet-500" />
                  <h3 className="font-bold text-sm text-gray-800">AI-Collected Requirements</h3>
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border ml-auto",
                    selected.category ? CATEGORY_COLORS[selected.category] : "text-gray-400 border-gray-200 bg-gray-50")}>
                    {selected.category || "GENERAL"}
                  </span>
                </div>

                {selected.requirementData && Object.keys(selected.requirementData).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(selected.requirementData).map(([key, val]) => (
                      <div key={key} className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-800 font-semibold">{val}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bot className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-xs text-gray-400">
                      {selected.botEscalated
                        ? "No structured requirements were collected before escalation."
                        : "Bot is still collecting requirements from the guest."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center bg-[#eef1f8] text-gray-400">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mb-5 border border-gray-100">
              <Headset className="w-10 h-10 opacity-10" />
            </div>
            <p className="text-sm font-black text-gray-700">Select a conversation</p>
            <p className="text-xs mt-2 max-w-[240px] text-center leading-relaxed text-gray-400">
              {isSupervisor
                ? "Pick a chat from the sidebar. Assign it to a department agent to handle."
                : "Pick a chat assigned to you to start replying."}
            </p>
          </div>
        )}
      </div>
    </div>
  </AdminLayout>
);
}
