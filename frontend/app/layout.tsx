import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { PrivyClientProvider } from '@/components/auth/PrivyClientProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SolVane · News-Sentiment Trading Agent',
  description:
    'An autonomous AI agent that trades Solana on live news sentiment, routing swaps through Jupiter.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <PrivyClientProvider>{children}</PrivyClientProvider>
      </body>
    </html>
  );
}
