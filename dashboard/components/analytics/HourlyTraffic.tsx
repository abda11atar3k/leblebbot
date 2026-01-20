"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Default hourly data (fallback when no data provided)
const defaultHourlyData = [
  { hour: "00:00", messages: 0 },
  { hour: "01:00", messages: 0 },
  { hour: "02:00", messages: 0 },
  { hour: "03:00", messages: 0 },
  { hour: "04:00", messages: 0 },
  { hour: "05:00", messages: 0 },
  { hour: "06:00", messages: 0 },
  { hour: "07:00", messages: 0 },
  { hour: "08:00", messages: 0 },
  { hour: "09:00", messages: 0 },
  { hour: "10:00", messages: 0 },
  { hour: "11:00", messages: 0 },
  { hour: "12:00", messages: 0 },
  { hour: "13:00", messages: 0 },
  { hour: "14:00", messages: 0 },
  { hour: "15:00", messages: 0 },
  { hour: "16:00", messages: 0 },
  { hour: "17:00", messages: 0 },
  { hour: "18:00", messages: 0 },
  { hour: "19:00", messages: 0 },
  { hour: "20:00", messages: 0 },
  { hour: "21:00", messages: 0 },
  { hour: "22:00", messages: 0 },
  { hour: "23:00", messages: 0 },
];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-soft-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">
          Messages: <span className="font-semibold text-foreground">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface HourlyTrafficDataPoint {
  hour: number;
  count: number;
}

interface HourlyTrafficProps {
  className?: string;
  data?: HourlyTrafficDataPoint[];
}

export const HourlyTraffic = memo(function HourlyTraffic({ className, data }: HourlyTrafficProps) {
  const { isRTL } = useTranslation();

  // Transform API data to chart format
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      // Create a map from API data
      const dataMap = new Map(data.map(d => [d.hour, d.count]));
      
      // Generate all 24 hours with data from API or 0
      return Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        messages: dataMap.get(i) || 0,
      }));
    }
    return defaultHourlyData;
  }, [data]);

  // Calculate total messages
  const totalMessages = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.messages, 0);
  }, [chartData]);

  return (
    <div className={cn("bg-surface border border-border rounded-xl p-5 shadow-soft", className)}>
      <div className={cn(
        "flex items-center justify-between mb-4",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isRTL ? "حركة المرور بالساعة" : "Hourly Traffic"}
          </h3>
        </div>
        <span className="text-xs text-muted">
          {isRTL ? `الإجمالي: ${totalMessages.toLocaleString()}` : `Total: ${totalMessages.toLocaleString()}`}
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
            <XAxis 
              dataKey="hour" 
              stroke="rgb(100,116,139)" 
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis 
              stroke="rgb(100,116,139)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.1)' }} />
            <Bar 
              dataKey="messages" 
              fill="#E91E63" 
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
