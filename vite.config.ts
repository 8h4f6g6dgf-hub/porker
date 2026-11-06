import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  // GitHub Pages serves this repository below /porker/; Sites serves at /.
  base:
    process.env.VITE_BASE_PATH ||
    (process.env.GITHUB_PAGES === "true" ? "/porker/" : "/"),
  plugins: [react(), tailwindcss()],
  test: {
    include: ["src/tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    css: false,
  },
});
