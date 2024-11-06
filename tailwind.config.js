/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "./src/**/*.{html,ts}",],
  theme: {
    extend: {
        colors: {
          brown: {
            50: '#FFF9F0',
            100: '#FAF3E0',  // Sand Beige
            200: '#EAD8C4',  // Pale Almond
            300: '#D8BFA6',  // Soft Tan
            400: '#BFA27D',  // Muted Taupe
            500: '#A57A55',  // Classic Brown
            600: '#8A6146',  // Warm Umber
            700: '#6E4B3A',  // Dark Mocha
            800: '#533526',  // Rich Espresso
            900: '#3A2419',  // Deep Chocolate
          },
      },
      fontFamily: {
        berkshire: ['"Berkshire Swash"', 'serif'],
      },
    },
  },
  plugins: [],
}

