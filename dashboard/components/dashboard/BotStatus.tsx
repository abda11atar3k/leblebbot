"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bot, Zap, Clock, CheckCircle } from "lucide-react";

// Static stats - memoized outside component
const stats = {
  status: "online",
  responseTime: "1.8s",
  accuracy: "96%",
  handled: 847,
  capacity: 72,
};

export const BotStatus = memo(function BotStatus() {
  const { t, isRTL } = useTranslation();

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-5">
        <div className={cn("flex items-center gap-3 mb-4", isRTL && "flex-row-reverse")}>
          <div className="p-2.5 rounded-lg bg-primary">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className={isRTL ? "text-right" : "text-left"}>
            <h3 className="font-semibold text-foreground">{t("dashboard.aiAssistant")}</h3>
            <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse justify-end")}>
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-subtle" />
              <span className="text-sm text-success">{t("common.online")}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2 text-sm text-muted", isRTL && "flex-row-reverse")}>
              <Clock className="w-4 h-4" />
              {t("dashboard.avgResponse")}
            </div>
            <span className="text-sm font-medium text-foreground tabular-nums">{stats.responseTime}</span>
          </div>
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2 text-sm text-muted", isRTL && "flex-row-reverse")}>
              <Zap className="w-4 h-4" />
              {t("dashboard.accuracy")}
            </div>
            <span className="text-sm font-medium text-foreground tabular-nums">{stats.accuracy}</span>
          </div>
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2 text-sm text-muted", isRTL && "flex-row-reverse")}>
              <CheckCircle className="w-4 h-4" />
              {t("dashboard.handledToday")}
            </div>
            <span className="text-sm font-medium text-foreground tabular-nums">{stats.handled}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary/20">
          <div className={cn("flex items-center justify-between mb-2", isRTL && "flex-row-reverse")}>
            <span className="text-sm text-muted">{t("dashboard.capacity")}</span>
            <span className="text-sm font-medium text-foreground tabular-nums">{stats.capacity}%</span>
          </div>
          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full will-change-[width]"
              style={{ width: `${stats.capacity}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
