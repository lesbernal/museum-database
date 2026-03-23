const db = require("../db");

module.exports = (req, res) => {

  // GET /giftshopitems
  if (req.method === "GET") {

    const sql = "SELECT * FROM giftshopitem";

    db.query(sql, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

  }

  // POST /giftshopitems
  else if (req.method === "POST") {

    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {

      const data = JSON.parse(body);

      const sql = `
        INSERT INTO giftshopitem
        (item_id, item_name, category, price, stock_quantity)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.item_id,
          data.item_name,
          data.category,
          data.price,
          data.stock_quantity
        ],
        (err, result) => {

          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(err));
          }

          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            message: "Gift shop item added",
            id: result.insertId
          }));

        }
      );

    });

  }

  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "Method not allowed"
    }));
  }

};