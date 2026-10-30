import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D97706',
        'gold-light': '#F59E0B',
        'gold-dim': 'rgba(217,119,6,0.12)',
        'dark-bg': '#0a0f0a',
        'dark-card': '#0e180e',
        'dark-border': '#1e2e1e',
        'dark-text': '#e2e8f0',
        'dark-muted': '#94a3b8',
        'pub-bg': '#F0FDF4',
        'pub-dark': '#064E3B',
        'pub-darker': '#022C22',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.35s ease',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
}

export default config
