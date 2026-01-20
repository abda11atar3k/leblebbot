"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  MessageSquare,
  Clock,
  Tag,
  ExternalLink,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { fetchConversation, fetchWhatsAppMessages } from "@/lib/api/conversations";

interface CustomerInfoProps {
  conversationId: string | null;
  isWhatsApp?: boolean;
}

interface CustomerData {
  name: string;
  email?: string;
  phone: string;
  location?: string;
  joinedAt?: string;
  totalOrders?: number;
  totalSpent?: string;
  conversations?: number;
  avgResponseTime?: string;
  tags: string[];
}

export function CustomerInfo({ conversationId, isWhatsApp = false }: CustomerInfoProps) {
  const { t, isRTL } = useTranslation();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const loadCustomerInfo = useCallback(async () => {
    if (!conversationId) {
      setCustomer(null);
      return;
    }
    
    setLoading(true);
    
    try {
      if (isWhatsApp) {
        // For WhatsApp chats, get basic info from messages endpoint
        const data = await fetchWhatsAppMessages(conversationId, 1);
        setCustomer({
          name: data.chat.name || data.chat.phone,
          phone: data.chat.phone,
          tags: data.chat.is_group ? ["Group"] : ["WhatsApp"],
        });
      } else {
        // For MongoDB conversations, get full user info
        const data = await fetchConversation(conversationId);
        if (data?.user) {
          setCustomer({
            name: data.user.name || data.user.phone || "مجهول",
            email: data.user.email,
            phone: data.user.phone || "",
            tags: data.user.tags || [],
            totalOrders: data.user.order_count,
            totalSpent: data.user.total_spent ? `$${data.user.total_spent}` : undefined,
          });
        } else {
          setCustomer(null);
        }
      }
    } catch (error) {
      console.error("Error loading customer info:", error);
      setCustomer(null);
    }
    
    setLoading(false);
  }, [conversationId, isWhatsApp]);
  
  useEffect(() => {
    loadCustomerInfo();
  }, [loadCustomerInfo]);
  
  if (!conversationId) {
    return null;
  }

  if (loading && !customer) {
    return (
      <div className={cn(
        "w-80 border-border bg-surface flex items-center justify-center",
        isRTL ? "border-r" : "border-l"
      )}>
        <RefreshCw className="w-6 h-6 text-muted animate-spin" />
      </div>
    );
  }

  // Fallback to basic display if no customer data
  const displayCustomer: CustomerData = customer || {
    name: isWhatsApp ? conversationId.split("@")[0] : "مجهول",
    phone: isWhatsApp ? conversationId.split("@")[0] : "",
    tags: isWhatsApp ? ["WhatsApp"] : [],
  };

  return (
    <div className={cn(
      "w-80 border-border bg-surface flex flex-col",
      isRTL ? "border-r" : "border-l"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border text-center">
        <Avatar name={displayCustomer.name} size="xl" className="mx-auto mb-3" />
        <h3 className="font-semibold text-foreground">{displayCustomer.name}</h3>
        {displayCustomer.email && (
          <p className="text-sm text-muted">{displayCustomer.email}</p>
        )}
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          {displayCustomer.tags.map((tag) => (
            <Badge key={tag} variant="primary" size="sm">
              {tag}
            </Badge>
          ))}
          {isWhatsApp && (
            <Badge variant="secondary" size="sm">
              Evolution API
            </Badge>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-4 border-b border-border space-y-3">
        {displayCustomer.email && (
          <div className={cn(
            "flex items-center gap-3 text-sm",
            isRTL && "flex-row-reverse"
          )}>
            <Mail className="w-4 h-4 text-muted" />
            <span className="text-foreground">{displayCustomer.email}</span>
          </div>
        )}
        <div className={cn(
          "flex items-center gap-3 text-sm",
          isRTL && "flex-row-reverse"
        )}>
          <Phone className="w-4 h-4 text-muted" />
          <span className="text-foreground">{displayCustomer.phone || "غير متوفر"}</span>
        </div>
        {displayCustomer.location && (
          <div className={cn(
            "flex items-center gap-3 text-sm",
            isRTL && "flex-row-reverse"
          )}>
            <MapPin className="w-4 h-4 text-muted" />
            <span className="text-foreground">{displayCustomer.location}</span>
          </div>
        )}
        {displayCustomer.joinedAt && (
          <div className={cn(
            "flex items-center gap-3 text-sm",
            isRTL && "flex-row-reverse"
          )}>
            <Calendar className="w-4 h-4 text-muted" />
            <span className="text-muted">{t("customer.customerSince")}</span>
            <span className={cn(
              "text-foreground",
              isRTL ? "mr-auto" : "ml-auto"
            )}>{displayCustomer.joinedAt}</span>
          </div>
        )}
      </div>

      {/* Stats - only show if we have data */}
      {(displayCustomer.totalOrders !== undefined || displayCustomer.totalSpent || displayCustomer.conversations || displayCustomer.avgResponseTime) && (
        <div className="p-4 border-b border-border">
          <h4 className={cn(
            "text-sm font-medium text-foreground mb-3",
            isRTL ? "text-end" : "text-start"
          )}>
            {t("customer.statistics")}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {displayCustomer.totalOrders !== undefined && (
              <div className="p-3 bg-surface-elevated rounded-lg">
                <div className={cn(
                  "flex items-center gap-2 text-muted mb-1",
                  isRTL && "flex-row-reverse"
                )}>
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-xs">{t("customer.orders")}</span>
                </div>
                <p className={cn(
                  "text-lg font-semibold text-foreground",
                  isRTL ? "text-end" : "text-start"
                )}>{displayCustomer.totalOrders}</p>
              </div>
            )}
            {displayCustomer.totalSpent && (
              <div className="p-3 bg-surface-elevated rounded-lg">
                <div className={cn(
                  "flex items-center gap-2 text-muted mb-1",
                  isRTL && "flex-row-reverse"
                )}>
                  <Tag className="w-4 h-4" />
                  <span className="text-xs">{t("customer.totalSpent")}</span>
                </div>
                <p className={cn(
                  "text-lg font-semibold text-foreground",
                  isRTL ? "text-end" : "text-start"
                )}>{displayCustomer.totalSpent}</p>
              </div>
            )}
            {displayCustomer.conversations !== undefined && (
              <div className="p-3 bg-surface-elevated rounded-lg">
                <div className={cn(
                  "flex items-center gap-2 text-muted mb-1",
                  isRTL && "flex-row-reverse"
                )}>
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">{t("customer.chats")}</span>
                </div>
                <p className={cn(
                  "text-lg font-semibold text-foreground",
                  isRTL ? "text-end" : "text-start"
                )}>{displayCustomer.conversations}</p>
              </div>
            )}
            {displayCustomer.avgResponseTime && (
              <div className="p-3 bg-surface-elevated rounded-lg">
                <div className={cn(
                  "flex items-center gap-2 text-muted mb-1",
                  isRTL && "flex-row-reverse"
                )}>
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">{t("customer.avgResponse")}</span>
                </div>
                <p className={cn(
                  "text-lg font-semibold text-foreground",
                  isRTL ? "text-end" : "text-start"
                )}>{displayCustomer.avgResponseTime}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "grid grid-cols-2 gap-2",
          isRTL && "direction-rtl"
        )}>
          <Button variant="secondary" size="sm">
            <ExternalLink className="w-4 h-4" />
            {t("customer.viewProfile")}
          </Button>
          <Button variant="secondary" size="sm">
            <UserPlus className="w-4 h-4" />
            {t("customer.addNote")}
          </Button>
        </div>
      </div>
    </div>
  );
}
