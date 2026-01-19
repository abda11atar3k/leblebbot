"use client";

import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { OnboardingProvider } from "@/lib/onboarding";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { SetupChecklist } from "@/components/onboarding/SetupChecklist";

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
