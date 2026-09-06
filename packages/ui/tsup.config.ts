import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
  esbuildOptions(options) {
    options.alias = { "@": srcDir };
  },
});