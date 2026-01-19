"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Lightbulb, X } from "lucide-react";

interface TipCardProps {
  tipKey: string;
  variant?: "inline" | "floating";
  className?: string;
}

export function TipCard({ tipKey, variant = "inline", className }: TipCardProps) {
  const { t, isRTL } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const storageKey = `leblebbot-tip-${tipKey}`;

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      setIsDismissed(true);
    }
    setMounted(true);
  }, [storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  const handleDontShowAgain = () => {
    handleDismiss();
  };

  if (!mounted || isDismissed) return null;

  return (
    <div
      className={cn(
        "bg-primary/5 border border-primary/20 rounded-xl p-4",
        variant === "floating" && "fixed bottom-20 w-80 shadow-xl z-30",
        variant === "floating" && (isRTL ? "left-4" : "right-4"),
        className
      )}
    >
      <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            {t("tips.proTip")}
          </p>
          <p className="text-sm text-foreground">{t(`tips.${tipKey}`)}</p>
          <div className={cn("flex items-center gap-3 mt-3", isRTL && "flex-row-reverse")}>
            <button
              onClick={handleDismiss}
              className="text-xs text-muted hover:text-foreground"
            >
              {t("tips.dismiss")}
            </button>
            <button
              onClick={handleDontShowAgain}
              className="text-xs text-primary hover:text-primary-400"
            >
              {t("tips.dontShowAgain")}
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded text-muted hover:text-foreground flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
