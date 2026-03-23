/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/renderer/**/*.{html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Paleta principal — rojo Open Screen
        brand: {
          50:  '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6b6b',
          500: '#f83b3b',
          600: '#e51d1d',
          700: '#c11414',
          800: '#9f1414',
          900: '#841818',
          950: '#4f0909',
        },
        // Superficies (light mode)
        surface: {
          DEFAULT: '#ffffff',
          soft:    '#f1f5f9',
          muted:   '#e2e8f0',
        },
        // Superficies (dark mode)
        dark: {
          base:    '#0d0f18',
          surface: '#161929',
          card:    '#1d2133',
          border:  '#1e2535',
        },
      },
      boxShadow: {
        'brand':    '0 4px 20px -4px rgb(229 29 29 / .45)',
        'brand-lg': '0 8px 32px -6px rgb(229 29 29 / .5)',
        'card':     '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .06)',
        'card-md':  '0 4px 16px 0 rgb(0 0 0 / .08)',
      },
      borderRadius: {
        'card': '14px',
        'btn':  '10px',
      },
      animation: {
        'fade-up':   'fadeUp .3s ease both',
        'fade-up-2': 'fadeUp .3s .07s ease both',
        'fade-up-3': 'fadeUp .3s .14s ease both',
        'blink':     'blink 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(7px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '.3' },
        }
      }
    }
  },
  plugins: [],
}
