import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        honey:         '#F4C03F',
        'honey-light': '#F8D76E',
        'honey-dark':  '#D4A020',
        'honey-soft':  '#FDF6E3',
        text:          '#111018',
        'text-md':     '#4A4754',
        'text-lt':     '#8A8694',
        bg:            '#FAF8F5',
        'bg-alt':      '#F2EFEA',
        surface:       '#FFFFFF',
        border:        '#E5E2DD',
        'border-lt':   '#F0EDE8',
        green:         '#3D8B3D',
        'green-soft':  '#E8F5E8',
        blue:          '#4A90B8',
        'blue-soft':   '#E4F0F8',
        red:           '#D43D3D',
        'red-soft':    '#FDE8E8',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
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
