import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo_app_inicio.png", "logo_lozio_app.jpg"],
      manifest: {
        id: "/",
        name: "Lo Zio - Auténtica Pizza Italiana",
        short_name: "Lo Zio",
        description: "Pizzeria Lo Zio: pizza artesanal italiana. Reserva mesa y haz pedidos.",
        theme_color: "#B5371B",
        background_color: "#f7f5f2",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "es",
        dir: "ltr",
        prefer_related_applications: false,
        icons: [
          {
            src: "logo_app_inicio.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo_app_inicio.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "logo_app_inicio.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,woff2}"],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
