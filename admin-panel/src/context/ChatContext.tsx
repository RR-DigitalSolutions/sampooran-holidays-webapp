/**
 * Global Chat Context for Admin Panel
 *
 * Establishes a single persistent Socket.io connection the moment
 * an admin logs in. Handles:
 * - Joining the "admins" room automatically
 * - Real-time conversation list updates
 * - Audio + visual notifications for new messages from any page
 * - Shared state used by Support.tsx
 */
import {
  createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth, API_BASE } from "./AuthContext";

/* ─── Types ──────────────────────────────────────────────────── */
export interface Conversation {
  id: number;
  userId: number;
  guestSessionId?: string;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  status: string;
  lastMessageAt: string;
  lastMessage?: string;
  lastMessageRole?: string;
  unreadCount?: number;
}

export interface ChatMsg {
  id?: number;
  conversationId?: number;
  senderId?: number | null;
  senderRole: string;
  content?: string;
  text?: string;
  createdAt?: string;
  local?: boolean;
  guestName?: string;
  sessionId?: string;
}

interface ChatContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  totalUnread: number;
  isConnected: boolean;
  socket: Socket | null;
  fetchConversations: () => Promise<void>;
  sendMessage: (payload: Record<string, unknown>) => void;
  latestToast: string | null;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}

/* ─── Helpers ──────────────────────────────────────────────────── */
const API = `${API_BASE}/api`;
const WS_URL = (import.meta as any).env?.VITE_WS_URL || "http://localhost:8080";

function getToken(): string {
  try {
    const raw = localStorage.getItem("sh_admin_token");
    if (!raw) return "";
    return JSON.parse(raw).token || "";
  } catch { return ""; }
}

function authHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

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

export function playPing() {
  try {
    initAudio();
    if (globalAudio) {
      globalAudio.currentTime = 0;
      globalAudio.play().catch(() => {});
    }
  } catch (_) {}
}

function showBrowserNotif(title: string, body: string, url = "/support") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/icon-192x192.png",
    tag: "sampooran-chat-admin",
    requireInteraction: true,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

/* ─── Provider ─────────────────────────────────────────────────── */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestToast, setLatestToast] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  const showToast = (msg: string) => {
    setLatestToast(msg);
    setTimeout(() => setLatestToast(null), 5000);
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/conversations`, { headers: authHeaders() });
      if (!res.ok) return;
      const data: Conversation[] = await res.json();
      setConversations(
        data.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      );
    } catch (_) {}
  }, []);

  // Establish Socket.io when user logs in
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const socket = io(WS_URL, {
      query: { userId: String(user.id) },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("admin:join");
      fetchConversations(); // load fresh conversations on connect
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("chat:message", (msg: ChatMsg) => {
      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== msg.conversationId) return c;
          const text = msg.content || msg.text || "";
          return {
            ...c,
            lastMessage: text,
            lastMessageRole: msg.senderRole,
            lastMessageAt: msg.createdAt || new Date().toISOString(),
            unreadCount: msg.senderRole === "USER" ? (c.unreadCount || 0) + 1 : c.unreadCount,
          };
        });
        return updated.sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });

      // Notify for incoming user messages
      if (msg.senderRole === "USER") {
        playPing();
        const msgBody = msg.content || msg.text || "New message";
        showToast(`💬 ${msg.guestName || "Visitor"}: ${msgBody}`);
        showBrowserNotif(
          `Chat from ${msg.guestName || "a visitor"}`,
          msgBody
        );
      }
    });

    socket.on("chat:new_conversation", (conv: Conversation) => {
      playPing();
      const toastMsg = `🔔 New chat from ${conv.guestName || "a visitor"} — ${conv.guestPhone || ""}`;
      showToast(toastMsg);
      showBrowserNotif(
        `New chat started!`,
        `${conv.guestName || "A visitor"} wants to talk. ${conv.guestPhone || ""}`
      );
      setConversations(prev => {
        if (prev.find(c => c.id === conv.id)) return prev;
        return [{ ...conv, unreadCount: 1 }, ...prev];
      });
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); setIsConnected(false); };
  }, [user, fetchConversations]);

  const sendMessage = useCallback((payload: Record<string, unknown>) => {
    socketRef.current?.emit("chat:message", payload);
  }, []);

  return (
    <ChatCtx.Provider value={{
      conversations, setConversations,
      totalUnread, isConnected,
      socket: socketRef.current,
      fetchConversations,
      sendMessage,
      latestToast,
    }}>
      {children}
    </ChatCtx.Provider>
  );
}
