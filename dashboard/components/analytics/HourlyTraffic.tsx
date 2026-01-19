"use client";

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

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  messages: Math.floor(Math.random() * 200) + 20,
}));

interface HourlyTrafficProps {
  className?: string;
}

export function HourlyTraffic({ className }: HourlyTrafficProps) {
  const { isRTL } = useTranslation();

  return (
    <div className={cn("bg-surface border border-border rounded-xl p-5 shadow-soft", className)}>
      <div className={cn(
        "flex items-center gap-2 mb-4",
        isRTL && "flex-row-reverse"
      )}>
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {isRTL ? "حركة المرور الإجمالية بالساعة" : "Hourly Traffic Overview"}
        </h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis 
              dataKey="hour" 
              stroke="rgb(100,116,139)" 
              fontSize={9}
              tickLine={false}
              interval={2}
            />
            <YAxis 
              stroke="rgb(100,116,139)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(30, 41, 59)',
                border: '1px solid rgb(51, 65, 85)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="messages" 
              fill="#E91E63" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
