const db = require("../db");

module.exports = (req, res) => {
  // GET /giftshoptransactionitems
  if (req.method === "GET") {
    

    const sql = "SELECT * FROM giftshoptransactionitem";

    db.query(sql, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /giftshoptransactionitems
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const sql = `
        INSERT INTO giftshoptransactionitem
        (transaction_id, item_id, quantity, subtotal)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.transaction_id,
          data.item_id,
          data.quantity,
          data.subtotal
        ],
        (err, result) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(err));
          }

          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            message: "Cafe transaction item added",
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