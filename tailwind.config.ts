import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0d0d0d',
        'bg-surface': '#141414',
        'bg-elevated': '#1c1c1c',
        'bg-overlay': '#242424',
        border: '#2a2a2a',
        'border-active': '#3d3d3d',
        'text-primary': '#f0f0f0',
        'text-secondary': '#8a8a8a',
        'text-muted': '#555555',
        accent: '#c8f542',
        'accent-dim': '#9bbf2e',
        danger: '#ff4545',
        success: '#22c55e',
        warning: '#f59e0b',
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
