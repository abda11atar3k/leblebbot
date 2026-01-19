"use client";

import { useState } from "react";
import { useOnboarding } from "@/lib/onboarding";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Plug2,
  Bot,
  FileText,
  MessageSquare,
  Users,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

const stepConfig = [
  {
    id: "connect-channel",
    icon: Plug2,
    href: "/connectors",
    translationKey: "connectFirstChannel",
  },
  {
    id: "customize-bot",
    icon: Bot,
    href: "/settings?tab=bot",
    translationKey: "customizeBotPersonality",
  },
  {
    id: "upload-knowledge",
    icon: FileText,
    href: "/settings?tab=bot",
    translationKey: "uploadKnowledgeBase",
  },
  {
    id: "send-test",
    icon: MessageSquare,
    href: "/chats",
    translationKey: "sendTestMessage",
  },
  {
    id: "invite-team",
    icon: Users,
    href: "/settings?tab=team",
    translationKey: "inviteTeamMember",
  },
];

interface SetupChecklistProps {
  variant?: "sidebar" | "floating" | "card";
  className?: string;
}

export function SetupChecklist({ variant = "card", className }: SetupChecklistProps) {
  const { steps, completedCount, totalSteps, progress, completeStep } = useOnboarding();
  const { t, isRTL } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || progress === 100) {
    return null;
  }

  const getStepStatus = (stepId: string) => {
    return steps.find((s) => s.id === stepId)?.completed || false;
  };

  if (variant === "floating") {
    return (
      <div
        className={cn(
          "fixed bottom-4 z-40 w-80 bg-surface border border-border rounded-xl shadow-xl",
          isRTL ? "left-4" : "right-4",
          className
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <p className="text-sm font-semibold text-foreground">
                {t("onboarding.setupChecklist")}
              </p>
              <p className="text-xs text-muted">
                {completedCount} {t("onboarding.of")} {totalSteps} {t("onboarding.completed")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="p-1 rounded text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {stepConfig.map((step) => {
              const isCompleted = getStepStatus(step.id);
              const Icon = step.icon;
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    isCompleted
                      ? "bg-success/10 text-success"
                      : "hover:bg-surface-elevated text-muted hover:text-foreground",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                  <Icon className="w-4 h-4" />
                  <span className={cn("flex-1 text-sm", isCompleted && "line-through")}>
                    {t(`onboarding.${step.translationKey}`)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={cn("bg-surface border border-border rounded-xl", className)}>
      <div className="p-4 border-b border-border">
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className={isRTL ? "text-right" : "text-left"}>
            <h3 className="font-semibold text-foreground">{t("onboarding.setupChecklist")}</h3>
            <p className="text-sm text-muted">{t("onboarding.completeSetup")}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 border-b border-border">
        <div className={cn("flex items-center justify-between mb-2", isRTL && "flex-row-reverse")}>
          <span className="text-sm text-muted">
            {completedCount} {t("onboarding.of")} {totalSteps}
          </span>
          <span className="text-sm font-medium text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2">
        {stepConfig.map((step, index) => {
          const isCompleted = getStepStatus(step.id);
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                isCompleted
                  ? "bg-success/10"
                  : "hover:bg-surface-elevated",
                isRTL && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  isCompleted ? "bg-success text-white" : "bg-surface-elevated text-muted"
                )}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-success line-through" : "text-foreground"
                  )}
                >
                  {t(`onboarding.${step.translationKey}`)}
                </p>
              </div>
              <Icon className={cn("w-5 h-5", isCompleted ? "text-success" : "text-muted")} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
