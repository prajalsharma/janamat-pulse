import { LandingNav } from '@/components/landing-civic/LandingNav';
import { Hero } from '@/components/landing-civic/Hero';
import { SignalPipeline } from '@/components/landing-civic/SignalPipeline';
import { TrackedProjects } from '@/components/landing-civic/TrackedProjects';
import { WhyItMatters } from '@/components/landing-civic/WhyItMatters';
import { FinalCta } from '@/components/landing-civic/FinalCta';
import { LandingFooter } from '@/components/landing-civic/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <LandingNav />
      <main>
        <Hero />
        <SignalPipeline />
        {/* Async server component: fetches live projects, falls back to the seed registry. */}
        <TrackedProjects />
        <WhyItMatters />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
