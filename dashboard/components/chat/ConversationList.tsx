"use client";

import { useState } from "react";
import { Search, Filter, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Conversation {
  id: string;
  customer: {
    name: string;
    avatar?: string;
  };
  lastMessage: string;
  time: string;
  channel: "whatsapp" | "messenger" | "telegram" | "website";
  status: "active" | "pending" | "resolved";
  unread: number;
}

const conversations: Conversation[] = [
  {
    id: "1",
    customer: { name: "أحمد محمد" },
    lastMessage: "محتاج مساعدة في الطلب #12345",
    time: "2د",
    channel: "whatsapp",
    status: "active",
    unread: 2,
  },
  {
    id: "2",
    customer: { name: "سارة أحمد" },
    lastMessage: "شكراً على المساعدة!",
    time: "5د",
    channel: "messenger",
    status: "resolved",
    unread: 0,
  },
  {
    id: "3",
    customer: { name: "عمر حسن" },
    lastMessage: "المنتج ده متوفر باللون الأزرق؟",
    time: "12د",
    channel: "telegram",
    status: "pending",
    unread: 1,
  },
  {
    id: "4",
    customer: { name: "فاطمة علي" },
    lastMessage: "عايزة أطلب استرجاع",
    time: "18د",
    channel: "whatsapp",
    status: "active",
    unread: 3,
  },
  {
    id: "5",
    customer: { name: "محمود سعيد" },
    lastMessage: "الطلب هيوصل امتى؟",
    time: "25د",
    channel: "website",
    status: "pending",
    unread: 0,
  },
  {
    id: "6",
    customer: { name: "نورا حسين" },
    lastMessage: "ممكن تتبع الشحنة؟",
    time: "32د",
    channel: "whatsapp",
    status: "active",
    unread: 1,
  },
];

const channelColors: Record<string, string> = {
  whatsapp: "bg-whatsapp",
  messenger: "bg-messenger",
  telegram: "bg-telegram",
  website: "bg-primary",
};

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "resolved">("all");
  const { t, isRTL } = useTranslation();

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || conv.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filterLabels = {
    all: t("conversations.all"),
    active: t("conversations.active"),
    pending: t("conversations.pending"),
    resolved: t("conversations.resolved"),
  };

  return (
    <div className={cn(
      "w-80 flex flex-col bg-surface shadow-soft",
      isRTL ? "border-s border-border" : "border-e border-border"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className={cn(
          "text-lg font-bold text-foreground mb-3",
          isRTL ? "text-end" : "text-start"
        )}>
          {t("conversations.title")}
        </h2>
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder={t("conversations.searchConversations")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className={cn(
        "flex items-center gap-1 p-2 border-b border-border overflow-x-auto scrollbar-hide",
        isRTL && "flex-row-reverse"
      )}>
        {(["all", "active", "pending", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all",
              filter === f
                ? "bg-primary text-white shadow-soft"
                : "text-muted hover:text-foreground hover:bg-surface-elevated"
            )}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full flex items-start gap-3 p-4 transition-colors border-b border-border",
              selectedId === conv.id
                ? "bg-primary/10"
                : "hover:bg-surface-elevated/50",
              isRTL && "flex-row-reverse text-end"
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar name={conv.customer.name} size="lg" />
              <span
                className={cn(
                  "absolute -bottom-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface",
                  channelColors[conv.channel],
                  isRTL ? "-left-0.5" : "-right-0.5"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "flex items-center justify-between mb-1",
                isRTL && "flex-row-reverse"
              )}>
                <span className="font-medium text-foreground truncate">
                  {conv.customer.name}
                </span>
                <span className="text-xs text-muted flex-shrink-0">{conv.time}</span>
              </div>
              <p className="text-sm text-muted truncate">{conv.lastMessage}</p>
            </div>
            {conv.unread > 0 && (
              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-bold bg-primary text-white rounded-full">
                {conv.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
