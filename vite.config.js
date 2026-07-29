import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { articleStudioVitePlugin } from "./server/articleStudioServer.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    articleStudioVitePlugin()
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js"
  }
});
