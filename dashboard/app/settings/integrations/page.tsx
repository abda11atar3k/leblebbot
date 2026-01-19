"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  FileSpreadsheet,
  MessageSquare,
  Settings,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Key,
  Link,
  Unlink,
  Bell,
  Shield,
  Zap
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ElementType;
  iconColor: string;
  connected: boolean;
  lastSync?: string;
  features: string[];
  featuresAr: string[];
}

const integrations: Integration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    nameAr: "تقويم جوجل",
    description: "Sync bookings automatically with Google Calendar",
    descriptionAr: "مزامنة الحجوزات تلقائياً مع تقويم جوجل",
    icon: Calendar,
    iconColor: "text-blue-500",
    connected: false,
    features: [
      "Auto-create calendar events for bookings",
      "Two-way sync with Google Calendar",
      "Send calendar invites to customers",
      "Set automatic reminders"
    ],
    featuresAr: [
      "إنشاء أحداث تقويم تلقائياً للحجوزات",
      "مزامنة ثنائية مع تقويم جوجل",
      "إرسال دعوات التقويم للعملاء",
      "تعيين تذكيرات تلقائية"
    ]
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    nameAr: "جداول بيانات جوجل",
    description: "Export data and analytics to Google Sheets",
    descriptionAr: "تصدير البيانات والتحليلات إلى جداول بيانات جوجل",
    icon: FileSpreadsheet,
    iconColor: "text-green-500",
    connected: false,
    features: [
      "Auto-log orders to spreadsheet",
      "Export booking records",
      "Daily analytics reports",
      "Custom data exports"
    ],
    featuresAr: [
      "تسجيل الطلبات تلقائياً في الجدول",
      "تصدير سجلات الحجوزات",
      "تقارير تحليلية يومية",
      "تصدير بيانات مخصصة"
    ]
  },
  {
    id: "whatsapp-notifications",
    name: "WhatsApp Notifications",
    nameAr: "إشعارات واتساب",
    description: "Send instant notifications via WhatsApp",
    descriptionAr: "إرسال إشعارات فورية عبر واتساب",
    icon: MessageSquare,
    iconColor: "text-whatsapp",
    connected: true,
    lastSync: "منذ دقيقتين",
    features: [
      "New order alerts to admin",
      "Order status updates to customers",
      "Booking reminders",
      "Follow-up messages"
    ],
    featuresAr: [
      "تنبيهات الطلبات الجديدة للإدارة",
      "تحديثات حالة الطلب للعملاء",
      "تذكيرات الحجوزات",
      "رسائل المتابعة"
    ]
  }
];

