"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, children, className, onValueChange }: TabsProps) {
  const [value, setValueState] = useState(defaultValue);

  const setValue = useCallback((newValue: string) => {
    setValueState(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const { isRTL } = useTranslation();
  
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1.5 bg-surface rounded-xl border border-border shadow-soft overflow-x-auto scrollbar-hide",
        isRTL && "flex-row-reverse",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: selectedValue, setValue } = useTabs();
  const isSelected = selectedValue === value;

  return (
    <button
      onClick={() => setValue(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap",
        isSelected
          ? "bg-primary text-white shadow-soft"
          : "text-muted hover:text-foreground hover:bg-surface-elevated",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabs();

  if (selectedValue !== value) return null;

  return <div className={cn("mt-6 animate-fade-in", className)}>{children}</div>;
}
