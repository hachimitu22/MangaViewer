const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '__tests__/large/e2e/playwright',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
});
