"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Headset, Loader2,
  CheckCheck, Check, ChevronRight, Shield, BellRing
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getApiBaseAbsolute, getApiUrl } from "@/lib/api-url";

/* ── Types ─────────────────────────────────────────────────── */
interface GuestInfo { name: string; phone: string; email: string; }
interface Message {
  id?: number;
  senderId?: number | null;
  senderRole: string;
  content?: string;
  text?: string;
  createdAt?: string;
  local?: boolean; // optimistic message, not yet echoed from server
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || getApiBaseAbsolute();
const API_URL = getApiUrl();

/* ── Notification helpers ──────────────────────────────────── */
let globalAudio: HTMLAudioElement | null = null;

function initAudio() {
  if (typeof window === "undefined") return;
  if (!globalAudio) {
    globalAudio = new Audio("/notification.wav");
    globalAudio.volume = 0.5;
  }
}

if (typeof document !== "undefined") {
  const unlock = () => {
    initAudio();
    if (globalAudio) {
      globalAudio.play().then(() => {
        globalAudio!.pause();
        globalAudio!.currentTime = 0;
      }).catch(() => {});
    }
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
}

function playPing() {
  try {
    initAudio();
    if (globalAudio) {
      globalAudio.currentTime = 0;
      globalAudio.play().catch(() => {});
    }
  } catch (_) {}
}

async function requestNotifPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function showBrowserNotif(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: "sampooran-chat",
  });
  n.onclick = () => { window.focus(); n.close(); };
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/* ── ChatWidget ────────────────────────────────────────────── */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "chat">("form");
  const [guest, setGuest] = useState<GuestInfo>({ name: "", phone: "", email: "" });
  const [agreed, setAgreed] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [unread, setUnread] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionId = useRef<string>("");
  const [latestToast, setLatestToast] = useState<{title: string, body: string} | null>(null);

