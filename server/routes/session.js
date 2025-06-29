const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const Session = require('../models/session');
const { v4: uuidv4 } = require('uuid');

async function createSessionWithRetry(req, retries = 5, delayMs = 100) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { title, language } = req.body;
      const sessionUuid = uuidv4();
      console.log(`POST /api/session: Attempt ${attempt} - Creating session`, { title, language, userId: req.userId, sessionUuid });

      if (!title || !language) {
        return { status: 400, data: { message: 'Title and language are required' } };
      }

      const session = new Session({
        sessionUuid,
        title,
        language,
        createdBy: req.userId,
        code: '',
        users: []
      });

      const savedSession = await session.save();
      console.log('POST /api/session: Session created', { _id: savedSession._id, sessionUuid: savedSession.sessionUuid });

      return {
        status: 201,
        data: {
          _id: savedSession._id,
          title: savedSession.title,
          language: savedSession.language
        }
      };
    } catch (error) {
      console.error(`POST /api/session: Attempt ${attempt} - Error creating session`, {
        message: error.message,
        code: error.code,
        name: error.name,
        sessionUuid
      });
      if (error.code === 11000 && attempt < retries) {
        console.log(`POST /api/session: Duplicate sessionUuid ${sessionUuid}, retrying (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      return {
        status: error.code === 11000 ? 400 : 500,
        data: { message: error.code === 11000 ? `Session UUID already exists: ${sessionUuid}` : 'Failed to create session: ' + error.message }
      };
    }
  }
  return { status: 500, data: { message: 'Failed to create session after multiple attempts' } };
}

// Create a new session (POST /api/session)
router.post('/', verifyJWT, async (req, res) => {
  const { status, data } = await createSessionWithRetry(req);
  res.status(status).json(data);
});

// Get session by ID (GET /api/session/:sessionId)
router.get('/:sessionId', verifyJWT, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('GET /api/session/:sessionId: Fetching session', sessionId);

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    console.log('GET /api/session/:sessionId: Session found', { _id: session._id });
    res.json({
      _id: session._id,
      title: session.title,
      language: session.language,
      code: session.code,
      users: session.users
    });
  } catch (error) {
    console.error('GET /api/session/:sessionId: Error fetching session', error);
    res.status(500).json({ message: 'Failed to get session: ' + error.message });
  }
});

// Save session code (PUT /api/session/:sessionId/code)
router.put('/:sessionId/code', verifyJWT, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;
    console.log('PUT /api/session/:sessionId/code: Saving code', { sessionId, userId: req.userId });

    if (typeof code !== 'string') {
      return res.status(400).json({ message: 'Code must be a string' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.code = code;
    session.lastActive = new Date();
    await session.save();

    console.log('PUT /api/session/:sessionId/code: Code saved', { _id: session._id });
    res.json({ message: 'Code saved successfully' });
  } catch (error) {
    console.error('PUT /api/session/:sessionId/code: Error saving code', error);
    res.status(500).json({ message: 'Failed to save code: ' + error.message });
  }
});

// Join a session (POST /api/session/:sessionId/join)
router.post('/:sessionId/join', verifyJWT, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name } = req.body;
    console.log('POST /api/session/:sessionId/join: Joining session', { sessionId, name, userId: req.userId });

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const userId = uuidv4();
    const userColor = getRandomColor();

    const newUser = {
      id: userId,
      name: name || 'Anonymous',
      color: userColor,
      active: true,
      lastActive: new Date()
    };

    // Prevent duplicate users (based on userId or name)
    const existingUser = session.users.find(u => u.id === userId || u.name === name);
    if (existingUser) {
      return res.status(400).json({ message: 'User already in session' });
    }

    session.users.push(newUser);
    session.lastActive = new Date();
    await session.save();

    console.log('POST /api/session/:sessionId/join: Session joined', { _id: session._id });
    res.json({
      _id: session._id,
      title: session.title,
      language: session.language,
      code: session.code,
      users: session.users
    });
  } catch (error) {
    console.error('POST /api/session/:sessionId/join: Error joining session', error);
    res.status(500).json({ message: 'Failed to join session: ' + error.message });
  }
});

// Leave a session (POST /api/session/:sessionId/leave)
router.post('/:sessionId/leave', verifyJWT, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    console.log('POST /api/session/:sessionId/leave: Leaving session', { sessionId, userId });

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const userIndex = session.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(400).json({ message: 'User not found in session' });
    }

    session.users[userIndex].active = false;
    session.lastActive = new Date();
    await session.save();

    console.log('POST /api/session/:sessionId/leave: Session updated', { _id: session._id });
    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/session/:sessionId/leave: Error leaving session', error);
    res.status(500).json({ message: 'Failed to leave session: ' + error.message });
  }
});

// Clear all sessions (DELETE /api/sessions)
router.delete('/', verifyJWT, async (req, res) => {
  try {
    console.log('DELETE /api/sessions: Clearing all sessions for user', req.userId);
    await Session.deleteMany({ createdBy: req.userId });
    console.log('DELETE /api/sessions: Sessions cleared');
    res.json({ message: 'All sessions cleared successfully' });
  } catch (error) {
    console.error('DELETE /api/sessions: Error clearing sessions', error);
    res.status(500).json({ message: 'Failed to clear sessions: ' + error.message });
  }
});

function getRandomColor() {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33F5',
    '#F5FF33', '#33FFF5', '#FF3333', '#33FF33'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = router;