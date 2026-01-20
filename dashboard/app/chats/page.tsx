"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CustomerInfo } from "@/components/chat/CustomerInfo";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function ChatsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isWhatsAppChat, setIsWhatsAppChat] = useState(false);
  const { isRTL } = useTranslation();

  const handleSelectConversation = (id: string, isWhatsApp: boolean = false) => {
    setSelectedConversation(id);
    setIsWhatsAppChat(isWhatsApp);
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <div className={cn("flex-1 flex h-full overflow-hidden", isRTL ? "pr-64" : "pl-64")}>
        <ConversationList
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
        />
        <ChatWindow 
          conversationId={selectedConversation} 
          isWhatsApp={isWhatsAppChat}
        />
        <CustomerInfo 
          conversationId={selectedConversation} 
          isWhatsApp={isWhatsAppChat}
        />
      </div>
    </div>
  );
}
