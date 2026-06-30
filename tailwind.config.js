/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      fontFamily: {
        baloo: ['"Baloo 2"', 'cursive', 'sans-serif'],
        fredoka: ['Fredoka', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      height: {
        'screen-dvh': '100dvh',
      },
      colors: {
        accent: {
          yellow: '#fec348',
          orange: '#ff7547',
          purple: '#9747ff',
          cyan: '#06b6d4',
          green: '#3f9c35',
        },
        bg: {
          dark: '#0d0d0d',
          card: '#121212',
        },
      },
    },
  },
  plugins: [],
};