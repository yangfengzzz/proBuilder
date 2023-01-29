import reactRefresh from "@vitejs/plugin-react-refresh";
import { defineConfig } from "vite";
import packageJson from "./package.json";
import { replaceCodePlugin } from "vite-plugin-replace";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRefresh(),
    replaceCodePlugin({
      replacements: [
        {
          from: "__ProjectVersion",
          to: packageJson.version
        }
      ]
    })
  ],
  resolve: {
    dedupe: ["oasis-engine"]
  },
  optimizeDeps: {
    exclude: [
      "oasis-engine",
      "@oasis-engine/core",
      "@oasis-engine/math",
      "@oasis-engine/rhi-webgl",
      "@oasis-engine/loader",
      "@oasis-engine/physics-physx"
    ]
  },
  build: {
    minify: false,
    target: "ios13"
    // lib: {
    //   entry: "./main.tsx",
    //   /**
    //    * The name of the exposed global variable. Required when the `formats` option includes
    //    * `umd` or `iife`
    //    */
    //   name: "OasisLib",
    //   formats: ["es", "umd"],
    // },
  }
});
