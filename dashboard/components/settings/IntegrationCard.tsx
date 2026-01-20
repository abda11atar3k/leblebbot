"use client";

import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Check,
  X,
  Settings,
  Link,
  Unlink,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Calendar,
  Mail,
  MessageSquare,
  CreditCard,
  Banknote,
  Truck,
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  FileSpreadsheet,
  Calendar,
  Mail,
  MessageSquare,
  CreditCard,
  Banknote,
  Truck,
};

export interface Integration {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category: string;
  icon: string;
  status: {
    connected: boolean;
    last_sync?: string | null;
    error?: string | null;
  };
  config: {
    enabled: boolean;
    settings: Record<string, any>;
  };
  features: string[];
  features_ar: string[];
}

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onUpdateSettings: (id: string, settings: Record<string, any>) => Promise<void>;
  onTest: (id: string) => Promise<{ success: boolean; message: string }>;
}

export const IntegrationCard = memo(function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onUpdateSettings,
  onTest,
}: IntegrationCardProps) {
  const { t, isRTL } = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [localSettings, setLocalSettings] = useState(integration.config.settings);

  const Icon = iconMap[integration.icon] || FileSpreadsheet;
  const isConnected = integration.status.connected;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect(integration.id);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      await onDisconnect(integration.id);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(integration.id);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    await onUpdateSettings(integration.id, localSettings);
    setShowSettings(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "google":
        return "text-blue-500";
      case "messaging":
        return "text-green-500";
      case "payment":
        return "text-purple-500";
      case "shipping":
        return "text-orange-500";
      default:
        return "text-primary";
    }
  };

  return (
    <>
      <Card variant={isConnected ? "elevated" : "default"} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className={cn(
            "flex items-start justify-between gap-3",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                isConnected ? "bg-success/10" : "bg-surface-elevated"
              )}>
                <Icon className={cn("w-6 h-6", getCategoryColor(integration.category))} />
              </div>
              <div className={isRTL ? "text-end" : "text-start"}>
                <CardTitle className="text-base">
                  {isRTL ? integration.name_ar : integration.name}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 line-clamp-1">
                  {isRTL ? integration.description_ar : integration.description}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={isConnected ? "success" : "secondary"}
              className={cn("flex items-center gap-1 shrink-0", isRTL && "flex-row-reverse")}
            >
              {isConnected ? (
                <>
                  <Check className="w-3 h-3" />
                  {isRTL ? "متصل" : "Connected"}
                </>
              ) : (
                <>
                  <X className="w-3 h-3" />
                  {isRTL ? "غير متصل" : "Disconnected"}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Features */}
          <div className="space-y-1.5">
            <p className={cn("text-xs font-medium text-muted", isRTL && "text-end")}>
              {isRTL ? "المميزات" : "Features"}
            </p>
            <ul className="grid grid-cols-2 gap-1">
              {(isRTL ? integration.features_ar : integration.features).slice(0, 4).map((feature, index) => (
                <li
                  key={index}
                  className={cn(
                    "flex items-center gap-1.5 text-xs text-muted",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <Check className="w-3 h-3 text-success shrink-0" />
                  <span className="truncate">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Last Sync */}
          {isConnected && integration.status.last_sync && (
            <div className={cn(
              "flex items-center gap-2 text-xs text-muted p-2 bg-surface-elevated rounded-lg",
              isRTL && "flex-row-reverse"
            )}>
              <RefreshCw className="w-3 h-3" />
              <span>{isRTL ? "آخر مزامنة:" : "Last sync:"} {integration.status.last_sync}</span>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={cn(
              "flex items-center gap-2 text-xs p-2 rounded-lg",
              testResult.success ? "bg-success/10 text-success" : "bg-error/10 text-error",
              isRTL && "flex-row-reverse"
            )}>
              {testResult.success ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className={cn(
            "flex items-center gap-2 pt-1",
            isRTL && "flex-row-reverse"
          )}>
            {isConnected ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="flex-1"
                >
                  <Settings className="w-4 h-4" />
                  {isRTL ? "الإعدادات" : "Settings"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTest}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                  className="text-error hover:text-error hover:bg-error/10"
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
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

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)}>
        <ModalHeader onClose={() => setShowSettings(false)}>
          <ModalTitle className={cn(isRTL && "text-end")}>
            {isRTL ? `إعدادات ${integration.name_ar}` : `${integration.name} Settings`}
          </ModalTitle>
          <ModalDescription className={cn(isRTL && "text-end")}>
            {isRTL ? "تخصيص إعدادات التكامل" : "Customize integration settings"}
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            {Object.entries(localSettings).map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <label className={cn(
                  "text-sm font-medium text-foreground capitalize",
                  isRTL && "block text-end"
                )}>
                  {key.replace(/_/g, " ")}
                </label>
                {typeof value === "boolean" ? (
                  <label className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    isRTL && "flex-row-reverse justify-end"
                  )}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        [key]: e.target.checked
                      })}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-muted">
                      {isRTL ? "مفعّل" : "Enabled"}
                    </span>
                  </label>
                ) : (
                  <Input
                    value={value}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      [key]: e.target.value
                    })}
                    className={cn(isRTL && "text-end")}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                )}
              </div>
            ))}
          </div>
        </ModalContent>
        <ModalFooter className={cn(isRTL && "flex-row-reverse")}>
          <Button variant="secondary" onClick={() => setShowSettings(false)}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleSaveSettings}>
            {isRTL ? "حفظ" : "Save"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
});
