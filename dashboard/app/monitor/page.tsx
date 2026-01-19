"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { LiveStats } from "@/components/monitor/LiveStats";
import { ActivityChart } from "@/components/monitor/ActivityChart";
import { LiveConversations } from "@/components/monitor/LiveConversations";
import { GovernorateStats } from "@/components/analytics/GovernorateStats";
import { HourlyTraffic } from "@/components/analytics/HourlyTraffic";
import { PlatformComparison } from "@/components/analytics/PlatformComparison";
import { 
  RefreshCw, 
  ExternalLink, 
  Settings,
  Wifi,
  WifiOff,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonitorPage() {
  const { t, isRTL } = useTranslation();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(6);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleManualRefresh = () => {
    setLastUpdated(new Date());
  };

  return (
    <AppShell 
      title={isRTL ? "المراقبة المباشرة" : "Real-Time Monitor"} 
      description={isRTL ? "متابعة لحظية لجميع المحادثات والإحصائيات" : "Live monitoring of all conversations and statistics"}
    >
      {/* Top Bar */}
      <div className={cn(
        "flex items-center justify-between mb-6 p-4 bg-surface border border-border rounded-xl shadow-soft",
        isRTL && "flex-row-reverse"
      )}>
        {/* Left Side - Company Name & Status */}
        <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-success" />
            ) : (
              <WifiOff className="w-5 h-5 text-error" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isConnected ? "text-success" : "text-error"
            )}>
              {isConnected 
                ? (isRTL ? "متصل" : "Connected") 
                : (isRTL ? "غير متصل" : "Disconnected")
              }
            </span>
          </div>
          <div className="h-6 w-px bg-border" />
          <span className="text-lg font-bold text-primary">
            Focus-Company - Real-Time Monitor
          </span>
        </div>

        {/* Right Side - Controls */}
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          {/* Last Updated */}
          <div className={cn(
            "flex items-center gap-2 text-sm text-muted",
            isRTL && "flex-row-reverse"
          )}>
            <Clock className="w-4 h-4" />
            <span>
              {isRTL ? "آخر تحديث:" : "Last updated:"}{" "}
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              autoRefresh 
                ? "bg-success/10 text-success" 
                : "bg-surface-elevated text-muted"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
            {isRTL 
              ? `التحديث التلقائي كل ${refreshInterval} ثانية` 
              : `Auto-refresh ${refreshInterval}s`
            }
          </button>

          {/* Manual Refresh */}
          <Button variant="secondary" size="sm" onClick={handleManualRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* External Link */}
          <Button variant="ghost" size="sm">
            <ExternalLink className="w-4 h-4" />
            {isRTL ? "لوجو" : "Logo"}
          </Button>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-1">
            <button className="px-2 py-1 text-xs font-medium rounded bg-primary text-white">
              AR
            </button>
          </div>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <LiveStats />
          <ActivityChart />
        </div>

        {/* Right Column - Live Conversations */}
        <div className="lg:col-span-1">
          <LiveConversations />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mt-8 space-y-6">
        <GovernorateStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformComparison />
          <HourlyTraffic />
        </div>
      </div>
    </AppShell>
  );
}
