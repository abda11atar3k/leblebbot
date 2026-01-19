"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  MessageSquare,
  Plug2,
  Radio,
  Settings,
  Bot,
  ChevronDown,
  LogOut,
  Building2,
  HelpCircle,
  Sparkles,
  Activity,
  Package,
  Calendar,
  BarChart3,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { t, isRTL } = useTranslation();

  const navigation = [
    {
      name: t("sidebar.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t("sidebar.monitor"),
      href: "/monitor",
      icon: Activity,
    },
    {
      name: t("sidebar.conversations"),
      href: "/chats",
      icon: MessageSquare,
      badge: 12,
    },
    {
      name: t("sidebar.orders"),
      href: "/orders",
      icon: Package,
    },
    {
      name: t("sidebar.bookings"),
      href: "/bookings",
      icon: Calendar,
    },
    {
      name: t("sidebar.connectors"),
      href: "/connectors",
      icon: Plug2,
    },
    {
      name: t("sidebar.broadcasts"),
      href: "/broadcasts",
      icon: Radio,
    },
    {
      name: t("sidebar.analytics"),
      href: "/analytics",
      icon: BarChart3,
    },
    {
      name: t("sidebar.settings"),
      href: "/settings",
      icon: Settings,
    },
  ];

  const secondaryNav = [
    { name: t("sidebar.helpCenter"), href: "/help", icon: HelpCircle },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-50 w-64 flex flex-col bg-surface shadow-soft",
        isRTL ? "right-0 border-s border-border" : "left-0 border-e border-border"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center gap-3 px-4 border-b border-border",
        isRTL && "flex-row-reverse"
      )}>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className={cn("flex-1 min-w-0", isRTL ? "text-end" : "text-start")}>
          <h1 className="text-base font-bold text-foreground truncate">LeblebBot</h1>
          <p className="text-xs text-muted truncate">{t("sidebar.aiPlatform")}</p>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="p-3 border-b border-border">
        <button className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 transition-colors",
          isRTL && "flex-row-reverse"
        )}>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className={cn("flex-1 min-w-0", isRTL ? "text-end" : "text-start")}>
            <p className="text-sm font-medium text-foreground truncate">Acme Corp</p>
            <p className="text-xs text-muted">Pro Plan</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={
                item.href === "/dashboard" ? "dashboard" : 
                item.href === "/chats" ? "conversations" : 
                item.href === "/connectors" ? "connectors" : 
                item.href === "/settings" ? "settings" : undefined
              }
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated",
                isRTL && "flex-row-reverse"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted")} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded-full",
                  isActive ? "bg-white/20 text-white" : "bg-primary text-white"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border">
          <p className={cn(
            "px-3 mb-2 text-xs font-semibold text-muted uppercase tracking-wider",
            isRTL ? "text-end" : "text-start"
          )}>
            {t("sidebar.support")}
          </p>
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-elevated transition-colors",
                isRTL && "flex-row-reverse"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Upgrade CTA */}
      <div className="p-3 border-t border-border">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t("sidebar.upgradeToPro")}</span>
          </div>
          <p className={cn("text-xs text-muted mb-3", isRTL ? "text-end" : "text-start")}>
            {isRTL ? "احصل على ميزات متقدمة" : "Get advanced features"}
          </p>
          <button className="w-full py-2 px-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-soft">
            {isRTL ? "ترقية الآن" : "Upgrade Now"}
          </button>
        </div>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-border">
        <div className={cn("flex items-center gap-3 px-3 py-2", isRTL && "flex-row-reverse")}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-sm font-bold text-white shadow-soft">
            أح
          </div>
          <div className={cn("flex-1 min-w-0", isRTL ? "text-end" : "text-start")}>
            <p className="text-sm font-medium text-foreground truncate">أحمد محمد</p>
            <p className="text-xs text-muted truncate">ahmed@acme.com</p>
          </div>
          <button className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors">
            <LogOut className={cn("w-4 h-4", isRTL && "rtl:flip")} />
          </button>
        </div>
      </div>
    </aside>
  );
}
