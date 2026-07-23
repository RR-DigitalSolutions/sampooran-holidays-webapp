"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sampooran Holidays — Smart Chat Widget v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Features:
 *  - AI Bot pre-screening with clear "🤖 AI Assistant" disclosure
 *  - Quick reply buttons (tap-to-select)
 *  - Requirement collection progress with step indicator
 *  - Smooth human handoff animation
 *  - Spam/block error handling
 *  - Read receipts (✓ sent, ✓✓ read by agent)
 *  - Browser notifications + audio
 *  - Draggable floating widget
 *  - Unread badge counter
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Headset, Loader2,
  CheckCheck, Check, ChevronRight, Shield, BellRing,
  Bot, User2, AlertTriangle, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiBaseAbsolute, getApiUrl } from "@/lib/api-url";
import SampoornaAvatar from "./SampoornaAvatar";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface GuestInfo { name: string; phone: string; email: string; }

interface QuickReply { id: string; label: string; value: string; }

interface Message {
  id?: number;
  senderId?: number | null;
  senderRole: string; // 'USER' | 'BOT' | 'ADMIN' | 'AGENT'
  content?: string;
  text?: string;
  createdAt?: string;
  local?: boolean;
  isBot?: boolean;
  quickReplies?: QuickReply[];
  recommendations?: any[];
  metadata?: string | null; // JSON string
}

/* ── Typewriter Animated Text Stream Component ────────────────────────────── */
function TypewriterText({ text, isLatest }: { text: string; isLatest: boolean }) {
  const [displayed, setDisplayed] = useState(isLatest ? "" : text);

  useEffect(() => {
    if (!isLatest) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 14);
    return () => clearInterval(timer);
  }, [text, isLatest]);

  return (
    <div className="text-sm leading-relaxed whitespace-pre-line text-slate-800">
      {displayed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1")}
      {isLatest && displayed.length < text.length && (
        <span className="inline-block w-1.5 h-3 bg-[#1B3A6B] ml-1 animate-pulse rounded-xs" />
      )}
    </div>
  );
}

function getRecommendationsFromMeta(m: Message): any[] {
  if (m.recommendations && m.recommendations.length > 0) return m.recommendations;
  if (m.metadata) {
    try {
      const meta = JSON.parse(m.metadata);
      if (meta.recommendations) return meta.recommendations;
    } catch {}
  }
  return [];
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const WS_URL  = process.env.NEXT_PUBLIC_WS_URL || getApiBaseAbsolute();
const API_URL = getApiUrl();

const CATEGORY_LABELS: Record<string, string> = {
  TOUR:    "Tour Packages",
  HOTEL:   "Hotel Bookings",
  TAXI:    "Transport / Taxi",
  B2B:     "B2B Sales",
  B2C:     "Customer Support",
  GENERAL: "Support Team",
};

/* ── Audio helpers ───────────────────────────────────────────────────────── */
let globalAudio: HTMLAudioElement | null = null;

function initAudio() {
  if (typeof window === "undefined" || globalAudio) return;
  globalAudio = new Audio("/notification.wav");
  globalAudio.volume = 0.5;
}

if (typeof document !== "undefined") {
  const unlock = () => {
    initAudio();
    globalAudio?.play().then(() => { globalAudio!.pause(); globalAudio!.currentTime = 0; }).catch(() => {});
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
}

function playPing() {
  try { initAudio(); if (globalAudio) { globalAudio.currentTime = 0; globalAudio.play().catch(() => {}); } } catch (_) {}
}

async function requestNotifPermission() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  await Notification.requestPermission();
}

function showBrowserNotif(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon: "/icon-192x192.png", tag: "sampooran-chat" });
  n.onclick = () => { window.focus(); n.close(); };
}

