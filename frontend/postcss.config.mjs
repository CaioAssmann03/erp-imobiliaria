import zoomBreakpoints from "./lib/postcss/zoom-breakpoints.mjs";

// Depois do Tailwind: faz `sm:`/`md:`/`lg:`/`xl:` acompanharem o tamanho do texto (ver o plugin).
const config = {
  plugins: ["@tailwindcss/postcss", zoomBreakpoints],
};

export default config;
