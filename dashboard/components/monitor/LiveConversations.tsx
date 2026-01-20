"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Search, MessageSquare, Clock, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchRecentConversations, RecentConversation } from "@/lib/api/analytics";

interface LiveConversationsProps {
  className?: string;
}

export function LiveConversations({ className }: LiveConversationsProps) {
  const { isRTL } = useTranslation();
  const [filter, setFilter] = useState<"all" | "whatsapp" | "instagram" | "facebook" | "messenger">("all");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchRecentConversations(30);
      setConversations(data.items);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesFilter = filter === "all" || conv.platform === filter;
    const matchesSearch = conv.name.toLowerCase().includes(search.toLowerCase()) ||
                         conv.phone.includes(search) ||
                         conv.last_message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeConversations = filteredConversations.filter(c => c.status === "active");
  const inactiveConversations = filteredConversations.filter(c => c.status === "inactive");

  // Format time ago
  const getTimeAgo = (timeStr: string): string => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return isRTL ? "الآن" : "now";
      if (diffMins < 60) return isRTL ? `منذ ${diffMins} د` : `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return isRTL ? `منذ ${diffHours} س` : `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return isRTL ? `منذ ${diffDays} ي` : `${diffDays}d ago`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className={cn("bg-surface border border-border rounded-xl shadow-soft overflow-hidden h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className={cn(
          "flex items-center justify-between mb-3",
          isRTL && "flex-row-reverse"
        )}>
          <h3 className={cn(
            "text-sm font-semibold text-foreground flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <MessageSquare className="w-4 h-4 text-primary" />
            {isRTL ? "المحادثات" : "Conversations"}
          </h3>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="w-3 h-3 animate-spin text-muted" />}
            <Badge variant="primary">{filteredConversations.length}</Badge>
          </div>
        </div>

        {/* Search */}
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder={isRTL ? "البحث في المحادثات..." : "Search conversations..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />

        {/* Filters */}
        <div className={cn(
          "flex items-center gap-2 overflow-x-auto scrollbar-hide",
          isRTL && "flex-row-reverse"
        )}>
          {[
            { id: "all", label: isRTL ? "الكل" : "All", icon: "📱" },
            { id: "whatsapp", label: "WhatsApp", icon: "💬" },
            { id: "messenger", label: "Messenger", icon: "📘" },
            { id: "instagram", label: "Instagram", icon: "📷" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150",
                filter === f.id
                  ? "bg-primary text-white"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              )}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
        {loading && conversations.length === 0 ? (
          // Loading skeleton
          <div className="p-2 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                <div className="w-10 h-10 bg-surface-elevated rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-surface-elevated rounded mb-2" />
                  <div className="h-3 w-40 bg-surface-elevated rounded mb-1" />
                  <div className="h-3 w-32 bg-surface-elevated rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            {isRTL ? "لا توجد محادثات" : "No conversations found"}
          </div>
        ) : (
          <>
            {/* Active Conversations */}
            {activeConversations.length > 0 && (
              <div className="p-2">
                <p className={cn(
                  "text-xs font-semibold text-primary px-2 py-1",
                  isRTL && "text-end"
                )}>
                  {isRTL ? "نشط" : "Active"} ({activeConversations.length})
                </p>
                {activeConversations.map((conv) => (
                  <ConversationItem 
                    key={conv.id} 
                    conversation={conv} 
                    isRTL={isRTL}
                    timeAgo={getTimeAgo(conv.time)}
                  />
                ))}
              </div>
            )}

            {/* Inactive Conversations */}
            {inactiveConversations.length > 0 && (
              <div className="p-2 border-t border-border">
                <p className={cn(
                  "text-xs font-semibold text-muted px-2 py-1",
                  isRTL && "text-end"
                )}>
                  {isRTL ? "غير نشط" : "Inactive"} ({inactiveConversations.length})
                </p>
                {inactiveConversations.map((conv) => (
                  <ConversationItem 
                    key={conv.id} 
                    conversation={conv} 
                    isRTL={isRTL}
                    timeAgo={getTimeAgo(conv.time)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: RecentConversation;
  isRTL: boolean;
  timeAgo: string;
}

function ConversationItem({ conversation, isRTL, timeAgo }: ConversationItemProps) {
  const platformColors: Record<string, string> = {
    whatsapp: "text-whatsapp",
    facebook: "text-messenger",
    messenger: "text-messenger",
    instagram: "text-pink-500",
    telegram: "text-blue-500",
  };

  return (
    <button className={cn(
      "w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors",
      isRTL && "flex-row-reverse text-end"
    )}>
      <Avatar name={conversation.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isRTL && "flex-row-reverse"
        )}>
          <span className={cn("text-sm font-medium", platformColors[conversation.platform] || "text-foreground")}>
            {conversation.phone || conversation.name}
          </span>
          {conversation.status === "active" && (
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
          {conversation.escalated && (
            <span className="w-4 h-4 flex items-center justify-center text-xs font-bold bg-error text-white rounded-full">!</span>
          )}
        </div>
        <p className="text-sm text-foreground truncate">{conversation.name}</p>
        {conversation.last_message && (
          <p className="text-xs text-muted truncate">{conversation.last_message}</p>
        )}
        <p className={cn(
          "text-xs text-muted mt-1 flex items-center gap-1",
          isRTL && "flex-row-reverse justify-end"
        )}>
          <Clock className="w-3 h-3" />
          {timeAgo}
        </p>
      </div>
      {conversation.unread > 0 && (
        <span className="px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
          {conversation.unread}
        </span>
      )}
    </button>
  );
}
