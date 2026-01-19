"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "./MessageBubble";

interface Message {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  isBot?: boolean;
  status?: "sent" | "delivered" | "read";
}

const mockMessagesAr: Message[] = [
  {
    id: "1",
    content: "السلام عليكم، محتاج مساعدة في الطلب رقم #12345",
    time: "10:30 ص",
    isOwn: false,
  },
  {
    id: "2",
    content: "أهلاً أحمد! يسعدني مساعدتك. دقيقة واحدة أشوف الطلب.",
    time: "10:31 ص",
    isOwn: true,
    isBot: true,
    status: "read",
  },
  {
    id: "3",
    content: "الطلب #12345 اتعمل يوم 15 يناير. حالياً بيتجهز للشحن وهيتبعت خلال 24 ساعة.",
    time: "10:31 ص",
    isOwn: true,
    isBot: true,
    status: "read",
  },
  {
    id: "4",
    content: "تمام! بس عايز أغير عنوان التوصيل. ينفع؟",
    time: "10:33 ص",
    isOwn: false,
  },
  {
    id: "5",
    content: "أيوه ينفع تغير العنوان لأن الطلب لسه ما اتشحنش. تحب أساعدك في التغيير؟",
    time: "10:33 ص",
    isOwn: true,
    isBot: true,
    status: "read",
  },
  {
    id: "6",
    content: "أيوه لو سمحت! العنوان الجديد: 123 شارع النيل، القاهرة",
    time: "10:35 ص",
    isOwn: false,
  },
];

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessagesAr);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, isRTL } = useTranslation();

  const quickReplies = [
    isRTL ? "هشوف ده ليك" : "I'll check that for you",
    isRTL ? "هحولك لمتخصص" : "Let me transfer you to a specialist",
    isRTL ? "في حاجة تانية أساعدك فيها؟" : "Is there anything else I can help with?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        content: input,
        time: new Date().toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }),
        isOwn: true,
        status: "sent",
      },
    ]);
    setInput("");
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Bot className="w-10 h-10 text-muted" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {t("conversations.noConversationSelected")}
          </h3>
          <p className="text-sm text-muted">
            {t("conversations.selectConversation")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className={cn(
        "h-16 flex items-center justify-between px-4 border-b border-border bg-surface shadow-soft",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <Avatar name="أحمد محمد" size="lg" />
          <div className={isRTL ? "text-end" : "text-start"}>
            <h3 className="font-bold text-foreground">أحمد محمد</h3>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted">{t("common.online")}</span>
              <Badge variant="primary" size="sm">WhatsApp</Badge>
            </div>
          </div>
        </div>
        <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <MessageBubble key={message.id} {...message} isRTL={isRTL} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 py-2 border-t border-border bg-surface">
        <div className={cn(
          "flex items-center gap-2 overflow-x-auto scrollbar-hide",
          isRTL && "flex-row-reverse"
        )}>
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs text-muted whitespace-nowrap">
            {t("conversations.aiSuggestions")}:
          </span>
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => setInput(reply)}
              className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-surface">
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <button className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("conversations.typeMessage")}
            className={cn(
              "flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
              isRTL ? "text-end" : "text-start"
            )}
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send className={cn("w-4 h-4", isRTL && "rtl:flip")} />
            {t("common.send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
