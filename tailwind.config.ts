import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'bg-void': '#060608',
        'bg-base': '#0c0c0f',
        'bg-surface': '#111116',
        'bg-elevated': '#18181f',
        'bg-overlay': '#1e1e28',
        'bg-hover': '#22222e',
        'border-subtle': 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.08)',
        'border-active': 'rgba(255,255,255,0.14)',
        'border-accent': 'rgba(200,245,66,0.25)',
        'text-primary': '#f2f2f4',
        'text-secondary': '#8b8b9a',
        'text-muted': '#4a4a5a',
        accent: '#c8f542',
        'accent-dim': '#a8cc35',
        'accent-muted': '#7a9a22',
        danger: '#f43f5e',
        success: '#22c55e',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        sans: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
      },
      boxShadow: {
        glass: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 0 0 0.5px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        'accent-glow': '0 0 0 1px rgba(200,245,66,0.3), 0 0 20px rgba(200,245,66,0.1), 0 0 60px rgba(200,245,66,0.05)',
        'pr-glow': '0 0 12px rgba(200,245,66,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
