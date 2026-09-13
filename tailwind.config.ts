import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5E46',
          hover: '#FF7E6A',
          light: '#FFE8E5',
        },
        ink: {
          DEFAULT: '#1F2937',
          muted: '#6B7280',
        },
        line: '#E5E7EB',
        danger: '#DC2626',
        success: '#16A34A',
        canvas: '#F4F6F8',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '26px' }],
        'body-sm': ['14px', { lineHeight: '22px' }],
        caption: ['12px', { lineHeight: '18px' }],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        raised: '0 4px 16px rgba(16, 24, 40, 0.08)',
        overlay: '0 12px 40px rgba(16, 24, 40, 0.16)',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
