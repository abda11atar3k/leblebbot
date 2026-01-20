"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MessageSquare, Mail, Clock } from "lucide-react";
import { fetchConversations, Conversation } from "@/lib/api/conversations";

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="w-3 h-3" />,
  messenger: <MessageSquare className="w-3 h-3" />,
  telegram: <MessageSquare className="w-3 h-3" />,
  website: <Mail className="w-3 h-3" />,
};

const statusVariants: Record<string, "success" | "warning" | "error" | "primary"> = {
  active: "primary",
  closed: "success",
  pending: "warning",
  escalated: "error",
};

export const RecentActivity = memo(function RecentActivity() {
  const { t, isRTL } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      const data = await fetchConversations(undefined, undefined, 5, 0);
      setConversations(data.items);
      setLoading(false);
    }
    loadConversations();
    
    // Refresh every 15 seconds
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return t("time.justNow") || "الآن";
    if (diffMins === 1) return t("time.minuteAgo") || "منذ دقيقة";
    if (diffMins < 60) return t("time.minutesAgo").replace("{n}", diffMins.toString()) || `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "منذ ساعة";
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "منذ يوم";
    return `منذ ${diffDays} أيام`;
  }, [t]);

  const getStatusText = useCallback((status: string, escalated: boolean) => {
    if (escalated) return t("common.escalated") || "تصعيد";
    switch (status) {
      case "active": return t("common.active") || "نشط";
      case "closed": return t("common.resolved") || "تم الحل";
      default: return status;
    }
  }, [t]);

  const getChannelText = useCallback((channel: string) => {
    switch (channel) {
      case "whatsapp": return t("channels.whatsapp") || "واتساب";
      case "messenger": return t("channels.messenger") || "ماسنجر";
      case "telegram": return t("channels.telegram") || "تليجرام";
      case "website": return t("channels.website") || "الموقع";
      default: return channel;
    }
  }, [t]);

  const getStatus = (conv: Conversation): string => {
    if (conv.escalated) return "escalated";
    return conv.status;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
          <CardTitle>{t("dashboard.recentConversations")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-10 h-10 bg-surface-elevated rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-surface-elevated rounded mb-2" />
                  <div className="h-3 w-48 bg-surface-elevated rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
          <CardTitle>{t("dashboard.recentConversations")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted">
            لا توجد محادثات حتى الآن
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
        <CardTitle>{t("dashboard.recentConversations")}</CardTitle>
        <a href="/chats" className="text-sm text-primary hover:text-primary-400 font-medium transition-colors duration-150">
          {t("common.viewAll")}
        </a>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {conversations.map((conv) => (
            <a
              key={conv.id}
              href={`/chats?id=${conv.id}`}
              className={cn(
                "flex items-center gap-4 p-4 hover:bg-surface-elevated/50 transition-colors duration-150 cursor-pointer",
                isRTL && "flex-row-reverse"
              )}
            >
              <Avatar name={conv.user?.name || conv.user?.phone || "مجهول"} size="lg" />
              <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.user?.name || conv.user?.phone || "مجهول"}
                  </p>
                  <Badge variant={statusVariants[getStatus(conv)]} size="sm">
                    {getStatusText(conv.status, conv.escalated)}
                  </Badge>
                </div>
                <p className="text-sm text-muted truncate mt-0.5">
                  {conv.last_message || `${conv.message_count} رسالة`}
                </p>
              </div>
              <div className={cn("flex flex-col gap-1", isRTL ? "items-start" : "items-end")}>
                <div className={cn("flex items-center gap-1 text-xs text-muted", isRTL && "flex-row-reverse")}>
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(conv.updated_at)}
                </div>
                <div className={cn("flex items-center gap-1 text-xs text-muted", isRTL && "flex-row-reverse")}>
                  {channelIcons[conv.channel] || channelIcons.whatsapp}
                  {getChannelText(conv.channel)}
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
