"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  MessageSquare,
  Sparkles,
  Zap,
  Globe,
} from "lucide-react";

const steps = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Business" },
  { id: 3, title: "Bot Setup" },
  { id: 4, title: "Channels" },
  { id: 5, title: "Complete" },
];

const industries = [
  { id: "ecommerce", label: "E-commerce", icon: "🛒" },
  { id: "saas", label: "SaaS", icon: "💻" },
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "finance", label: "Finance", icon: "🏦" },
  { id: "education", label: "Education", icon: "📚" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "food", label: "Food & Beverage", icon: "🍕" },
  { id: "other", label: "Other", icon: "🌟" },
];

const channels = [
  { id: "whatsapp", name: "WhatsApp", icon: "📱", color: "bg-whatsapp" },
  { id: "messenger", name: "Messenger", icon: "💬", color: "bg-messenger" },
  { id: "telegram", name: "Telegram", icon: "📨", color: "bg-telegram" },
  { id: "website", name: "Website", icon: "🌐", color: "bg-primary" },
];

const personalities = [
  { id: "professional", title: "Professional", emoji: "👔" },
  { id: "friendly", title: "Friendly", emoji: "😊" },
  { id: "casual", title: "Casual", emoji: "✌️" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    botName: "",
    personality: "friendly",
    channels: [] as string[],
  });

  const toggleChannel = (id: string) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(id)
        ? prev.channels.filter((c) => c !== id)
        : [...prev.channels, id],
    }));
  };

  const handleFinish = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">LeblebBot</span>
        </div>

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > s.id
                    ? "bg-primary text-white"
                    : step === s.id
                    ? "bg-primary/20 text-primary border border-primary"
                    : "bg-surface-elevated text-muted"
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${step > s.id ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                Welcome to LeblebBot
              </h1>
              <p className="text-muted mb-8">
                Let us set up your AI-powered customer support in just a few steps
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-surface border border-border rounded-xl text-center">
                  <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                  <span className="text-sm text-muted">Quick Setup</span>
                </div>
                <div className="p-4 bg-surface border border-border rounded-xl text-center">
                  <Bot className="w-6 h-6 text-primary mx-auto mb-2" />
                  <span className="text-sm text-muted">AI Powered</span>
                </div>
                <div className="p-4 bg-surface border border-border rounded-xl text-center">
                  <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
                  <span className="text-sm text-muted">Multi-Channel</span>
                </div>
              </div>
              <Button onClick={() => setStep(2)} size="lg">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Business */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Tell us about your business
                </h2>
                <p className="text-muted">This helps us customize your bot</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Name
                  </label>
                  <Input
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Industry
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {industries.map((ind) => (
                      <button
                        key={ind.id}
                        onClick={() => setForm({ ...form, industry: ind.id })}
                        className={`p-3 rounded-lg text-center transition-colors ${
                          form.industry === ind.id
                            ? "bg-primary/20 border-primary border"
                            : "bg-surface-elevated border border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xl block mb-1">{ind.icon}</span>
                        <span className="text-xs">{ind.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!form.businessName || !form.industry}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Bot Setup */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Customize your bot</h2>
                <p className="text-muted">Give your bot a name and personality</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bot Name
                  </label>
                  <Input
                    value={form.botName}
                    onChange={(e) => setForm({ ...form, botName: e.target.value })}
                    placeholder="Support Assistant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Personality
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {personalities.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setForm({ ...form, personality: p.id })}
                        className={`p-4 rounded-lg text-center transition-colors ${
                          form.personality === p.id
                            ? "bg-primary/20 border-primary border"
                            : "bg-surface-elevated border border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-2xl block mb-2">{p.emoji}</span>
                        <span className="text-sm font-medium">{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!form.botName}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Channels */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Connect your channels</h2>
                <p className="text-muted">Select where you want to deploy your bot</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-5 rounded-xl text-left transition-colors ${
                      form.channels.includes(ch.id)
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-surface border border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{ch.icon}</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          form.channels.includes(ch.id)
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                      >
                        {form.channels.includes(ch.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground">{ch.name}</h3>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep(5)} disabled={form.channels.length === 0}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">You are all set!</h2>
              <p className="text-muted mb-8">
                Your AI support bot is ready. Let us head to the dashboard and start connecting
                your channels.
              </p>
              <div className="bg-surface border border-border rounded-xl p-5 mb-8 text-left">
                <h3 className="font-semibold text-foreground mb-4">Quick Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Business</span>
                    <span className="text-foreground">{form.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Bot Name</span>
                    <span className="text-foreground">{form.botName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Personality</span>
                    <span className="text-foreground capitalize">{form.personality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Channels</span>
                    <span className="text-foreground">{form.channels.length} selected</span>
                  </div>
                </div>
              </div>
              <Button onClick={handleFinish} size="lg" isLoading={isLoading}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
