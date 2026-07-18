import type { Config } from 'tailwindcss';
import containerQueries from '@tailwindcss/container-queries';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cafe': {
          'brown': '#2C1810',
          'cream': '#F5E6D3',
          'accent': '#D4A574',
          'gold': '#C9A227',
        },
        'status': {
          'available': '#4ADE80',
          'occupied': '#F87171',
          'preparing': '#FBBF24',
          'awaiting': '#A78BFA',
          'reserved': '#60A5FA',
          'cleaning': '#34D399',
        },
      },
      fontFamily: {
        'persian': ['Vazirmatn', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 165, 116, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 165, 116, 0.8)' },
        },
      },
    },
  },
  plugins: [containerQueries],
};

export default config;
