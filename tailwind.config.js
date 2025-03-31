/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          'splendor-blue': {
            DEFAULT: '#0F2149',
            dark: '#0A1432',
            light: '#1A3366',
          },
          'splendor-gold': {
            DEFAULT: '#FFD700',
            dark: '#E6C300',
            light: '#FFDE33',
          }
        }
      },
    },
    plugins: [],
  }