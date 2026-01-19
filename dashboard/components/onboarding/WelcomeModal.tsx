"use client";

import { useOnboarding } from "@/lib/onboarding";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bot, Sparkles, Zap, Globe, Play, X } from "lucide-react";

export function WelcomeModal() {
  const { showWelcome, dismissWelcome, startTour } = useOnboarding();
  const { t, isRTL } = useTranslation();

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
        onClick={dismissWelcome}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl animate-spotlight overflow-hidden">
        {/* Close button */}
        <button
          onClick={dismissWelcome}
          className={cn(
            "absolute top-4 z-10 p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors",
            isRTL ? "left-4" : "right-4"
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gradient header */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Bot className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <div className={cn("text-center mb-6", isRTL && "font-arabic")}>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t("onboarding.welcome")}
            </h2>
            <p className="text-muted">
              {t("onboarding.letsSetup")}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Zap, label: t("onboarding.quickSetup") },
              { icon: Sparkles, label: t("onboarding.aiPowered") },
              { icon: Globe, label: t("onboarding.multiChannel") },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-elevated"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted text-center">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={startTour}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium transition-colors hover:bg-primary-600",
                isRTL && "flex-row-reverse"
              )}
            >
              <Play className="w-5 h-5" />
              {t("onboarding.startTour")}
            </button>
            <button
              onClick={dismissWelcome}
              className="w-full px-6 py-3 rounded-xl text-muted hover:text-foreground font-medium transition-colors"
            >
              {t("onboarding.skipTour")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
