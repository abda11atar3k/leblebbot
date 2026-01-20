"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { MapPin } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GovernorateData {
  name: string;
  nameAr: string;
  chats: number;
  color: string;
}

const governoratesData: GovernorateData[] = [
  { name: "Cairo", nameAr: "القاهرة", chats: 324, color: "#E91E63" },
  { name: "Giza", nameAr: "الجيزة", chats: 139, color: "#9C27B0" },
  { name: "Qena", nameAr: "قنا", chats: 121, color: "#FF9800" },
  { name: "Alexandria", nameAr: "الإسكندرية", chats: 71, color: "#673AB7" },
  { name: "Dakahlia", nameAr: "الدقهلية", chats: 44, color: "#3F51B5" },
  { name: "Minya", nameAr: "المنيا", chats: 39, color: "#2196F3" },
  { name: "Monufia", nameAr: "المنوفية", chats: 38, color: "#00BCD4" },
  { name: "Asyut", nameAr: "أسيوط", chats: 35, color: "#009688" },
  { name: "Gharbiya", nameAr: "الغربية", chats: 34, color: "#4CAF50" },
  { name: "Beheira", nameAr: "البحيرة", chats: 30, color: "#8BC34A" },
  { name: "Qalyubia", nameAr: "القليوبية", chats: 25, color: "#CDDC39" },
  { name: "Port Said", nameAr: "بورسعيد", chats: 23, color: "#FFC107" },
];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-soft-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">
          Chats: <span className="font-semibold text-foreground">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface GovernorateStatsProps {
  className?: string;
}

export const GovernorateStats = memo(function GovernorateStats({ className }: GovernorateStatsProps) {
  const { t, isRTL } = useTranslation();

  // Sort by chats descending for bar chart
  const sortedData = [...governoratesData].sort((a, b) => b.chats - a.chats);
  const chartData = sortedData.slice(0, 8).map(g => ({
    name: isRTL ? g.nameAr : g.name,
    chats: g.chats,
    color: g.color,
  }));

  // Top 12 for grid
  const gridData = sortedData.slice(0, 12);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className={cn(
        "flex items-center gap-2",
        isRTL && "flex-row-reverse"
      )}>
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">
          {t("analytics.locationAnalysis")}
        </h2>
        <span className="text-sm text-muted">
          5000 {isRTL ? "رسالة analyzed" : "messages analyzed"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-soft">
          <h3 className={cn(
            "text-sm font-semibold text-foreground mb-4",
            isRTL && "text-end"
          )}>
            {t("analytics.governorateDistribution")}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ left: isRTL ? 10 : 20, right: isRTL ? 20 : 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="rgb(100,116,139)" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="rgb(100,116,139)" 
                  fontSize={11}
                  width={isRTL ? 70 : 80}
                  tickLine={false}
                  axisLine={false}
                  orientation={isRTL ? "right" : "left"}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.1)' }} />
                <Bar 
                  dataKey="chats" 
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid Stats */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-soft">
          <h3 className={cn(
            "text-sm font-semibold text-foreground mb-4",
            isRTL && "text-end"
          )}>
            {t("analytics.governoratesByMentions")}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {gridData.map((gov) => (
              <div
                key={gov.name}
                className="bg-surface-elevated rounded-xl p-3 text-center"
              >
                <p className="text-xs font-medium mb-1 truncate" style={{ color: gov.color }}>
                  {isRTL ? gov.nameAr : gov.name}
                </p>
                <p className="text-xs text-muted">{isRTL ? "محادثات:" : "Chats:"}</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: gov.color }}>
                  {gov.chats}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
