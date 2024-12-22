import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    base: "/",
    plugins: [react()],
    preview: {
      host: true,
      open: true,
      port: 5174,
    },
    server: {
      host: true,
      open: true,
      port: 5173,
    },
    resolve: {
      alias: {
        src: "/src",
      },
    },
  };
});
