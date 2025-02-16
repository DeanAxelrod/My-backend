const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// Middleware to configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Environment variable for OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OpenAI API key is not set');
  process.exit(1);
}

app.post('/get-prompt', async (req, res) => {
  // Log the entire request body for debugging
  console.log('Received request body:', req.body);

  const { classification } = req.body;

  // More detailed error checking
  if (!classification) {
    console.error('Error: Classification is missing from request body');
    return res.status(400).json({ 
      error: 'Classification is required',
      details: 'The request body must include a "classification" field' 
    });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Translate this dog emotion or sound classification into a funny and very short human-like sentence: ${classification}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ prompt: response.data.choices[0].message.content });
  } catch (error) {
    // More comprehensive error logging
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(500).json({ 
      error: 'Failed to get prompt from OpenAI',
      details: error.response?.data || error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
