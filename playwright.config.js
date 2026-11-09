const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, // Booking.com may throttle parallel sessions
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['allure-playwright']],
  use: {
    baseURL: 'https://www.booking.com',
    browserName: 'chromium',
    headless: false,
    locale: 'en-GB',
    timezoneId: 'Asia/Calcutta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    launchOptions: { args: ['--disable-blink-features=AutomationControlled'] }
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
