"use client";

import AppShell from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { ConversationChart } from "@/components/dashboard/ConversationChart";
import { ChannelBreakdown } from "@/components/dashboard/ChannelBreakdown";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { BotStatus } from "@/components/dashboard/BotStatus";
import { useTranslation } from "@/lib/i18n";
import { MessageSquare, Users, Clock, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { t } = useTranslation();

  const stats = [
    {
      title: t("dashboard.totalConversations"),
      value: "12,847",
      change: { value: "12.5%", trend: "up" as const },
      icon: <MessageSquare className="w-5 h-5 text-primary" />,
    },
    {
      title: t("dashboard.activeUsers"),
      value: "3,421",
      change: { value: "8.2%", trend: "up" as const },
      icon: <Users className="w-5 h-5 text-primary" />,
    },
    {
      title: t("dashboard.avgResponseTime"),
      value: "1.8s",
      change: { value: "0.3s", trend: "down" as const },
      icon: <Clock className="w-5 h-5 text-primary" />,
    },
    {
      title: t("dashboard.resolutionRate"),
      value: "94.2%",
      change: { value: "2.1%", trend: "up" as const },
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
    },
  ];

  return (
    <AppShell title={t("dashboard.title")} description={t("dashboard.subtitle")}>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

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
