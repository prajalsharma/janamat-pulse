import type { Config } from 'tailwindcss';

/**
 * Janamat Pulse design tokens.
 * Brand: teal signal + violet on-chain + crimson civic accent on deep ink.
 * Semantic names (not raw hex in components) per ui-ux-pro-max color-semantic.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // base surfaces (deep ink)
        ink: '#0B1220',
        surface: {
          DEFAULT: '#0F1830',
          2: '#131E3A',
        },
        line: '#1E2A45', // hairline borders
        // text
        content: {
          DEFAULT: '#F5F7FA',
          muted: '#94A3B8', // ~6:1 on ink — AA
          faint: '#64748B',
        },
        // functional accents
        signal: '#22D3EE', // teal — the live pulse / public sentiment
        chain: '#9945FF', // violet — on-chain / Solana
        civic: '#E23252', // crimson — civic / Nepal / flag
        // sentiment states
        corroborate: '#22D3EE',
        dispute: '#E23252',
        neutralv: '#94A3B8',
      },
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(245,247,250,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.7)',
        'signal-glow': '0 0 0 1px rgba(34,211,238,0.35), 0 0 20px -6px rgba(34,211,238,0.5)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%': { boxShadow: '0 0 0 0 rgba(34,211,238,0.55)' },
          '70%': { boxShadow: '0 0 0 7px rgba(34,211,238,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'meter-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(226,50,82,0)' },
          '50%': { boxShadow: '0 0 14px -2px rgba(226,50,82,0.6)' },
        },
        'scan-x': {
          '0%': { transform: 'translateX(-30%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(130%)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 320ms cubic-bezier(0,0,0.2,1) both',
        'pulse-dot': 'pulse-dot 2s ease-out infinite',
        sweep: 'sweep 2.2s ease-in-out infinite',
        rise: 'rise 620ms cubic-bezier(0.22,1,0.36,1) both',
        'meter-glow': 'meter-glow 2.6s ease-in-out infinite',
        'scan-x': 'scan-x 3.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
