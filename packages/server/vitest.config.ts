import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test-setup.ts',
        '**/vitest.config.ts',
      ],
      all: true,
      clean: true,
      thresholds: {
        statements: 60.3,
        branches: 29.76,
        functions: 86.66,
        lines: 60.3,
      },
    },
  },
});
