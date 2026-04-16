const db = require("../db");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";

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

      console.log("Login attempt for email:", email);

      db.query(
        `SELECT u.*, 
          CASE 
            WHEN m.user_id IS NOT NULL AND m.expiration_date >= CURDATE() THEN 'member'
            ELSE u.role 
          END as role
         FROM user u
         LEFT JOIN member m ON u.user_id = m.user_id
         WHERE u.email = ?`,
        [email],
        (err, results) => {
          if (err) {
            console.error("Database error:", err);
            return sendError(res, err);
          }

          console.log("Query results:", results);

          const user = results[0];

          if (!user) {
            console.log("User not found");
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid credentials" }));
          }

          console.log("User found - ID:", user.user_id, "Role:", user.role);

          if (user.password !== password) {
            console.log("Password mismatch");
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid credentials" }));
          }

          const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            SECRET_KEY,
            { expiresIn: "1h" }
          );

          console.log("Sending response with role:", user.role);

          sendJSON(res, {
            token,
            user_id: user.user_id,
            role: user.role,
          });
        }
      );
    } catch (err) {
      console.error("Parse error:", err);
      sendError(res, err);
    }
  });
};

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res, err) {
  console.error("Auth error:", err);
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: err.message || err }));
}