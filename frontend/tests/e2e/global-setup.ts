import { chromium, FullConfig } from '@playwright/test';
import axios from 'axios';

/**
 * Global setup for Playwright tests
 * This file is used to:
 * 1. Start the backend server (if not already running)
 * 2. Create test data (user, ranges) in the database
 * 3. Perform authentication if needed
 */

const API_BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');
  
  try {
    // Wait for backend to be ready
    console.log('Waiting for backend to be ready...');
    const maxRetries = 30;
    const retryDelay = 1000; // 1 second
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        if (response.status === 200) {
          console.log('Backend is ready!');
          break;
        }
      } catch (err) {
        if (i === maxRetries - 1) {
          console.error('Backend did not start in time');
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // Create test user
    console.log('Creating test user...');
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
      });
      console.log('Test user created or already exists');
    } catch (err) {
      // User might already exist, that's fine
      console.log('Test user already exists');
    }
    
    // Create test range with hands
    console.log('Creating test range...');
    try {
      const rangeResponse = await axios.post(`${API_BASE_URL}/ranges/`, {
        name: 'Test Range E2E',
        description: 'Range de test pour E2E',
        range_type: 'preflop',
        position: 'BTN',
        hands: {
          'AA': 'raise',
          'KK': 'raise',
          'QQ': 'raise',
          'AKs': 'raise',
          'JJ': 'call',
          'TT': 'call',
          'AQs': 'raise',
          'KQs': 'call',
        },
        user_id: 1,
      });
      console.log(`Test range created: ID=${rangeResponse.data.id}`);
    } catch (err) {
      // Range might already exist, that's fine
      console.log('Test range already exists');
    }
    
    // List ranges to verify
    try {
      const rangesResponse = await axios.get(`${API_BASE_URL}/ranges/`);
      console.log(`Found ${rangesResponse.data.length} ranges in database`);
      rangesResponse.data.forEach((r: any) => {
        console.log(`  - ${r.name} (ID=${r.id}, hands=${Object.keys(r.hands || {}).length})`);
      });
    } catch (err) {
      console.error('Could not list ranges:', err);
    }
    
    // Save storage state if authentication is needed
    // const browser = await chromium.launch();
    // const page = await browser.newPage();
    // await page.goto('/login');
    // await page.fill('input[name="email"]', 'test@test.com');
    // await page.fill('input[name="password"]', 'password123');
    // await page.click('button[type="submit"]');
    // await page.context().storageState({ path: 'storageState.json' });
    // await browser.close();
    
    console.log('Global setup completed!');
}

export default globalSetup;
