"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Calendar,
  MessageSquare,
} from "lucide-react";

const broadcasts = [
  {
    id: "1",
    name: "January Sale Announcement",
    status: "completed",
    sent: 2450,
    delivered: 2380,
    read: 1890,
    channel: "whatsapp",
    date: "Jan 15, 2024",
  },
  {
    id: "2",
    name: "New Product Launch",
    status: "scheduled",
    sent: 0,
    delivered: 0,
    read: 0,
    channel: "whatsapp",
    date: "Jan 20, 2024",
  },
  {
    id: "3",
    name: "Customer Feedback Request",
    status: "completed",
    sent: 1200,
    delivered: 1150,
    read: 820,
    channel: "telegram",
    date: "Jan 10, 2024",
  },
  {
    id: "4",
    name: "Holiday Greetings",
    status: "failed",
    sent: 500,
    delivered: 120,
    read: 0,
    channel: "messenger",
    date: "Dec 25, 2023",
  },
];

const statusColors: Record<string, "success" | "warning" | "error" | "primary"> = {
  completed: "success",
  scheduled: "primary",
  sending: "warning",
  failed: "error",
};

export default function BroadcastsPage() {
  const [showComposer, setShowComposer] = useState(false);
  const [channel, setChannel] = useState("whatsapp");

  return (
    <AppShell title="Broadcasts" description="Send messages to multiple contacts">
      {!showComposer ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">4,150</p>
                    <p className="text-sm text-muted">Messages Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-success/10">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">3,650</p>
                    <p className="text-sm text-muted">Delivered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-warning/10">
                    <Users className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">2,710</p>
                    <p className="text-sm text-muted">Read</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-surface-elevated">
                    <Clock className="w-5 h-5 text-muted" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">1</p>
                    <p className="text-sm text-muted">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
            <Button onClick={() => setShowComposer(true)}>
              <Plus className="w-4 h-4" />
              New Broadcast
            </Button>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {broadcasts.map((broadcast) => (
                  <TableRow key={broadcast.id} className="cursor-pointer">
                    <TableCell className="font-medium">{broadcast.name}</TableCell>
                    <TableCell>
                      <Badge variant="default" size="sm" className="capitalize">
                        {broadcast.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[broadcast.status]} size="sm" className="capitalize">
                        {broadcast.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{broadcast.sent.toLocaleString()}</TableCell>
                    <TableCell>{broadcast.delivered.toLocaleString()}</TableCell>
                    <TableCell>{broadcast.read.toLocaleString()}</TableCell>
                    <TableCell className="text-muted">{broadcast.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      ) : (
        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Broadcast</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowComposer(false)}>
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Campaign Name
                </label>
                <Input placeholder="e.g., January Sale Announcement" />
              </div>

              {/* Channel */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Channel
                </label>
                <Select
                  value={channel}
                  onChange={setChannel}
                  options={[
                    { value: "whatsapp", label: "WhatsApp" },
                    { value: "telegram", label: "Telegram" },
                    { value: "messenger", label: "Messenger" },
                  ]}
                />
              </div>

              {/* Audience */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Audience
                </label>
                <Select
                  value="all"
                  onChange={() => {}}
                  options={[
                    { value: "all", label: "All Contacts (2,450)" },
                    { value: "active", label: "Active Customers (1,200)" },
                    { value: "vip", label: "VIP Customers (320)" },
                    { value: "new", label: "New Contacts (580)" },
                  ]}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <Textarea
                  placeholder="Type your message here..."
                  className="h-32"
                />
                <p className="text-xs text-muted mt-2">
                  Use {"{name}"} to personalize with customer name
                </p>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Schedule
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" defaultChecked className="text-primary" />
                    <span className="text-sm text-foreground">Send Now</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" className="text-primary" />
                    <span className="text-sm text-foreground">Schedule</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button variant="secondary" onClick={() => setShowComposer(false)}>
                  Save as Draft
                </Button>
                <Button>
                  <Send className="w-4 h-4" />
                  Send Broadcast
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
