"use client";

import { useState } from "react";
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
} from "lucide-react";

const connectors = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Connect via Evolution API",
    icon: "📱",
    color: "bg-whatsapp",
    status: "connected",
    stats: { messages: 4520, contacts: 1240 },
  },
  {
    id: "messenger",
    name: "Messenger",
    description: "Facebook & Instagram DMs",
    icon: "💬",
    color: "bg-messenger",
    status: "disconnected",
    stats: null,
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Telegram Bot API",
    icon: "📨",
    color: "bg-telegram",
    status: "connected",
    stats: { messages: 1290, contacts: 458 },
  },
  {
    id: "website",
    name: "Website Widget",
    description: "Embed chat on your site",
    icon: "🌐",
    color: "bg-primary",
    status: "disconnected",
    stats: null,
  },
];

export default function ConnectorsPage() {
  const [connectModal, setConnectModal] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState(false);

  const selectedConnector = connectors.find((c) => c.id === connectModal);

  return (
    <AppShell title="Connectors" description="Manage your messaging channels">
      <div className="grid gap-6 md:grid-cols-2">
        {connectors.map((connector) => (
          <Card key={connector.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${connector.color} flex items-center justify-center text-2xl`}>
                      {connector.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{connector.name}</h3>
                      <p className="text-sm text-muted">{connector.description}</p>
                    </div>
                  </div>
                  <Badge variant={connector.status === "connected" ? "success" : "default"}>
                    {connector.status === "connected" ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      "Disconnected"
                    )}
                  </Badge>
                </div>

                {connector.stats ? (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-surface-elevated rounded-lg mb-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {connector.stats.messages.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted">Messages this month</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {connector.stats.contacts.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted">Total contacts</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-surface-elevated rounded-lg mb-4 text-center">
                    <p className="text-sm text-muted">
                      Connect to start receiving messages
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {connector.status === "connected" ? (
                    <>
                      <Button variant="secondary" size="sm" className="flex-1">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                      <Button variant="secondary" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="danger" size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="flex-1"
                      onClick={() => setConnectModal(connector.id)}
                    >
                      Connect {connector.name}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connect Modal */}
      <Modal open={!!connectModal} onClose={() => setConnectModal(null)}>
        <ModalHeader onClose={() => setConnectModal(null)}>
          <ModalTitle>Connect {selectedConnector?.name}</ModalTitle>
          <ModalDescription>
            Follow the steps below to connect your {selectedConnector?.name} account
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          {connectModal === "whatsapp" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-elevated rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Step 1: Scan QR Code</h4>
                <p className="text-sm text-muted mb-4">
                  Open WhatsApp on your phone and scan the QR code below
                </p>
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-background" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                <Smartphone className="w-5 h-5 text-primary" />
                <p className="text-sm text-foreground">
                  Waiting for connection... Make sure WhatsApp is open on your phone
                </p>
              </div>
            </div>
          )}
          {connectModal === "messenger" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-elevated rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Connect Facebook Page</h4>
                <p className="text-sm text-muted mb-4">
                  You'll be redirected to Facebook to authorize access to your pages
                </p>
              </div>
              <Button className="w-full">
                <ExternalLink className="w-4 h-4" />
                Connect with Facebook
              </Button>
            </div>
          )}
          {connectModal === "telegram" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-elevated rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Enter Bot Token</h4>
                <p className="text-sm text-muted mb-4">
                  Get your bot token from @BotFather on Telegram
                </p>
                <Input placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" />
              </div>
            </div>
          )}
          {connectModal === "website" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-elevated rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Installation Code</h4>
                <p className="text-sm text-muted mb-4">
                  Add this code to your website before the closing body tag
                </p>
                <pre className="p-3 bg-background rounded-lg text-xs text-muted overflow-x-auto">
{`<script>
  (function(w,d,s,l,i){
    // LeblebBot Widget Code
  })(window,document,'script');
</script>`}
                </pre>
              </div>
              <Button variant="secondary" className="w-full">
                Copy Code
              </Button>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConnectModal(null)}>
            Cancel
          </Button>
          <Button>
            {connectModal === "whatsapp" ? "Refresh QR" : "Connect"}
          </Button>
        </ModalFooter>
      </Modal>
    </AppShell>
  );
}