export default function IntegrationsPage() {
  const { isRTL } = useTranslation();
  const [integrationsState, setIntegrationsState] = useState(integrations);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIntegrationsState(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, connected: true, lastSync: isRTL ? "الآن" : "Just now" }
        : int
    ));
    setConnecting(null);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrationsState(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, connected: false, lastSync: undefined }
        : int
    ));
  };

  return (
    <AppShell 
      title={isRTL ? "التكاملات" : "Integrations"} 
      description={isRTL ? "ربط LeblebBot مع خدماتك المفضلة" : "Connect LeblebBot with your favorite services"}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground">
                {integrationsState.filter(i => i.connected).length}
              </p>
              <p className="text-sm text-muted">{isRTL ? "متصل" : "Connected"}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-muted/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-muted" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground">
                {integrationsState.filter(i => !i.connected).length}
              </p>
              <p className="text-sm text-muted">{isRTL ? "متاح" : "Available"}</p>
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
              <p className="text-sm text-muted">{isRTL ? "آمن" : "Secure"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrationsState.map((integration) => {
          const Icon = integration.icon;
          const isConnecting = connecting === integration.id;

          return (
            <Card key={integration.id} variant={integration.connected ? "elevated" : "default"}>
              <CardHeader>
                <div className={cn(
                  "flex items-start justify-between",
                  isRTL && "flex-row-reverse"
                )}>
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      integration.connected ? "bg-success/10" : "bg-surface-elevated"
                    )}>
                      <Icon className={cn("w-6 h-6", integration.iconColor)} />
                    </div>
                    <div className={isRTL ? "text-end" : "text-start"}>
                      <CardTitle className="text-lg">
                        {isRTL ? integration.nameAr : integration.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {isRTL ? integration.descriptionAr : integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={integration.connected ? "success" : "secondary"}
                    className={cn(
                      "flex items-center gap-1",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    {integration.connected ? (
                      <>
                        <Check className="w-3 h-3" />
                        {isRTL ? "متصل" : "Connected"}
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        {isRTL ? "غير متصل" : "Not Connected"}
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                <div className="space-y-2">
                  <p className={cn(
                    "text-xs font-semibold text-muted",
                    isRTL && "text-end"
                  )}>
                    {isRTL ? "المميزات" : "Features"}
                  </p>
                  <ul className="space-y-1.5">
                    {(isRTL ? integration.featuresAr : integration.features).map((feature, index) => (
                      <li 
                        key={index}
                        className={cn(
                          "flex items-center gap-2 text-sm text-muted",
                          isRTL && "flex-row-reverse"
                        )}
                      >
                        <Check className="w-3 h-3 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Last Sync */}
                {integration.connected && integration.lastSync && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs text-muted p-2 bg-surface-elevated rounded-lg",
                    isRTL && "flex-row-reverse"
                  )}>
                    <RefreshCw className="w-3 h-3" />
                    <span>{isRTL ? "آخر مزامنة:" : "Last sync:"} {integration.lastSync}</span>
                  </div>
                )}

                {/* Actions */}
                <div className={cn(
                  "flex items-center gap-2 pt-2",
                  isRTL && "flex-row-reverse"
                )}>
                  {integration.connected ? (
                    <>
                      <Button variant="secondary" size="sm">
                        <Settings className="w-4 h-4" />
                        {isRTL ? "الإعدادات" : "Settings"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <Unlink className="w-4 h-4" />
                        {isRTL ? "قطع الاتصال" : "Disconnect"}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handleConnect(integration.id)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {isRTL ? "جاري الاتصال..." : "Connecting..."}
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4" />
                          {isRTL ? "اتصال" : "Connect"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* API Keys Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className={isRTL ? "text-end" : "text-start"}>
                <CardTitle>{isRTL ? "مفاتيح API" : "API Keys"}</CardTitle>
                <CardDescription>
                  {isRTL 
                    ? "إدارة مفاتيح API للتكاملات المخصصة" 
                    : "Manage API keys for custom integrations"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              "flex items-center gap-4",
              isRTL && "flex-row-reverse"
            )}>
              <Input 
                value="lbb_sk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button variant="secondary" size="sm">
                {isRTL ? "نسخ" : "Copy"}
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className={cn(
              "text-xs text-muted",
              isRTL && "text-end"
            )}>
              {isRTL 
                ? "احتفظ بمفتاح API الخاص بك سرياً. لا تشاركه مع أي شخص."
                : "Keep your API key secret. Never share it with anyone."}
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
                <CardTitle>{isRTL ? "Webhooks" : "Webhooks"}</CardTitle>
                <CardDescription>
                  {isRTL 
                    ? "استقبال إشعارات فورية عند حدوث أحداث معينة" 
                    : "Receive real-time notifications when events occur"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center gap-4",
              isRTL && "sm:flex-row-reverse"
            )}>
              <Input 
                placeholder={isRTL ? "https://your-server.com/webhook" : "https://your-server.com/webhook"}
                className="flex-1"
              />
              <Button>{isRTL ? "حفظ" : "Save"}</Button>
            </div>
            <div className={cn(
              "flex flex-wrap gap-2",
              isRTL && "flex-row-reverse justify-end"
            )}>
              {[
                { id: "orders", label: isRTL ? "الطلبات" : "Orders" },
                { id: "bookings", label: isRTL ? "الحجوزات" : "Bookings" },
                { id: "conversations", label: isRTL ? "المحادثات" : "Conversations" },
              ].map((event) => (
                <label 
                  key={event.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 bg-surface-elevated rounded-lg cursor-pointer",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <input type="checkbox" defaultChecked className="rounded" />
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
