const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { startServer: startYjsServer } = require('./yjs-server');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = 'mongodb+srv://sathiyamoorthithuran:SAthya%402004@codecrt.xwumw9b.mongodb.net/?retryWrites=true&w=majority&appName=codecrt'
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in .env');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware to verify JWT
const verifyJWT = (req, res, next) => {
  const cookies = require('cookie').parse(req.headers.cookie || '');
  const token = cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Express config
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
const executeRoutes = require('./routes/execute');
const sessionRoutes = require('./routes/session');

app.use('/api/execute', verifyJWT, executeRoutes);
app.use('/api/session', verifyJWT, sessionRoutes);

// Get User Profile
app.get('/api/user', verifyJWT, async (req, res) => {
  try {
    console.log('GET /api/user: Fetching user', req.userId);
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('GET /api/user: Error fetching user', error);
    res.status(500).json({ message: 'Server error fetching user: ' + error.message });
  }
});

// Update User Profile
app.put('/api/user', verifyJWT, async (req, res) => {
  try {
    const { firstName, lastName, email, birthDate } = req.body;
    console.log('PUT /api/user: Updating user', { userId: req.userId, firstName, lastName, email });
    if (!firstName || !lastName || !email || !birthDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { firstName, lastName, email, birthDate },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('PUT /api/user: Error updating user', error);
    res.status(500).json({ message: 'Server error updating user: ' + error.message });
  }
});

// Delete User Profile
app.delete('/api/user', verifyJWT, async (req, res) => {
  try {
    console.log('DELETE /api/user: Deleting user', req.userId);
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'strict' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/user: Error deleting user', error);
    res.status(500).json({ message: 'Server error deleting user: ' + error.message });
  }
});

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, birthDate, password } = req.body;
    console.log('POST /api/signup: Creating user', { firstName, lastName, email });
    if (!firstName || !lastName || !email || !birthDate || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ firstName, lastName, email, birthDate, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 3600000 });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('POST /api/signup: Error during signup', error);
    res.status(500).json({ message: 'Server error during signup: ' + error.message });
  }
});

// Signin Endpoint
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('POST /api/signin: Signing in', { email });
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 3600000 });
    res.status(200).json({ message: 'Signin successful' });
  } catch (error) {
    console.error('POST /api/signin: Error during signin', error);
    res.status(500).json({ message: 'Server error during signin: ' + error.message });
  }
});

// Verify Token Endpoint
app.get('/api/auth/verify', verifyJWT, (req, res) => {
  console.log('GET /api/auth/verify: Token verified', req.userId);
  res.status(200).json({ valid: true, userId: req.userId });
});

// Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
  console.log('POST /api/auth/logout: Logging out');
  res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'strict' });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Root route
app.get('/', (req, res) => {
  console.log('GET /: Root route accessed');
  res.send('CodeCRT backend live!');
});

// Global error middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  res.status(500).json({ message: 'Internal server error: ' + err.message });
});

// Start Yjs server
startYjsServer(server);

// Start the server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));