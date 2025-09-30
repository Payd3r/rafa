/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  safelist: [
    { pattern: /^(container|block|inline|inline-block|flex|inline-flex|grid|hidden)$/ },
    { pattern: /^(items|justify|content|place)-(start|end|center|between|around|evenly)$/ },
    { pattern: /^flex-(row|col|wrap|nowrap|1|auto|initial|none)$/ },
    { pattern: /^(self|place-self)-(auto|start|end|center|stretch)$/ },
    { pattern: /^(order|col|row)-/ },
    { pattern: /^(w|h|min-w|min-h|max-w|max-h)-/ },
    { pattern: /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap)-/ },
    { pattern: /^space-[xy]-/ },
    { pattern: /^(rounded|rounded-[trbl]|rounded-[sm|md|lg|xl|2xl|3xl|full])/ },
    { pattern: /^(border|border-[trbl]|border-[0-9]|border-(solid|dashed|dotted)|border-(charcoal|black|white|gray700|gray400|sand)|border-[a-z0-9-]+)$/ },
    { pattern: /^(bg|from|via|to)-/ },
    { pattern: /^text-(left|center|right|justify|[0-9]+|[a-z0-9-]+)$/ },
    { pattern: /^(leading|tracking|font|uppercase|lowercase|capitalize|normal-case)/ },
    { pattern: /^(grid-cols|grid-rows|col-span|row-span)-/ },
    { pattern: /^(place-items|place-content|place-self)-/ },
    { pattern: /^(overflow|overscroll)-/ },
    { pattern: /^(z|top|left|right|bottom|inset)-/ },
    { pattern: /^(opacity|shadow|shadow-[a-z0-9/]+)$/ },
    { pattern: /^(transition|duration|ease|delay|animate)-/ },
    { pattern: /^(scale|rotate|translate|skew)-/ },
    { pattern: /^(cursor|select|pointer-events)-/ },
    { pattern: /^(sr-only|not-sr-only)$/ },
    { pattern: /^(sm:|md:|lg:|xl:|2xl:)/ },
    { pattern: /^(hover:|focus:|active:|disabled:|group-hover:|aria-)/ },
  ],
  theme: {
    extend: {
      colors: {
        black: '#0B0B0B',
        charcoal: '#141414',
        gray700: '#4D4D4D',
        gray400: '#9A9A9A',
        sand: '#C7B299',
      },
      fontFamily: {
        sans: ['Oswald', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        none: '0',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.7s ease-out forwards',
        'fade-in-right': 'fadeInRight 0.7s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'slide-in-bottom': 'slideInBottom 0.6s ease-out forwards',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 1s linear infinite',
        'bounce-gentle': 'bounce 1s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInUp: {
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInLeft: {
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        fadeInRight: {
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        scaleIn: {
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        slideInBottom: {
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}


