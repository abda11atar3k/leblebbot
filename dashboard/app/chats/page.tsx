"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CustomerInfo } from "@/components/chat/CustomerInfo";

export default function ChatsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 pl-64 flex">
        <ConversationList
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
        />
        <ChatWindow conversationId={selectedConversation} />
        <CustomerInfo conversationId={selectedConversation} />
      </div>
    </div>
  );
}
