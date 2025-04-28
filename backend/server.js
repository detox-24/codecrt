const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { setupWSConnection } = require('y-websocket/bin/utils');
const axios = require('axios');
const cors = require('cors');

require('dotenv').config(); // Add this to load .env

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST'],
}));

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
});

// Yjs CRDT sync on /yjs
io.of('/yjs').on('connection', (socket) => {
  setupWSConnection(socket, socket.request);
  console.log('Yjs client connected via /yjs');
});

// Run results on default namespace
io.of('/').on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);
  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

// Judge0 Language Mapping
const languageMap = {
  javascript: 63, // Node.js 12.14.0
  python: 71,     // Python 3.8.1
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
};

app.use(express.json());
app.post('/run', async (req, res) => {
  const { code, language, input = '' } = req.body;

  // Map language to Judge0 language ID
  const languageId = languageMap[language];
  if (!languageId) {
    io.of('/').emit('runResult', { output: 'Unsupported language' });
    return res.status(400).json({ output: 'Unsupported language' });
  }

  try {
    // Step 1: Submit code to Judge0 (RapidAPI)
    const submissionResponse = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions',
      {
        source_code: code,
        language_id: languageId,
        stdin: input, // Use the input from the request
        expected_output: null,
        base64_encoded: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        params: { wait: false }, // Get token, poll later
      }
    );

    const token = submissionResponse.data.token;
    if (!token) throw new Error('No submission token received');

    // Step 2: Poll for result
    let result;
    for (let i = 0; i < 10; i++) { // Poll up to 10 times
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      const statusResponse = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
          params: { base64_encoded: false, fields: 'stdout,stderr,status' },
        }
      );

      const status = statusResponse.data.status?.id;
      if (status >= 3) { // 3+ means processed (success, error, etc.)
        result = statusResponse.data;
        break;
      }
    }

    if (!result) throw new Error('Timeout waiting for Judge0 result');

    // Step 3: Format output
    let output = '';
    if (result.stdout) output = result.stdout;
    else if (result.stderr) output = `Error: ${result.stderr}`;
    else output = `Status: ${result.status?.description || 'Unknown error'}`;

    // Broadcast result to all clients
    io.of('/').emit('runResult', { output });
    res.json({ output });

  } catch (err) {
    const errorMsg = `Judge0 error: ${err.message}`;
    io.of('/').emit('runResult', { output: errorMsg });
    res.status(500).json({ output: errorMsg });
  }
});

app.get('/', (req, res) => res.send('CodeCRT backend live!'));
server.listen(3000, () => console.log('Server on port 3000'));