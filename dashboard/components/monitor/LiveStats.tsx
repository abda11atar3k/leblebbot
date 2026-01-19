"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { 
  MessageSquare, 
  MessagesSquare,
  Calendar,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

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
  const { t, isRTL } = useTranslation();
  const [stats, setStats] = useState({
    totalChats: 2453,
    booked: 12,
    notifications: 100,
    platforms: [
      { platform: "whatsapp", icon: "💬", active: 1, total: 1757, color: "bg-whatsapp" },
      { platform: "instagram", icon: "📷", active: 0, total: 0, color: "bg-pink-500" },
      { platform: "facebook", icon: "📘", active: 1, total: 696, color: "bg-messenger" },
    ] as PlatformStat[],
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalChats: prev.totalChats + Math.floor(Math.random() * 3),
        platforms: prev.platforms.map(p => ({
          ...p,
          active: Math.max(0, p.active + Math.floor(Math.random() * 3) - 1),
          total: p.total + Math.floor(Math.random() * 2),
        })),
      }));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
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
              {stats.platforms.reduce((acc, p) => acc + p.active, 0)}
            </p>
            <p className="text-xs text-muted">{isRTL ? "نشط" : "active"}</p>
          </div>

          {/* Individual Platforms */}
          {stats.platforms.map((platform) => (
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
          {/* Total Chats */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessagesSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted">allChats</span>
            </div>
            <p className="text-3xl font-bold text-primary">{stats.totalChats.toLocaleString()}</p>
            <p className="text-xs text-muted">TOTALCHATS</p>
          </div>

          {/* Platform Totals */}
          {stats.platforms.map((platform) => (
            <div 
              key={`total-${platform.platform}`}
              className="bg-surface border border-border rounded-xl p-4 shadow-soft"
            >
              <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", platform.color)}>
                  <span className="text-white text-sm">{platform.icon}</span>
                </div>
                <span className="text-xs text-muted capitalize">{platform.platform}</span>
              </div>
              <p className={cn("text-3xl font-bold", platform.total > 0 ? "text-foreground" : "text-muted")}>
                {platform.total.toLocaleString()}
              </p>
              <p className="text-xs text-muted">{isRTL ? "إجمالي" : "total"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings & Notifications */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-success" />
            </div>
            <span className="text-xs text-muted">
              {isRTL ? "المواعيد" : "Bookings"}
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.booked}</p>
          <p className="text-xs text-muted">BOOKED</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-warning" />
            </div>
            <span className="text-xs text-muted">
              {isRTL ? "الإشعارات" : "Notifications"}
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.notifications}</p>
          <p className="text-xs text-muted">CLICKTOVIEW</p>
        </div>
      </div>
    </div>
  );
}
