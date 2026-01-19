import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#10b981', // emerald-500
          green: '#10b981',
          blue: '#3b82f6',
          orange: '#f97316',
          purple: '#a855f7',
        },
      },
    },
  },
  plugins: [],
}
export default config
