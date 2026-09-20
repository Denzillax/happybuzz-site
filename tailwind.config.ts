import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Spiegelt src/lib/theme.js (Meeko, 20.09.2026): Ink, Pastelle, kein Cream, kein Grau
        honey:         '#F4C03F',
        'honey-light': '#FEE8B0',
        'honey-dark':  '#8A5A00',
        'honey-soft':  '#FEE8B0',
        text:          '#1D1D1D',
        'text-md':     '#34343B',
        'text-lt':     '#5B626C',
        bg:            '#FFFFFF',
        'bg-alt':      '#F3F3FF',
        surface:       '#FFFFFF',
        border:        '#1D1D1D',
        'border-lt':   'rgba(29,29,29,.16)',
        green:         '#50804F',
        'green-soft':  '#CEF6E8',
        blue:          '#1D1D1D',
        'blue-soft':   '#D3F0FF',
        red:           '#C62828',
        'red-soft':    '#FFE2DE',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'buzz': '6px',
      },
      maxWidth: {
        'content': '1480px',
      },
      boxShadow: {
        'buzz':       '0 1px 4px rgba(17, 16, 24, 0.05)',
        'buzz-md':    '0 2px 8px rgba(17, 16, 24, 0.06)',
        'buzz-lg':    '0 4px 16px rgba(17, 16, 24, 0.08)',
        'buzz-hover': '0 2px 12px rgba(244, 192, 63, 0.2)',
        'buzz-xl':    '0 8px 32px rgba(17, 16, 24, 0.1)',
      },
      animation: {
        'buzz-in':  'buzzIn 0.25s ease-out',
        'float':    'float 3s ease-in-out infinite',
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        buzzIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-5px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
