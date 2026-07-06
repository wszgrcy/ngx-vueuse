// Learn more about Vitest configuration options at https://vitest.dev/config/

import { resolve } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // bail: 1,
    clearMocks: true,
    fileParallelism: true,
    name: 'browser',
    // include: ['projects/**/*.browser.spec.ts'],
    browser: {
      enabled: true,
      provider: playwright({
        contextOptions: {
          locale: 'en-US',
          timezoneId: 'UTC',
        },
      }),
      headless: true,
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
    setupFiles: ['vitest.setup.ts'],
  },
});
