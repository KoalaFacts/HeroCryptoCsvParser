import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/tax': resolve(__dirname, 'src/tax'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/core': resolve(__dirname, 'src/core'),
      '@/sources': resolve(__dirname, 'src/sources'),
      '@tests': resolve(__dirname, 'tests'),
      '@specs': resolve(__dirname, 'specs')
    }
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.ts',
        '**/*.d.ts',
        '**/index.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        branches: 60,
        functions: 50,
        lines: 60,
        statements: 60
      }
    }
  }
});