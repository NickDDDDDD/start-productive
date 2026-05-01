import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("exceljs")) return "vendor-excel";
          if (id.includes("@arco-design")) return "vendor-arco";
          if (
            id.includes("vue") ||
            id.includes("pinia") ||
            id.includes("@vue")
          ) {
            return "vendor-vue";
          }
          return "vendor";
        },
      },
    },
  },
});
