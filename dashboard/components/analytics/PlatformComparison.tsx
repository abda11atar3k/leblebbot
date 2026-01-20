"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { BarChart3 } from "lucide-react";
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

// Default platform data (fallback when no data provided)
const defaultPlatformData = [
  { name: "WhatsApp", messages: 0, color: "#25D366" },
  { name: "Messenger", messages: 0, color: "#0084FF" },
  { name: "Instagram", messages: 0, color: "#E1306C" },
];

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-soft-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted">
          messages: <span className="font-semibold text-foreground">{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface PlatformDataPoint {
  name: string;
  messages: number;
  color: string;
}

interface PlatformComparisonProps {
  className?: string;
  data?: PlatformDataPoint[];
}

export const PlatformComparison = memo(function PlatformComparison({ className, data }: PlatformComparisonProps) {
  const { isRTL } = useTranslation();

  // Use provided data or fallback to default
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultPlatformData;
  }, [data]);

  // Calculate total messages
  const totalMessages = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.messages, 0);
  }, [chartData]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  return (
    <div className={cn("bg-surface border border-border rounded-xl p-5 shadow-soft", className)}>
      <div className={cn(
        "flex items-center justify-between mb-4",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isRTL ? "إحصائيات المنصات" : "Platform Statistics"}
          </h3>
        </div>
        <span className="text-xs text-muted">
          {isRTL ? `الإجمالي: ${formatNumber(totalMessages)}` : `Total: ${formatNumber(totalMessages)}`}
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="rgb(100,116,139)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgb(100,116,139)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.1)' }} />
            <Bar 
              dataKey="messages" 
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Platform Legend */}
      <div className={cn(
        "flex items-center justify-center gap-6 mt-4",
        isRTL && "flex-row-reverse"
      )}>
        {chartData.map((platform) => (
          <div 
            key={platform.name}
            className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: platform.color }}
            />
            <span className="text-xs text-muted">{platform.name}</span>
            <span className="text-xs font-bold text-foreground tabular-nums">
              {formatNumber(platform.messages)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
