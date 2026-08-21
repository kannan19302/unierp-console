import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Dedupe React across pnpm-linked local packages (@kannan19302/shared in
  // dev). Without this, Vite resolves react through the symlink's REAL path
  // and finds shared's own devDependency copy in shared/node_modules — a
  // second React instance whose hooks fail with "Cannot read properties of
  // null (reading 'useMemo')" the moment a linked component (e.g.
  // UniErpAuthProvider) renders here, because it ran on a different React
  // than the one this app's own components use. Harmless in production:
  // shared has no react dependency of its own there, only an optional peer
  // that resolves through the consuming app's tree either way.
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    // The actual fix: without this, Vite resolves the pnpm-link symlink to
    // its REAL path before doing node_modules lookups, landing in
    // shared/node_modules instead of this app's own. `dedupe` alone cannot
    // correct that — it only picks between two paths Vite's graph already
    // found, and by then the wrong one is already what got imported.
    preserveSymlinks: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    // @kannan19302/shared ships CommonJS. Vitest's default is to let a
    // dependency's CJS load through Node's own require() rather than Vite's
    // resolver — which has no concept of the aliases/dedupe/preserveSymlinks
    // above, so every one of those was silently bypassed for this package
    // specifically. Forcing it through Vite's pipeline (`inline`) is what
    // actually makes the alias apply.
    server: {
      deps: {
        inline: [/@kannan19302\/shared/],
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src/'),
      // Force every resolution of react/react-dom (including ones reached
      // through the pnpm-linked @kannan19302/shared) to this app's own copy.
      // dedupe/preserveSymlinks alone did not stop pnpm's `.pnpm` virtual
      // store from resolving shared's own devDependency install first — this
      // alias is the blunt but reliable fix.
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      // J02 — `all: true` so coverage counts untested source files and can
      // fail; thresholds set at the measured floor (ratchet may only rise).
      all: true,
      thresholds: {
        lines: 55,
        functions: 55,
        branches: 30,
        statements: 55,
      },
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/**/tests/**',
        'src/**/dto/**',
        'src/main.ts',
        'src/**/*.module.ts',
      ],
    },
  },
});
