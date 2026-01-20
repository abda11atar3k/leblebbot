"use client";

import { useState, memo, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Custom tooltip component for theme-aware styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-soft-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-muted">
            {entry.name}: <span className="font-semibold text-foreground">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ConversationChart = memo(function ConversationChart() {
  const { t, isRTL } = useTranslation();
  const [period, setPeriod] = useState<"7d" | "30d">("7d");

  // Memoize data arrays
  const data7Days = useMemo(() => [
    { name: t("days.mon"), total: 1240, resolved: 1180 },
    { name: t("days.tue"), total: 1890, resolved: 1720 },
    { name: t("days.wed"), total: 1560, resolved: 1490 },
    { name: t("days.thu"), total: 2100, resolved: 1950 },
    { name: t("days.fri"), total: 2450, resolved: 2280 },
    { name: t("days.sat"), total: 1780, resolved: 1650 },
    { name: t("days.sun"), total: 1320, resolved: 1260 },
  ], [t]);

  const data30Days = useMemo(() => [
    { name: t("days.week1"), total: 8400, resolved: 7800 },
    { name: t("days.week2"), total: 9200, resolved: 8600 },
    { name: t("days.week3"), total: 10100, resolved: 9400 },
    { name: t("days.week4"), total: 11500, resolved: 10800 },
  ], [t]);

  const data = period === "7d" ? data7Days : data30Days;

  // Memoize callbacks
  const setPeriod7d = useCallback(() => setPeriod("7d"), []);
  const setPeriod30d = useCallback(() => setPeriod("30d"), []);

  // Memoize tick formatter
  const tickFormatter = useCallback((value: number) => 
    value >= 1000 ? `${value / 1000}k` : String(value)
  , []);

  // Memoize labels
  const totalLabel = t("dashboard.totalLabel");
  const resolvedLabel = t("dashboard.resolvedLabel");

  return (
    <Card className="col-span-2">
      <CardHeader className={cn("flex flex-row items-center justify-between pb-2", isRTL && "flex-row-reverse")}>
        <CardTitle>{t("dashboard.conversationsOverview")}</CardTitle>
        <div className={cn("flex items-center gap-1 p-1 bg-surface-elevated rounded-lg", isRTL && "flex-row-reverse")}>
          <button
            onClick={setPeriod7d}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150",
              period === "7d" ? "bg-primary text-white" : "text-muted hover:text-foreground hover:bg-surface"
            )}
          >
            {t("dashboard.days7")}
          </button>
          <button
            onClick={setPeriod30d}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150",
              period === "30d" ? "bg-primary text-white" : "text-muted hover:text-foreground hover:bg-surface"
            )}
          >
            {t("dashboard.days30")}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                reversed={isRTL}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={tickFormatter}
                orientation={isRTL ? "right" : "left"}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: 'rgba(148, 163, 184, 0.3)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name={totalLabel}
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name={resolvedLabel}
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorResolved)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={cn("flex items-center justify-center gap-6 mt-4", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted">{totalLabel}</span>
          </div>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted">{resolvedLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
