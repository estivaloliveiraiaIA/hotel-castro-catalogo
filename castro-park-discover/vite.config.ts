import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages publishes under /<repo>/
  // Keep local/dev builds at /, but set the correct base when running in GitHub Actions.
  base: process.env.GITHUB_ACTIONS ? "/hotel-castro-catalogo/" : "/",

  // Used to cache-bust places.json on deploy.
  define: {
    __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA || Date.now().toString()),
  },

  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
