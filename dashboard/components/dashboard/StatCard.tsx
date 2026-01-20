"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    trend: "up" | "down";
  };
  icon: React.ReactNode;
  className?: string;
}

export const StatCard = memo(function StatCard({ title, value, change, icon, className }: StatCardProps) {
  const { isRTL } = useTranslation();

  return (
    <div className={cn("bg-surface border border-border rounded-xl p-5", className)}>
      <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
        <div className="p-2.5 rounded-lg bg-primary/10">{icon}</div>
        {change && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              change.trend === "up" ? "text-success" : "text-error",
              isRTL && "flex-row-reverse"
            )}
          >
            {change.trend === "up" ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            {change.value}
          </div>
        )}
      </div>
      <div className={cn("mt-4", isRTL && "text-right")}>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-sm text-muted mt-1">{title}</p>
      </div>
    </div>
  );
});
