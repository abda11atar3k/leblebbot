"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { fetchAnalytics, AnalyticsData, HourlyTrafficPoint } from "@/lib/api/analytics";

// Dynamic imports for heavy chart components
const WeeklyTrendsChart = dynamic(
  () => import("@/components/analytics/WeeklyTrendsChart"),
  { ssr: false, loading: () => <ChartSkeleton height="h-72" /> }
);

const GovernorateStats = dynamic(
  () => import("@/components/analytics/GovernorateStats").then(mod => ({ default: mod.GovernorateStats })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const HourlyTraffic = dynamic(
  () => import("@/components/analytics/HourlyTraffic").then(mod => ({ default: mod.HourlyTraffic })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PlatformComparison = dynamic(
  () => import("@/components/analytics/PlatformComparison").then(mod => ({ default: mod.PlatformComparison })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const AIInsights = dynamic(
  () => import("@/components/analytics/AIInsights").then(mod => ({ default: mod.AIInsights })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl p-5 animate-pulse`}>
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-40 bg-surface-elevated rounded" />
        <div className="h-4 w-24 bg-surface-elevated rounded" />
      </div>
      <div className={`${height} bg-surface-elevated rounded-xl`} />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 bg-surface-elevated rounded-xl" />
            <div className="h-4 w-12 bg-surface-elevated rounded" />
          </div>
          <div className="h-8 w-20 bg-surface-elevated rounded mb-2" />
          <div className="h-4 w-28 bg-surface-elevated rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { isRTL } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await fetchAnalytics(7);
    setAnalytics(data);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return isRTL ? "الآن" : "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return isRTL ? `منذ ${minutes} دقائق` : `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    return isRTL ? `منذ ${hours} ساعات` : `${hours} hours ago`;
  };

  const stats = analytics ? [
    {
      title: isRTL ? "إجمالي الرسائل" : "Total Messages",
      value: formatNumber(analytics.total_messages),
      change: `${analytics.messages_today} اليوم`,
      trend: "up" as const,
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: isRTL ? "إجمالي المحادثات" : "Total Conversations",
      value: formatNumber(analytics.total_conversations),
      change: `${analytics.active_conversations} نشط`,
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: isRTL ? "إجمالي المستخدمين" : "Total Users",
      value: formatNumber(analytics.total_users),
      change: `+${analytics.new_users_today} جديد`,
      trend: "up" as const,
      icon: Users,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: isRTL ? "متوسط وقت الرد" : "Avg Response Time",
      value: `${analytics.avg_response_time.toFixed(1)}s`,
      change: `${(analytics.resolution_rate * 100).toFixed(0)}% حل`,
      trend: "down" as const,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ] : [];

  // Prepare platform data for PlatformComparison component
  const platformData = analytics?.platform_stats ? [
    { 
      name: "WhatsApp", 
      messages: analytics.platform_stats.whatsapp?.total || 0, 
      color: "#25D366" 
    },
    { 
      name: "Messenger", 
      messages: analytics.platform_stats.messenger?.total || 0, 
      color: "#0084FF" 
    },
    { 
      name: "Instagram", 
      messages: analytics.platform_stats.instagram?.total || 0, 
      color: "#E1306C" 
    },
  ] : undefined;

  // Prepare hourly traffic data
  const hourlyData: HourlyTrafficPoint[] = analytics?.hourly_traffic || [];

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
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            {isRTL ? `آخر تحديث: ${getTimeAgo(lastUpdated)}` : `Last updated: ${getTimeAgo(lastUpdated)}`}
          </Badge>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Button variant="secondary" size="sm" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
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
      {loading && !analytics ? (
        <StatsSkeleton />
      ) : (
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
      )}

      {/* Weekly Trends Chart */}
      <WeeklyTrendsChart />

      {/* Platform & Hourly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-6">
        <PlatformComparison data={platformData} />
        <HourlyTraffic data={hourlyData} />
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
