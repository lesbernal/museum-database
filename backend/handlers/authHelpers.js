const jwt = require('jsonwebtoken');
const SECRET_KEY = "your_secret_key"; // same as auth.js

function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    return payload; // { user_id, role, iat, exp }
  } catch {
    return null;
  }
}

module.exports = { verifyToken };