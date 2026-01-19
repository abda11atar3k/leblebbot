"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Activity, Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  time: string;
  whatsapp: number;
  facebook: number;
  instagram: number;
}

interface ActivityChartProps {
  className?: string;
}

export function ActivityChart({ className }: ActivityChartProps) {
  const { t, isRTL } = useTranslation();
  const [data, setData] = useState<DataPoint[]>([]);

  // Generate initial data
  useEffect(() => {
    const generateData = () => {
      const points: DataPoint[] = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        points.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          whatsapp: Math.floor(Math.random() * 50) + 10,
          facebook: Math.floor(Math.random() * 30) + 5,
          instagram: Math.floor(Math.random() * 20),
        });
      }
      return points;
    };
    setData(generateData());

    // Update every 6 seconds
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const now = new Date();
        newData.push({
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          whatsapp: Math.floor(Math.random() * 50) + 10,
          facebook: Math.floor(Math.random() * 30) + 5,
          instagram: Math.floor(Math.random() * 20),
        });
        return newData;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("bg-surface border border-border rounded-xl p-5 shadow-soft", className)}>
      <div className={cn(
        "flex items-center justify-between mb-4",
        isRTL && "flex-row-reverse"
      )}>
        <h3 className={cn(
          "text-sm font-semibold text-foreground flex items-center gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <Activity className="w-4 h-4 text-primary" />
          {isRTL ? "النشاط المباشر" : "Live Activity"}
        </h3>
        <button className="text-muted hover:text-foreground">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className={cn(
        "flex items-center gap-4 mb-4",
        isRTL && "flex-row-reverse justify-end"
      )}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <div className="w-3 h-3 rounded-full bg-whatsapp" />
          <span className="text-xs text-muted">WhatsApp</span>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <div className="w-3 h-3 rounded-full bg-messenger" />
          <span className="text-xs text-muted">Facebook</span>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span className="text-xs text-muted">Instagram</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis 
              dataKey="time" 
              stroke="rgb(100,116,139)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
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
            <Line 
              type="monotone" 
              dataKey="whatsapp" 
              stroke="#25D366" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="facebook" 
              stroke="#0084FF" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="instagram" 
              stroke="#E1306C" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
