"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Ban,
} from "lucide-react";

const customer = {
  name: "Ahmed Mohamed",
  email: "ahmed@example.com",
  phone: "+20 123 456 7890",
  location: "Cairo, Egypt",
  joinedAt: "Jan 2024",
  totalOrders: 12,
  totalSpent: "$1,240",
  conversations: 8,
  avgResponseTime: "2.3s",
  tags: ["VIP", "Returning"],
};

const recentOrders = [
  { id: "#12345", date: "Jan 15", status: "Processing", amount: "$89.00" },
  { id: "#12289", date: "Dec 28", status: "Delivered", amount: "$156.00" },
  { id: "#12156", date: "Dec 10", status: "Delivered", amount: "$42.00" },
];

interface CustomerInfoProps {
  conversationId: string | null;
}

export function CustomerInfo({ conversationId }: CustomerInfoProps) {
  if (!conversationId) {
    return null;
  }

  return (
    <div className="w-80 border-l border-border bg-surface flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border text-center">
        <Avatar name={customer.name} size="xl" className="mx-auto mb-3" />
        <h3 className="font-semibold text-foreground">{customer.name}</h3>
        <p className="text-sm text-muted">{customer.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {customer.tags.map((tag) => (
            <Badge key={tag} variant="primary" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-muted" />
          <span className="text-foreground">{customer.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-muted" />
          <span className="text-foreground">{customer.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="w-4 h-4 text-muted" />
          <span className="text-foreground">{customer.location}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-muted" />
          <span className="text-muted">Customer since</span>
          <span className="text-foreground ml-auto">{customer.joinedAt}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">Statistics</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface-elevated rounded-lg">
            <div className="flex items-center gap-2 text-muted mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs">Orders</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{customer.totalOrders}</p>
          </div>
          <div className="p-3 bg-surface-elevated rounded-lg">
            <div className="flex items-center gap-2 text-muted mb-1">
              <Tag className="w-4 h-4" />
              <span className="text-xs">Total Spent</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{customer.totalSpent}</p>
          </div>
          <div className="p-3 bg-surface-elevated rounded-lg">
            <div className="flex items-center gap-2 text-muted mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs">Chats</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{customer.conversations}</p>
          </div>
          <div className="p-3 bg-surface-elevated rounded-lg">
            <div className="flex items-center gap-2 text-muted mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Avg. Response</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{customer.avgResponseTime}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="p-4 border-b border-border flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">Recent Orders</h4>
          <button className="text-xs text-primary hover:text-primary-400">View all</button>
        </div>
        <div className="space-y-2">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{order.id}</p>
                <p className="text-xs text-muted">{order.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{order.amount}</p>
                <Badge
                  variant={order.status === "Delivered" ? "success" : "warning"}
                  size="sm"
                >
                  {order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm">
            <ExternalLink className="w-4 h-4" />
            View Profile
          </Button>
          <Button variant="secondary" size="sm">
            <UserPlus className="w-4 h-4" />
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
}
