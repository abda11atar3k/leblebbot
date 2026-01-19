"use client";

import { useState } from "react";
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

const data7Days = [
  { name: "Mon", total: 1240, resolved: 1180 },
  { name: "Tue", total: 1890, resolved: 1720 },
  { name: "Wed", total: 1560, resolved: 1490 },
  { name: "Thu", total: 2100, resolved: 1950 },
  { name: "Fri", total: 2450, resolved: 2280 },
  { name: "Sat", total: 1780, resolved: 1650 },
  { name: "Sun", total: 1320, resolved: 1260 },
];

const data30Days = [
  { name: "Week 1", total: 8400, resolved: 7800 },
  { name: "Week 2", total: 9200, resolved: 8600 },
  { name: "Week 3", total: 10100, resolved: 9400 },
  { name: "Week 4", total: 11500, resolved: 10800 },
];

export function ConversationChart() {
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const data = period === "7d" ? data7Days : data30Days;

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Conversations Overview</CardTitle>
        <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg">
          <button
            onClick={() => setPeriod("7d")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period === "7d"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period === "30d"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            30 days
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value >= 1000 ? `${value / 1000}k` : value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(51, 65, 85, 0.5)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#f8fafc" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorResolved)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted">Total Conversations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted">Resolved</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
