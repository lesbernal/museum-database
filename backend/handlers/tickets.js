const db = require("../db");

module.exports = (req, res) => {
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

      const sql = `
        INSERT INTO ticket
        (user_id, purchase_date, visit_date, ticket_type, base_price, discount_type, final_price, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      return db.query(sql,
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