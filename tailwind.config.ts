import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-void':     '#080810',
        'bg-surface':  '#0e0e1a',
        'bg-elevated': '#13131f',
        'gold':        '#c9a84c',
        'gold-bright': '#f0c96e',
        'gold-dim':    '#6b5520',
        'nox':         '#00e5a0',
        'text-primary':   '#f0ede8',
        'text-secondary': '#8a8599',
        'text-ghost':     '#3d3a4e',
        'status-error':   '#e05555',
        'status-warning': '#f0a84c',
        'status-info':    '#4c8ef0',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body:    ['DM Mono', 'monospace'],
        data:    ['Orbitron', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #f0c96e 50%, #c9a84c 100%)',
      },
      boxShadow: {
        'gold-glow':   '0 0 20px rgba(201,168,76,0.15), 0 0 40px rgba(201,168,76,0.08)',
        'gold-glow-lg':'0 0 40px rgba(201,168,76,0.25), 0 0 80px rgba(201,168,76,0.1)',
        'nox-glow':    '0 0 20px rgba(0,229,160,0.15)',
        'card':        '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover':  '0 16px 48px rgba(0,0,0,0.6)',
      },
      animation: {
        'orb-float':  'orbFloat 8s ease-in-out infinite',
        'orb-float2': 'orbFloat2 10s ease-in-out infinite',
        'nox-pulse':  'noxPulse 2s ease-in-out infinite',
        'active-dot': 'activePulse 2s ease-in-out infinite',
        'shimmer':    'shimmer 3s linear infinite',
      },
      maxWidth: {
        '8xl': '1440px',
      },
    },
  },
  plugins: [],
};
export default config;
