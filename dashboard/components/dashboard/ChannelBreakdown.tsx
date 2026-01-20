"use client";

import { memo, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const ChannelBreakdown = memo(function ChannelBreakdown() {
  const { t, isRTL } = useTranslation();

  const data = useMemo(() => [
    { name: t("channels.whatsapp"), value: 4520, color: "#25D366" },
    { name: t("channels.messenger"), value: 2840, color: "#0084FF" },
    { name: t("channels.telegram"), value: 1290, color: "#0088cc" },
    { name: t("channels.website"), value: 890, color: "#2563eb" },
  ], [t]);

  const total = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.messagesByChannel")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* CSS-based horizontal bars - much faster than recharts */}
        <div className="space-y-4">
          {data.map((item) => {
            const percentage = (item.value / maxValue) * 100;
            return (
              <div key={item.name} className="space-y-2">
                <div className={cn(
                  "flex items-center justify-between text-sm",
                  isRTL && "flex-row-reverse"
                )}>
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-muted">{item.name}</span>
                  </div>
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <span className="text-foreground font-semibold tabular-nums">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="text-muted text-xs w-10 tabular-nums">
                      {((item.value / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full will-change-[width]"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      transition: 'width 300ms ease-out'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className={cn(
          "flex items-center justify-between mt-6 pt-4 border-t border-border text-sm",
          isRTL && "flex-row-reverse"
        )}>
          <span className="text-muted">{t("dashboard.totalLabel")}</span>
          <span className="text-foreground font-bold tabular-nums">
            {total.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
