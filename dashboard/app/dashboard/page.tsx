"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { BotStatus } from "@/components/dashboard/BotStatus";
import { useTranslation } from "@/lib/i18n";
import { MessageSquare, Users, Clock, TrendingUp } from "lucide-react";
import { fetchAnalytics, AnalyticsData } from "@/lib/api/analytics";

// Dynamic imports for heavy chart components - load on demand
const ConversationChart = dynamic(
  () => import("@/components/dashboard/ConversationChart").then(mod => ({ default: mod.ConversationChart })),
  { 
    ssr: false,
    loading: () => <ChartSkeleton className="col-span-2" />
  }
);

const ChannelBreakdown = dynamic(
  () => import("@/components/dashboard/ChannelBreakdown").then(mod => ({ default: mod.ChannelBreakdown })),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

const RecentActivity = dynamic(
  () => import("@/components/dashboard/RecentActivity").then(mod => ({ default: mod.RecentActivity })),
  { 
    ssr: false,
    loading: () => <ListSkeleton />
  }
);

// Skeleton components for loading states
function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl p-5 animate-pulse ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-40 bg-surface-elevated rounded" />
        <div className="h-8 w-24 bg-surface-elevated rounded" />
      </div>
      <div className="h-[280px] bg-surface-elevated rounded-xl" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-40 bg-surface-elevated rounded" />
        <div className="h-4 w-16 bg-surface-elevated rounded" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <div className="w-10 h-10 bg-surface-elevated rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-surface-elevated rounded mb-2" />
              <div className="h-3 w-48 bg-surface-elevated rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-4 w-24 bg-surface-elevated rounded" />
            <div className="w-10 h-10 bg-surface-elevated rounded-xl" />
          </div>
          <div className="h-8 w-20 bg-surface-elevated rounded mb-2" />
          <div className="h-3 w-16 bg-surface-elevated rounded" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      const data = await fetchAnalytics(7);
      setAnalytics(data);
      setLoading(false);
    }
    loadAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const stats = analytics ? [
    {
      title: t("dashboard.totalConversations"),
      value: formatNumber(analytics.total_conversations),
      change: { 
        value: `${(analytics.resolution_rate * 100).toFixed(1)}%`, 
        trend: "up" as const 
      },
      icon: <MessageSquare className="w-5 h-5 text-primary" />,
    },
    {
      title: t("dashboard.activeUsers"),
      value: formatNumber(analytics.active_users_today),
      change: { 
        value: `+${analytics.new_users_today}`, 
        trend: "up" as const 
      },
      icon: <Users className="w-5 h-5 text-primary" />,
    },
    {
      title: t("dashboard.avgResponseTime"),
      value: `${analytics.avg_response_time.toFixed(1)}s`,
      change: { value: "سريع", trend: "down" as const },
      icon: <Clock className="w-5 h-5 text-primary" />,
    },
    {
      title: t("dashboard.resolutionRate"),
      value: `${(analytics.csat_score * 100).toFixed(1)}%`,
      change: { 
        value: `${analytics.active_conversations} نشط`, 
        trend: "up" as const 
      },
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
    },
  ] : [];

  return (
    <AppShell title={t("dashboard.title")} description={t("dashboard.subtitle")}>
      <div className="space-y-6">
        {/* Stats Grid */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ConversationChart />
          <ChannelBreakdown />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <BotStatus />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
