module.exports = {
  projects: [
    {
      displayName: 'small',
      testMatch: ['<rootDir>/__tests__/small/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'medium',
      testMatch: ['<rootDir>/__tests__/medium/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/__tests__/e2e/**/*.test.js'],
      preset: "jest-puppeteer",
    },
  ],
}