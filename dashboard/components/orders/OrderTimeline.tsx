"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { 
  Package, 
  CheckCircle, 
  Truck, 
  AlertCircle, 
  XCircle,
  Clock
} from "lucide-react";
import { OrderStatus } from "./OrderCard";

interface TimelineStep {
  status: OrderStatus;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  timestamp?: string;
}

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  timestamps?: Partial<Record<OrderStatus, string>>;
  className?: string;
}

export function OrderTimeline({ currentStatus, timestamps = {}, className }: OrderTimelineProps) {
  const { isRTL } = useTranslation();

  const steps: TimelineStep[] = [
    { status: "new", label: "Order Placed", labelAr: "تم الطلب", icon: AlertCircle },
    { status: "processing", label: "Processing", labelAr: "قيد التجهيز", icon: Package },
    { status: "shipping", label: "Shipping", labelAr: "في الطريق", icon: Truck },
    { status: "delivered", label: "Delivered", labelAr: "تم التوصيل", icon: CheckCircle },
  ];

  const statusOrder: OrderStatus[] = ["new", "processing", "shipping", "delivered"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentStatus === "cancelled") {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 bg-error/10 rounded-xl",
        isRTL && "flex-row-reverse",
        className
      )}>
        <XCircle className="w-6 h-6 text-error" />
        <div className={isRTL ? "text-end" : "text-start"}>
          <p className="font-semibold text-error">
            {isRTL ? "تم إلغاء الطلب" : "Order Cancelled"}
          </p>
          {timestamps.cancelled && (
            <p className="text-sm text-muted">{timestamps.cancelled}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "flex items-center justify-between",
        isRTL && "flex-row-reverse"
      )}>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div 
              key={step.status}
              className="flex flex-col items-center relative z-10"
            >
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isCompleted 
                  ? isCurrent 
                    ? "bg-primary text-white shadow-glow" 
                    : "bg-success text-white"
                  : "bg-surface-elevated text-muted"
              )}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              <p className={cn(
                "text-xs font-medium mt-2 text-center",
                isCompleted ? "text-foreground" : "text-muted"
              )}>
                {isRTL ? step.labelAr : step.label}
              </p>

              {/* Timestamp */}
              {timestamps[step.status] && (
                <p className="text-xs text-muted mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timestamps[step.status]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Line */}
      <div className={cn(
        "absolute top-5 h-0.5 bg-surface-elevated",
        isRTL ? "right-10 left-10" : "left-10 right-10"
      )}>
        <div 
          className="h-full bg-success transition-all duration-500"
          style={{ 
            width: `${(currentIndex / (steps.length - 1)) * 100}%`,
            [isRTL ? 'right' : 'left']: 0
          }}
        />
      </div>
    </div>
  );
}
