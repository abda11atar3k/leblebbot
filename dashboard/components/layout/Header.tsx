"use client";

import { useState } from "react";
import { Bell, Sun, Moon, Monitor, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { t, isRTL } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const notifications = [
    {
      id: 1,
      title: t("notifications.newConversation"),
      message: isRTL ? "أحمد بدأ محادثة جديدة" : "Ahmed started a new conversation",
      time: isRTL ? "منذ دقيقتين" : "2m ago",
      read: false,
    },
    {
      id: 2,
      title: t("notifications.botEscalation"),
      message: t("notifications.customerRequestedSupport"),
      time: isRTL ? "منذ 15 دقيقة" : "15m ago",
      read: false,
    },
    {
      id: 3,
      title: t("notifications.weeklyReport"),
      message: t("notifications.analyticsReportAvailable"),
      time: isRTL ? "منذ ساعة" : "1h ago",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className={cn(
      "h-16 flex items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40 shadow-soft",
      isRTL && "flex-row-reverse"
    )}>
      {/* Page Title */}
      <div className={isRTL ? "text-end" : "text-start"}>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>

      {/* Actions */}
      <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
        {/* Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-colors"
            title={t("settings.theme")}
          >
            {resolvedTheme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {showThemeMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowThemeMenu(false)}
              />
              <div className={cn(
                "absolute top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-soft-lg z-50 animate-slide-down p-1.5",
                isRTL ? "left-0" : "right-0"
              )}>
                {[
                  { value: "light", label: t("settings.lightMode"), icon: Sun },
                  { value: "dark", label: t("settings.darkMode"), icon: Moon },
                  { value: "system", label: t("settings.systemDefault"), icon: Monitor },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setTheme(item.value as "light" | "dark" | "system");
                      setShowThemeMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all",
                      theme === item.value
                        ? "bg-primary text-white shadow-soft"
                        : "text-muted hover:text-foreground hover:bg-surface-elevated",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {theme === item.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-colors"
            title={t("header.notifications")}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background",
                isRTL ? "left-1.5" : "right-1.5"
              )} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className={cn(
                "absolute top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-soft-lg z-50 animate-slide-down overflow-hidden",
                isRTL ? "left-0" : "right-0"
              )}>
                <div className="p-4 border-b border-border bg-surface-elevated/50">
                  <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                    <h3 className="font-bold text-foreground">{t("header.notifications")}</h3>
                    {unreadCount > 0 && (
                      <button className="text-xs text-primary hover:text-primary-700 font-medium">
                        {t("header.markAllRead")}
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-b border-border last:border-0 hover:bg-surface-elevated/50 cursor-pointer transition-colors",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
                            notification.read ? "bg-muted/50" : "bg-primary"
                          )}
                        />
                        <div className={cn("flex-1 min-w-0", isRTL ? "text-end" : "text-start")}>
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted truncate">
                            {notification.message}
                          </p>
                          <p className={cn(
                            "text-xs text-muted mt-1.5 flex items-center gap-1",
                            isRTL && "flex-row-reverse justify-end"
                          )}>
                            <Clock className="w-3 h-3" />
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border bg-surface-elevated/50">
                  <button className="w-full py-2 text-sm text-primary hover:text-primary-700 font-medium rounded-lg hover:bg-primary/5 transition-colors">
                    {t("header.viewAllNotifications")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
