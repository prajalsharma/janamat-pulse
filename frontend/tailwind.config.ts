import type { Config } from 'tailwindcss';

/** SolVane brand tokens (see brand.md). Dark-first trading terminal. */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B14',
        surface: {
          DEFAULT: '#12121C',
          2: '#191926',
        },
        border: '#242433',
        content: {
          DEFAULT: '#ECECF3',
          muted: '#8A8A9A',
        },
        brand: {
          purple: '#9945FF',
          green: '#14F195',
          'green-deep': '#0E8F63',
        },
        bull: '#14F195',
        bear: '#FF5C7A',
        warn: '#FFB020',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        beam: 'linear-gradient(120deg, #9945FF 0%, #14F195 100%)',
        'beam-soft': 'linear-gradient(120deg, rgba(153,69,255,0.16) 0%, rgba(20,241,149,0.16) 100%)',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(153,69,255,0.4), 0 0 24px -4px rgba(153,69,255,0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(20,241,149,0.5)' },
          '70%': { boxShadow: '0 0 0 6px rgba(20,241,149,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(20,241,149,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 300ms cubic-bezier(0,0,0.2,1) both',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
