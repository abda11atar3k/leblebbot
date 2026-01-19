"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Radio, AlertTriangle, Bot, Zap, FileText, Users } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    icon: Radio,
    label: "Create Broadcast",
    href: "/broadcasts/new",
    color: "text-primary bg-primary/10",
  },
  {
    icon: AlertTriangle,
    label: "View Escalations",
    href: "/chats?filter=escalated",
    color: "text-warning bg-warning/10",
    badge: 3,
  },
  {
    icon: Bot,
    label: "Bot Settings",
    href: "/settings?tab=bot",
    color: "text-success bg-success/10",
  },
  {
    icon: FileText,
    label: "Knowledge Base",
    href: "/settings?tab=knowledge",
    color: "text-muted bg-surface-elevated",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="relative flex flex-col items-center gap-2 p-4 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors"
          >
            <div className={`p-2.5 rounded-lg ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground text-center">
              {action.label}
            </span>
            {action.badge && (
              <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-xs font-bold bg-error text-white rounded-full">
                {action.badge}
              </span>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
