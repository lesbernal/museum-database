const db = require("../db");

module.exports = (req, res) => {
  // GET /cafetransactions
  if (req.method === "GET") {

    const sql = "SELECT * FROM cafetransaction";
    db.query(sql, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /cafetransactions
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const sql = `
        INSERT INTO cafetransaction
        (cafe_transaction_id, user_id, transaction_datetime, total_amount, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `;


      db.query(
        sql,
        [
          data.cafe_transaction_id,
          data.user_id,
          data.transaction_datetime,
          data.total_amount,
          data.payment_method
        ],
        (err, result) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(err));
          }

          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            message: "Cafe transaction added",
            id: result.insertId
          }));
        }
      );
    });
  }

  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};