const db = require("../db");

module.exports = (req, res, parsedUrl) => {

  // GET /cafetransactionitems
  if (req.method === "GET") {
    

    const sql = "SELECT * FROM cafetransactionitem";

    db.query(sql, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /cafetransactionitems
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const sql = `
        INSERT INTO cafetransactionitem
        (transaction_item_id, transaction_id, item_id, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.transaction_item_id,
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

else if (req.method === "DELETE") {
  const id = parsedUrl.pathname.split("/")[2];

  const sql = "DELETE FROM cafetransactionitem WHERE transaction_item_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(err));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Cafe transaction item deleted"
    }));
  });
}

  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};