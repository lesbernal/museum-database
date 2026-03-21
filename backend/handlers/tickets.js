//ticket

const db = require("../db");

module.exports = (req, res) => {

  // GET /tickets
  if (req.method === "GET") {
    db.query("SELECT * FROM ticket", (err, results) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /tickets
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

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
            res.writeHead(500);
            return res.end(JSON.stringify(err));
          }

          res.writeHead(201);
          res.end(JSON.stringify({ message: "Ticket added" }));
        }
      );
    });
  }
};