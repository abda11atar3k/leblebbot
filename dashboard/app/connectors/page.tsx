"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Check,
  X,
  Settings,
  RefreshCw,
  QrCode,
  ExternalLink,
  Smartphone,
  Globe,
  Send,
  Users,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  fetchConnectors,
  fetchConnectorStatus,
  connectConnector,
  disconnectConnector,
  fetchQRCode,
  logoutWhatsApp,
  fetchSyncStatus,
  ConnectorInfo,
  ConnectorStatus,
  ConnectorSyncStatus,
} from "@/lib/api/connectors";
import { clearAllWhatsAppCaches } from "@/lib/api/conversations";

interface ConnectorWithStatus extends ConnectorInfo {
  connectionStatus?: ConnectorStatus;
  syncStatus?: ConnectorSyncStatus;
}

const connectorIcons: Record<string, string> = {
  whatsapp: "📱",
  messenger: "💬",
  telegram: "📨",
  instagram: "📷",
  website: "🌐",
};

const connectorColors: Record<string, string> = {
  whatsapp: "bg-whatsapp",
  messenger: "bg-messenger",
  telegram: "bg-telegram",
  instagram: "bg-pink-500",
  website: "bg-primary",
};

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  
  // Sync status state
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ConnectorSyncStatus | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadConnectors = async () => {
    setLoading(true);
    const data = await fetchConnectors();
    
    // Fetch status and sync status for each connector
    const connectorsWithStatus = await Promise.all(
      data.items.map(async (connector) => {
        const status = await fetchConnectorStatus(connector.type);
        let sync: ConnectorSyncStatus | undefined;
        if (connector.type === "whatsapp" && status.connected) {
          sync = await fetchSyncStatus(connector.type);
        }
        return { ...connector, connectionStatus: status, syncStatus: sync };
      })
    );
    
    setConnectors(connectorsWithStatus);
    setLoading(false);
  };

  // Poll for connection status when QR modal is open
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(async () => {
      if (connectModal === "whatsapp") {
        const sync = await fetchSyncStatus("whatsapp");
        setSyncStatus(sync);
        
        if (sync.connected && !isConnected) {
          // Just connected!
          setIsConnected(true);
          setIsSyncing(true);
          setQrCode(null); // Hide QR code
        }
        
        // Check if sync is progressing (messages > 0 means syncing)
        if (isConnected && sync.messages > 0) {
          setIsSyncing(true);
        }
      }
    }, 2000); // Poll every 2 seconds
  }, [connectModal, isConnected]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadConnectors();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadConnectors, 10000);
    return () => clearInterval(interval);
  }, []);

  // Start/stop polling based on modal state
  useEffect(() => {
    if (connectModal === "whatsapp" && qrCode) {
      startPolling();
    } else if (!connectModal) {
      stopPolling();
      // Reset states when modal closes
      setIsConnected(false);
      setIsSyncing(false);
      setSyncStatus(null);
    }
    
    return () => stopPolling();
  }, [connectModal, qrCode, startPolling, stopPolling]);

  const handleConnect = async (connectorType: string) => {
    setConnecting(true);
    setQrCode(null);
    setConnectionError(null);
    setPairingCode(null);
    
    if (connectorType === "whatsapp") {
      try {
        // Connect returns QR code directly in Evolution API v2
        const result = await connectConnector(connectorType);
        
        // Check for errors
        if (result.error) {
          setConnectionError(result.error);
          setConnecting(false);
          return;
        }
        
        // Extract QR code from response
        if (result.base64) {
          setQrCode(result.base64);
        } else if (result.qr_code) {
          setQrCode(result.qr_code);
        } else if (result.already_connected) {
          // Already connected, close modal and refresh
          setConnectModal(null);
          loadConnectors();
        } else {
          // Fallback: try fetching QR code separately
          setQrLoading(true);
          const qr = await fetchQRCode();
          if (qr.base64) {
            setQrCode(qr.base64);
          } else if (qr.qr_code) {
            setQrCode(qr.qr_code);
          } else if (qr.error) {
            setConnectionError(qr.error);
          }
          setQrLoading(false);
        }
        
        // Check for pairing code
        if (result.pairing_code) {
          setPairingCode(result.pairing_code);
        }
      } catch (error) {
        setConnectionError(String(error));
      }
    } else {
      await connectConnector(connectorType);
    }
    
    setConnecting(false);
  };

  const handleDisconnect = async (connectorType: string) => {
    if (connectorType === "whatsapp") {
      await logoutWhatsApp();
      // Clear all WhatsApp caches when logging out
      await clearAllWhatsAppCaches();
      // Reload page to clear all React state
      window.location.reload();
      return;
    } else {
      await disconnectConnector(connectorType);
    }
    loadConnectors();
  };

  const handleRefreshQR = async () => {
    setQrLoading(true);
    setConnectionError(null);
    
    try {
      const qr = await fetchQRCode();
      if (qr.base64) {
        setQrCode(qr.base64);
      } else if (qr.qr_code) {
        setQrCode(qr.qr_code);
      } else if (qr.error) {
        setConnectionError(qr.error);
      }
    } catch (error) {
      setConnectionError(String(error));
    }
    
    setQrLoading(false);
  };

  const selectedConnector = connectors.find((c) => c.type === connectModal);

  if (loading && connectors.length === 0) {
    return (
      <AppShell title="القنوات" description="إدارة قنوات المراسلة">
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-elevated" />
                    <div>
                      <div className="h-5 w-24 bg-surface-elevated rounded mb-2" />
                      <div className="h-4 w-32 bg-surface-elevated rounded" />
                    </div>
                  </div>
                </div>
                <div className="h-24 bg-surface-elevated rounded-lg mb-4" />
                <div className="h-10 bg-surface-elevated rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="القنوات" description="إدارة قنوات المراسلة">
      <div className="grid gap-6 md:grid-cols-2">
        {connectors.map((connector) => {
          const isConnected = connector.connectionStatus?.connected || false;
          const icon = connectorIcons[connector.type] || "📱";
          const color = connectorColors[connector.type] || "bg-primary";
          
          return (
            <Card key={connector.type} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}>
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{connector.name}</h3>
                        <p className="text-sm text-muted">{connector.description}</p>
                      </div>
                    </div>
                    <Badge variant={isConnected ? "success" : "default"}>
                      {isConnected ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          متصل
                        </>
                      ) : (
                        connector.status === "coming_soon" ? "قريباً" : "غير متصل"
                      )}
                    </Badge>
                  </div>

                  {connector.connectionStatus?.connected ? (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-surface-elevated rounded-lg mb-4">
                      <div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">
                          {connector.syncStatus?.messages?.toLocaleString() || "-"}
                        </p>
                        <p className="text-sm text-muted">الرسائل</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">
                          {connector.syncStatus?.contacts?.toLocaleString() || "-"}
                        </p>
                        <p className="text-sm text-muted">جهات الاتصال</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-elevated rounded-lg mb-4 text-center">
                      <p className="text-sm text-muted">
                        {connector.status === "coming_soon" 
                          ? "هذه القناة قيد التطوير"
                          : "اتصل لبدء استقبال الرسائل"}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Button variant="secondary" size="sm" className="flex-1">
                          <Settings className="w-4 h-4" />
                          الإعدادات
                        </Button>
                        <Button variant="secondary" size="sm" onClick={loadConnectors}>
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDisconnect(connector.type)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setConnectModal(connector.type);
                          if (connector.type === "whatsapp") {
                            handleConnect(connector.type);
                          }
                        }}
                        disabled={connector.status === "coming_soon"}
                      >
                        {connector.status === "coming_soon" 
                          ? "قريباً" 
                          : `اتصل بـ ${connector.name}`}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connect Modal */}
      <Modal open={!!connectModal} onClose={() => { setConnectModal(null); setQrCode(null); setConnectionError(null); setPairingCode(null); }}>
        <ModalHeader onClose={() => { setConnectModal(null); setQrCode(null); setConnectionError(null); setPairingCode(null); }}>
          <ModalTitle>اتصل بـ {selectedConnector?.name}</ModalTitle>
          <ModalDescription>
            اتبع الخطوات التالية للاتصال بحسابك على {selectedConnector?.name}
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          {connectModal === "whatsapp" && (
            <div className="space-y-4">
              {/* Connected - Show Sync Progress */}
              {isConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">تم الاتصال بنجاح!</h4>
                        <p className="text-sm text-muted">جاري مزامنة البيانات...</p>
                      </div>
                    </div>
                    
                    {/* Sync Progress */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-surface rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-primary" />
                          {isSyncing && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
                        </div>
                        <p className="text-xl font-bold text-foreground tabular-nums">
                          {syncStatus?.contacts?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted">جهات الاتصال</p>
                      </div>
                      <div className="p-3 bg-surface rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          {isSyncing && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
                        </div>
                        <p className="text-xl font-bold text-foreground tabular-nums">
                          {syncStatus?.chats?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted">المحادثات</p>
                      </div>
                      <div className="p-3 bg-surface rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          {isSyncing && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
                        </div>
                        <p className="text-xl font-bold text-foreground tabular-nums">
                          {syncStatus?.messages?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted">الرسائل</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      جاري مزامنة الرسائل... قد تستغرق العملية عدة دقائق
                    </p>
                  </div>
                </div>
              ) : (
                /* Not Connected - Show QR Code */
                <>
                  <div className="p-4 bg-surface-elevated rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">الخطوة 1: امسح رمز QR</h4>
                    <p className="text-sm text-muted mb-4">
                      افتح واتساب على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز
                    </p>
                    <div className="w-56 h-56 mx-auto bg-white rounded-lg flex items-center justify-center overflow-hidden p-2">
                      {qrLoading || connecting ? (
                        <div className="text-center">
                          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                          <p className="text-xs text-muted">جاري التحميل...</p>
                        </div>
                      ) : connectionError ? (
                        <div className="text-center p-4">
                          <X className="w-8 h-8 text-error mx-auto mb-2" />
                          <p className="text-xs text-error mb-2">{connectionError}</p>
                          {connectionError.includes("Unexpected") && (
                            <p className="text-xs text-muted">
                              السيرفر مش قادر يتصل بـ WhatsApp. جرب تاني بعد شوية أو تواصل مع الدعم.
                            </p>
                          )}
                        </div>
                      ) : qrCode ? (
                        <img 
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <QrCode className="w-20 h-20 text-muted mx-auto mb-2" />
                          <p className="text-xs text-muted">اضغط تحديث QR</p>
                        </div>
                      )}
                    </div>
                    {pairingCode && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                        <p className="text-xs text-muted mb-1">أو استخدم كود الربط:</p>
                        <p className="text-lg font-mono font-bold text-primary tracking-wider">{pairingCode}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                    <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      في انتظار الاتصال... تأكد من أن واتساب مفتوح على هاتفك
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          {connectModal === "messenger" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-elevated rounded-lg">
                <h4 className="font-medium text-foreground mb-2">اتصل بصفحة فيسبوك</h4>
                <p className="text-sm text-muted mb-4">
                  سيتم توجيهك إلى فيسبوك لتصريح الوصول إلى صفحاتك
                </p>
              </div>
              <Button className="w-full" disabled>
                <ExternalLink className="w-4 h-4" />
                قريباً
              </Button>
            </div>
          )}
          {connectModal === "telegram" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-elevated rounded-lg">
                <h4 className="font-medium text-foreground mb-2">أدخل توكن البوت</h4>
                <p className="text-sm text-muted mb-4">
                  احصل على توكن البوت من @BotFather على تليجرام
                </p>
                <Input placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" dir="ltr" />
              </div>
            </div>
          )}
          {connectModal === "website" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-elevated rounded-lg">
                <h4 className="font-medium text-foreground mb-2">كود التثبيت</h4>
                <p className="text-sm text-muted mb-4">
                  أضف هذا الكود إلى موقعك قبل إغلاق وسم body
                </p>
                <pre className="p-3 bg-background rounded-lg text-xs text-muted overflow-x-auto" dir="ltr">
{`<script>
  (function(w,d,s,l,i){
    // LeblebBot Widget Code
  })(window,document,'script');
</script>`}
                </pre>
              </div>
              <Button variant="secondary" className="w-full">
                نسخ الكود
              </Button>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          {connectModal === "whatsapp" && isConnected ? (
            <Button 
              onClick={() => { 
                setConnectModal(null); 
                setQrCode(null); 
                setConnectionError(null); 
                setPairingCode(null);
                loadConnectors(); // Refresh connectors list
              }}
            >
              <Check className="w-4 h-4" />
              تم
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => { setConnectModal(null); setQrCode(null); setConnectionError(null); setPairingCode(null); }}>
                إلغاء
              </Button>
              {connectModal === "whatsapp" && (
                <Button onClick={handleRefreshQR} disabled={qrLoading || connecting}>
                  {qrLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "تحديث QR"}
                </Button>
              )}
            </>
          )}
        </ModalFooter>
      </Modal>
    </AppShell>
  );
}
