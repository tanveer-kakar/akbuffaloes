import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/node_modules/recharts/") || id.includes("/node_modules/d3-")) return "charts-vendor";
          if (id.includes("/node_modules/jspdf") || id.includes("/node_modules/jspdf-autotable") || id.includes("/node_modules/html2canvas")) return "pdf-vendor";
          if (id.includes("/node_modules/@radix-ui/")) return "ui-vendor";
          if (id.includes("/node_modules/framer-motion/")) return "motion-vendor";
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/") || id.includes("/node_modules/scheduler/")) return "react-vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
