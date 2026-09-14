/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nasa: ['Nasa', 'sans-serif'],
        motif: ['Motif', 'sans-serif'],
      },
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#09090b',
        },
        card: {
          DEFAULT: '#18181b',
          foreground: '#fafafa',
        },
        border: '#27272a',
      }
    },
  },
  plugins: [],
}
