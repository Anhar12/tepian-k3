import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({ autoCodeSplitting: true }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tepian K3",
        short_name: "Tepian K3",
        description: "Tepian K3 - PWA Application",
        theme_color: "#0c0c0c",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/health$/,
          /^\/healthz$/,
          /^\/trpc\//,
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
  },
});
