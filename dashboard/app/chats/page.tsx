"use client";

import { useState } from "react";
import { Menu, ArrowRight, ArrowLeft } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CustomerInfo } from "@/components/chat/CustomerInfo";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function ChatsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isWhatsAppChat, setIsWhatsAppChat] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const { isRTL } = useTranslation();

  const handleSelectConversation = (id: string, isWhatsApp: boolean = false) => {
    setSelectedConversation(id);
    setIsWhatsAppChat(isWhatsApp);
    // On mobile, hide list and show chat when selecting
    setShowMobileList(false);
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setSelectedConversation(null);
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Mobile Sidebar Drawer */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 z-50 transition-transform duration-300",
        isRTL ? "right-0" : "left-0",
        showSidebar ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
      )}>
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col lg:flex-row h-full overflow-hidden",
        // Desktop: add padding for fixed sidebar
        "lg:pl-64",
        isRTL && "lg:pl-0 lg:pr-64"
      )}>
        {/* Conversation List Panel - Mobile: full screen or hidden */}
        <div className={cn(
          "flex flex-col h-full",
          // Mobile: full width, Desktop: fixed width
          "w-full lg:w-80 flex-shrink-0",
          // Mobile: hide when viewing chat
          !showMobileList && "hidden lg:flex",
          isRTL ? "lg:border-s border-border" : "lg:border-e border-border"
        )}>
          {/* Mobile Header with menu */}
          <div className={cn(
            "lg:hidden flex items-center gap-2 p-3 border-b border-border bg-surface flex-shrink-0",
            isRTL && "flex-row-reverse"
          )}>
            <button 
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-lg hover:bg-surface-elevated"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold flex-1">المحادثات</span>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-hidden">
            <ConversationList
              selectedId={selectedConversation}
              onSelect={handleSelectConversation}
            />
          </div>
        </div>
        
        {/* Chat Window Panel - Mobile: full screen or hidden */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 h-full",
          // Mobile: hide when viewing list
          showMobileList && "hidden lg:flex"
        )}>
          {/* Mobile Back Header */}
          {!showMobileList && selectedConversation && (
            <div className={cn(
              "lg:hidden flex items-center gap-2 p-3 border-b border-border bg-surface flex-shrink-0",
              isRTL && "flex-row-reverse"
            )}>
              <button 
                onClick={handleBackToList}
                className="p-2 rounded-lg hover:bg-surface-elevated"
              >
                {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </button>
              <span className="font-semibold flex-1">رجوع للمحادثات</span>
            </div>
          )}
          
          {/* Chat Window */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow 
              conversationId={selectedConversation} 
              isWhatsApp={isWhatsAppChat}
            />
          </div>
        </div>
        
        {/* Customer Info Panel - Desktop only */}
        <div className="hidden xl:block flex-shrink-0">
          <CustomerInfo 
            conversationId={selectedConversation} 
            isWhatsApp={isWhatsAppChat}
          />
        </div>
      </div>
    </div>
  );
}
