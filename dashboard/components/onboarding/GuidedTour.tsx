"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/lib/onboarding";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type TourPosition = "top" | "bottom" | "left" | "right";

interface TourStep {
  id: string;
  titleKey: string;
  descKey: string;
  target: string;
  position: TourPosition;
}

const tourSteps: TourStep[] = [
  {
    id: "dashboard",
    titleKey: "tourStep1Title",
    descKey: "tourStep1Desc",
    target: "[data-tour='dashboard']",
    position: "right",
  },
  {
    id: "conversations",
    titleKey: "tourStep2Title",
    descKey: "tourStep2Desc",
    target: "[data-tour='conversations']",
    position: "right",
  },
  {
    id: "connectors",
    titleKey: "tourStep3Title",
    descKey: "tourStep3Desc",
    target: "[data-tour='connectors']",
    position: "right",
  },
  {
    id: "settings",
    titleKey: "tourStep4Title",
    descKey: "tourStep4Desc",
    target: "[data-tour='settings']",
    position: "right",
  },
];

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: TourPosition;
}

export function GuidedTour() {
  const { showTour, currentTourStep, endTour, nextTourStep, prevTourStep } = useOnboarding();
  const { t, isRTL } = useTranslation();
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = tourSteps[currentTourStep];
  const isLastStep = currentTourStep === tourSteps.length - 1;
  const isFirstStep = currentTourStep === 0;

  useEffect(() => {
    if (!showTour || !step) return;

    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      const tooltipWidth = 320;
      const tooltipHeight = 160;
      const padding = 16;

      let top = 0;
      let left = 0;
      let arrowPosition: "top" | "bottom" | "left" | "right" = "top";

      switch (step.position) {
        case "bottom":
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = "top";
          break;
        case "top":
          top = rect.top - tooltipHeight - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = "bottom";
          break;
        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - padding;
          arrowPosition = "right";
          break;
        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding;
          arrowPosition = "left";
          break;
      }

      // Clamp to viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

      setPosition({ top, left, arrowPosition });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [showTour, currentTourStep, step]);

  if (!showTour || !step || !position) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" />

      {/* Spotlight on target */}
      {targetRect && (
        <div
          className="fixed z-[101] rounded-lg ring-4 ring-primary ring-offset-4 ring-offset-transparent"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[102] w-80 bg-surface border border-border rounded-xl shadow-2xl animate-spotlight"
        style={{ top: position.top, left: position.left }}
      >
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-surface border-border rotate-45",
            position.arrowPosition === "top" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t",
            position.arrowPosition === "bottom" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b",
            position.arrowPosition === "left" && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b",
            position.arrowPosition === "right" && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t"
          )}
        />

        {/* Content */}
        <div className="p-4">
          <div className={cn("flex items-start justify-between mb-3", isRTL && "flex-row-reverse")}>
            <div>
              <p className="text-xs text-primary font-medium mb-1">
                {t("onboarding.step")} {currentTourStep + 1} {t("onboarding.of")} {tourSteps.length}
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {t(`onboarding.${step.titleKey}`)}
              </h3>
            </div>
            <button
              onClick={endTour}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className={cn("text-sm text-muted mb-4", isRTL && "text-right")}>
            {t(`onboarding.${step.descKey}`)}
          </p>

          {/* Navigation */}
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <button
              onClick={prevTourStep}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                isFirstStep
                  ? "text-muted cursor-not-allowed"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated",
                isRTL && "flex-row-reverse"
              )}
            >
              <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              {t("onboarding.previous")}
            </button>

            <button
              onClick={isLastStep ? endTour : nextTourStep}
              className={cn(
                "flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
                "bg-primary text-white hover:bg-primary-600",
                isRTL && "flex-row-reverse"
              )}
            >
              {isLastStep ? t("onboarding.gotIt") : t("onboarding.nextStep")}
              {!isLastStep && <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
