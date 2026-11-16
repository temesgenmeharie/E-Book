import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@backend": path.resolve(__dirname, "./src/backend"),
      "@frontend": path.resolve(__dirname, "./src/frontend"),
      "@database": path.resolve(__dirname, "./src/database"),
    },
  },
});

