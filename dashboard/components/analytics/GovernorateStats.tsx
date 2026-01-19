"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { MapPin, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  { name: "Alexandria", nameAr: "الإسكندرية", chats: 71, color: "#673AB7" },
  { name: "Dakahlia", nameAr: "الدقهلية", chats: 44, color: "#3F51B5" },
  { name: "Minya", nameAr: "المنيا", chats: 39, color: "#2196F3" },
  { name: "Monufia", nameAr: "المنوفية", chats: 38, color: "#00BCD4" },
  { name: "Asyut", nameAr: "أسيوط", chats: 35, color: "#009688" },
  { name: "Gharbiya", nameAr: "الغربية", chats: 34, color: "#4CAF50" },
  { name: "Beheira", nameAr: "البحيرة", chats: 30, color: "#8BC34A" },
  { name: "Qalyubia", nameAr: "القليوبية", chats: 25, color: "#CDDC39" },
  { name: "Port Said", nameAr: "بورسعيد", chats: 23, color: "#FFC107" },
  { name: "Qena", nameAr: "قنا", chats: 121, color: "#FF9800" },
];

interface GovernorateStatsProps {
  className?: string;
}

export function GovernorateStats({ className }: GovernorateStatsProps) {
  const { isRTL } = useTranslation();

  // Sort by chats descending for bar chart
  const sortedData = [...governoratesData].sort((a, b) => b.chats - a.chats);
  const chartData = sortedData.slice(0, 8).map(g => ({
    name: isRTL ? g.nameAr : g.name,
    chats: g.chats,
    fill: g.color,
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
          {isRTL ? "تحليل الموقع" : "Location Analysis"}
        </h2>
        <span className="text-sm text-muted">
          5000 {isRTL ? "رسالة analyzed" : "messages analyzed"}
        </span>
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-soft">
          <h3 className={cn(
            "text-sm font-semibold text-foreground mb-4",
            isRTL && "text-end"
          )}>
            governorateDistribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis type="number" stroke="rgb(100,116,139)" fontSize={10} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="rgb(100,116,139)" 
                  fontSize={10}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(30, 41, 59)',
                    border: '1px solid rgb(51, 65, 85)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="chats" fill="#E91E63" radius={[0, 4, 4, 0]} />
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
            governoratesByMentions
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {gridData.map((gov) => (
              <div
                key={gov.name}
                className="bg-surface-elevated rounded-xl p-3 text-center"
              >
                <p className="text-xs text-muted mb-1 truncate" style={{ color: gov.color }}>
                  {isRTL ? gov.nameAr : gov.name}
                </p>
                <p className="text-xs text-muted">Chats:</p>
                <p className="text-2xl font-bold" style={{ color: gov.color }}>
                  {gov.chats}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
