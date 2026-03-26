const jwt = require('jsonwebtoken');
const SECRET_KEY = "your_secret_key";

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  console.log("🔑 authHeader:", authHeader ? authHeader.substring(0, 50) + "..." : "MISSING");
  
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  console.log("🔑 Token extracted, length:", token.length);
  
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    console.log("✅ Token verified - payload:", payload);
    return payload;
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return null;
  }
}

module.exports = { verifyToken };