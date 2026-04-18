// handlers/tickets.js

const db = require("../db");

function verifyUser(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

module.exports = (req, res, parsedUrl) => {
  const authValue = verifyUser(req);

  // ── GET /tickets or GET /tickets?user_id=X ────────────────────────────────
  if (req.method === "GET") {
    const filterUserId = parsedUrl.query?.user_id;
    const sql    = filterUserId
      ? "SELECT * FROM ticket WHERE user_id = ? ORDER BY purchase_date DESC, ticket_id DESC"
      : "SELECT * FROM ticket ORDER BY purchase_date DESC, ticket_id DESC";
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

  // ── POST /tickets ─────────────────────────────────────────────────────────
  else if (req.method === "POST") {
    if (!authValue) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized. Please log in." }));
    }

    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });

    req.on("end", () => {
      let data;
      try { data = JSON.parse(body); }
      catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }

      // Use user_id from body (sent by frontend), not the raw auth token
      const userId = data.user_id || authValue;

      // ── Map discount label to the enum values the DB accepts ──────────────
      // DB enum: 'None','Student','Military','Member'
      // Frontend sends strings like "Member - Gold (1 free admission)" or "None"
      let discountType = "None";
      const rawDiscount = (data.discount_type || "").toLowerCase();
      if (rawDiscount.includes("member")) discountType = "Member";
      else if (rawDiscount.includes("student")) discountType = "Student";
      else if (rawDiscount.includes("military")) discountType = "Military";

      const sql = `
        INSERT INTO ticket
        (user_id, purchase_date, visit_date, ticket_type, base_price, discount_type, final_price, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(sql, [
        userId,
        data.purchase_date,
        data.visit_date,
        data.ticket_type,
        data.base_price,
        discountType,
        data.final_price,
        data.payment_method || "Credit Card",
      ], (err) => {
        if (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: err.sqlMessage || err.message }));
        }

        // ── Update visitor's total_visits and last_visit_date ─────────────
        // The visitor table tracks visits. We count distinct visit_dates from tickets
        // where visit_date <= today to get an accurate count.
        const today = new Date().toISOString().slice(0, 10);
        db.query(
          `SELECT COUNT(DISTINCT visit_date) AS cnt, MAX(visit_date) AS last_visit
           FROM ticket
           WHERE user_id = ? AND visit_date <= ?`,
          [userId, today],
          (err2, countRows) => {
            if (err2 || !countRows?.length) {
              // Non-fatal: ticket was saved, just couldn't update visitor stats
              res.writeHead(201, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ message: "Ticket added" }));
            }

            const totalVisits = countRows[0].cnt || 0;
            const lastVisit   = countRows[0].last_visit || today;

            db.query(
              `UPDATE visitor SET total_visits = ?, last_visit_date = ? WHERE user_id = ?`,
              [totalVisits, lastVisit, userId],
              (err3) => {
                // Non-fatal
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Ticket added" }));
              }
            );
          }
        );
      });
    });
  }

  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};