"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, Ban, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatPhoneE164, isPhoneLike } from "@/lib/formatters/phone";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  fetchConversations, 
  fetchWhatsAppChats,
  preloadTopChats,
  Conversation,
  WhatsAppChat
} from "@/lib/api/conversations";

const channelColors: Record<string, string> = {
  whatsapp: "bg-whatsapp",
  messenger: "bg-messenger",
  telegram: "bg-telegram",
  website: "bg-primary",
};

// Platform filter options
type PlatformFilter = "all" | "whatsapp" | "messenger" | "instagram";
type StatusFilter = "all" | "active" | "closed" | "escalated";

// Unified conversation item for display
interface UnifiedConversation {
  id: string;
  name: string;
  phone?: string;
  lastMessage: string;
  lastMessageType?: string;
  updatedAt: string;
  channel: string;
  unreadCount: number;
  escalated: boolean;
  isWhatsApp: boolean;
  isGroup: boolean;
  isBanned: boolean;
  profilePic?: string | null;
  remoteJid?: string;
}

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string, isWhatsApp?: boolean) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("whatsapp");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [whatsappCount, setWhatsappCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const { t, isRTL } = useTranslation();
  
  const ITEMS_PER_PAGE = 50;

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return phone;
    return isPhoneLike(phone) ? formatPhoneE164(phone) : phone;
  };

  // Convert chat to unified format
  const chatToUnified = (chat: WhatsAppChat): UnifiedConversation => {
    let displayName = chat.name;
    const isJustNumber = displayName.replace(/\D/g, '').length === displayName.length;
    if ((isJustNumber && displayName.length > 10) || isPhoneLike(displayName)) {
      displayName = formatPhoneForDisplay(displayName);
    }
    
    return {
      id: chat.remote_jid,
      name: displayName,
      phone: chat.phone,
      lastMessage: chat.last_message,
      lastMessageType: chat.last_message_type,
      updatedAt: chat.last_message_time,
      channel: "whatsapp",
      unreadCount: chat.unread_count,
      escalated: false,
      isWhatsApp: true,
      isGroup: chat.is_group,
      isBanned: chat.is_banned || false,
      profilePic: chat.profile_pic,
      remoteJid: chat.remote_jid,
    };
  };

  const loadConversations = useCallback(async (isLoadMore = false, nextPage?: number) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setPage(1);
    }
    
    const currentPage = nextPage || (isLoadMore ? page : 1);
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    
    try {
      if (platformFilter === "whatsapp") {
        // Load directly from Evolution API
        const data = await fetchWhatsAppChats(ITEMS_PER_PAGE, undefined, offset);
        setWhatsappCount(data.total);
        
        // Deduplicate by id/remote_jid on frontend as well
        const existingIds = isLoadMore 
          ? new Set(conversations.map(c => c.id))
          : new Set<string>();
        
        const newUnified: UnifiedConversation[] = [];
        
        for (const chat of data.items) {
          if (existingIds.has(chat.remote_jid)) continue;
          existingIds.add(chat.remote_jid);
          newUnified.push(chatToUnified(chat));
        }
        
        if (isLoadMore) {
          setConversations(prev => [...prev, ...newUnified]);
        } else {
          setConversations(newUnified);
          // Preload top 5 chats for instant opening
          const chatIds = newUnified.map(c => c.id);
          preloadTopChats(chatIds, 5);
        }
        
        // Check if there are more items
        const totalLoaded = offset + data.items.length;
        setHasMore(totalLoaded < data.total);
        
      } else {
        // Load from MongoDB
        const status = statusFilter === "all" ? undefined : statusFilter === "escalated" ? "active" : statusFilter;
        const escalated = statusFilter === "escalated" ? true : undefined;
        const channel = platformFilter === "all" ? undefined : platformFilter;
        
        const data = await fetchConversations(status, escalated, ITEMS_PER_PAGE, offset, channel);
        
        const newUnified: UnifiedConversation[] = data.items.map((conv: Conversation) => ({
          id: conv.id,
          name: conv.user?.name || conv.user?.phone || "مجهول",
          phone: conv.user?.phone,
          lastMessage: conv.last_message || `${conv.message_count} رسالة`,
          updatedAt: conv.updated_at,
          channel: conv.channel,
          unreadCount: 0,
          escalated: conv.escalated,
          isWhatsApp: false,
          isGroup: false,
          isBanned: false,
          profilePic: null,
        }));
        
        if (isLoadMore) {
          setConversations(prev => [...prev, ...newUnified]);
        } else {
          setConversations(newUnified);
        }
        
        setHasMore(data.items.length === ITEMS_PER_PAGE);
        
        // Also fetch WhatsApp count for badge
        if (platformFilter === "all" && !isLoadMore) {
          const waData = await fetchWhatsAppChats(1);
          setWhatsappCount(waData.total);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [platformFilter, statusFilter, page, conversations]);

  useEffect(() => {
    loadConversations(false);
    
    // Auto-refresh every 10 seconds (don't refresh too often with pagination)
    const interval = setInterval(() => loadConversations(false), 10000);
    return () => clearInterval(interval);
  }, [platformFilter, statusFilter]);
  
  // Load more when scrolling to bottom
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadConversations(true, nextPage);
    }
  }, [loadingMore, hasMore, page, loadConversations]);
  
  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    // Load more when within 200px of bottom
    if (scrollBottom < 200 && !loadingMore && hasMore) {
      loadMore();
    }
  }, [loadMore, loadingMore, hasMore]);

  // Filter by search locally
  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      conv.name.toLowerCase().includes(searchLower) ||
      (conv.phone?.includes(search)) ||
      conv.lastMessage.toLowerCase().includes(searchLower)
    );
  });

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return "الآن";
      if (diffMins < 60) return `${diffMins}د`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}س`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}ي`;
    } catch {
      return "";
    }
  };

  const statusLabels = {
    all: t("conversations.all") || "الكل",
    active: t("conversations.active") || "نشط",
    closed: t("conversations.resolved") || "تم الحل",
    escalated: t("conversations.pending") || "تصعيد",
  };

  const platformLabels: Record<PlatformFilter, { label: string; icon: string }> = {
    all: { label: "الكل", icon: "📱" },
    whatsapp: { label: "واتس", icon: "💬" },
    messenger: { label: "مسنجر", icon: "📘" },
    instagram: { label: "انستا", icon: "📷" },
  };

  const handleSelect = (conv: UnifiedConversation) => {
    onSelect(conv.id, conv.isWhatsApp);
  };

  return (
    <div className={cn(
      "w-80 flex flex-col bg-surface shadow-soft h-full",
      isRTL ? "border-s border-border" : "border-e border-border"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse")}>
          <h2 className={cn(
            "text-lg font-bold text-foreground",
            isRTL ? "text-end" : "text-start"
          )}>
            {t("conversations.title") || "المحادثات"}
          </h2>
          <button 
            onClick={() => loadConversations(false)}
            className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
            title="تحديث"
          >
            <RefreshCw className={cn("w-4 h-4 text-muted", loading && "animate-spin")} />
          </button>
        </div>
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder={t("conversations.searchConversations") || "البحث في المحادثات..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Platform Filters */}
      <div className={cn(
        "flex items-center gap-1 p-2 border-b border-border flex-shrink-0",
        isRTL && "flex-row-reverse justify-end"
      )}>
        {(["all", "whatsapp", "messenger", "instagram"] as PlatformFilter[]).map((p) => {
          const isActive = platformFilter === p;
          const showLabel = p === "all" || p === "whatsapp"; // Only show labels for main filters
          
          return (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              title={platformLabels[p].label}
              className={cn(
                "flex items-center gap-1 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-all duration-150 border",
                showLabel ? "px-2" : "px-1.5",
                isActive
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface-elevated/30 text-muted border-border/50 hover:text-foreground hover:border-primary/30"
              )}
            >
              <span className="text-xs">{platformLabels[p].icon}</span>
              {showLabel && <span>{platformLabels[p].label}</span>}
              {p === "whatsapp" && whatsappCount > 0 && (
                <span className={cn(
                  "text-[9px] px-1 py-0.5 rounded-full font-bold min-w-[16px] text-center",
                  isActive ? "bg-white/25 text-white" : "bg-primary/15 text-primary"
                )}>
                  {whatsappCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Filters - only show when not filtering by WhatsApp from Evolution API */}
      {platformFilter !== "whatsapp" && (
        <div className={cn(
          "flex items-center gap-1 p-2 border-b border-border overflow-x-auto scrollbar-hide flex-shrink-0",
          isRTL && "flex-row-reverse"
        )}>
          {(["all", "active", "closed", "escalated"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors duration-150",
                statusFilter === f
                  ? "bg-surface-elevated text-foreground shadow-soft"
                  : "text-muted hover:text-foreground"
              )}
            >
              {statusLabels[f]}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-thin min-h-0"
        onScroll={handleScroll}
      >
        {loading && conversations.length === 0 ? (
          // Loading skeleton
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-4 border-b border-border animate-pulse">
                <div className="w-10 h-10 bg-surface-elevated rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-surface-elevated rounded mb-2" />
                  <div className="h-3 w-40 bg-surface-elevated rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">
            {platformFilter === "whatsapp" 
              ? "لا توجد محادثات WhatsApp"
              : "لا توجد محادثات"
            }
          </div>
        ) : (
          <>
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv)}
              className={cn(
                "w-full flex items-start gap-3 p-3 transition-colors border-b border-border",
                selectedId === conv.id
                  ? "bg-primary/10"
                  : "hover:bg-surface-elevated/50",
                isRTL && "flex-row-reverse text-end"
              )}
            >
              <div className="relative flex-shrink-0">
                <Avatar 
                  name={conv.name || conv.phone || "?"} 
                  src={conv.profilePic}
                  size="lg" 
                />
                <span
                  className={cn(
                    "absolute -bottom-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface",
                    channelColors[conv.channel] || channelColors.whatsapp,
                    isRTL ? "-left-0.5" : "-right-0.5"
                  )}
                />
                {conv.isGroup && (
                  <span
                    className={cn(
                      "absolute -top-0.5 w-4 h-4 rounded-full bg-surface-elevated flex items-center justify-center",
                      isRTL ? "-left-0.5" : "-right-0.5"
                    )}
                  >
                    <Users className="w-2.5 h-2.5 text-muted" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "flex items-center justify-between mb-0.5",
                  isRTL && "flex-row-reverse"
                )}>
                  <span 
                    className={cn(
                      "font-medium text-foreground truncate text-sm",
                      conv.isBanned && "text-error"
                    )}
                    dir={isPhoneLike(conv.name) || conv.name.startsWith("+") ? "ltr" : undefined}
                  >
                    {conv.name}
                    {conv.isBanned && <Ban className="w-3 h-3 inline ml-1 text-error" />}
                  </span>
                  <span className="text-xs text-muted flex-shrink-0 mr-2">
                    {getTimeAgo(conv.updatedAt)}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold bg-primary text-white rounded-full">
                  {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                </span>
              )}
              {conv.escalated && (
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-bold bg-error text-white rounded-full">
                  !
                </span>
              )}
            </button>
          ))}
          
          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">جاري التحميل...</span>
            </div>
          )}
          
          {/* End of list message */}
          {!hasMore && conversations.length > ITEMS_PER_PAGE && (
            <div className="text-center py-4 text-muted text-xs">
              تم عرض كل المحادثات ({conversations.length})
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
