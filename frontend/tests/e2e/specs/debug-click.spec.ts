import { test, expect } from '@playwright/test';

test('debug: click register button step by step', async ({ page }) => {
  const consoleMsgs: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', msg => consoleMsgs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto('http://localhost:3000/register');
  await page.waitForTimeout(2000);

  // Check overlay
  const overlay = page.locator('#webpack-dev-server-client-overlay');
  console.log('OVERLAY:', await overlay.count());
  if (await overlay.count() > 0) {
    const frame = overlay.contentFrame();
    if (frame) console.log('OVERLAY_CONTENT:', (await frame.locator('body').textContent())?.substring(0, 500));
  }

  // Fill form
  await page.fill('[data-testid="register-username"]', 'clicktest');
  await page.fill('[data-testid="register-email"]', 'clicktest@test.com');
  await page.fill('[data-testid="register-password"]', 'password123');
  
  // Check button state before click
  const btn = page.locator('[data-testid="register-submit"]');
  console.log('BTN_DISABLED:', await btn.isDisabled());
  console.log('BTN_TEXT:', await btn.textContent());

  // Click and capture network
  const requests: string[] = [];
  const responses: {url: string; status: number}[] = [];
  page.on('request', req => { if (req.url().includes('/api/')) requests.push(`${req.method()} ${req.url()}`); });
  page.on('response', res => { if (res.url().includes('/api/')) responses.push({url: res.url(), status: res.status()}); });

  await btn.click();
  await page.waitForTimeout(5000);

  console.log('URL_AFTER_CLICK:', page.url());
  console.log('REQUESTS:', JSON.stringify(requests));
  console.log('RESPONSES:', JSON.stringify(responses));
  console.log('CONSOLE:', JSON.stringify(consoleMsgs.slice(-5)));
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors));

  // Check for error alert
  const alert = page.locator('[role="alert"]');
  if (await alert.count() > 0) {
    console.log('ALERT:', await alert.textContent());
  }

  // Check if still on register page
  const usernameInput = page.locator('[data-testid="register-username"]');
  console.log('STILL_ON_REGISTER:', await usernameInput.count());
});
