"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Send, Paperclip, Smile, MoreVertical, Phone, Bot, Sparkles, RefreshCw, Ban, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "./MessageBubble";
import { 
  fetchConversation, 
  getWhatsAppMessages,
  sendChatMessage,
  sendWhatsAppMessage,
  banUser,
  unbanUser,
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
}

interface ChatWindowProps {
  conversationId: string | null;
  isWhatsApp?: boolean;
}

// Simple in-memory cache for messages and chat info (survives component remounts)
const messagesCache = new Map<string, Message[]>();
const chatInfoCache = new Map<string, WhatsAppMessagesResponse["chat"] | null>();

export function ChatWindow({ conversationId, isWhatsApp = false }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationData, setConversationData] = useState<ConversationDetailResponse | null>(null);
  const [whatsappChatInfo, setWhatsappChatInfo] = useState<WhatsAppMessagesResponse["chat"] | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const { t, isRTL } = useTranslation();

  const quickReplies = suggestions.length > 0 ? suggestions : [
    "هشوف ده ليك",
    "هحولك لمتخصص",
    "في حاجة تانية أساعدك فيها؟",
  ];

  // Check if user is scrolled near bottom (within 100px)
  const checkIsAtBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const threshold = 100;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setIsAtBottom(isNearBottom);
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

  // Background refresh - doesn't show loading spinner
  const refreshConversation = useCallback(async () => {
    if (!conversationId) return;
    
    setIsRefreshing(true);
    
    try {
      if (isWhatsApp) {
        const data = await getWhatsAppMessages(conversationId, 50);
        
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
            status: "read" as const,
            type: msg.type,
            senderName: msg.sender_name,
            senderPic: msg.sender_pic,
            mediaUrl: msg.media_url,
            mediaMimetype: msg.media_mimetype,
            mediaDuration: msg.media_duration,
          });
        }
        
        // Save to cache
        messagesCache.set(conversationId, formattedMessages);
        chatInfoCache.set(conversationId, data.chat);
        
        // Update state
        setWhatsappChatInfo(data.chat);
        setConversationData(null);
        setMessages(formattedMessages);
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
        }
      }
    } catch (error) {
      console.error("Error refreshing conversation:", error);
    }
    
    setIsRefreshing(false);
    setLoading(false);
  }, [conversationId, isWhatsApp]);

  // INSTANT: Load cached data synchronously before paint
  useLayoutEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setWhatsappChatInfo(null);
      setInitialScrollDone(false);
      return;
    }
    
    const cached = messagesCache.get(conversationId);
    const cachedInfo = chatInfoCache.get(conversationId);
    
    if (cached && cached.length > 0) {
      // INSTANT display from cache
      setMessages(cached);
      setWhatsappChatInfo(cachedInfo || null);
      setInitialScrollDone(true);
      lastMessageCountRef.current = cached.length;
      setLoading(false);
    } else {
      // No cache - show loading
      setMessages([]);
      setWhatsappChatInfo(null);
      setInitialScrollDone(false);
      lastMessageCountRef.current = 0;
      setLoading(true);
    }
    setNewMessagesCount(0);
  }, [conversationId]);

  // Background fetch after instant cache display
  useEffect(() => {
    if (!conversationId) return;
    
    // Fetch fresh data in background
    refreshConversation();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(refreshConversation, 10000);
    return () => clearInterval(interval);
  }, [conversationId, isWhatsApp, refreshConversation]);

  // Track scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      checkIsAtBottom();
    };
    
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkIsAtBottom]);

  // Smart scroll behavior - only auto-scroll on initial load or when at bottom
  useLayoutEffect(() => {
    if (messages.length > 0) {
      const newCount = messages.length;
      const prevCount = lastMessageCountRef.current;
      
      // Double RAF to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!initialScrollDone) {
            // First load - always scroll to bottom
            scrollToBottom(true);
            setInitialScrollDone(true);
          } else if (newCount > prevCount) {
            // New messages arrived
            const newestMessage = messages[messages.length - 1];
            
            if (newestMessage?.isOwn) {
              // Own message - always scroll
              scrollToBottom(false);
            } else if (isAtBottom) {
              // At bottom - scroll smoothly
              scrollToBottom(false);
            } else {
              // Not at bottom - show indicator
              setNewMessagesCount(prev => prev + (newCount - prevCount));
            }
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
  const customerName = isWhatsApp 
    ? (whatsappChatInfo?.name || whatsappChatInfo?.phone || "مجهول")
    : (conversationData?.user?.name || conversationData?.user?.phone || "مجهول");
  
  const customerPic = isWhatsApp ? whatsappChatInfo?.profile_pic : null;
  const channel = isWhatsApp ? "whatsapp" : (conversationData?.conversation.channel || "whatsapp");
  const isGroup = isWhatsApp && whatsappChatInfo?.is_group;

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
              <span className="text-xs text-muted">{t("common.online") || "متصل"}</span>
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
        <div className={cn("flex items-center gap-1 relative", isRTL && "flex-row-reverse")}>
          <Button variant="ghost" size="sm" onClick={refreshConversation}>
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
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
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                {...message} 
                isRTL={isRTL}
                isGroup={isGroup}
                customerPic={customerPic}
                customerName={customerName}
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
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <button className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors">
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
