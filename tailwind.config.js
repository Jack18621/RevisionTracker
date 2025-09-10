export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f14',
        card: '#0f151d',
        edge: '#1f2a37',
        text: '#e9eef5',
        sub: '#9fb0c1',
        brand: '#3b82f6',
        brand2: '#22c55e',
        brand3: '#a855f7',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    },
  },
  plugins: [],
}
