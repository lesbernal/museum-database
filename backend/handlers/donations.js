const db = require("../db");

function verifyUser(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

module.exports = (req, res, parsedUrl) => {
  const userId = verifyUser(req);

  // GET /donations or GET /donations?user_id=X
  if (req.method === "GET") {
    const filterUserId = parsedUrl.query?.user_id;

    const sql = filterUserId
      ? "SELECT * FROM donation WHERE user_id = ? ORDER BY donation_date DESC"
      : "SELECT * FROM donation";

    const params = filterUserId ? [filterUserId] : [];

    return db.query(sql, params, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(results));
    });
  }

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

      data.user_id = userId;

      const sql = `
        INSERT INTO donation (user_id, donation_date, amount, donation_type)
        VALUES (?, ?, ?, ?)
      `;

      db.query(sql, [
        data.user_id,
        data.donation_date,
        data.amount,
        data.donation_type
      ], (err) => {
        if (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: err.sqlMessage }));
        }
        res.writeHead(201, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Donation added" }));
      });
    });
  }

  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};