const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// Configure CORS with more specific options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or postman)
    if (!origin || 
        origin === 'null' || 
        origin.includes('localhost') || 
        origin.includes('thunkable.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Environment variable for OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OpenAI API key is not set');
  process.exit(1);
}

app.post('/get-prompt', async (req, res) => {
  // Log incoming request for debugging
  console.log('Received classification request:', req.body);

  const { classification } = req.body;

  // Validate classification
  if (!classification) {
    return res.status(400).json({ 
      error: 'Classification is required',
      details: 'Please provide a valid dog sound/emotion classification'
    });
  }

  try {
    // Call OpenAI API to generate prompt
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
        max_tokens: 50, // Limit response length
        temperature: 0.7, // Add some creativity
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      }
    );

    // Extract and send the generated prompt
    const generatedPrompt = response.data.choices[0].message.content.trim();
    
    // Log generated prompt for debugging
    console.log('Generated Prompt:', generatedPrompt);

    res.json({ 
      prompt: generatedPrompt,
      classification: classification
    });

  } catch (error) {
    // Comprehensive error logging
    console.error('Error in prompt generation:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Send appropriate error response
    if (error.response) {
      // The request was made and the server responded with a status code
      res.status(error.response.status).json({
        error: 'OpenAI API Error',
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(504).json({
        error: 'No response from OpenAI',
        details: 'The API did not respond in time'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: 'Prompt Generation Failed',
        details: error.message
      });
    }
  }
});

// Handle preflight requests for CORS
app.options('/get-prompt', cors(corsOptions));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
