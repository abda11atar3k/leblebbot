"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare,
  MoreVertical,
  CheckCircle,
  Truck,
  AlertCircle,
  XCircle
} from "lucide-react";

export type OrderStatus = "new" | "processing" | "shipping" | "delivered" | "cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: OrderStatus;
  platform: "whatsapp" | "facebook" | "instagram" | "website";
  createdAt: string;
  conversationId?: string;
}

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  onViewConversation?: (conversationId: string) => void;
}

export function OrderCard({ order, onStatusChange, onViewConversation }: OrderCardProps) {
  const { isRTL } = useTranslation();

  const statusConfig: Record<OrderStatus, { label: string; labelAr: string; icon: React.ElementType; color: string }> = {
    new: { 
      label: "New", 
      labelAr: "جديد", 
      icon: AlertCircle, 
      color: "bg-primary/10 text-primary" 
    },
    processing: { 
      label: "Processing", 
      labelAr: "قيد التجهيز", 
      icon: Package, 
      color: "bg-warning/10 text-warning" 
    },
    shipping: { 
      label: "Shipping", 
      labelAr: "في الطريق", 
      icon: Truck, 
      color: "bg-blue-500/10 text-blue-500" 
    },
    delivered: { 
      label: "Delivered", 
      labelAr: "تم التوصيل", 
      icon: CheckCircle, 
      color: "bg-success/10 text-success" 
    },
    cancelled: { 
      label: "Cancelled", 
      labelAr: "ملغي", 
      icon: XCircle, 
      color: "bg-error/10 text-error" 
    },
  };

  const platformColors = {
    whatsapp: "bg-whatsapp",
    facebook: "bg-messenger",
    instagram: "bg-pink-500",
    website: "bg-primary",
  };

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-soft hover:shadow-soft-lg transition-all">
      {/* Header */}
      <div className={cn(
        "flex items-start justify-between mb-4",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <Avatar name={order.customer.name} size="lg" />
          <div className={isRTL ? "text-end" : "text-start"}>
            <h3 className="font-bold text-foreground">{order.customer.name}</h3>
            <p className="text-sm text-muted">#{order.orderNumber}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <div className={cn(
            "w-3 h-3 rounded-full",
            platformColors[order.platform]
          )} />
          <Badge className={status.color}>
            <StatusIcon className="w-3 h-3 me-1" />
            {isRTL ? status.labelAr : status.label}
          </Badge>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-4">
        <div className={cn(
          "flex items-center gap-2 text-sm text-muted",
          isRTL && "flex-row-reverse"
        )}>
          <Phone className="w-4 h-4" />
          <span dir="ltr">{order.customer.phone}</span>
        </div>
        <div className={cn(
          "flex items-center gap-2 text-sm text-muted",
          isRTL && "flex-row-reverse"
        )}>
          <MapPin className="w-4 h-4" />
          <span>{order.customer.address}</span>
        </div>
        <div className={cn(
          "flex items-center gap-2 text-sm text-muted",
          isRTL && "flex-row-reverse"
        )}>
          <Clock className="w-4 h-4" />
          <span>{order.createdAt}</span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-surface-elevated rounded-lg p-3 mb-4">
        {order.items.map((item, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center justify-between py-1",
              isRTL && "flex-row-reverse"
            )}
          >
            <span className="text-sm text-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="text-sm font-medium text-foreground">
              {item.price * item.quantity} {isRTL ? "ج.م" : "EGP"}
            </span>
          </div>
        ))}
        <div className={cn(
          "flex items-center justify-between pt-2 mt-2 border-t border-border",
          isRTL && "flex-row-reverse"
        )}>
          <span className="text-sm font-bold text-foreground">
            {isRTL ? "الإجمالي" : "Total"}
          </span>
          <span className="text-lg font-bold text-primary">
            {order.total} {isRTL ? "ج.م" : "EGP"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-2",
        isRTL && "flex-row-reverse"
      )}>
        {order.conversationId && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onViewConversation?.(order.conversationId!)}
          >
            <MessageSquare className="w-4 h-4" />
            {isRTL ? "المحادثة" : "Chat"}
          </Button>
        )}
        
        {order.status === "new" && (
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => onStatusChange?.(order.id, "processing")}
          >
            {isRTL ? "قبول الطلب" : "Accept Order"}
          </Button>
        )}
        
        {order.status === "processing" && (
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => onStatusChange?.(order.id, "shipping")}
          >
            <Truck className="w-4 h-4" />
            {isRTL ? "بدء الشحن" : "Start Shipping"}
          </Button>
        )}
        
        {order.status === "shipping" && (
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => onStatusChange?.(order.id, "delivered")}
          >
            <CheckCircle className="w-4 h-4" />
            {isRTL ? "تم التوصيل" : "Mark Delivered"}
          </Button>
        )}

        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
