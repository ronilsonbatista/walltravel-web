import { defineConfig } from "vite";

export default defineConfig({
  // Allow WALLTRAVEL_* without VITE_ prefix (Phase 13 contract).
  envPrefix: ["VITE_", "WALLTRAVEL_"],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
