import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        eci: {
          red: {
            DEFAULT: '#8B0000',
            dark: '#6B0000',
            light: '#A51D24',
          },
          gold: {
            DEFAULT: '#D97706',
            light: '#F59E0B',
          },
          dark: {
            DEFAULT: '#0F172A',
            surface: '#1E293B',
            border: '#334155',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};

export default config;
