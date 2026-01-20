"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation, LanguageSwitcher } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Building2,
  Bot,
  Users,
  Key,
  CreditCard,
  Globe,
  Upload,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Languages,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [showApiKey, setShowApiKey] = useState(false);
  const { t, isRTL } = useTranslation();
  const { theme, setTheme } = useTheme();

  // Handle tab change - redirect to integrations page
  const handleTabChange = (value: string) => {
    if (value === "integrations") {
      router.push("/settings/integrations");
    }
  };

  const tones = [
    { key: "professional", label: t("settings.professional") },
    { key: "friendly", label: t("settings.friendly") },
    { key: "casual", label: t("settings.casual") },
  ];
  const [selectedTone, setSelectedTone] = useState("friendly");

  const themeOptions = [
    { value: "light", label: t("settings.lightMode"), icon: Sun },
    { value: "dark", label: t("settings.darkMode"), icon: Moon },
    { value: "system", label: t("settings.systemDefault"), icon: Monitor },
  ];

  return (
    <AppShell title={t("settings.title")} description={t("settings.subtitle")}>
      <Tabs defaultValue="general" onValueChange={handleTabChange}>
        <TabsList className={cn("mb-6", isRTL && "flex-row-reverse")}>
          <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("settings.theme")}</TabsTrigger>
          <TabsTrigger value="bot">{t("settings.botSettings")}</TabsTrigger>
          <TabsTrigger value="team">{t("settings.team")}</TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1.5">
            {t("settings.integrations")}
            <ExternalLink className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="billing">{t("settings.billing")}</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.businessInfo")}</CardTitle>
                <CardDescription>{t("settings.updateBusinessDetails")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.businessName")}
                  </label>
                  <Input defaultValue="شركة أكمي" />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.industry")}
                  </label>
                  <Input defaultValue={isRTL ? "تجارة إلكترونية" : "E-commerce"} />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.website")}
                  </label>
                  <Input defaultValue="https://acme.com" />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.timezone")}
                  </label>
                  <Input defaultValue="Africa/Cairo (GMT+2)" />
                </div>
                <Button>{t("settings.saveChanges")}</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance - Language & Theme */}
        <TabsContent value="appearance">
          <div className="space-y-6 max-w-2xl">
            {/* Language Settings */}
            <Card>
              <CardHeader>
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Languages className="w-5 h-5 text-primary" />
                  </div>
                  <div className={isRTL ? "text-end" : "text-start"}>
                    <CardTitle>{t("settings.language")}</CardTitle>
                    <CardDescription>
                      {isRTL ? "اختر لغة الواجهة" : "Choose interface language"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LanguageSwitcher variant="select" />
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div className={isRTL ? "text-end" : "text-start"}>
                    <CardTitle>{t("settings.theme")}</CardTitle>
                    <CardDescription>
                      {isRTL ? "اختر مظهر الواجهة" : "Choose interface appearance"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn("grid grid-cols-3 gap-3", isRTL && "direction-rtl")}>
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors duration-150",
                        theme === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        theme === option.value ? "bg-primary text-white" : "bg-surface-elevated text-muted"
                      )}>
                        <option.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{option.label}</span>
                      {theme === option.value && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bot Settings */}
        <TabsContent value="bot">
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.botPersonality")}</CardTitle>
                <CardDescription>{t("settings.customizeBot")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.botName")}
                  </label>
                  <Input defaultValue={isRTL ? "مساعد لبلب" : "Lebleb Assistant"} />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.tone")}
                  </label>
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    {tones.map((tone) => (
                      <button
                        key={tone.key}
                        onClick={() => setSelectedTone(tone.key)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
                          selectedTone === tone.key
                            ? "bg-primary text-white shadow-soft"
                            : "bg-surface-elevated text-muted hover:text-foreground"
                        )}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.defaultLanguage")}
                  </label>
                  <Input defaultValue={isRTL ? "العربية والإنجليزية" : "Arabic & English"} />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium text-foreground mb-2",
                    isRTL ? "text-end" : "text-start"
                  )}>
                    {t("settings.customInstructions")}
                  </label>
                  <Textarea
                    className="h-24"
                    defaultValue={isRTL 
                      ? "رحب بالعملاء دائماً. ركز على حل مشاكلهم بسرعة. اقترح بدائل عند عدم توفر المنتجات."
                      : "Always greet customers warmly. Focus on solving their problems quickly. Offer alternatives when products are unavailable."
                    }
                  />
                </div>
                <Button>{t("settings.saveChanges")}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.knowledgeBase")}</CardTitle>
                <CardDescription>{t("settings.uploadDocuments")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Upload className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">{t("settings.dropFilesHere")}</p>
                  <p className="text-xs text-muted">{t("settings.uploadHint")}</p>
                  <Button variant="secondary" className="mt-4">
                    {t("common.upload")}
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className={cn(
                    "flex items-center justify-between p-3 bg-surface-elevated rounded-xl",
                    isRTL && "flex-row-reverse"
                  )}>
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div className={isRTL ? "text-end" : "text-start"}>
                        <p className="text-sm font-medium text-foreground">
                          {isRTL ? "كتالوج-المنتجات.pdf" : "product-catalog.pdf"}
                        </p>
                        <p className="text-xs text-muted">2.4 MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-error" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team">
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={isRTL ? "text-end" : "text-start"}>
                  <CardTitle>{t("settings.teamMembers")}</CardTitle>
                  <CardDescription>{t("settings.manageAccess")}</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                  {t("settings.invite")}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: isRTL ? "أحمد محمد" : "Ahmed Mohamed", email: "ahmed@acme.com", role: isRTL ? "مالك" : "Owner" },
                    { name: isRTL ? "سارة أحمد" : "Sarah Ahmed", email: "sarah@acme.com", role: isRTL ? "مدير" : "Admin" },
                    { name: isRTL ? "محمد حسن" : "Mohamed Hassan", email: "mohamed@acme.com", role: isRTL ? "وكيل" : "Agent" },
                  ].map((member) => (
                    <div
                      key={member.email}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl hover:bg-surface-elevated transition-colors",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        <Avatar name={member.name} size="lg" />
                        <div className={isRTL ? "text-end" : "text-start"}>
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={member.role === (isRTL ? "مالك" : "Owner") ? "primary" : "default"}>
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations - Redirects to /settings/integrations */}
        <TabsContent value="integrations">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted mb-4">{isRTL ? "جاري التحويل..." : "Redirecting..."}</p>
            </div>
          </div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.currentPlan")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20",
                  isRTL && "flex-row-reverse"
                )}>
                  <div className={isRTL ? "text-end" : "text-start"}>
                    <h3 className="text-lg font-bold text-foreground">{t("settings.proPlan")}</h3>
                    <p className="text-sm text-muted">{isRTL ? "49$/شهر" : "$49/month"}</p>
                  </div>
                  <Badge variant="primary">{t("common.active")}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <div className={cn(
                    "flex items-center justify-between text-sm",
                    isRTL && "flex-row-reverse"
                  )}>
                    <span className="text-muted">{t("settings.messagesThisMonth")}</span>
                    <span className="text-foreground font-medium">8,420 / 10,000</span>
                  </div>
                  <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div className="h-full w-[84%] bg-primary rounded-full" />
                  </div>
                  <p className="text-xs text-muted">
                    {t("settings.resetsOn")} {isRTL ? "1 فبراير 2024" : "Feb 1, 2024"}
                  </p>
                </div>
                <div className={cn("flex items-center gap-3 mt-6", isRTL && "flex-row-reverse")}>
                  <Button variant="secondary">{t("settings.upgradePlan")}</Button>
                  <Button variant="ghost">{t("settings.cancelSubscription")}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
