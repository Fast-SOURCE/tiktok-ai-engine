import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // IMPORTANT: Must come BEFORE the '@' alias to intercept @/lib/trpc imports
      {
        find: /^.*\/lib\/trpc$/,
        replacement: path.resolve(__dirname, "client/src/lib/trpc.mock.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "client/src"),
      },
      {
        find: "@shared",
        replacement: path.resolve(__dirname, "shared"),
      },
    ],
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
