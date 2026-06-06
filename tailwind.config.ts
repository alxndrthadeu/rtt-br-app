import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Unchanged dark-mode palette (existing pages keep working)
        cream: '#EDE8DC',
        gold: '#C9A84C',
        coral: '#C13B2A',
        green: '#1B6B3A',
        dark: '#1A1A1A',
        midnight: '#0B1929',
        navy: '#0F2237',
        // Light-mode vintage palette
        paper: '#F0E8D0',
        parchment: '#E2D5B5',
        ink: '#1A0A00',
        azul: '#002776',
        field: {
          light: '#4A7F58',
          dark: '#3D7048',
        },
      },
      fontFamily: {
        oswald: ['var(--font-oswald)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
