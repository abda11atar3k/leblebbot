"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Search, MessageSquare, Clock, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Conversation {
  id: string;
  phone: string;
  name: string;
  lastMessage: string;
  time: string;
  platform: "whatsapp" | "facebook" | "instagram";
  status: "active" | "inactive";
  unread?: number;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    phone: "20120358l871",
    name: "أحمد محمد",
    lastMessage: "سعر القطعة الواحدة من الماسك الفحمي هو 150 جنيه...",
    time: "منذ دقيقة",
    platform: "whatsapp",
    status: "active",
    unread: 2,
  },
  {
    id: "2",
    phone: "2424779241490424a",
    name: "سارة أحمد",
    lastMessage: "بخصوص شي / شارع جونير - ميدان المحور - أمام محطة...",
    time: "منذ 3 دقائق",
    platform: "whatsapp",
    status: "active",
  },
  {
    id: "3",
    phone: "201223406876",
    name: "محمد حسن",
    lastMessage: "شكراً يا فندم على المعلومات، هل تريد أن أضيف السمر...",
    time: "منذ 5 دقائق",
    platform: "whatsapp",
    status: "inactive",
  },
  {
    id: "4",
    phone: "20109866700O",
    name: "فاطمة علي",
    lastMessage: "الطلب تم بنجاح، شكراً لتعاملك معنا",
    time: "منذ 10 دقائق",
    platform: "facebook",
    status: "inactive",
  },
];

interface LiveConversationsProps {
  className?: string;
}

export function LiveConversations({ className }: LiveConversationsProps) {
  const { t, isRTL } = useTranslation();
  const [filter, setFilter] = useState<"all" | "whatsapp" | "instagram" | "facebook">("all");
  const [search, setSearch] = useState("");

  const filteredConversations = mockConversations.filter(conv => {
    const matchesFilter = filter === "all" || conv.platform === filter;
    const matchesSearch = conv.name.toLowerCase().includes(search.toLowerCase()) ||
                         conv.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const activeConversations = filteredConversations.filter(c => c.status === "active");
  const inactiveConversations = filteredConversations.filter(c => c.status === "inactive");

  const platformColors = {
    whatsapp: "bg-whatsapp",
    facebook: "bg-messenger",
    instagram: "bg-pink-500",
  };

  return (
    <div className={cn("bg-surface border border-border rounded-xl shadow-soft overflow-hidden", className)}>
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
          <Badge variant="primary">{filteredConversations.length}</Badge>
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
            { id: "instagram", label: "Instagram", icon: "📷" },
            { id: "facebook", label: "Facebook", icon: "📘" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
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

      {/* Active Conversations */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {activeConversations.length > 0 && (
          <div className="p-2">
            <p className={cn(
              "text-xs font-semibold text-primary px-2 py-1",
              isRTL && "text-end"
            )}>
              activeConversations
            </p>
            {activeConversations.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} isRTL={isRTL} />
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
              INACTIVE CHATS
            </p>
            {inactiveConversations.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} isRTL={isRTL} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isRTL }: { conversation: Conversation; isRTL: boolean }) {
  const platformColors = {
    whatsapp: "text-whatsapp",
    facebook: "text-messenger",
    instagram: "text-pink-500",
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
          <span className={cn("text-sm font-medium", platformColors[conversation.platform])}>
            {conversation.phone}
          </span>
          {conversation.status === "active" && (
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
        </div>
        <p className="text-sm text-foreground truncate">{conversation.name}</p>
        <p className="text-xs text-muted truncate">{conversation.lastMessage}</p>
        <p className={cn(
          "text-xs text-muted mt-1 flex items-center gap-1",
          isRTL && "flex-row-reverse justify-end"
        )}>
          <Clock className="w-3 h-3" />
          {conversation.time}
        </p>
      </div>
      {conversation.unread && conversation.unread > 0 && (
        <span className="px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
          {conversation.unread}
        </span>
      )}
    </button>
  );
}
