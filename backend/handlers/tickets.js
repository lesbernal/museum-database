// backend/routes/tickets.js
const db = require("../db");

// Simple middleware to check user is "logged in"
function verifyUser(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;

  // Expect header: "Bearer <user_id>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  const userId = parts[1];
  return userId;
}

module.exports = (req, res) => {
  const userId = verifyUser(req);

  // GET /tickets
  if (req.method === "GET") {
    return db.query("SELECT * FROM ticket", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(results));
    });
  }

  // POST /tickets
  else if (req.method === "POST") {
    if (!userId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized. Please log in." }));
    }

    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });

    req.on("end", () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }

      // Override user_id from token/header
      data.user_id = userId;

      const sql = `
        INSERT INTO ticket
        (user_id, purchase_date, visit_date, ticket_type, base_price, discount_type, final_price, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.user_id,
          data.purchase_date,
          data.visit_date,
          data.ticket_type,
          data.base_price,
          data.discount_type,
          data.final_price,
          data.payment_method
        ],
        (err) => {
          if (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: err.sqlMessage }));
          }

          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Ticket added" }));
        }
      );
    });
  }

  // Method not allowed
  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};