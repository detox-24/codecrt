const express = require('express');
const axios = require('axios');
const router = express.Router();

// Judge0 API configuration
const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

// Execute code endpoint
router.post('/', async (req, res) => {
  try {
    const { sourceCode, languageId, stdin = '' } = req.body;
    
    // Create submission
    const createResponse = await axios({
      method: 'POST',
      url: `${JUDGE0_API_URL}`,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: {
        source_code: sourceCode,
        language_id: languageId,
        stdin,
        wait: true // Wait for the result
      }
    });
    
    const token = createResponse.data.token;
    
    // Get submission result
    const resultResponse = await axios({
      method: 'GET',
      url: `${JUDGE0_API_URL}/${token}`,
      headers: {
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      params: {
        base64_encoded: 'false',
        fields: 'stdout,stderr,status_id,status,time,memory'
      }
    });
    
    const result = resultResponse.data;
    
    // Format the response
    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      time: result.time,
      memory: result.memory,
      status: {
        id: result.status.id,
        description: result.status.description
      },
      token
    });
  } catch (error) {
    console.error('Error executing code:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error executing code',
      message: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;