"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Weekly data for trends
const weeklyData = [
  { day: "السبت", conversations: 120, orders: 45, bookings: 12 },
  { day: "الأحد", conversations: 145, orders: 52, bookings: 18 },
  { day: "الإثنين", conversations: 178, orders: 68, bookings: 22 },
  { day: "الثلاثاء", conversations: 156, orders: 58, bookings: 15 },
  { day: "الأربعاء", conversations: 189, orders: 72, bookings: 25 },
  { day: "الخميس", conversations: 201, orders: 85, bookings: 28 },
  { day: "الجمعة", conversations: 165, orders: 62, bookings: 20 },
];

const weeklyDataEn = [
  { day: "Sat", conversations: 120, orders: 45, bookings: 12 },
  { day: "Sun", conversations: 145, orders: 52, bookings: 18 },
  { day: "Mon", conversations: 178, orders: 68, bookings: 22 },
  { day: "Tue", conversations: 156, orders: 58, bookings: 15 },
  { day: "Wed", conversations: 189, orders: 72, bookings: 25 },
  { day: "Thu", conversations: 201, orders: 85, bookings: 28 },
  { day: "Fri", conversations: 165, orders: 62, bookings: 20 },
];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-soft-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default memo(function WeeklyTrendsChart() {
  const { isRTL } = useTranslation();
  const chartData = isRTL ? weeklyData : weeklyDataEn;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className={cn(
          "flex items-center justify-between",
          isRTL && "flex-row-reverse"
        )}>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <TrendingUp className="w-5 h-5 text-primary" />
            {isRTL ? "اتجاهات الأسبوع" : "Weekly Trends"}
          </CardTitle>
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted">{isRTL ? "محادثات" : "Conversations"}</span>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted">{isRTL ? "طلبات" : "Orders"}</span>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-xs text-muted">{isRTL ? "حجوزات" : "Bookings"}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2266FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2266FF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="rgb(100,116,139)" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="rgb(100,116,139)" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148, 163, 184, 0.3)' }} />
              <Area 
                type="monotone" 
                dataKey="conversations" 
                name={isRTL ? "محادثات" : "Conversations"}
                stroke="#2266FF" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorConversations)"
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="orders" 
                name={isRTL ? "طلبات" : "Orders"}
                stroke="#10B981" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOrders)"
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                name={isRTL ? "حجوزات" : "Bookings"}
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
