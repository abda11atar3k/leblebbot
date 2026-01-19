"use client";

import { cn } from "@/lib/utils";
import { Bot, Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  time: string;
  isOwn: boolean;
  isBot?: boolean;
  status?: "sent" | "delivered" | "read";
  isRTL?: boolean;
}

export function MessageBubble({ content, time, isOwn, isBot, status, isRTL = false }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? (isRTL ? "flex-row-reverse justify-start" : "justify-end") : (isRTL ? "justify-end flex-row-reverse" : "justify-start")
      )}
    >
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-foreground">أح</span>
        </div>
      )}
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-soft",
          isOwn
            ? "bg-primary text-white rounded-ee-md"
            : "bg-surface text-foreground rounded-es-md",
          isRTL && isOwn && "rounded-ee-2xl rounded-es-md",
          isRTL && !isOwn && "rounded-es-2xl rounded-ee-md"
        )}
      >
        {isBot && (
          <div className={cn(
            "flex items-center gap-1 mb-1",
            isRTL && "flex-row-reverse"
          )}>
            <Bot className="w-3 h-3" />
            <span className="text-xs opacity-75">
              {isRTL ? "البوت" : "Bot"}
            </span>
          </div>
        )}
        <p className={cn(
          "text-sm leading-relaxed",
          isRTL ? "text-end" : "text-start"
        )} dir="auto">
          {content}
        </p>
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "justify-end" : "justify-start",
          isRTL && "flex-row-reverse"
        )}>
          <span className={cn(
            "text-xs",
            isOwn ? "text-white/70" : "text-muted"
          )}>
            {time}
          </span>
          {isOwn && status && (
            <>
              {status === "sent" && <Check className="w-3 h-3 text-white/70" />}
              {status === "delivered" && <CheckCheck className="w-3 h-3 text-white/70" />}
              {status === "read" && <CheckCheck className="w-3 h-3 text-white" />}
            </>
          )}
        </div>
      </div>
      {isOwn && isBot && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  );
}
