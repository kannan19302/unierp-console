import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    alias: {
      '@': path.resolve(__dirname, './src/'),
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
