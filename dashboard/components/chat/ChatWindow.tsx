"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Send, Paperclip, Smile, MoreVertical, Phone, Bot, Sparkles, RefreshCw, Ban, Users, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "./MessageBubble";
import { formatPhoneE164, isPhoneLike } from "@/lib/formatters/phone";
import { 
  fetchConversation, 
  getWhatsAppMessages,
  sendChatMessage,
  sendWhatsAppMessage,
  banUser,
  unbanUser,
  registerCacheClearFn,
  Message as ApiMessage,
  ConversationDetailResponse,
  WhatsAppMessage,
  WhatsAppMessagesResponse
} from "@/lib/api/conversations";

interface Message {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  isBot?: boolean;
  status?: "sent" | "delivered" | "read";
  type?: string;
  senderName?: string;
  senderPic?: string | null;
  mediaUrl?: string | null;
  mediaMimetype?: string | null;
  mediaDuration?: number | null;
  mediaThumbnail?: string | null;
}

interface ChatWindowProps {
  conversationId: string | null;
  isWhatsApp?: boolean;
}

// Simple in-memory cache for messages and chat info (survives component remounts)
const messagesCache = new Map<string, Message[]>();
const chatInfoCache = new Map<string, WhatsAppMessagesResponse["chat"] | null>();

// Function to clear ChatWindow caches - exported for use when reconnecting WhatsApp
export function clearChatCaches() {
  messagesCache.clear();
  chatInfoCache.clear();
}

// Register the cache clear function
registerCacheClearFn(clearChatCaches);

