/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './__tests__/large/e2e',
  fullyParallel: true,
  workers: process.env.CI ? '50%' : undefined,
  timeout: 60_000,
  use: {
    headless: true,
  },
};
