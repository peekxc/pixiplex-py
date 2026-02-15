import { resolve } from "node:path";
import UnoCSS from "@unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [UnoCSS()],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: false,
    // cssCodeSplit: false,
    // rollupOptions: {
    //   output: {
    //     inlineDynamicImports: true,
    //     manualChunks: undefined,
    //   },
    // },
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
