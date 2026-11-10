import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  envDir: path.resolve(__dirname, ".."),
  plugins: [react()],
  esbuild: {
    pure: ["console.log"],
    drop: ["debugger"],
  },
  build: {
    minify: "esbuild",
    outDir: "dist",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-utils": ["axios", "jwt-decode", "react-helmet-async"],
          "vendor-ui": [
            "radix-ui",
            "styled-components",
            "react-icons",
            "react-hot-toast",
            "react-loading-skeleton",
          ],
          "vendor-framer": ["framer-motion"],
          "vendor-mathlive": ["mathlive"],
          "vendor-markdown": [
            "react-markdown",
            "rehype-katex",
            "remark-math",
            "html-react-parser",
          ],
          "vendor-editor": ["slate", "slate-react", "slate-history"],
        },
      },
    },
  },
  server: {
    historyApiFallback: true,
    proxy: {
      "/api": {
        target: "http://localhost:7860",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  publicDir: "public",
  ssr: {
    noExternal: ["react-helmet-async"],
  },
  optimizeDeps: {
    exclude: ["fs", "path"], // Add any other Node-only libs
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "styled-components": path.resolve(
        __dirname,
        "./node_modules/styled-components",
      ),
    },
  },
});
