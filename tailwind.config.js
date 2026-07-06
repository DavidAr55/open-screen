/** @type {import('tailwindcss').Config} */

// ─── Escalas absolutas — idénticas en tema claro y oscuro ────────────────────
// Identidad "LivePro Command": azul #007AFF (primario), rojo #FF3B30 (en vivo/
// destructivo), naranja #D75600 (avisos), neutros anclados en #121212.

const primary = {
  50:  '#F0F6FF',
  100: '#E0EDFF',
  200: '#A8C7FA', // fondo del botón primario tonal
  300: '#7EB0F7',
  400: '#3D95F5',
  500: '#007AFF',
  600: '#0066D6',
  700: '#0052AC',
  800: '#003F85',
  900: '#032F60',
  950: '#021D3D',
}

const live = {
  50:  '#FFF1F0',
  100: '#FFE1DF',
  200: '#FFC7C4', // chips salmón (acciones destructivas)
  300: '#FFA09A',
  400: '#FF6B61',
  500: '#FF3B30',
  600: '#E02D24',
  700: '#B8221B',
  800: '#921C17',
  900: '#781D19',
  950: '#430B08',
}

const warn = {
  50:  '#FFF4EC',
  100: '#FFE6D5',
  200: '#FFCCA8', // chips durazno
  300: '#FFA96F',
  400: '#F57F33',
  500: '#E86A10',
  600: '#D75600',
  700: '#B24700',
  800: '#8C3900',
  900: '#733001',
  950: '#3F1800',
}

const neutral = {
  50:  '#F7F7F8',
  100: '#EFEFF1',
  200: '#DFDFE3',
  300: '#C7C7CD',
  400: '#A2A2AA',
  500: '#7C7C85',
  600: '#5F5F69',
  700: '#46464E',
  800: '#2E2E33',
  900: '#1C1C20',
  950: '#121212',
}

export default {
  darkMode: 'class',
  content: [
    './src/renderer/**/*.{html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary,
        live,
        warn,
        neutral,
        cream: {
          DEFAULT: '#E8E2D6', // botón "inverted"
          soft:    '#F3EFE7',
          deep:    '#D8CDB8',
        },

        // ── Semánticos — cambian con el tema vía CSS vars (index.css) ──────
        surface: {
          0: 'rgb(var(--surface-0) / <alpha-value>)', // fondo de app
          1: 'rgb(var(--surface-1) / <alpha-value>)', // paneles
          2: 'rgb(var(--surface-2) / <alpha-value>)', // tarjetas
          3: 'rgb(var(--surface-3) / <alpha-value>)', // elevado / hover
        },
        line: {
          1: 'rgb(var(--line-1) / <alpha-value>)', // bordes 1px sutiles
          2: 'rgb(var(--line-2) / <alpha-value>)', // bordes marcados
        },
        ink: {
          1: 'rgb(var(--ink-1) / <alpha-value>)', // texto principal
          2: 'rgb(var(--ink-2) / <alpha-value>)', // texto secundario
          3: 'rgb(var(--ink-3) / <alpha-value>)', // texto terciario
          4: 'rgb(var(--ink-4) / <alpha-value>)', // texto deshabilitado
        },
      },
      boxShadow: {
        'card':    '0 1px 2px 0 rgb(0 0 0 / .10)',
        'card-md': '0 4px 14px 0 rgb(0 0 0 / .18)',
      },
      borderRadius: {
        'card':  '8px',
        'panel': '6px',
        'btn':   '4px',
      },
      animation: {
        'fade-up':        'fadeUp .3s ease both',
        'fade-up-2':      'fadeUp .3s .07s ease both',
        'fade-up-3':      'fadeUp .3s .14s ease both',
        'blink':          'blink 1.4s ease-in-out infinite',
        'modal-in':       'modalIn .15s cubic-bezier(.34,1.56,.64,1) both',
        'slide-in-right': 'slideInRight .22s ease both',
        'section-flash':  'sectionFlash .45s cubic-bezier(.36,.07,.19,.97) forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(7px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '.3' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        sectionFlash: {
          '0%':   { boxShadow: '0 0 0 0 rgb(0 122 255 / .5)',    backgroundColor: 'rgb(0 122 255 / .08)' },
          '40%':  { boxShadow: '0 0 0 6px rgb(0 122 255 / .15)', backgroundColor: 'rgb(0 122 255 / .12)' },
          '100%': { boxShadow: '0 0 0 0 rgb(0 122 255 / 0)',     backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
