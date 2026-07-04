/**
 * Simple test server for Playwright E2E tests
 * This server mocks the main routes of the poker_tool application
 * to allow tests to run without a full React development server
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, '../../build')));

// Mock API routes
app.get('/api/ranges', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Test Range',
      description: 'A test range for E2E testing',
      range_type: 'preflop',
      position: 'BTN',
      hands: {
        'AA': 'raise',
        'KK': 'raise',
        'QQ': 'open',
        'AKs': 'open',
        'AKo': 'call',
        'JJ': 'fold',
      },
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Tight Range',
      description: 'A tight range for testing',
      range_type: 'preflop',
      position: 'UTG',
      hands: {
        'AA': 'raise',
        'KK': 'raise',
        'AKs': 'open',
      },
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
});

app.get('/api/ranges/:id', (req, res) => {
  const rangeId = parseInt(req.params.id);
  if (rangeId === 1) {
    res.json({
      id: 1,
      name: 'Test Range',
      description: 'A test range for E2E testing',
      range_type: 'preflop',
      position: 'BTN',
      hands: {
        'AA': 'raise',
        'KK': 'raise',
        'QQ': 'open',
        'AKs': 'open',
        'AKo': 'call',
        'JJ': 'fold',
      },
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    res.status(404).json({ error: 'Range not found' });
  }
});

// Mock training modes
app.get('/api/training/modes', (req, res) => {
  res.json([
    { id: 'fill', name: 'Remplir', description: 'Remplir les actions pour chaque main' },
    { id: 'guess', name: 'Deviner', description: 'Deviner si une main fait partie de la range' },
    { id: 'complete', name: 'Compléter', description: 'Compléter une range partielle' },
  ]);
});

// Mock training session creation
app.post('/api/training/sessions', (req, res) => {
  res.json({
    id: 1,
    user_id: 1,
    range_id: 1,
    mode: 'fill',
    score: 0,
    total_questions: 10,
    correct_answers: 0,
    time_spent: 0,
    details: {
      questions: [],
      current_question: 0,
      start_time: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  });
});

// Mock next question
app.post('/api/training/sessions/:id/next', (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { answer } = req.body;
  
  // Simple mock: return a question
  res.json({
    id: sessionId,
    current_question: {
      type: 'fill',
      hand: 'AA',
      question: 'Quelle action pour AA ?',
      correct_answer: 'raise',
    },
    score: answer === 'raise' ? 100 : 0,
    sessionComplete: false,
  });
});

// Mock session end
app.post('/api/training/sessions/:id/end', (req, res) => {
  res.json({
    id: parseInt(req.params.id),
    score: 85,
    total_questions: 10,
    correct_answers: 8,
    time_spent: 120,
    sessionComplete: true,
  });
});

// Mock stats
app.get('/api/stats', (req, res) => {
  res.json({
    total_ranges: 2,
    total_training_sessions: 5,
    avg_score: 82.5,
    total_time_spent: 600,
  });
});

// Mock login (if needed)
app.post('/api/login', (req, res) => {
  res.json({
    access_token: 'mock-token',
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    },
  });
});

// Mock user info
app.get('/api/me', (req, res) => {
  res.json({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  });
});

// Fallback: serve index.html for all other routes (for React Router)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../../build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

module.exports = app;
