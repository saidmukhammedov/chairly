/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chairly: {
          bg: '#FAFAFA',          // Crisp gallery white
          surface: '#FFFFFF',     // Pure white
          panel: '#F4F4F5',       // Refined neutral zinc
          border: '#E4E4E7',      // Crisp delicate 1px border
          dark: '#09090B',        // Deep obsidian black
          charcoal: '#18181B',    // Dark slate
          muted: '#71717A',       // Refined neutral text
          subtle: '#A1A1AA',      // Subtle placeholder
          terracotta: {
            50: '#FDF8F6',
            100: '#F8ECE6',
            200: '#F2D9CE',
            300: '#E6BAA9',
            400: '#D58D72',
            500: '#C25E3E',
            600: '#AD4D2F',
            700: '#8E3E26',
            800: '#733322',
            900: '#5F2D20',
          },
          forest: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            500: '#16A34A',
            600: '#15803D',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}
