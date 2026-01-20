"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { OnboardingProvider } from "@/lib/onboarding";

// Lazy load onboarding components - they're not needed immediately
const WelcomeModal = dynamic(
  () => import("@/components/onboarding/WelcomeModal").then(mod => ({ default: mod.WelcomeModal })),
  { ssr: false }
);

const GuidedTour = dynamic(
  () => import("@/components/onboarding/GuidedTour").then(mod => ({ default: mod.GuidedTour })),
  { ssr: false }
);

const SetupChecklist = dynamic(
  () => import("@/components/onboarding/SetupChecklist").then(mod => ({ default: mod.SetupChecklist })),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <OnboardingProvider>
          {children}
          <WelcomeModal />
          <GuidedTour />
          <SetupChecklist variant="floating" />
        </OnboardingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
