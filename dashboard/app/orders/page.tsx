"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { OrderCard, Order, OrderStatus } from "@/components/orders/OrderCard";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  TrendingUp,
  DollarSign
} from "lucide-react";

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customer: {
      name: "أحمد محمد",
      phone: "+201234567890",
      address: "15 شارع التحرير، وسط البلد، القاهرة",
    },
    items: [
      { name: "ماسك الفحم", quantity: 2, price: 150 },
      { name: "كريم مرطب", quantity: 1, price: 200 },
    ],
    total: 500,
    status: "new",
    platform: "whatsapp",
    createdAt: "منذ 5 دقائق",
    conversationId: "conv-1",
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customer: {
      name: "سارة أحمد",
      phone: "+201098765432",
      address: "8 شارع الهرم، الجيزة",
    },
    items: [
      { name: "سيروم فيتامين سي", quantity: 1, price: 350 },
    ],
    total: 350,
    status: "processing",
    platform: "facebook",
    createdAt: "منذ 30 دقيقة",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customer: {
      name: "محمد حسن",
      phone: "+201112223333",
      address: "22 شارع الكورنيش، الإسكندرية",
    },
    items: [
      { name: "غسول وجه", quantity: 2, price: 120 },
      { name: "تونر", quantity: 1, price: 180 },
    ],
    total: 420,
    status: "shipping",
    platform: "instagram",
    createdAt: "منذ ساعة",
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customer: {
      name: "فاطمة علي",
      phone: "+201555666777",
      address: "5 شارع النيل، المعادي، القاهرة",
    },
    items: [
      { name: "مجموعة العناية الكاملة", quantity: 1, price: 899 },
    ],
    total: 899,
    status: "delivered",
    platform: "whatsapp",
    createdAt: "منذ 3 ساعات",
  },
];

export default function OrdersPage() {
  const { t, isRTL } = useTranslation();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    new: orders.filter(o => o.status === "new").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipping: orders.filter(o => o.status === "shipping").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const totalRevenue = orders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const filters: { id: OrderStatus | "all"; label: string; labelAr: string; icon: React.ElementType; color: string }[] = [
    { id: "all", label: "All", labelAr: "الكل", icon: Package, color: "bg-primary" },
    { id: "new", label: "New", labelAr: "جديد", icon: Clock, color: "bg-primary" },
    { id: "processing", label: "Processing", labelAr: "قيد التجهيز", icon: Package, color: "bg-warning" },
    { id: "shipping", label: "Shipping", labelAr: "في الطريق", icon: Truck, color: "bg-blue-500" },
    { id: "delivered", label: "Delivered", labelAr: "تم التوصيل", icon: CheckCircle, color: "bg-success" },
    { id: "cancelled", label: "Cancelled", labelAr: "ملغي", icon: XCircle, color: "bg-error" },
  ];

  return (
    <AppShell 
      title={isRTL ? "الأوردرات" : "Orders"} 
      description={isRTL ? "إدارة الطلبات والمتابعة" : "Manage orders and track deliveries"}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
              <p className="text-sm text-muted">{isRTL ? "إجمالي الطلبات" : "Total Orders"}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground">{statusCounts.new + statusCounts.processing}</p>
              <p className="text-sm text-muted">{isRTL ? "قيد المعالجة" : "Pending"}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground">{statusCounts.delivered}</p>
              <p className="text-sm text-muted">{isRTL ? "تم التوصيل" : "Delivered"}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <p className="text-2xl font-bold text-foreground">
                {totalRevenue.toLocaleString()} {isRTL ? "ج.م" : "EGP"}
              </p>
              <p className="text-sm text-muted">{isRTL ? "الإيرادات" : "Revenue"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6",
        isRTL && "sm:flex-row-reverse"
      )}>
        <div className="flex-1 w-full sm:w-auto">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder={isRTL ? "البحث في الطلبات..." : "Search orders..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={cn(
          "flex items-center gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto",
          isRTL && "flex-row-reverse"
        )}>
          {filters.map((f) => {
            const Icon = f.icon;
            const count = statusCounts[f.id];
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-150",
                  filter === f.id
                    ? `${f.color} text-white shadow-soft`
                    : "bg-surface text-muted hover:text-foreground hover:bg-surface-elevated"
                )}
              >
                <Icon className="w-4 h-4" />
                {isRTL ? f.labelAr : f.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  filter === f.id ? "bg-white/20" : "bg-surface-elevated"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <Button>
          <Plus className="w-4 h-4" />
          {isRTL ? "طلب جديد" : "New Order"}
        </Button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isRTL ? "لا توجد طلبات" : "No orders found"}
          </h3>
          <p className="text-sm text-muted">
            {isRTL ? "جرب تغيير الفلتر أو البحث" : "Try changing the filter or search term"}
          </p>
        </div>
      )}
    </AppShell>
  );
}
