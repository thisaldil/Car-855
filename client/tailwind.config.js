export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#333333', 700: '#2a2a2a', 800: '#222222', 900: '#171717' },
        gold: { DEFAULT: '#C99833', 600: '#b0832a', 100: '#f7edd7' },
        mist: '#E6E6E6',
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 4px 20px rgba(0,0,0,.07)' },
    },
  },
  plugins: [],
};
