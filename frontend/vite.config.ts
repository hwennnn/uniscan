import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";

dotenv.config();

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