/* ── Session ─────────────────────────────────────────────────────────────── */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("chat_session_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("chat_session_id", id); }
  return id;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function msgText(m: Message): string { return m.content || m.text || ""; }

function getQuickReplies(m: Message): QuickReply[] {
  if (m.quickReplies) return m.quickReplies;
  if (m.metadata) {
    try { const meta = JSON.parse(m.metadata); return meta.quickReplies || []; } catch { return []; }
  }
  return [];
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function ChatWidget() {
  const [isOpen, setIsOpen]           = useState(false);
  const [step, setStep]               = useState<"form" | "chat">("form");
  const [guest, setGuest]             = useState<GuestInfo>({ name: "", phone: "", email: "" });
  const [agreed, setAgreed]           = useState(false);
  const [formErr, setFormErr]         = useState("");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [botTyping, setBotTyping]     = useState(false);
  const [unread, setUnread]           = useState(0);
  const [isEscalated, setIsEscalated] = useState(false); // bot → human
  const [category, setCategory]       = useState<string | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [isMuted, setIsMuted]         = useState(false);
  const [latestToast, setLatestToast] = useState<{ title: string; body: string } | null>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: -400, right: 20, top: -600, bottom: 50 });
  const [isReturning, setIsReturning]         = useState(false);
  const [agentInfo, setAgentInfo]             = useState<{ name: string; role: string } | null>(null);
  const [rotatingIndex, setRotatingIndex]     = useState(0);

  const ROTATING_TAGLINES = [
    "💬 Need Help? Chat with us!",
    "🏔️ Kashmir & Kerala Deals!",
    "⭐ Sampoorna AI Assistant",
    "🔥 Best Price Guaranteed!",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setRotatingIndex(prev => (prev + 1) % ROTATING_TAGLINES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const isSendingRef = useRef(false);

  const socketRef      = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionId      = useRef<string>("");

  /* ── Drag Constraints ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setDragConstraints({
      left: -window.innerWidth + 80, right: 20,
      top: -window.innerHeight + 150, bottom: 50,
    });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Restore session ──────────────────────────────────────────────────── */
  useEffect(() => {
    sessionId.current = getOrCreateSessionId();
    const saved = localStorage.getItem("chat_guest_info");
    if (saved) {
      try {
        const g: GuestInfo = JSON.parse(saved);
        setGuest(g);
        if (g.name && g.phone && g.email) setStep("chat");
      } catch {}
    }
  }, []);

  /* ── Auto-scroll ──────────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping, botTyping]);

  /* ── Unread badge ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderRole !== "USER") setUnread(u => u + 1);
    }
  }, [messages]);
  useEffect(() => { if (isOpen) setUnread(0); }, [isOpen]);

  /* ── Socket connection ────────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== "chat") return;

    const socket = io(WS_URL, {
      query: { sessionId: sessionId.current },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
      // Load history
      fetch(`${API_URL}/chat/history?sessionId=${sessionId.current}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data);
            setIsReturning(true); // Has prior messages — returning user!
            // Check if already escalated (human messages exist)
            const hasHuman = data.some(m => ["ADMIN", "AGENT"].includes(m.senderRole));
            if (hasHuman) setIsEscalated(true);
          }
        })
        .catch(() => {});
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("chat:message", (msg: Message) => {
      // Hide bot typing indicator when bot message arrives
      setBotTyping(false);

      // Deduplicate optimistic messages and prevent duplicate server broadcasts
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        const filtered = prev.filter(m => !(m.local && m.senderRole === msg.senderRole && msgText(m) === msgText(msg)));
        return [...filtered, msg];
      });

      // Parse quick replies from metadata if not already set
      if (!msg.quickReplies && msg.metadata) {
        try {
          const meta = typeof msg.metadata === "string" ? JSON.parse(msg.metadata) : msg.metadata;
          if (meta.quickReplies) msg.quickReplies = meta.quickReplies;
        } catch {}
      }


      // Detect escalation (human agent joined)
      if (["ADMIN", "AGENT"].includes(msg.senderRole)) {
        setIsEscalated(true);
        setAgentInfo({ name: "Travel Expert", role: msg.senderRole });
        playPing();
        const body = msgText(msg) || "An agent has joined your conversation.";
        showBrowserNotif("Sampooran Holidays Support", body);
        setLatestToast({ title: "🧑 Agent Connected", body });
        setTimeout(() => setLatestToast(null), 6000);
      }
    });

    // Agent has explicitly joined the conversation (admin:takeover)
    socket.on("chat:agent_joined", (data: { agentName?: string; role?: string }) => {
      setIsEscalated(true);
      const name = data.agentName || "Travel Expert";
      setAgentInfo({ name, role: data.role || "AGENT" });
      playPing();
      const body = `${name} is now ready to help you personally! 🎉`;
      showBrowserNotif("Sampooran Holidays — Expert Connected", body);
      setLatestToast({ title: "✅ Expert Connected!", body });
      setTimeout(() => setLatestToast(null), 8000);
    });

    socket.on("chat:typing_bot", (data: { isTyping: boolean }) => {
      setBotTyping(data.isTyping);
      if (data.isTyping) {
        if (botTypingTimerRef.current) clearTimeout(botTypingTimerRef.current);
        botTypingTimerRef.current = setTimeout(() => setBotTyping(false), 5000);
      }
    });

    socket.on("chat:typing_admin", (data: { isTyping: boolean }) => {
      setAgentTyping(data.isTyping);
      if (data.isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setAgentTyping(false), 3000);
      }
    });

    // Handle errors — only show user-visible codes (MUTED, BLOCKED, RATE_LIMITED)
    // SERVER_ERROR is suppressed to prevent false "Something went wrong" banners
    socket.on("chat:error", (err: { code: string; message: string; mutedUntil?: number }) => {
      const SHOW_CODES = ["MUTED", "BLOCKED", "RATE_LIMITED"];
      if (SHOW_CODES.includes(err.code)) {
        if (err.code === "MUTED") setIsMuted(true);
        setErrorMsg(err.message);
        setTimeout(() => setErrorMsg(null), 10000);
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [step]);

  /* ── 90s Heartbeat (also triggers proactive idle nudge on server) ──────── */
  useEffect(() => {
    if (step !== "chat") return;
    const interval = setInterval(() => {
      socketRef.current?.emit("chat:heartbeat", { sessionId: sessionId.current });
    }, 90_000); // 90s matches the proactive nudge threshold
    return () => clearInterval(interval);
  }, [step]);

  const [password, setPassword]       = useState("");
  const [isB2B, setIsB2B]             = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [wantRegister, setWantRegister] = useState(false);
  const [userAccount, setUserAccount]   = useState<any>(null);

  /* ── Form Submit ──────────────────────────────────────────────────────── */
  const handleFormSubmit = async () => {
    if (!guest.name.trim() || !guest.phone.trim() || !guest.email.trim()) {
      setFormErr("Please fill all required fields."); return;
    }
    if (!/^\d{10}$/.test(guest.phone.replace(/\s/g, ""))) {
      setFormErr("Enter a valid 10-digit phone number."); return;
    }
    if (!agreed) { setFormErr("Please accept the privacy policy to continue."); return; }

    // If password provided or register requested, perform in-chat registration / login
    if (wantRegister || password.trim()) {
      if (!password.trim()) { setFormErr("Please enter a password to register."); return; }
      try {
        const res = await fetch(`${API_URL}/auth/chat-register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: guest.name,
            email: guest.email,
            phoneNumber: guest.phone,
            password: password,
            isB2B: isB2B,
            companyName: companyName,
            sessionId: sessionId.current,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormErr(data.error || "Registration failed");
          return;
        }
        if (data.token) {
          localStorage.setItem("sh_token", data.token);
          setUserAccount(data.user);
        }
      } catch (err: any) {
        setFormErr("Network error during registration.");
        return;
      }
    }

    localStorage.setItem("chat_guest_info", JSON.stringify(guest));
    setFormErr("");
    requestNotifPermission();
    setStep("chat");
  };

  /* ── Typing emitter ───────────────────────────────────────────────────── */
  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("chat:typing", { sessionId: sessionId.current, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", { sessionId: sessionId.current, isTyping: false });
    }, 1500);
  }, []);

  /* ── Send message ─────────────────────────────────────────────────────── */
  const handleSend = useCallback((text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !socketRef.current || !isConnected || isSendingRef.current) return;
    isSendingRef.current = true;

    // Ensure session ID is always present — guard against race conditions
    const sid = sessionId.current || getOrCreateSessionId();
    if (!sid) return;
    if (!sessionId.current) sessionId.current = sid;

    const optimistic: Message = {
      senderRole: "USER", text: msg, content: msg,
      createdAt: new Date().toISOString(), local: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");

    socketRef.current.emit("chat:message", {
      sessionId: sid,
      guestName: guest.name,
      guestPhone: guest.phone,
      guestEmail: guest.email,
      role: "USER",
      text: msg,
    });

    setTimeout(() => { isSendingRef.current = false; }, 300);
  }, [input, guest, isConnected]);

  /* ── Quick reply tap ──────────────────────────────────────────────────── */
  const handleQuickReply = useCallback((value: string) => {
    handleSend(value);
  }, [handleSend]);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      dragMomentum={false}
      className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-[100] flex flex-col items-end select-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="mb-2 sm:mb-3 w-[calc(100vw-1.25rem)] sm:w-[380px] max-w-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col bg-white border border-slate-200"
            style={{ height: step === "form" ? "auto" : "min(580px, calc(100dvh - 160px))" }}
          >
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="bg-[#1B3A6B] px-5 py-4 flex items-center justify-between text-white shrink-0 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3">
                {isEscalated ? (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                    <Headset className="w-5 h-5 text-emerald-300" />
                  </div>
                ) : (
                  <SampoornaAvatar size="md" online={isConnected} />
                )}
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    {isEscalated ? "Sampooran Support" : "Sampoorna Concierge"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("w-2 h-2 rounded-full", isConnected && step === "chat" ? "bg-green-400" : "bg-white/40 animate-pulse")} />
                    <span className="text-[10px] font-semibold opacity-90 tracking-wider">
                      {step === "chat"
                        ? isConnected
                          ? isEscalated ? "Live Travel Expert" : "Online • Travel Assistant"
                          : "Connecting…"
                        : "Live Chat"
                      }
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                onPointerDown={e => e.stopPropagation()}
                className="p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Escalated Banner ─────────────────────────────────────── */}
            {step === "chat" && isEscalated && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center gap-2 shrink-0"
              >
                <Headset className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <p className="text-[10px] text-emerald-700 font-semibold">
                  ✅ A travel expert has joined your conversation!
                </p>
              </motion.div>
            )}

            {/* ── Content area ─────────────────────────────────────────── */}
            <div onPointerDown={e => e.stopPropagation()} className="flex-1 flex flex-col overflow-hidden bg-white">

              {/* ── PRE-CHAT FORM ─────────────────────────────────────── */}
              {step === "form" && (
                <div className="p-5 flex flex-col gap-4">
                  <div className="text-center pb-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#1B3A6B]/10 flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-7 h-7 text-[#1B3A6B]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">👋 Welcome to Sampooran Holidays!</p>
                    <p className="text-xs text-slate-500 mt-1">Our AI will gather your requirements before connecting you with a travel expert.</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <input type="text" placeholder="Your Full Name *"
                      value={guest.name}
                      onChange={e => setGuest(g => ({ ...g, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 transition"
                    />
                    <input type="tel" placeholder="Phone Number (10 digits) *"
                      value={guest.phone}
                      onChange={e => setGuest(g => ({ ...g, phone: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 transition"
                    />
                    <input type="email" placeholder="Email Address *"
                      value={guest.email}
                      onChange={e => setGuest(g => ({ ...g, email: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 transition"
                    />

                    {/* Registration Toggle */}
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex flex-col gap-2">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          🎁 Save Itinerary & Get ₹1,000 Bonus
                        </span>
                        <input type="checkbox" checked={wantRegister}
                          onChange={e => setWantRegister(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#1B3A6B] cursor-pointer"
                        />
                      </label>
                      {wantRegister && (
                        <div className="flex flex-col gap-2 pt-1">
                          <input type="password" placeholder="Create Account Password *"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#1B3A6B]"
                          />
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isB2B}
                              onChange={e => setIsB2B(e.target.checked)}
                              className="w-3.5 h-3.5 rounded accent-[#1B3A6B] cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-slate-700">Register as B2B Partner / Agency</span>
                          </label>
                          {isB2B && (
                            <input type="text" placeholder="Company / Agency Name *"
                              value={companyName}
                              onChange={e => setCompanyName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#1B3A6B]"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {formErr && <p className="text-xs text-red-500 font-medium -mt-1">{formErr}</p>}

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#1B3A6B] cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      I agree to the{" "}
                      <a href="/privacy-policy" target="_blank" className="text-[#1B3A6B] underline">Privacy Policy</a>
                      {" "}and consent to being contacted by Sampooran Holidays team.
                    </span>
                  </label>

                  <button
                    onClick={handleFormSubmit}
                    className="w-full bg-[#1B3A6B] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#1B3A6B]/90 active:scale-[0.98] transition-all text-sm shadow-lg shadow-[#1B3A6B]/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Chat with AI Assistant
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                    <Shield className="w-3 h-3" /> Your info is safe with us
                  </div>
                </div>
              )}

              {/* ── CHAT INTERFACE ─────────────────────────────────────── */}
              {step === "chat" && (
                <>
                  {/* Error banner */}
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center gap-2 shrink-0"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <p className="text-[10px] text-red-600 font-semibold">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f0f4f8]">

                    {/* Welcome bubble (empty state) */}
                    {messages.length === 0 && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%] border border-slate-100">
                          <div className="flex items-center gap-1.5 mb-1">
                            <SampoornaAvatar size="sm" online={false} />
                            <span className="text-xs font-bold text-[#1B3A6B]">Sampoorna</span>
                          </div>
                          {isReturning ? (
                            <>
                              <p className="text-sm text-slate-700">Welcome back, <strong>{guest.name.split(" ")[0]}</strong>! 🌟</p>
                              <p className="text-xs text-slate-500 mt-0.5">Great to have you again — how can I make your next trip amazing?</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-slate-700">Hello <strong>{guest.name.split(" ")[0]}</strong>! 👋</p>
                              <p className="text-xs text-slate-500 mt-0.5">I'm Sampoorna, your personal travel concierge. How can I help?</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Returning user welcome-back notification */}
                    {isReturning && messages.length > 0 && !agentInfo && (
                      <div className="flex justify-center my-1">
                        <span className="text-[10px] text-slate-400 bg-white border border-slate-100 rounded-full px-3 py-0.5 shadow-sm">
                          🔄 Resumed conversation · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    )}

                    {/* Agent Connected Banner */}
                    {agentInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex justify-center my-2"
                      >
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm text-xs text-emerald-700 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          ✅ {agentInfo.name} (Travel Expert) has joined your conversation!
                        </div>
                      </motion.div>
                    )}

                    {messages.map((msg, i) => {
                      const isMe  = msg.senderRole === "USER";
                      const isBot = msg.isBot || msg.senderRole === "BOT";
                      const isAgent = ["ADMIN", "AGENT"].includes(msg.senderRole);
                      const text  = msgText(msg);
                      const qr    = getQuickReplies(msg);
                      const recs  = getRecommendationsFromMeta(msg);

                      if (!text) return null;

                      return (
                        <div key={i} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                          {/* Role label for bot/agent */}
                          {!isMe && (
                            <div className="flex items-center gap-1.5 px-1">
                              {isBot ? (
                                <>
                                  <SampoornaAvatar size="sm" online={false} />
                                  <span className="text-[10px] text-[#1B3A6B] font-bold">Sampoorna</span>
                                </>
                              ) : isAgent ? (
                                <>
                                  <Headset className="w-3 h-3 text-emerald-600" />
                                  <span className="text-[9px] text-emerald-700 font-bold uppercase">Travel Expert</span>
                                </>
                              ) : null}
                            </div>
                          )}

                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative",
                              isMe
                                ? "bg-[#1B3A6B] text-white rounded-tr-none"
                                : isBot
                                  ? "bg-amber-50/90 text-slate-800 rounded-tl-none border border-amber-100"
                                  : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                            )}
                          >
                            {/* Animated Typewriter Text for Bot, static for User */}
                            {isBot ? (
                              <TypewriterText text={text} isLatest={i === messages.length - 1} />
                            ) : (
                              <div className={cn("text-sm leading-relaxed whitespace-pre-line", isMe ? "text-white" : "text-slate-800")}>
                                {text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1")}
                              </div>
                            )}

                            <div className={cn("flex items-center gap-1 mt-1 justify-end", isMe ? "text-white/60" : "text-slate-400")}>
                              <span className="text-[9px]">{formatTime(msg.createdAt)}</span>
                              {isMe && (msg.local ? <Check className="w-3 h-3 text-white/50" /> : <CheckCheck className="w-3 h-3 text-white/70" />)}
                            </div>
                          </motion.div>

                          {/* Recommendation Cards Carousel */}
                          {!isMe && recs.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-2.5 overflow-x-auto py-2 px-1 max-w-[95%] no-scrollbar my-1"
                            >
                              {recs.map((card: any, idx: number) => (
                                <div key={idx} className="shrink-0 w-[190px] bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col transition-all hover:shadow-lg">
                                  <div className="h-24 bg-slate-100 relative overflow-hidden">
                                    <img src={card.image || "/placeholder-package.jpg"} alt={card.title} className="w-full h-full object-cover" />
                                    <span className="absolute top-1.5 left-1.5 bg-[#1B3A6B] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                      {card.type}
                                    </span>
                                    {card.rating && (
                                      <span className="absolute top-1.5 right-1.5 bg-amber-400 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                        ★ {card.rating}
                                      </span>
                                    )}
                                  </div>
                                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                                    <div>
                                      <h4 className="font-bold text-[11px] text-slate-900 line-clamp-1">{card.title}</h4>
                                      {card.subtitle && <p className="text-[9px] text-slate-500 font-medium">{card.subtitle}</p>}
                                      {card.location && <p className="text-[8px] text-slate-400 mt-0.5 truncate">{card.location}</p>}
                                    </div>
                                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                      <p className="text-[11px] font-black text-[#1B3A6B]">{card.price}</p>
                                      <button
                                        onClick={() => handleQuickReply(`Book ${card.title}`)}
                                        className="px-2 py-1 bg-[#1B3A6B] text-white rounded-lg text-[9px] font-bold hover:bg-[#1B3A6B]/90 transition shadow-xs"
                                      >
                                        Book Now
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}

                          {/* Quick Replies (only for the last bot message with QRs) */}
                          {!isMe && qr.length > 0 && i === messages.length - 1 && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex flex-wrap gap-2 mt-1 max-w-[85%]"
                            >
                              {qr.map(reply => (
                                <button
                                  key={reply.id}
                                  onClick={() => handleQuickReply(reply.value)}
                                  className="px-3 py-1.5 bg-white border-2 border-[#1B3A6B]/20 text-[#1B3A6B] rounded-full text-xs font-semibold hover:bg-[#1B3A6B] hover:text-white hover:border-[#1B3A6B] transition-all active:scale-95 shadow-sm"
                                >
                                  {reply.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}

                    {/* Bot Typing indicator */}
                    {botTyping && (
                      <div className="flex items-start">
                        <div className="bg-amber-50/80 rounded-2xl rounded-tl-none px-3.5 py-2 shadow-sm flex items-center gap-2 border border-amber-100/80">
                          <SampoornaAvatar size="sm" online={false} />
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.span key={i}
                                className="w-1.5 h-1.5 rounded-full bg-amber-500"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-amber-800 font-medium">Sampoorna is typing…</span>
                        </div>
                      </div>
                    )}

                    {/* Agent Typing indicator */}
                    {agentTyping && (
                      <div className="flex items-start">
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 border border-slate-100">
                          <Headset className="w-3 h-3 text-emerald-500" />
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.span key={i}
                                className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] text-slate-400">Agent typing…</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Muted / Suspended Policy Notice */}
                  {isMuted && (
                    <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center justify-between text-red-700 text-xs font-bold shrink-0">
                      <span>🚫 Chat suspended due to policy violation.</span>
                    </div>
                  )}

                  {/* Input Bar — always contained, send button fully visible on all mobile sizes */}
                  <div className="px-2 sm:px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 shrink-0 w-full overflow-hidden">
                    <input
                      type="text"
                      disabled={isMuted || !isConnected}
                      placeholder={
                        isMuted
                          ? "🚫 Chat suspended for policy violation"
                          : !isConnected
                            ? "⏳ Connecting to server…"
                            : isEscalated
                              ? "Reply to your travel expert…"
                              : "Ask Sampoorna… or pick an option"
                      }
                      value={input}
                      onChange={e => { setInput(e.target.value); }}
                      onKeyDown={e => e.key === "Enter" && handleSend()}
                      className={cn(
                        "flex-1 min-w-0 border rounded-full px-3 py-2 sm:px-4 sm:py-2.5 text-[13px] sm:text-sm outline-none transition",
                        isMuted || !isConnected
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-slate-50 border-slate-200 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
                      )}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || !isConnected || isMuted}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1B3A6B] text-[#F5A623] flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 shrink-0 flex-none"
                      aria-label="Send message"
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Button & Rotating Tagline Badge ───────────────────────── */}
      <div className="relative flex items-center justify-end gap-2">
        {/* Rotating Text Pill (visible on both mobile & desktop when chat is closed) */}
        {!isOpen && (
          <AnimatePresence mode="wait">
            <motion.div
              key={rotatingIndex}
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              onClick={() => setIsOpen(true)}
              className="bg-[#1B3A6B] text-[#F5A623] text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-[#F5A623]/30 cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition-transform"
            >
              <span>{ROTATING_TAGLINES[rotatingIndex]}</span>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 shrink-0">
          {/* Rotating SVG Circular Ring */}
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
          >
            <path id="curve" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
            <text className="text-[7.5px] font-black uppercase tracking-[0.18em] fill-[#1B3A6B]">
              <textPath href="#curve" startOffset="0%">Chat with us • Sampooran Holidays • </textPath>
            </text>
          </motion.svg>

          {/* FAB Button */}
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setIsOpen(o => !o)}
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative cursor-pointer z-10 bg-[#1B3A6B] text-[#F5A623]"
            aria-label="Toggle chat"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              ) : (
                <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="animate-pulse">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-[#F5A623] text-[#F5A623]" />
                </motion.div>
              )}
            </AnimatePresence>

            {unread > 0 && !isOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[8px] sm:text-[10px] font-black rounded-full flex items-center justify-center shadow-lg z-20">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Toast Notification ─────────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && latestToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onPointerDown={e => e.stopPropagation()}
            className="absolute bottom-[70px] right-0 w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 cursor-pointer"
            onClick={() => { setIsOpen(true); setLatestToast(null); }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-[#1B3A6B] animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{latestToast.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{latestToast.body}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
