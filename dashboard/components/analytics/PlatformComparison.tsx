"use client";

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
  Legend,
} from "recharts";

const platformData = [
  { name: "WhatsApp", messages: 1757, color: "#25D366" },
  { name: "Facebook", messages: 696, color: "#0084FF" },
  { name: "Instagram", messages: 0, color: "#E1306C" },
];

interface PlatformComparisonProps {
  className?: string;
}

export function PlatformComparison({ className }: PlatformComparisonProps) {
  const { isRTL } = useTranslation();

  return (
    <div className={cn("bg-surface border border-border rounded-xl p-5 shadow-soft", className)}>
      <div className={cn(
        "flex items-center gap-2 mb-4",
        isRTL && "flex-row-reverse"
      )}>
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {isRTL ? "إحصائيات المنصات" : "Platform Statistics"}
        </h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={platformData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis 
              dataKey="name" 
              stroke="rgb(100,116,139)" 
              fontSize={11}
              tickLine={false}
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
              radius={[4, 4, 0, 0]}
            >
              {platformData.map((entry, index) => (
                <Bar key={index} dataKey="messages" fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Platform Icons */}
      <div className={cn(
        "flex items-center justify-center gap-6 mt-4",
        isRTL && "flex-row-reverse"
      )}>
        {platformData.map((platform) => (
          <div 
            key={platform.name}
            className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: platform.color }}
            />
            <span className="text-xs text-muted">{platform.name}</span>
            <span className="text-xs font-bold text-foreground">{platform.messages}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
