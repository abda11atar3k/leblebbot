"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { 
  MessageSquare, 
  MessagesSquare,
  Users,
  MessageCircle,
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { fetchLiveStats, LiveStats as LiveStatsData } from "@/lib/api/analytics";

interface PlatformStat {
  platform: string;
  icon: string;
  active: number;
  total: number;
  color: string;
}

interface LiveStatsProps {
  className?: string;
}

export function LiveStats({ className }: LiveStatsProps) {
  const { isRTL } = useTranslation();
  const [stats, setStats] = useState<LiveStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchLiveStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError("Failed to load stats");
      console.error("Error loading live stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 6 seconds
    const interval = setInterval(loadStats, 6000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Transform API data to platform stats format
  const platforms: PlatformStat[] = stats ? [
    { 
      platform: "whatsapp", 
      icon: "💬", 
      active: stats.platforms?.whatsapp?.active || 0, 
      total: stats.platforms?.whatsapp?.total || 0, 
      color: "bg-whatsapp" 
    },
    { 
      platform: "messenger", 
      icon: "📘", 
      active: stats.platforms?.messenger?.active || 0, 
      total: stats.platforms?.messenger?.total || 0, 
      color: "bg-messenger" 
    },
    { 
      platform: "instagram", 
      icon: "📷", 
      active: stats.platforms?.instagram?.active || 0, 
      total: stats.platforms?.instagram?.total || 0, 
      color: "bg-pink-500" 
    },
  ] : [];

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const totalActive = platforms.reduce((acc, p) => acc + p.active, 0);
  const isConnected = stats?.sync_status?.connected || false;

  if (loading && !stats) {
    return (
      <div className={cn("space-y-6 animate-pulse", className)}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4">
              <div className="h-8 w-8 bg-surface-elevated rounded-lg mb-2" />
              <div className="h-8 w-16 bg-surface-elevated rounded mb-1" />
              <div className="h-4 w-12 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Connection Status */}
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg",
        isConnected ? "bg-success/10" : "bg-error/10",
        isRTL && "flex-row-reverse"
      )}>
        {isConnected ? (
          <Wifi className="w-4 h-4 text-success" />
        ) : (
          <WifiOff className="w-4 h-4 text-error" />
        )}
        <span className={cn(
          "text-sm font-medium",
          isConnected ? "text-success" : "text-error"
        )}>
          {isConnected 
            ? (isRTL ? `متصل - ${stats?.sync_status?.profile_name || "WhatsApp"}` : `Connected - ${stats?.sync_status?.profile_name || "WhatsApp"}`)
            : (isRTL ? "غير متصل" : "Disconnected")
          }
        </span>
        {loading && <RefreshCw className="w-3 h-3 animate-spin text-muted" />}
      </div>

      {/* Active Conversations by Platform */}
      <div>
        <h3 className={cn(
          "text-sm font-semibold text-muted mb-3 flex items-center gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <MessageSquare className="w-4 h-4" />
          {isRTL ? "المحادثات النشطة" : "Active Conversations"}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* All Platforms */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessagesSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted">
                {isRTL ? "جميع المنصات" : "All Platforms"}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {totalActive}
            </p>
            <p className="text-xs text-muted">{isRTL ? "نشط" : "active"}</p>
          </div>

          {/* Individual Platforms */}
          {platforms.map((platform) => (
            <div 
              key={platform.platform}
              className="bg-surface border border-border rounded-xl p-4 shadow-soft"
            >
              <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", platform.color)}>
                  <span className="text-white text-sm">{platform.icon}</span>
                </div>
                <span className="text-xs text-muted capitalize">{platform.platform}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{platform.active}</p>
              <p className="text-xs text-muted">{isRTL ? "نشط" : "active"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Total Statistics */}
      <div>
        <h3 className={cn(
          "text-sm font-semibold text-muted mb-3 flex items-center gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <TrendingUp className="w-4 h-4" />
          {isRTL ? "الإحصائيات الإجمالية" : "Total Statistics"}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Messages */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted">
                {isRTL ? "الرسائل" : "Messages"}
              </span>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formatNumber(stats?.total_messages || 0)}
            </p>
            <p className="text-xs text-muted">{isRTL ? "إجمالي" : "total"}</p>
          </div>

          {/* Total Contacts */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs text-muted">
                {isRTL ? "جهات الاتصال" : "Contacts"}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatNumber(stats?.total_contacts || 0)}
            </p>
            <p className="text-xs text-muted">{isRTL ? "إجمالي" : "total"}</p>
          </div>

          {/* Total Chats */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <MessagesSquare className="w-4 h-4 text-warning" />
              </div>
              <span className="text-xs text-muted">
                {isRTL ? "المحادثات" : "Chats"}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatNumber(stats?.total_chats || 0)}
            </p>
            <p className="text-xs text-muted">{isRTL ? "إجمالي" : "total"}</p>
          </div>

          {/* Messages Today */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs text-muted">
                {isRTL ? "اليوم" : "Today"}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatNumber(stats?.messages_today || 0)}
            </p>
            <p className="text-xs text-muted">{isRTL ? "رسائل" : "messages"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
