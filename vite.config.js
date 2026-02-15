import { resolve } from "node:path";
import UnoCSS from "@unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname, "demo"),
  plugins: [UnoCSS()],
  build: {
    outDir: resolve(__dirname, "demo/dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
