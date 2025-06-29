const jwt = require('jsonwebtoken');
const cookie = require('cookie');

module.exports = (req, res, next) => {
  try {
    console.log('verifyJWT: Checking token for', req.method, req.path);
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      console.warn('verifyJWT: No token provided');
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('verifyJWT: Token verified, userId:', decoded.userId);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('verifyJWT: Error verifying token', {
      message: error.message,
      path: req.path,
      method: req.method
    });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};