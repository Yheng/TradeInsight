/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - Professional blue with financial undertones
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Trading green - Profit/bullish
        bullish: {
          50: '#f0fdf0',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Trading red - Loss/bearish
        bearish: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Warning/neutral - Amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Dark theme colors for professional trading interface
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Sophisticated grays for trading platform with WCAG AA compliance
        trading: {
          bg: '#0a0e1a',          // Primary background
          surface: '#111827',      // Card/surface background
          elevated: '#1f2937',     // Elevated surface (modals, dropdowns)
          border: '#374151',       // Border color
          muted: '#6b7280',        // Muted/secondary text
          text: '#f9fafb',         // Primary text (high contrast)
          secondary: '#e5e7eb',    // Secondary text (WCAG AA: 7.13:1 ratio)
          tertiary: '#d1d5db',     // Tertiary text (WCAG AA: 5.74:1 ratio)
          accent: '#3b82f6',       // Accent color
          input: '#1f2937',        // Input background
          'input-text': '#f9fafb', // Input text color
          'input-placeholder': '#9ca3af', // Input placeholder
          label: '#e5e7eb',        // Form labels
        },
        // Legacy aliases for backward compatibility
        success: {
          50: '#f0fdf0',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-custom': 'pulseCustom 2s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'chart-rise': 'chartRise 0.6s ease-out',
        'chart-fall': 'chartFall 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseCustom: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        pulseGlow: {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 5px rgb(59 130 246 / 0.5)'
          },
          '50%': { 
            opacity: '0.8',
            boxShadow: '0 0 20px rgb(59 130 246 / 0.8), 0 0 30px rgb(59 130 246 / 0.4)'
          },
        },
        chartRise: {
          '0%': { 
            transform: 'translateY(20px) scale(0.95)', 
            opacity: '0',
            color: 'rgb(34 197 94)'
          },
          '100%': { 
            transform: 'translateY(0) scale(1)', 
            opacity: '1',
            color: 'rgb(34 197 94)'
          },
        },
        chartFall: {
          '0%': { 
            transform: 'translateY(-20px) scale(0.95)', 
            opacity: '0',
            color: 'rgb(239 68 68)'
          },
          '100%': { 
            transform: 'translateY(0) scale(1)', 
            opacity: '1',
            color: 'rgb(239 68 68)'
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgb(59 130 246 / 0.2)' },
          '100%': { boxShadow: '0 0 20px rgb(59 130 246 / 0.4), 0 0 30px rgb(59 130 246 / 0.1)' },
        },
      },
      backgroundImage: {
        'gradient-trading': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'gradient-bullish': 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
        'gradient-bearish': 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
        'gradient-primary': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-glow': 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        'chart-grid': 'linear-gradient(to right, rgba(156, 163, 175, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(156, 163, 175, 0.1) 1px, transparent 1px)',
      },
      boxShadow: {
        'trading': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'trading-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'trading-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glow-sm': '0 0 5px rgba(59, 130, 246, 0.3)',
        'glow-md': '0 0 10px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 20px rgba(59, 130, 246, 0.5)',
        'bullish': '0 0 10px rgba(34, 197, 94, 0.3)',
        'bearish': '0 0 10px rgba(239, 68, 68, 0.3)',
      },
    },
  },
  plugins: [],
}