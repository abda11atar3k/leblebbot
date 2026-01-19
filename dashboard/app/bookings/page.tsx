"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { BookingCalendar, Booking } from "@/components/bookings/BookingCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  Phone, 
  User,
  MapPin,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  ExternalLink
} from "lucide-react";

const mockBookings: Booking[] = [
  {
    id: "1",
    customer: { name: "أحمد محمد", phone: "+201234567890" },
    service: "استشارة طبية",
    date: new Date(2026, 0, 19, 10, 0),
    time: "10:00",
    duration: 30,
    status: "confirmed",
    notes: "مريض جديد",
    platform: "whatsapp",
  },
  {
    id: "2",
    customer: { name: "سارة أحمد", phone: "+201098765432" },
    service: "حجز طاولة",
    date: new Date(2026, 0, 19, 14, 0),
    time: "14:00",
    duration: 120,
    status: "pending",
    notes: "4 أشخاص، جلسة خارجية",
    platform: "facebook",
  },
  {
    id: "3",
    customer: { name: "محمد حسن", phone: "+201112223333" },
    service: "موعد صيانة",
    date: new Date(2026, 0, 20, 9, 0),
    time: "09:00",
    duration: 60,
    status: "confirmed",
    platform: "instagram",
  },
  {
    id: "4",
    customer: { name: "فاطمة علي", phone: "+201555666777" },
    service: "استشارة",
    date: new Date(2026, 0, 20, 16, 0),
    time: "16:00",
    duration: 45,
    status: "pending",
    platform: "phone",
  },
  {
    id: "5",
    customer: { name: "يوسف إبراهيم", phone: "+201444555666" },
    service: "حجز طاولة",
    date: new Date(2026, 0, 21, 20, 0),
    time: "20:00",
    duration: 90,
    status: "confirmed",
    notes: "عيد ميلاد، كعكة مطلوبة",
    platform: "whatsapp",
  },
  {
    id: "6",
    customer: { name: "نورا محمود", phone: "+201777888999" },
    service: "استشارة طبية",
    date: new Date(2026, 0, 18, 11, 0),
    time: "11:00",
    duration: 30,
    status: "completed",
    platform: "whatsapp",
  },
];

