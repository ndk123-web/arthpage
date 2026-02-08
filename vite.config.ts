import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import tailwindcss from '@tailwindcss/vite'
import path from "path";


// here added your Vite config with the crx plugin 
// crx plugin will read the manifest file and bundle your extension accordingly

// what crx does ?
  // it tells the vite that build a chrome extension not a regular web app
export default defineConfig({
  plugins: [react(), crx({ manifest }), tailwindcss(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

});
