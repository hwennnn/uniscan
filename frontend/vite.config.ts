import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    base: "/",
    plugins: [react()],
    preview: {
      port: 5173,
      strictPort: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: {
        "/api": {
          target: process.env.BACKEND_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
      esbuild: {
        target: "esnext",
        platform: "linux",
      },
    },
  };
});