  // Restore guest info from localStorage on mount
  useEffect(() => {
    sessionId.current = getOrCreateSessionId();
    const saved = localStorage.getItem("chat_guest_info");
    if (saved) {
      const g: GuestInfo = JSON.parse(saved);
      setGuest(g);
      if (g.name && g.phone && g.email) setStep("chat");
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, adminTyping]);

  // Unread badge
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderRole !== "USER") setUnread(u => u + 1);
    }
  }, [messages]);

  useEffect(() => { if (isOpen) setUnread(0); }, [isOpen]);

  // Socket connect when chat step
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
        .then(data => { if (Array.isArray(data)) setMessages(data); })
        .catch(() => {});
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("chat:message", (msg: Message) => {
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.local && m.text === (msg.text || msg.content)));
        return [...filtered, msg];
      });
      // Play sound + browser notification for incoming admin messages
      if (msg.senderRole !== "USER") {
        playPing();
        const body = msg.content || msg.text || "You have a new message from our team!";
        showBrowserNotif("Sampooran Holidays Support", body);
        setLatestToast({ title: "New Message", body });
        setTimeout(() => setLatestToast(null), 5000);
      }
    });

    socket.on("chat:typing_admin", (data: { isTyping: boolean }) => {
      setAdminTyping(data.isTyping);
      if (data.isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setAdminTyping(false), 3000);
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [step]);

  const handleFormSubmit = () => {
    if (!guest.name.trim() || !guest.phone.trim() || !guest.email.trim()) {
      setFormErr("Please fill all fields.");
      return;
    }
    if (!/^\d{10}$/.test(guest.phone.replace(/\s/g, ""))) {
      setFormErr("Enter a valid 10-digit phone number.");
      return;
    }
    if (!agreed) { setFormErr("Please accept the privacy policy to continue."); return; }
    localStorage.setItem("chat_guest_info", JSON.stringify(guest));
    setFormErr("");
    // Request browser notification permission when user starts chat
    requestNotifPermission();
    setStep("chat");
  };

  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("chat:typing", { sessionId: sessionId.current, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", { sessionId: sessionId.current, isTyping: false });
    }, 1500);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socketRef.current) return;

    // Optimistic message
    const optimistic: Message = {
      senderRole: "USER",
      text,
      content: text,
      createdAt: new Date().toISOString(),
      local: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");

    socketRef.current.emit("chat:message", {
      sessionId: sessionId.current,
      guestName: guest.name,
      guestPhone: guest.phone,
      guestEmail: guest.email,
      role: "USER",
      text,
    });
  };

  const msgText = (m: Message) => m.content || m.text || "";

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-[100] flex flex-col items-end select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="mb-3 w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl overflow-hidden shadow-2xl flex flex-col bg-white border border-slate-200"
            style={{ height: step === "form" ? "auto" : "520px" }}
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Sampooran Support</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("w-2 h-2 rounded-full", isConnected && step === "chat" ? "bg-green-400" : "bg-white/40 animate-pulse")} />
                    <span className="text-[10px] font-semibold opacity-80 uppercase tracking-wider">
                      {step === "chat" ? (isConnected ? "Online" : "Connecting…") : "Live Chat"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── PRE-CHAT FORM ── */}
            {step === "form" && (
              <div className="p-5 flex flex-col gap-4">
                <div className="text-center pb-1">
                  <p className="text-sm font-bold text-slate-800">👋 Hi there! How can we help?</p>
                  <p className="text-xs text-slate-500 mt-1">Please share your details to start chatting with our team.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Your Full Name *"
                    value={guest.name}
                    onChange={e => setGuest(g => ({ ...g, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits) *"
                    value={guest.phone}
                    onChange={e => setGuest(g => ({ ...g, phone: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={guest.email}
                    onChange={e => setGuest(g => ({ ...g, email: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                </div>

                {formErr && <p className="text-xs text-red-500 font-medium -mt-1">{formErr}</p>}

                {/* Policy Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500 leading-relaxed">
                    I agree to the{" "}
                    <a href="/privacy-policy" target="_blank" className="text-primary underline">Privacy Policy</a>
                    {" "}and consent to being contacted by Sampooran Holidays team.
                  </span>
                </label>

                <button
                  onClick={handleFormSubmit}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all text-sm shadow-lg shadow-primary/20"
                >
                  Start Chat <ChevronRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <Shield className="w-3 h-3" /> Your info is safe with us
                </div>
              </div>
            )}

            {/* ── CHAT INTERFACE ── */}
            {step === "chat" && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f0f4f8]">
                  {/* Welcome bubble */}
                  {messages.length === 0 && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[82%]">
                        <p className="text-sm text-slate-700">Hello {guest.name.split(" ")[0]}! 👋</p>
                        <p className="text-xs text-slate-500 mt-1">How can we help with your trip today?</p>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => {
                    const isMe = msg.senderRole === "USER";
                    const text = msgText(msg);
                    const prev = messages[i - 1];
                    const showTime = !prev || prev.senderRole !== msg.senderRole ||
                      (new Date(msg.createdAt!).getTime() - new Date(prev.createdAt!).getTime()) > 60000;

                    return (
                      <div key={i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "max-w-[82%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative",
                            isMe
                              ? "bg-[#1B3A6B] text-white rounded-tr-none"
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                          )}
                        >
                          {text}
                          <div className={cn("flex items-center gap-1 mt-1 justify-end", isMe ? "text-white/60" : "text-slate-400")}>
                            <span className="text-[9px]">{formatTime(msg.createdAt)}</span>
                            {isMe && (
                              msg.local
                                ? <Check className="w-3 h-3 text-white/50" />
                                : <CheckCheck className="w-3 h-3 text-white/70" />
                            )}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {adminTyping && (
                    <div className="flex items-start">
                      <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5 border border-slate-100">
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-slate-400"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={input}
                    onChange={e => { setInput(e.target.value); emitTyping(); }}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !isConnected}
                    className="w-10 h-10 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 shrink-0"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen(o => !o)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative",
          isOpen ? "bg-slate-700 text-white" : "bg-[#1B3A6B] text-white"
        )}
        aria-label="Toggle chat"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      {/* Guest Toast Notification */}
      <AnimatePresence>
        {!isOpen && latestToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
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
    </div>
  );
}
