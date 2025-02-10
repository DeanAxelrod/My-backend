const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000; // Use the environment variable for the port

// Middleware to configure CORS
app.use(cors({
  origin: '*',  // Allow all origins. Change this to specific domains like 'https://x.thunkable.com' for added security.
  methods: ['GET', 'POST', 'OPTIONS'],  // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization']  // Allow these headers
}));

app.use(express.json());

// Environment variable for OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OpenAI API key is not set');
  process.exit(1);
}

app.post('/get-prompt', async (req, res) => {
  const { classification } = req.body;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Translate this dog emotion or sound classification into a funny short human-like sentence: ${classification}`,
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
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to get prompt from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
