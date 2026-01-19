"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Booking {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  service: string;
  date: Date;
  time: string;
  duration: number; // minutes
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  platform: "whatsapp" | "facebook" | "instagram" | "phone";
}

interface BookingCalendarProps {
  bookings: Booking[];
  onBookingClick?: (booking: Booking) => void;
  className?: string;
}

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function BookingCalendar({ bookings, onBookingClick, className }: BookingCalendarProps) {
  const { isRTL } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  const days = isRTL ? DAYS_AR : DAYS_EN;
  const months = isRTL ? MONTHS_AR : MONTHS_EN;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getBookingsForDate = (day: number) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return (
        bookingDate.getDate() === day &&
        bookingDate.getMonth() === currentDate.getMonth() &&
        bookingDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const today = new Date();

  const statusColors = {
    pending: "bg-warning/20 text-warning border-warning/30",
    confirmed: "bg-primary/20 text-primary border-primary/30",
    completed: "bg-success/20 text-success border-success/30",
    cancelled: "bg-error/20 text-error border-error/30",
  };

  return (
    <div className={cn("bg-surface border border-border rounded-xl shadow-soft overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className={cn(
          "flex items-center justify-between",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-1">
              {(["month", "week", "day"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    view === v 
                      ? "bg-primary text-white" 
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {v === "month" ? (isRTL ? "شهر" : "Month") 
                    : v === "week" ? (isRTL ? "أسبوع" : "Week")
                    : (isRTL ? "يوم" : "Day")}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <button
                onClick={() => navigateMonth(isRTL ? 1 : -1)}
                className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                {isRTL ? "اليوم" : "Today"}
              </button>
              <button
                onClick={() => navigateMonth(isRTL ? -1 : 1)}
                className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className={cn(
          "grid grid-cols-7 gap-1 mb-2",
          isRTL && "direction-rtl"
        )}>
          {days.map((day) => (
            <div 
              key={day}
              className="text-center text-xs font-semibold text-muted py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={cn(
          "grid grid-cols-7 gap-1",
          isRTL && "direction-rtl"
        )}>
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 p-1" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayBookings = getBookingsForDate(day);
            const isToday = 
              day === today.getDate() &&
              currentDate.getMonth() === today.getMonth() &&
              currentDate.getFullYear() === today.getFullYear();

            return (
              <div
                key={day}
                className={cn(
                  "h-24 p-1 rounded-lg border transition-all overflow-hidden",
                  isToday 
                    ? "border-primary bg-primary/5" 
                    : "border-transparent hover:border-border hover:bg-surface-elevated"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday ? "text-primary" : "text-foreground",
                  isRTL ? "text-end" : "text-start"
                )}>
                  {day}
                </div>
                
                <div className="space-y-0.5 overflow-hidden">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => onBookingClick?.(booking)}
                      className={cn(
                        "w-full text-xs px-1.5 py-0.5 rounded truncate border",
                        statusColors[booking.status],
                        isRTL ? "text-end" : "text-start"
                      )}
                    >
                      {booking.time} - {booking.customer.name}
                    </button>
                  ))}
                  {dayBookings.length > 2 && (
                    <p className="text-xs text-muted text-center">
                      +{dayBookings.length - 2} {isRTL ? "المزيد" : "more"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className={cn(
        "px-4 py-3 border-t border-border flex items-center gap-4",
        isRTL && "flex-row-reverse"
      )}>
        {Object.entries(statusColors).map(([status, color]) => (
          <div 
            key={status}
            className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <div className={cn("w-3 h-3 rounded-full border", color)} />
            <span className="text-xs text-muted capitalize">
              {status === "pending" ? (isRTL ? "قيد الانتظار" : "Pending")
                : status === "confirmed" ? (isRTL ? "مؤكد" : "Confirmed")
                : status === "completed" ? (isRTL ? "مكتمل" : "Completed")
                : (isRTL ? "ملغي" : "Cancelled")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