export function ChatWindow({ conversationId, isWhatsApp = false }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationData, setConversationData] = useState<ConversationDetailResponse | null>(null);
  const [whatsappChatInfo, setWhatsappChatInfo] = useState<WhatsAppMessagesResponse["chat"] | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const lastKnownMessageIdRef = useRef<string | null>(null);
  const scrollRestoreRef = useRef<{ prevHeight: number; prevTop: number } | null>(null);
  const loadOlderInProgressRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { t, isRTL } = useTranslation();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const WS_BASE = API_BASE.replace(/^http/, "ws");

  const quickReplies = suggestions.length > 0 ? suggestions : [
    "هشوف ده ليك",
    "هحولك لمتخصص",
    "في حاجة تانية أساعدك فيها؟",
  ];

  // Common emojis for quick access
  const commonEmojis = [
    "😊", "😂", "❤️", "👍", "🙏", "😍", "🔥", "✨", "💯", "👋",
    "😅", "🤣", "😭", "😎", "🥰", "😘", "🤔", "👏", "💪", "🎉",
    "😢", "😡", "🥺", "😴", "🤝", "👌", "✅", "❌", "⭐", "💬"
  ];

  const handleEmojiClick = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    
    // TODO: Implement file upload to Evolution API
    // For now, show a message
    alert("سيتم إضافة رفع الملفات قريباً!");
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset paging/search when switching conversations
  useEffect(() => {
    setCurrentPage(1);
    setMessages([]);
    setSearchQuery("");
    setTotalMessages(null);
    setIsTyping(false);
    setNewMessagesCount(0);
    lastKnownMessageIdRef.current = null;
    lastMessageCountRef.current = 0;
  }, [conversationId]);

  // WebSocket presence/typing updates (if backend provides them)
  useEffect(() => {
    if (wsRef.current) return;
    const ws = new WebSocket(`${WS_BASE}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "presence") {
          const data = payload.data || {};
          if (conversationId && data.remote_jid === conversationId) {
            const presence = String(data.presence || "").toLowerCase();
            const typingStates = ["composing", "recording", "typing"];
            const isNowTyping = typingStates.includes(presence);
            setIsTyping(isNowTyping);

            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }

            if (isNowTyping) {
              typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
              }, 5000);
            }
          }
        }
      } catch {
        // Ignore malformed WS messages
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      ws.close();
      wsRef.current = null;
    };
  }, [WS_BASE, conversationId]);

  // Check if user is scrolled near bottom (within 100px)
  const checkIsAtBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const threshold = 100;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      const isNearTop = container.scrollTop <= threshold;
      setIsAtBottom(isNearBottom);
      setIsAtTop(isNearTop);
      if (isNearBottom) {
        setNewMessagesCount(0);
      }
      return isNearBottom;
    }
    return true;
  }, []);

  // Scroll to bottom using scrollTop for reliable behavior
  const scrollToBottom = useCallback((instant = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (instant) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
      setIsAtBottom(true);
      setNewMessagesCount(0);
    }
  }, []);

  const handleLoadOlder = useCallback(() => {
    if (!conversationId || !isWhatsApp || loadingOlder) return;
    if (messagesContainerRef.current) {
      scrollRestoreRef.current = {
        prevHeight: messagesContainerRef.current.scrollHeight,
        prevTop: messagesContainerRef.current.scrollTop
      };
    }
    loadOlderInProgressRef.current = true;
    setLoadingOlder(true);
    setCurrentPage((prev: number) => prev + 1);
  }, [conversationId, isWhatsApp, loadingOlder]);

  const mapDeliveryStatus = useCallback((status?: number | string | null): Message["status"] => {
    if (status === null || status === undefined) return undefined;
    if (typeof status === "number") {
      if (status >= 3) return "read";
      if (status >= 2) return "delivered";
      if (status >= 1) return "sent";
      return "sent";
    }
    const normalized = String(status).toLowerCase();
    if (normalized.includes("read")) return "read";
    if (normalized.includes("deliver")) return "delivered";
    if (normalized.includes("sent")) return "sent";
    return undefined;
  }, []);

  // Background refresh - doesn't show loading spinner (page 1 only)
  const refreshConversation = useCallback(async () => {
    if (!conversationId) return;
    
    setIsRefreshing(true);
    
    try {
      if (isWhatsApp) {
        // Always refresh page 1 for new messages
        const data = await getWhatsAppMessages(conversationId, 50, 1);
        const cacheKey = `${conversationId}:50:1`;
        
        // Deduplicate messages by ID
        const seenIds = new Set<string>();
        const formattedMessages: Message[] = [];
        
        for (const msg of data.items) {
          if (seenIds.has(msg.id)) continue;
          seenIds.add(msg.id);
          
          formattedMessages.push({
            id: msg.id,
            content: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString("ar-EG", { 
              hour: "2-digit", 
              minute: "2-digit" 
            }),
            isOwn: msg.from_me,
            isBot: msg.from_me,
            status: mapDeliveryStatus(msg.status),
            type: msg.type,
            senderName: msg.sender_name,
            senderPic: msg.sender_pic,
            mediaUrl: msg.media_url,
            mediaMimetype: msg.media_mimetype,
            mediaDuration: msg.media_duration,
            mediaThumbnail: msg.media_thumbnail,
          });
        }
        
        // Save to cache
        messagesCache.set(cacheKey, formattedMessages);
        chatInfoCache.set(cacheKey, data.chat);
        
        // Update state - only replace if on page 1
        setWhatsappChatInfo(data.chat);
        setConversationData(null);
        if (currentPage === 1) {
          setMessages(formattedMessages);
        }
        setTotalMessages(data.total);
      } else {
        const data = await fetchConversation(conversationId);
        
        if (data) {
          const formattedMessages: Message[] = data.messages.map((msg: ApiMessage) => ({
            id: msg.id,
            content: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString("ar-EG", { 
              hour: "2-digit", 
              minute: "2-digit" 
            }),
            isOwn: msg.role === "assistant",
            isBot: msg.role === "assistant",
            status: "read" as const,
          }));
          
          messagesCache.set(conversationId, formattedMessages);
          setConversationData(data);
          setWhatsappChatInfo(null);
          setMessages(formattedMessages);
          setTotalMessages(formattedMessages.length);
        }
      }
    } catch (error) {
      console.error("Error refreshing conversation:", error);
    }
    
    setIsRefreshing(false);
    setLoading(false);
    setLoadingOlder(false);
  }, [conversationId, isWhatsApp, currentPage, mapDeliveryStatus]);

  // INSTANT: Load cached data synchronously before paint
  useLayoutEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setWhatsappChatInfo(null);
      setInitialScrollDone(false);
      return;
    }
    // Only use cache for page 1
    const cacheKey = isWhatsApp ? `${conversationId}:50:1` : conversationId;
    const cached = messagesCache.get(cacheKey);
    const cachedInfo = chatInfoCache.get(cacheKey);
    
    if (cached && cached.length > 0 && currentPage === 1) {
      // INSTANT display from cache
      setMessages(cached);
      setWhatsappChatInfo(cachedInfo || null);
      setInitialScrollDone(true);
      lastMessageCountRef.current = cached.length;
      setLoading(false);
    } else if (currentPage === 1) {
      // No cache - show loading
      setMessages([]);
      setWhatsappChatInfo(null);
      setInitialScrollDone(false);
      lastMessageCountRef.current = 0;
      setLoading(true);
    }
    setNewMessagesCount(0);
  }, [conversationId, isWhatsApp, currentPage]);

  // Helper to format messages from API response
  const formatMessages = useCallback((items: any[]): Message[] => {
    const seenIds = new Set<string>();
    const formatted: Message[] = [];
    
    for (const msg of items) {
      if (seenIds.has(msg.id)) continue;
      seenIds.add(msg.id);
      
      formatted.push({
        id: msg.id,
        content: msg.content,
        time: new Date(msg.timestamp).toLocaleTimeString("ar-EG", { 
          hour: "2-digit", 
          minute: "2-digit" 
        }),
        isOwn: msg.from_me,
        isBot: msg.from_me,
        status: mapDeliveryStatus(msg.status),
        type: msg.type,
        senderName: msg.sender_name,
        senderPic: msg.sender_pic,
        mediaUrl: msg.media_url,
        mediaMimetype: msg.media_mimetype,
        mediaDuration: msg.media_duration,
        mediaThumbnail: msg.media_thumbnail,
      });
    }
    
    return formatted;
  }, [mapDeliveryStatus]);

  // Initial load and auto-refresh (page 1 only)
  useEffect(() => {
    if (!conversationId) return;
    
    // Don't run auto-refresh if we're loading older messages
    if (loadOlderInProgressRef.current) return;
    
    // Fetch fresh data for page 1
    const fetchPage1 = async () => {
      try {
        if (isWhatsApp) {
          const data = await getWhatsAppMessages(conversationId, 50, 1, true);
          const formattedMessages = formatMessages(data.items);
          
          setWhatsappChatInfo(data.chat);
          // Only update if we're on page 1 (no older messages loaded yet)
          if (currentPage === 1) {
            setMessages(formattedMessages);
          }
          setTotalMessages(data.total);
        }
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };
    
    fetchPage1();
    
    // Auto-refresh every 3 seconds for near real-time updates
    const interval = setInterval(() => {
      if (!loadOlderInProgressRef.current && !loadingOlder && currentPage === 1) {
        fetchPage1();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [conversationId, isWhatsApp, formatMessages, currentPage, loadingOlder]);

  // Load more messages when page changes (page > 1)
  useEffect(() => {
    if (!conversationId || !isWhatsApp || currentPage === 1) return;
    if (!loadOlderInProgressRef.current) return; // Only run when explicitly loading older
    
    const loadMorePages = async () => {
      try {
        const data = await getWhatsAppMessages(conversationId, 50, currentPage, true);
        const newMessages = formatMessages(data.items);
        
        // Prepend older messages to existing ones
        setMessages(prev => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
          return [...uniqueNew, ...prev];
        });
        setTotalMessages(data.total);
      } catch (error) {
        console.error("Error loading more:", error);
      } finally {
        setLoadingOlder(false);
        // Don't reset loadOlderInProgressRef here - let scroll restoration handle it
      }
    };
    
    loadMorePages();
  }, [conversationId, isWhatsApp, currentPage, formatMessages]);

  // Handle load more button click
  const handleLoadMore = useCallback(() => {
    if (loadingOlder || loadOlderInProgressRef.current) return;
    
    const container = messagesContainerRef.current;
    if (container) {
      scrollRestoreRef.current = {
        prevHeight: container.scrollHeight,
        prevTop: container.scrollTop
      };
    }
    
    loadOlderInProgressRef.current = true;
    setLoadingOlder(true);
    setCurrentPage((prev) => prev + 1);
  }, [loadingOlder]);

  // Track scroll position and auto-load older messages when near top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      checkIsAtBottom();
      
      // Auto-load older messages when scrolled near top (within 100px)
      const isNearTop = container.scrollTop < 100;
      const hasMoreMessages = totalMessages !== null && messages.length < totalMessages;
      
      if (isNearTop && hasMoreMessages && !loadingOlder && !loadOlderInProgressRef.current && isWhatsApp) {
        // Save scroll position for restoration
        scrollRestoreRef.current = {
          prevHeight: container.scrollHeight,
          prevTop: container.scrollTop
        };
        loadOlderInProgressRef.current = true;
        setLoadingOlder(true);
        setCurrentPage((prev) => prev + 1);
      }
    };
    
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkIsAtBottom, totalMessages, messages.length, loadingOlder, isWhatsApp]);

  // Restore scroll position after loading older messages
  useLayoutEffect(() => {
    if (loadOlderInProgressRef.current && scrollRestoreRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const { prevHeight } = scrollRestoreRef.current;
      const newHeight = container.scrollHeight;
      const heightDiff = newHeight - prevHeight;
      
      // Restore scroll position to keep user at same visual position
      if (heightDiff > 0) {
        container.scrollTop = heightDiff;
      }
      
      scrollRestoreRef.current = null;
      loadOlderInProgressRef.current = false;
    }
  }, [messages]);

  // Smart scroll behavior - only auto-scroll on initial load or when at bottom
  useLayoutEffect(() => {
    if (messages.length > 0) {
      const newCount = messages.length;
      const prevCount = lastMessageCountRef.current;
      const newestMessage = messages[messages.length - 1];
      const newestMessageId = newestMessage?.id;
      const lastKnownId = lastKnownMessageIdRef.current;
      
      // Skip auto-scroll if we're loading older messages (scroll restoration handles it)
      if (scrollRestoreRef.current !== null) {
        lastMessageCountRef.current = newCount;
        // Don't update lastKnownMessageIdRef here - older messages don't count as "new"
        return;
      }
      
      // Double RAF to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!initialScrollDone) {
            // First load - always scroll to bottom
            scrollToBottom(true);
            setInitialScrollDone(true);
            // Set initial known message ID
            lastKnownMessageIdRef.current = newestMessageId || null;
          } else if (newestMessageId && newestMessageId !== lastKnownId && !newestMessage?.isOwn) {
            // New message from others arrived (different ID than last known)
            // This is a truly new incoming message
            if (isAtBottom) {
              // At bottom - scroll smoothly
              scrollToBottom(false);
            } else {
              // Not at bottom - show indicator for new incoming messages only
              setNewMessagesCount(prev => prev + 1);
            }
            lastKnownMessageIdRef.current = newestMessageId;
          } else if (newestMessage?.isOwn && newestMessageId !== lastKnownId) {
            // Own message - always scroll and update tracking
            scrollToBottom(false);
            lastKnownMessageIdRef.current = newestMessageId;
          }
          lastMessageCountRef.current = newCount;
        });
      });
    }
  }, [messages, initialScrollDone, scrollToBottom, isAtBottom]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const messageText = input;
    
    // Add message to UI immediately
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      content: messageText,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      status: "sent",
    };
    setMessages([...messages, newMessage]);
    setInput("");
    setSending(true);
    scrollToBottom();
    
    // For WhatsApp chats, send directly via WhatsApp endpoint
    if (isWhatsApp && conversationId) {
      const result = await sendWhatsAppMessage(conversationId, messageText);
      
      setSending(false);
      
      if (result.success) {
        // Reload to get actual sent message from WhatsApp
        setTimeout(refreshConversation, 1000);
      } else {
        // Show error - could add error toast here
        console.error("Failed to send WhatsApp message:", result.error);
      }
      return;
    }
    
    // For other channels, use AI chat endpoint
    let userPhone: string | undefined;
    let channel = "whatsapp";
    
    if (conversationData?.user?.phone) {
      userPhone = conversationData.user.phone;
      channel = conversationData.conversation.channel;
    }
    
    if (!userPhone) {
      console.error("No user phone found");
      setSending(false);
      return;
    }
    
    // Send via AI chat API
    const response = await sendChatMessage({
      phone: userPhone,
      message: messageText,
      channel: channel,
    });
    
    setSending(false);
    
    if (response.success && response.suggestions) {
      setSuggestions(response.suggestions);
    }
    
    // Reload conversation to get updated messages
    setTimeout(refreshConversation, 1000);
  };

  const handleBanToggle = async () => {
    const phone = isWhatsApp ? whatsappChatInfo?.phone : conversationData?.user?.phone;
    if (!phone) return;
    
    if (isBanned) {
      const success = await unbanUser(phone);
      if (success) setIsBanned(false);
    } else {
      const success = await banUser(phone, "Banned from chat");
      if (success) setIsBanned(true);
    }
    setShowMenu(false);
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Bot className="w-10 h-10 text-muted" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {t("conversations.noConversationSelected") || "لم يتم اختيار محادثة"}
          </h3>
          <p className="text-sm text-muted">
            {t("conversations.selectConversation") || "اختر محادثة من القائمة للبدء"}
          </p>
        </div>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Get customer info based on source
  let customerName = isWhatsApp 
    ? (whatsappChatInfo?.name || whatsappChatInfo?.phone || "مجهول")
    : (conversationData?.user?.name || conversationData?.user?.phone || "مجهول");
  
  if (isPhoneLike(customerName)) {
    customerName = formatPhoneE164(customerName);
  }
  
  const customerPic = isWhatsApp ? whatsappChatInfo?.profile_pic : null;
  const channel = isWhatsApp ? "whatsapp" : (conversationData?.conversation.channel || "whatsapp");
  const isGroup = isWhatsApp && whatsappChatInfo?.is_group;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const displayedMessages = normalizedQuery
    ? messages.filter((message) => {
        const contentMatch = message.content?.toLowerCase().includes(normalizedQuery);
        const senderMatch = message.senderName?.toLowerCase().includes(normalizedQuery);
        return contentMatch || senderMatch;
      })
    : messages;
  const hasMoreMessages = isWhatsApp && totalMessages !== null && messages.length < totalMessages;
  const showLoadMore = hasMoreMessages; // Always show when there are more messages
  const showTyping = isTyping || sending;

  return (
    <div className="flex-1 flex flex-col bg-background h-full min-h-0 relative">
      {/* Header */}
      <div className={cn(
        "h-16 flex items-center justify-between px-4 border-b border-border bg-surface shadow-soft flex-shrink-0",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <Avatar name={customerName} src={customerPic} size="lg" />
          <div className={isRTL ? "text-end" : "text-start"}>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              {customerName}
              {isGroup && <Users className="w-4 h-4 text-muted" />}
              {isBanned && <Ban className="w-4 h-4 text-error" />}
            </h3>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <span className="w-2 h-2 rounded-full bg-success" />
              {showTyping ? (
                <span className="text-xs text-primary">يكتب...</span>
              ) : (
                <span className="text-xs text-muted">{t("common.online") || "متصل"}</span>
              )}
              <Badge variant="primary" size="sm">
                {channel === "whatsapp" ? "WhatsApp" : 
                 channel === "messenger" ? "Messenger" :
                 channel === "telegram" ? "Telegram" : "Web"}
              </Badge>
              {isGroup && (
                <Badge variant="secondary" size="sm">مجموعة</Badge>
              )}
            </div>
          </div>
        </div>
        <div className={cn("flex items-center gap-2 relative", isRTL && "flex-row-reverse")}>
          <Button variant="ghost" size="sm" onClick={refreshConversation}>
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
          <div className={cn("relative", isRTL && "rtl:flip")}>
            <Search className={cn("w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2", isRTL ? "right-3" : "left-3")} />
            <input
              type="text"
              dir="auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث داخل المحادثة..."
              className={cn(
                "h-8 w-48 bg-surface-elevated border border-border rounded-lg text-xs px-8",
                "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
                isRTL ? "text-end" : "text-start"
              )}
            />
          </div>
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical className="w-4 h-4" />
            </Button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-50">
                <button
                  onClick={handleBanToggle}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-elevated transition-colors",
                    isBanned ? "text-success" : "text-error"
                  )}
                >
                  <Ban className="w-4 h-4" />
                  {isBanned ? "إلغاء الحظر" : "حظر المستخدم"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Load More Bar - Fixed at top */}
      {isWhatsApp && totalMessages !== null && messages.length < totalMessages && (
        <div className="flex justify-center py-2 border-b border-border bg-surface/80 backdrop-blur-sm">
          {loadingOlder ? (
            <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full bg-surface-elevated text-muted">
              <RefreshCw className="w-3 h-3 animate-spin" />
              جاري تحميل رسائل أقدم...
            </div>
          ) : (
            <button
              onClick={handleLoadMore}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
              تحميل رسائل أقدم ({messages.length} من {totalMessages})
            </button>
          )}
        </div>
      )}

      {/* Messages Container - scrollable area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin min-h-0 p-4"
      >
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted">
              لا توجد رسائل في هذه المحادثة
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted">
              لا توجد نتائج للبحث
            </div>
          ) : (
            displayedMessages.map((message) => (
              <MessageBubble 
                key={message.id} 
                {...message} 
                isRTL={isRTL}
                isGroup={isGroup}
                customerPic={customerPic}
                customerName={customerName}
                highlightQuery={normalizedQuery}
              />
            ))
          )}
        </div>
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* New Messages Indicator */}
      {newMessagesCount > 0 && !isAtBottom && (
        <button
          onClick={() => scrollToBottom(false)}
          className="absolute bottom-36 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all z-10 animate-in slide-in-from-bottom-2"
        >
          <ChevronDown className="w-4 h-4" />
          <span className="text-sm font-medium">
            {newMessagesCount} رسالة جديدة
          </span>
        </button>
      )}

      {/* Quick Replies */}
      <div className="px-4 py-2 border-t border-border bg-surface flex-shrink-0">
        <div className={cn(
          "flex items-center gap-2 overflow-x-auto scrollbar-hide",
          isRTL && "flex-row-reverse"
        )}>
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs text-muted whitespace-nowrap">
            {t("conversations.aiSuggestions") || "اقتراحات"}:
          </span>
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => setInput(reply)}
              className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-surface flex-shrink-0">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-2 p-2 bg-surface-elevated border border-border rounded-xl">
            <div className="flex flex-wrap gap-1">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-1.5 hover:bg-surface rounded-lg transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors"
            title="إرفاق ملف"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={cn(
              "p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors",
              showEmojiPicker && "bg-surface-elevated text-foreground"
            )}
            title="إضافة إيموجي"
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
            placeholder={t("conversations.typeMessage") || "اكتب رسالة..."}
            className={cn(
              "flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
              isRTL ? "text-end" : "text-start"
            )}
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending}>
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className={cn("w-4 h-4", isRTL && "rtl:flip")} />
            )}
            {t("common.send") || "إرسال"}
          </Button>
        </div>
      </div>
    </div>
  );
}
