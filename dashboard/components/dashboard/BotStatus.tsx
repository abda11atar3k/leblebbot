"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bot, Zap, Clock, CheckCircle } from "lucide-react";

export function BotStatus() {
  const stats = {
    status: "online",
    responseTime: "1.8s",
    accuracy: "96%",
    handled: 847,
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-subtle" />
              <span className="text-sm text-success">Online</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock className="w-4 h-4" />
              Avg. Response
            </div>
            <span className="text-sm font-medium text-foreground">{stats.responseTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Zap className="w-4 h-4" />
              Accuracy
            </div>
            <span className="text-sm font-medium text-foreground">{stats.accuracy}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <CheckCircle className="w-4 h-4" />
              Handled Today
            </div>
            <span className="text-sm font-medium text-foreground">{stats.handled}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Capacity</span>
            <span className="text-sm font-medium text-foreground">72%</span>
          </div>
          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full w-[72%] bg-primary rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
