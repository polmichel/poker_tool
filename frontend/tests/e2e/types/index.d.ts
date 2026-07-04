/**
 * Type declarations for Playwright tests
 */

// Extend Playwright test with custom fixtures if needed
declare module '@playwright/test' {
  // Add custom fixtures here if needed
  // Example:
  // interface TestFixtures {
  //   customFixture: CustomFixture;
  // }
}

// Global test types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BASE_URL: string;
      TEST_USER_EMAIL?: string;
      TEST_USER_PASSWORD?: string;
      CI?: string;
    }
  }
}
