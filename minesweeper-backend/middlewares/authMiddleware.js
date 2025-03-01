// minesweeper-backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing.' });
  }

  const token = authHeader.split(' ')[1]; // Bearer tokenHere

  if (!token) {
    return res.status(401).json({ message: 'Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};
