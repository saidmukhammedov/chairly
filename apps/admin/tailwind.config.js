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
          bg: '#FBF9F5',
          surface: '#FFFFFF',
          panel: '#F5F2EB',
          border: '#EAE5DB',
          dark: '#1A1A1A',
          charcoal: '#262626',
          muted: '#6B665E',
          subtle: '#8C867E',
          terracotta: {
            50: '#FDF8F6',
            100: '#F8ECE6',
            200: '#F2D9CE',
            300: '#E6BAA9',
            400: '#D58D72',
            500: '#C25E3E', // Primary brand accent
            600: '#AD4D2F',
            700: '#8E3E26',
            800: '#733322',
            900: '#5F2D20',
          },
          forest: {
            50: '#F1F7F4',
            100: '#E1EFE8',
            500: '#2D5A46',
            600: '#234737',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
