const db = require("../db");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key"; // You can also put this in .env

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", chunk => (body += chunk.toString()));
  req.on("end", async () => {
    try {
      const { email, password } = JSON.parse(body);

      db.query(
        "SELECT * FROM user WHERE email = ?",
        [email],
        (err, results) => {
          if (err) return sendError(res, err);
          const user = results[0];

          if (!user || user.password !== password) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid credentials" }));
          }

          const token = jwt.sign(
            { user_id: user.user_id, role: user.role || "visitor" },
            SECRET_KEY,
            { expiresIn: "1h" }
          );

          sendJSON(res, { token });
        }
      );
    } catch (err) {
      sendError(res, err);
    }
  });
};

// Helpers (same style as artists.js)
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res, err) {
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: err.message || err }));
}