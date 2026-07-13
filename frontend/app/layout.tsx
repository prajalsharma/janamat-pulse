import type { Metadata } from 'next';
import { Fira_Sans, Fira_Code } from 'next/font/google';
import { PrivyClientProvider } from '@/components/auth/PrivyClientProvider';
import './globals.css';

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fira-sans',
  display: 'swap',
});
const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Janamat Pulse · Civic Accountability on Solana',
  description:
    'An AI agent that measures public sentiment on government projects and anchors a tamper-proof civic record on Solana. One verified human, one voice.',
  icons: {
    icon: [{ url: '/brand/logo-icon.svg', type: 'image/svg+xml' }],
    shortcut: '/brand/logo-icon.svg',
    apple: '/brand/logo-icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className="font-sans antialiased bg-ink text-content">
        <PrivyClientProvider>{children}</PrivyClientProvider>
      </body>
    </html>
  );
}
