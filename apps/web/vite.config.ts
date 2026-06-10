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
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envDir: "../../",
  server: {
    port: 3001,
    proxy: {
      "/api/uploads": {
        target: process.env.VITE_SERVER_URL || "http://localhost:3005",
        changeOrigin: true,
      },
      "/api/public": {
        target: process.env.VITE_SERVER_URL || "http://localhost:3005",
        changeOrigin: true,
      },
    },
  },
});
