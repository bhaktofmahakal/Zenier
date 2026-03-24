/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        'tertiary-fixed': '#ffdad7',
        'on-primary-container': '#0d0096',
        'on-background': '#e3e2e3',
        'on-secondary-fixed': '#002113',
        'on-secondary': '#003824',
        'tertiary': '#ffb3af',
        'on-primary': '#1000a9',
        'tertiary-fixed-dim': '#ffb3af',
        'surface-container-low': '#1b1c1d',
        'secondary-container': '#00a572',
        'on-error-container': '#ffdad6',
        'primary-fixed': '#e1e0ff',
        'on-tertiary-container': '#5c000b',
        'primary-fixed-dim': '#c0c1ff',
        'on-error': '#690005',
        'error': '#ffb4ab',
        'on-tertiary-fixed-variant': '#8e101c',
        'surface': '#121315',
        'secondary': '#4edea3',
        'surface-dim': '#121315',
        'on-secondary-fixed-variant': '#005236',
        'surface-tint': '#c0c1ff',
        'on-primary-fixed': '#07006c',
        'inverse-primary': '#494bd6',
        'on-surface': '#e3e2e3',
        'inverse-on-surface': '#303032',
        'surface-container-lowest': '#0d0e0f',
        'secondary-fixed-dim': '#4edea3',
        'on-surface-variant': '#c7c4d7',
        'on-primary-fixed-variant': '#2f2ebe',
        'surface-container': '#1f2021',
        'primary': '#c0c1ff',
        'error-container': '#93000a',
        'background': '#121315',
        'outline-variant': '#464554',
        'surface-bright': '#38393a',
        'surface-container-high': '#292a2b',
        'tertiary-container': '#f55e5d',
        'surface-container-highest': '#343536',
        'on-tertiary-fixed': '#410005',
        'secondary-fixed': '#6ffbbe',
        'on-secondary-container': '#00311f',
        'on-tertiary': '#68000e',
        'outline': '#908fa0',
        'surface-variant': '#343536',
        'primary-container': '#8083ff',
        'inverse-surface': '#e3e2e3'
      },
      fontFamily: {
        headline: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        label: ['"Berkeley Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px'
      }
    }
  },
  plugins: []
}