export default function BookingsPage() {
  const { isRTL } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Booking["status"] | "all">("all");

  const handleStatusChange = (bookingId: string, newStatus: Booking["status"]) => {
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: newStatus } : b
    ));
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      b.customer.phone.includes(search) ||
      b.service.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayBookings = bookings.filter(b => {
    const today = new Date();
    const bookingDate = new Date(b.date);
    return (
      bookingDate.getDate() === today.getDate() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getFullYear() === today.getFullYear()
    );
  });

  const upcomingBookings = bookings
    .filter(b => new Date(b.date) > new Date() && b.status !== "cancelled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    today: todayBookings.length,
  };

  const platformColors = {
    whatsapp: "text-whatsapp",
    facebook: "text-messenger",
    instagram: "text-pink-500",
    phone: "text-primary",
  };

  const statusColors = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    cancelled: "bg-error/10 text-error",
  };

  return (
    <AppShell 
      title={isRTL ? "الحجوزات" : "Bookings"} 
      description={isRTL ? "إدارة المواعيد والحجوزات" : "Manage appointments and reservations"}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className={isRTL ? "text-end" : "text-start"}>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted">{isRTL ? "إجمالي" : "Total"}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div className={isRTL ? "text-end" : "text-start"}>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-xs text-muted">{isRTL ? "قيد الانتظار" : "Pending"}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className={isRTL ? "text-end" : "text-start"}>
                  <p className="text-2xl font-bold text-foreground">{stats.confirmed}</p>
                  <p className="text-xs text-muted">{isRTL ? "مؤكد" : "Confirmed"}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div className={isRTL ? "text-end" : "text-start"}>
                  <p className="text-2xl font-bold text-foreground">{stats.today}</p>
                  <p className="text-xs text-muted">{isRTL ? "اليوم" : "Today"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <BookingCalendar 
            bookings={filteredBookings}
            onBookingClick={setSelectedBooking}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
            <Button className="flex-1">
              <Plus className="w-4 h-4" />
              {isRTL ? "حجز جديد" : "New Booking"}
            </Button>
            <Button variant="secondary">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder={isRTL ? "البحث..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className={cn(
              "flex items-center gap-2 overflow-x-auto scrollbar-hide",
              isRTL && "flex-row-reverse"
            )}>
              {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all",
                    statusFilter === status
                      ? status === "all" 
                        ? "bg-primary text-white" 
                        : statusColors[status]
                      : "bg-surface-elevated text-muted hover:text-foreground"
                  )}
                >
                  {status === "all" ? (isRTL ? "الكل" : "All")
                    : status === "pending" ? (isRTL ? "قيد الانتظار" : "Pending")
                    : status === "confirmed" ? (isRTL ? "مؤكد" : "Confirmed")
                    : status === "completed" ? (isRTL ? "مكتمل" : "Completed")
                    : (isRTL ? "ملغي" : "Cancelled")}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Booking Details */}
          {selectedBooking ? (
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Calendar className="w-5 h-5 text-primary" />
                  {isRTL ? "تفاصيل الحجز" : "Booking Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer */}
                <div className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse"
                )}>
                  <Avatar name={selectedBooking.customer.name} size="lg" />
                  <div className={isRTL ? "text-end" : "text-start"}>
                    <p className="font-semibold text-foreground">{selectedBooking.customer.name}</p>
                    <p className="text-sm text-muted" dir="ltr">{selectedBooking.customer.phone}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    isRTL && "flex-row-reverse"
                  )}>
                    <Clock className="w-4 h-4 text-muted" />
                    <span className="text-foreground">{selectedBooking.time}</span>
                    <span className="text-muted">({selectedBooking.duration} {isRTL ? "دقيقة" : "min"})</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    isRTL && "flex-row-reverse"
                  )}>
                    <Calendar className="w-4 h-4 text-muted" />
                    <span className="text-foreground">
                      {new Date(selectedBooking.date).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Service */}
                <div className="p-3 bg-surface-elevated rounded-lg">
                  <p className="text-xs text-muted mb-1">{isRTL ? "الخدمة" : "Service"}</p>
                  <p className="font-medium text-foreground">{selectedBooking.service}</p>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="p-3 bg-surface-elevated rounded-lg">
                    <p className="text-xs text-muted mb-1">{isRTL ? "ملاحظات" : "Notes"}</p>
                    <p className="text-sm text-foreground">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Status Badge */}
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                  <span className="text-sm text-muted">{isRTL ? "الحالة:" : "Status:"}</span>
                  <Badge className={statusColors[selectedBooking.status]}>
                    {selectedBooking.status === "pending" ? (isRTL ? "قيد الانتظار" : "Pending")
                      : selectedBooking.status === "confirmed" ? (isRTL ? "مؤكد" : "Confirmed")
                      : selectedBooking.status === "completed" ? (isRTL ? "مكتمل" : "Completed")
                      : (isRTL ? "ملغي" : "Cancelled")}
                  </Badge>
                </div>

                {/* Actions */}
                <div className={cn("flex gap-2 pt-2", isRTL && "flex-row-reverse")}>
                  {selectedBooking.status === "pending" && (
                    <>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleStatusChange(selectedBooking.id, "confirmed")}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isRTL ? "تأكيد" : "Confirm"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleStatusChange(selectedBooking.id, "cancelled")}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {selectedBooking.status === "confirmed" && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleStatusChange(selectedBooking.id, "completed")}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isRTL ? "اكتمل" : "Complete"}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Upcoming Bookings */
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Clock className="w-5 h-5 text-primary" />
                  {isRTL ? "المواعيد القادمة" : "Upcoming"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={cn(
                        "w-full p-3 bg-surface-elevated rounded-lg hover:bg-border transition-colors",
                        isRTL ? "text-end" : "text-start"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-between mb-1",
                        isRTL && "flex-row-reverse"
                      )}>
                        <span className="font-medium text-foreground text-sm">
                          {booking.customer.name}
                        </span>
                        <Badge className={cn("text-xs", statusColors[booking.status])}>
                          {booking.time}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted">{booking.service}</p>
                      <p className="text-xs text-muted">
                        {new Date(booking.date).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </button>
                  ))}
                  {upcomingBookings.length === 0 && (
                    <p className="text-sm text-muted text-center py-4">
                      {isRTL ? "لا توجد مواعيد قادمة" : "No upcoming bookings"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
