import { CivicTerminal } from '@/components/civic/CivicTerminal';

// Viewing the civic pulse is public and keyless (transparency). Casting a voice
// requires the zero-knowledge identity check inside the modal.
export default function CivicApp() {
  return <CivicTerminal />;
}
