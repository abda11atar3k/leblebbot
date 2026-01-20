"use client";

import { memo, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Radio, AlertTriangle, Bot, FileText } from "lucide-react";
import Link from "next/link";

export const QuickActions = memo(function QuickActions() {
  const { t, isRTL } = useTranslation();

  const actions = useMemo(() => [
    {
      icon: Radio,
      label: t("dashboard.createBroadcast"),
      href: "/broadcasts/new",
      color: "text-primary bg-primary/10",
    },
    {
      icon: AlertTriangle,
      label: t("dashboard.viewEscalations"),
      href: "/chats?filter=escalated",
      color: "text-warning bg-warning/10",
      badge: 3,
    },
    {
      icon: Bot,
      label: t("dashboard.botSettings"),
      href: "/settings?tab=bot",
      color: "text-success bg-success/10",
    },
    {
      icon: FileText,
      label: t("dashboard.knowledgeBase"),
      href: "/settings?tab=knowledge",
      color: "text-muted bg-surface-elevated",
    },
  ], [t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.quickActions")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors duration-150",
              isRTL && "text-right"
            )}
          >
            <div className={`p-2.5 rounded-lg ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground text-center">
              {action.label}
            </span>
            {action.badge && (
              <span className={cn(
                "absolute top-2 w-5 h-5 flex items-center justify-center text-xs font-bold bg-error text-white rounded-full",
                isRTL ? "left-2" : "right-2"
              )}>
                {action.badge}
              </span>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
});
