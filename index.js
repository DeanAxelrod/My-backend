const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 4000;

// Middleware to configure CORS
app.use(cors({
  origin: '*',  // Allow all origins. Change this to specific domains like 'https://x.thunkable.com' for added security.
  methods: ['GET', 'POST', 'OPTIONS'],  // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cache-Buster']  // Added X-Cache-Buster header
}));

app.use(express.json());

// Environment variable for OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OpenAI API key is not set');
  process.exit(1);
}

// Middleware for cache busting and request tracking
app.use((req, res, next) => {
  // Generate a unique request ID
  req.requestId = crypto.randomBytes(16).toString('hex');
  
  // Log incoming requests with unique ID
  console.log(`[${req.requestId}] ${req.method} ${req.path} - Timestamp: ${new Date().toISOString()}`);
  
  // Add cache-busting headers
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  // Optional: add a custom cache-buster header
  res.set('X-Request-ID', req.requestId);
  
  next();
});

app.post('/get-prompt', async (req, res) => {
  const { classification } = req.body;
  
  // Optional: use request ID for more detailed logging
  console.log(`[${req.requestId}] Processing classification: ${classification}`);
  
  try {
    // Generate a unique cache-busting parameter
    const cacheBuster = crypto.randomBytes(8).toString('hex');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Translate this dog emotion or sound classification into a funny and very short human-like sentence: ${classification} [CB:${cacheBuster}]`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Cache-Buster': cacheBuster
        },
        // Add a timeout to prevent hanging requests
        timeout: 10000 // 10 seconds
      }
    );
    
    // Include request ID and cache buster in response for tracking
    res.json({ 
      prompt: response.data.choices[0].message.content,
      requestId: req.requestId,
      cacheBuster: cacheBuster
    });
  } catch (error) {
    console.error(`[${req.requestId}] Error calling OpenAI API:`, error.message);
    res.status(500).json({ 
      error: 'Failed to get prompt from OpenAI',
      requestId: req.requestId
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
