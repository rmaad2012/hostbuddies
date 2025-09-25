/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand color palette
        tan: {
          50: '#faf8f4',
          100: '#f5f0e4',
          200: '#ebe0c8',
          300: '#ddc9a3',
          400: '#d1b584',
          500: '#B68D40', // Primary tan
          600: '#a67d39',
          700: '#8b6830',
          800: '#72552b',
          900: '#5d4626',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdfbf6',
          200: '#fbf7ec',
          300: '#f8f2de',
          400: '#F4EBD0', // Primary cream
          500: '#f0e4c2',
          600: '#e8d5a8',
          700: '#dcc387',
          800: '#ceb069',
          900: '#b89c52',
        },
        charcoal: {
          50: '#f6f7f6',
          100: '#e3e5e3',
          200: '#c7ccc7',
          300: '#a3aca3',
          400: '#7d877d',
          500: '#616b61',
          600: '#4d554d',
          700: '#3f453f',
          800: '#2a312a',
          900: '#122620', // Primary charcoal
        },
        gold: {
          50: '#fefcf7',
          100: '#fdf8ec',
          200: '#fbf0d4',
          300: '#f7e4b4',
          400: '#f2d588',
          500: '#D6AD60', // Primary gold
          600: '#c49c54',
          700: '#a48547',
          800: '#876d3d',
          900: '#6f5a34',
        },
      },
      fontFamily: {
        'afacad': ['Afacad', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
