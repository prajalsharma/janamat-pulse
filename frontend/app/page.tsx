import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Trust } from '@/components/landing/Trust';
import { TerminalPreview } from '@/components/landing/TerminalPreview';
import { TechStrip } from '@/components/landing/TechStrip';
import { FinalCta } from '@/components/landing/FinalCta';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <Hero />
        <HowItWorks />
        <Trust />
        <TerminalPreview />
        <TechStrip />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
