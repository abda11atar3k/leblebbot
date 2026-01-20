"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IntegrationCard, Integration } from "@/components/settings/IntegrationCard";
import {
  fetchIntegrations,
  fetchCategories,
  connectIntegration,
  disconnectIntegration,
  updateIntegrationSettings,
  testIntegration,
  openOAuthPopup,
  Category,
} from "@/lib/api/integrations";
import { 
  Check,
  Zap,
  Shield,
  Key,
  RefreshCw,
  Bell,
  Search,
  FileSpreadsheet,
  Calendar,
  Mail,
  MessageSquare,
  CreditCard,
  Banknote,
  Truck,
  Layers,
} from "lucide-react";

// Category icons
const categoryIcons: Record<string, React.ElementType> = {
  google: Layers,
  messaging: MessageSquare,
  payment: CreditCard,
  shipping: Truck,
};

export default function IntegrationsPage() {
  const { t, isRTL } = useTranslation();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Load integrations and categories
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [integrationsData, categoriesData] = await Promise.all([
        fetchIntegrations(),
        fetchCategories(),
      ]);
      setIntegrations(integrationsData);
      setCategories(categoriesData);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filter integrations
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = !selectedCategory || integration.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.name_ar.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Stats
  const connectedCount = integrations.filter((i) => i.status.connected).length;
  const availableCount = integrations.filter((i) => !i.status.connected).length;

  // Handlers
  const handleConnect = useCallback(async (id: string) => {
    const result = await connectIntegration(id);
    
    if (result.status === "oauth_required" && result.oauth_url) {
      openOAuthPopup(result.oauth_url, async () => {
        // Refresh integrations after OAuth
        const updated = await fetchIntegrations();
        setIntegrations(updated);
      });
    } else {
      // Update local state
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: { ...i.status, connected: true, last_sync: "الآن" } }
            : i
        )
      );
    }
  }, []);

  const handleDisconnect = useCallback(async (id: string) => {
    await disconnectIntegration(id);
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: { ...i.status, connected: false, last_sync: null } }
          : i
      )
    );
  }, []);

  const handleUpdateSettings = useCallback(async (id: string, settings: Record<string, any>) => {
    await updateIntegrationSettings(id, settings);
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, config: { ...i.config, settings: { ...i.config.settings, ...settings } } }
          : i
      )
    );
  }, []);

  const handleTest = useCallback(async (id: string) => {
    return await testIntegration(id);
  }, []);

  return (
    <AppShell
      title={t("integrations.title")}
      description={t("integrations.description")}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground tabular-nums">{connectedCount}</p>
              <p className="text-sm text-muted">{t("integrations.connected")}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-muted/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-muted" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground tabular-nums">{availableCount}</p>
              <p className="text-sm text-muted">{t("integrations.available")}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-sm text-muted">{t("integrations.secure")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={cn(
        "flex flex-col sm:flex-row gap-4 mb-6",
        isRTL && "sm:flex-row-reverse"
      )}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            placeholder={t("integrations.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
          />
        </div>

        {/* Category Filter */}
        <div className={cn("flex gap-2 overflow-x-auto pb-1", isRTL && "flex-row-reverse")}>
          <Button
            variant={selectedCategory === null ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            {t("integrations.all")}
          </Button>
          {categories.map((category) => {
            const Icon = categoryIcons[category.id] || Layers;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn("flex items-center gap-2 whitespace-nowrap", isRTL && "flex-row-reverse")}
              >
                <Icon className="w-4 h-4" />
                {isRTL ? category.name_ar : category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Integrations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-elevated" />
                <div className="flex-1">
                  <div className="h-4 bg-surface-elevated rounded w-24 mb-2" />
                  <div className="h-3 bg-surface-elevated rounded w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-surface-elevated rounded" />
                <div className="h-3 bg-surface-elevated rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">
            {t("integrations.noResults")}
          </p>
          <p className="text-sm text-muted">
            {t("integrations.tryDifferent")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onUpdateSettings={handleUpdateSettings}
              onTest={handleTest}
            />
          ))}
        </div>
      )}

      {/* API Keys Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className={isRTL ? "text-end" : "text-start"}>
                <CardTitle>{t("integrations.apiKeys")}</CardTitle>
                <CardDescription>{t("integrations.apiKeysDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <Input
                value="lbb_sk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button variant="secondary" size="sm">
                {t("integrations.copy")}
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className={cn("text-xs text-muted", isRTL && "text-end")}>
              {t("integrations.apiKeyWarning")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <div className={isRTL ? "text-end" : "text-start"}>
                <CardTitle>{t("integrations.webhooks")}</CardTitle>
                <CardDescription>{t("integrations.webhooksDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center gap-4",
              isRTL && "sm:flex-row-reverse"
            )}>
              <Input
                placeholder="https://your-server.com/webhook"
                className="flex-1"
              />
              <Button>{t("integrations.save")}</Button>
            </div>
            <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse justify-end")}>
              {[
                { id: "orders", label: t("integrations.orders") },
                { id: "bookings", label: t("integrations.bookings") },
                { id: "conversations", label: t("integrations.conversations") },
              ].map((event) => (
                <label
                  key={event.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 bg-surface-elevated rounded-lg cursor-pointer transition-colors hover:bg-surface",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <input type="checkbox" defaultChecked className="rounded border-border" />
                  <span className="text-sm text-foreground">{event.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
