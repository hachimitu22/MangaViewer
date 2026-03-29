/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './__tests__/large/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    headless: true,
  },
};
