// tailwind.config.js
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  // Where Tailwind should look for class names (Mustache, HTML, JS)
  content: [
    "./server/templates/**/*.{mustache,html}",
    "./public/**/*.{html,js}",
    "./dist/**/*.html",
  ],

  // Guard-rail: guarantee important tokens from the guide UI
  safelist: [
    // text colors
    "text-white", "text-zinc-300", "text-zinc-400",
    "text-emerald-400", "text-cyan-400", "text-yellow-300", "text-lime-300",
    // borders & surfaces
    "border", "border-white/10",
    "bg-white/5", "bg-black/70", "backdrop-blur-sm",
    "rounded-xl", "shadow-md",
    // gradients used in hero/backgrounds
    "bg-gradient-to-br", "bg-gradient-to-r",
    "from-[#101012]", "via-[#0c0d0e]", "to-[#08090a]",
    // card border accents used in the grid
    "border-lime-400/30", "border-emerald-400/30", "border-cyan-400/30", "border-yellow-300/30",
  ],

  theme: {
    extend: {
      // include the standard palette and make sure white exists as a token
      colors: {
        ...colors,
        white: "#ffffff",
      },
      // (Optional) you can extend fonts here if you import them globally
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   }
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.9s cubic-bezier(.22,1,.36,1) forwards',
      }
    },
  },

  plugins: [],
};
