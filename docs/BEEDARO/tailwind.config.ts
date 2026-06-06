import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        honey:   '#F4C03F',
        'honey-light': '#F8D76E',
        'honey-dark':  '#D4A020',
        text:    '#191615',
        bg:      '#F9F4EC',
        'bg-alt':'#F0E8DA',
        green:   '#5B8C5A',
        'green-light': '#7BAF7A',
        blue:    '#94B9C9',
        'blue-light': '#B5D1DD',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'buzz': '12px',
      },
      boxShadow: {
        'buzz': '0 2px 8px rgba(25, 22, 21, 0.08)',
        'buzz-lg': '0 8px 24px rgba(25, 22, 21, 0.12)',
        'buzz-hover': '0 4px 16px rgba(244, 192, 63, 0.25)',
      },
      animation: {
        'buzz-in': 'buzzIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        buzzIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config


