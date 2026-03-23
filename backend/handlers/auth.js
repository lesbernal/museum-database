const db = require("../db");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key"; // You can also put this in .env

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", chunk => body += chunk.toString());
  req.on("end", async () => {
    try {
      const { email, password } = JSON.parse(body);
      const [rows] = await db.promise().query("SELECT * FROM user WHERE email = ?", [email]);
      const user = rows[0];

      if (!user || user.password !== password) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid credentials" }));
      }

      // create JWT
      const token = jwt.sign({ user_id: user.user_id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ token }));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
  });
}

module.exports = handleLogin;