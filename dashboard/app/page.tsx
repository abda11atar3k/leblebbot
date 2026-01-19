"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Bot,
  MessageSquare,
  Zap,
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const { t, isRTL } = useTranslation();

  const features = [
    {
      icon: Sparkles,
      title: t("landing.feature1Title"),
      description: t("landing.feature1Desc"),
    },
    {
      icon: Zap,
      title: t("landing.feature2Title"),
      description: t("landing.feature2Desc"),
    },
    {
      icon: Shield,
      title: t("landing.feature3Title"),
      description: t("landing.feature3Desc"),
    },
    {
      icon: Users,
      title: t("landing.feature4Title"),
      description: t("landing.feature4Desc"),
    },
  ];

  const stats = [
    { value: "99.9%", label: t("landing.uptime") },
    { value: "1.8s", label: t("landing.avgResponse") },
    { value: "50K+", label: t("landing.messagesDay") },
    { value: "96%", label: t("landing.satisfaction") },
  ];

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between h-16",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">LeblebBot</span>
            </div>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                {t("landing.signIn")}
              </Link>
              <Link href="/onboarding">
                <Button size="sm">{t("landing.getStarted")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className={cn(
          "absolute top-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl",
          isRTL ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
        )} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8",
              isRTL && "flex-row-reverse"
            )}>
              <Zap className="w-4 h-4" />
              {t("landing.poweredByAI")}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-tight">
              {t("landing.heroTitle")}{" "}
              <span className="text-primary">{t("landing.heroTitleHighlight")}</span>
            </h1>
            <p className="text-lg text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("landing.heroSubtitle")}
            </p>
            <div className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4",
              isRTL && "sm:flex-row-reverse"
            )}>
              <Link href="/onboarding">
                <Button size="lg" className="w-full sm:w-auto">
                  {t("landing.startFreeTrial")}
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  <MessageSquare className="w-4 h-4" />
                  {t("landing.watchDemo")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-sm text-muted font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              {t("landing.featuresSubtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "group p-6 bg-surface border border-border rounded-2xl hover:border-primary/50 hover:shadow-soft-lg transition-all duration-300",
                  isRTL ? "text-end" : "text-start"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors",
                  isRTL ? "mr-0 ml-auto" : "ml-0 mr-auto"
                )}>
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-8 md:p-16 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
              {t("landing.ctaSubtitle")}
            </p>
            <Link href="/onboarding">
              <Button size="lg">
                {t("landing.getStartedFree")}
                <ArrowIcon className="w-4 h-4" />
              </Button>
            </Link>
            <div className={cn(
              "flex items-center justify-center gap-6 mt-8 text-sm text-muted",
              isRTL && "flex-row-reverse"
            )}>
              <span className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Check className="w-4 h-4 text-success" />
                {t("landing.freeTrial")}
              </span>
              <span className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Check className="w-4 h-4 text-success" />
                {t("landing.noCard")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-between gap-4",
            isRTL && "sm:flex-row-reverse"
          )}>
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground">LeblebBot</span>
            </div>
            <p className="text-sm text-muted">{t("landing.allRights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
