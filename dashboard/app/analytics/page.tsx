"use client";

import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { GovernorateStats } from "@/components/analytics/GovernorateStats";
import { HourlyTraffic } from "@/components/analytics/HourlyTraffic";
import { PlatformComparison } from "@/components/analytics/PlatformComparison";
import { AIInsights } from "@/components/analytics/AIInsights";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Package,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
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

export default function AnalyticsPage() {
  const { isRTL } = useTranslation();
  const chartData = isRTL ? weeklyData : weeklyDataEn;

  const stats = [
    {
      title: isRTL ? "إجمالي المحادثات" : "Total Conversations",
      value: "2,453",
      change: "+12.5%",
      trend: "up" as const,
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: isRTL ? "إجمالي الطلبات" : "Total Orders",
      value: "442",
      change: "+8.2%",
      trend: "up" as const,
      icon: Package,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: isRTL ? "إجمالي الحجوزات" : "Total Bookings",
      value: "140",
      change: "+15.3%",
      trend: "up" as const,
      icon: Calendar,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: isRTL ? "متوسط وقت الرد" : "Avg Response Time",
      value: "< 2s",
      change: "-5.1%",
      trend: "down" as const,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <AppShell 
      title={isRTL ? "التحليلات" : "Analytics"} 
      description={isRTL ? "تحليلات شاملة لأداء البوت والمبيعات" : "Comprehensive bot performance and sales analytics"}
    >
      {/* Header Actions */}
      <div className={cn(
        "flex items-center justify-between mb-6",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Badge variant="secondary" className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
            <RefreshCw className="w-3 h-3" />
            {isRTL ? "آخر تحديث: منذ 5 دقائق" : "Last updated: 5 mins ago"}
          </Badge>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Button variant="secondary" size="sm">
            <Filter className="w-4 h-4" />
            {isRTL ? "فلتر" : "Filter"}
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" />
            {isRTL ? "تصدير" : "Export"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          const trendColor = stat.trend === "up" ? "text-success" : "text-error";
          
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center justify-between mb-3",
                  isRTL && "flex-row-reverse"
                )}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bgColor)}>
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div className={cn("flex items-center gap-1", trendColor, isRTL && "flex-row-reverse")}>
                    <TrendIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{stat.change}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className={cn("text-xs text-muted", isRTL && "text-end")}>{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Trends Chart */}
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="day" stroke="rgb(100,116,139)" fontSize={11} />
                <YAxis stroke="rgb(100,116,139)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(30, 41, 59)',
                    border: '1px solid rgb(51, 65, 85)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="#2266FF" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConversations)"
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Platform & Hourly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PlatformComparison />
        <HourlyTraffic />
      </div>

      {/* Geographic Analytics */}
      <GovernorateStats />

      {/* AI Insights */}
      <div className="mt-6">
        <AIInsights />
      </div>
    </AppShell>
  );
}
