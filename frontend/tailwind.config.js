/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Lora', 'Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        meter: {
          true: '#15803d',     // Deep Emerald (Zone 5)
          mostlytrue: '#65a30d', // Olive / Light Green (Zone 4)
          half: '#d97706',     // Amber / Warm Ochre (Zone 3)
          mostlyfalse: '#ea580c', // Orange-Red (Zone 2)
          false: '#b91c1c',    // Deep Crimson (Zone 1)
          unverified: '#64748b' // Neutral Slate (Zone 0)
        },
        whatsapp: {
          header: '#008069',
          headerDark: '#00a884',
          bg: '#ece5dd',
          sent: '#dcf8c6',
          received: '#ffffff',
          tick: '#53bdeb'
        },
        burgundy: {
          950: '#200C12', // Lifted deep royal burgundy-plum canvas
          900: '#2D141E', // Card surface glass
          850: '#381624',
          800: '#4A1C2C',
          700: '#581845',
          600: '#6D1B26',
          500: '#800020',
          400: '#990033',
        },
        gold: {
          DEFAULT: '#E5C158',
          light: '#F5D77F',
          dark: '#C8A33A',
          muted: 'rgba(229, 193, 88, 0.22)',
        },
        parchment: {
          DEFAULT: '#FAF6F0',
          muted: '#D4B29E',
        },
        editorial: {
          canvas: '#fdfbf7',
          surface: '#ffffff',
          border: '#e2e8f0',
          dark: '#0f172a',
          muted: '#475569',
          accent: '#1e3a8a'
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'editorial': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'bento': '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'specular': '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        'glass-hover': '0 22px 45px rgba(0, 0, 0, 0.65), 0 0 25px rgba(229, 193, 88, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.12)',
        'gold-glow': '0 0 15px rgba(229, 193, 88, 0.2)',
      }
    },
  },
  plugins: [],
}

