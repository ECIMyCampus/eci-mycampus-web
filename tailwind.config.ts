import type { Config } from 'tailwindcss';

/**
 * Sistema de diseño de ECI-MyCampus.
 * Tema oscuro neutro con un solo acento (rojo ECI). El verde se reserva para "en vivo".
 * Los colores salen de variables CSS definidas en src/app/globals.css.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Los estilos hover solo aplican en dispositivos con puntero: en táctil no quedan "pegados".
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          strong: 'rgb(var(--line-strong) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          subtle: 'rgb(var(--ink-subtle) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          /** Rojo aclarado para texto e íconos sobre fondo oscuro (contraste AA). */
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
        },
        live: 'rgb(var(--live) / <alpha-value>)',
        /** Rojo puro del logotipo; no se usa en la interfaz. */
        'logo-red': 'rgb(var(--logo-red) / <alpha-value>)',
        // Marca original: se conserva para lo que aún la usa.
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
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        program: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      borderRadius: {
        control: '0.625rem',
        card: '1rem',
      },
      boxShadow: {
        float: '0 12px 32px -8px rgb(0 0 0 / 0.6), 0 2px 6px rgb(0 0 0 / 0.4)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        // Curvas con más carácter que las de fábrica.
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
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
