"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AppShell({ children, title, description }: AppShellProps) {
  const { isRTL } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        isRTL ? "pr-64" : "pl-64"
      )}>
        <Header title={title} description={description} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
