/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'enosh-blue': '#2563eb', // Primary blue from enoshinfra
        'enosh-white': '#ffffff', // White background
      },
    },
  },
  plugins: [],
};
