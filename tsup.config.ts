import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'api/index': 'src/api/index.ts',
    'db/index': 'src/db/index.ts',
    'module/index': 'src/module/index.ts',
    'connector/index': 'src/connector/index.ts',
    types: 'src/types.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  outDir: 'dist',
});
