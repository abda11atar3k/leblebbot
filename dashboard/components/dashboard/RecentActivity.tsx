"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Mail, Clock } from "lucide-react";

const activities = [
  {
    id: 1,
    customer: "Ahmed Mohamed",
    message: "I need help with my order #12345",
    channel: "whatsapp",
    time: "2m ago",
    status: "active",
  },
  {
    id: 2,
    customer: "Sarah Johnson",
    message: "How do I reset my password?",
    channel: "messenger",
    time: "5m ago",
    status: "resolved",
  },
  {
    id: 3,
    customer: "Omar Hassan",
    message: "Product availability inquiry",
    channel: "telegram",
    time: "12m ago",
    status: "pending",
  },
  {
    id: 4,
    customer: "Fatima Ali",
    message: "Refund request for damaged item",
    channel: "whatsapp",
    time: "18m ago",
    status: "escalated",
  },
  {
    id: 5,
    customer: "John Smith",
    message: "Shipping delay question",
    channel: "website",
    time: "25m ago",
    status: "resolved",
  },
];

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="w-3 h-3" />,
  messenger: <MessageSquare className="w-3 h-3" />,
  telegram: <MessageSquare className="w-3 h-3" />,
  website: <Mail className="w-3 h-3" />,
};

const statusVariants: Record<string, "success" | "warning" | "error" | "primary"> = {
  active: "primary",
  resolved: "success",
  pending: "warning",
  escalated: "error",
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Conversations</CardTitle>
        <button className="text-sm text-primary hover:text-primary-400 font-medium">
          View all
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-4 hover:bg-surface-elevated/50 transition-colors cursor-pointer"
            >
              <Avatar name={activity.customer} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.customer}
                  </p>
                  <Badge variant={statusVariants[activity.status]} size="sm">
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted truncate mt-0.5">{activity.message}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted capitalize">
                  {channelIcons[activity.channel]}
                  {activity.channel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
