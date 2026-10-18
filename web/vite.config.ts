import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, las peticiones a /api se reenvían al servidor Express (puerto 3001),
// así el navegador no tiene problemas de CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { allow: [".."] }, // permite importar ../taxonomy.json de la raíz del repo
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        timeout: 200_000,
        proxyTimeout: 200_000,
      },
    },
  },
});