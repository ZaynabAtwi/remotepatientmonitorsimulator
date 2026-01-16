module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f2f7fb",
          100: "#e0eef8",
          200: "#b9daf0",
          300: "#88bde6",
          400: "#5e9dd8",
          500: "#3b7ac6",
          600: "#2f5ea4",
          700: "#264a82",
          800: "#1f3b66",
          900: "#192f4f"
        },
        success: "#2aa775",
        warning: "#f0b429",
        critical: "#e04f4f"
      }
    }
  },
  plugins: []
};
