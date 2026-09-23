import { defineConfig } from "vite";

export default defineConfig({
  // Allow WALLTRAVEL_* without VITE_ prefix (Phase 13 contract).
  envPrefix: ["VITE_", "WALLTRAVEL_"],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
