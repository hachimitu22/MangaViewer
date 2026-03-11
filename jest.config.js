module.exports = {
  projects: [
    {
      displayName: 'small',
      testMatch: ['<rootDir>/__tests__/small/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'middle',
      testMatch: ['<rootDir>/__tests__/middle/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/__tests__/e2e/**/*.test.js'],
      preset: "jest-puppeteer",
    },
  ],
}