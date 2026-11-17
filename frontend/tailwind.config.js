/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          red: '#EE1515',
          darkRed: '#BA0000',
          blue: '#2A75BB',
          yellow: '#FFDE00',
          gold: '#B3A125',
          dark: '#1A1D20',
          panel: '#22272E',
        }
      },
      fontFamily: {
        game: ['"Press Start 2P"', 'monospace', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

