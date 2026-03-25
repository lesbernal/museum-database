const db = require("../db");

module.exports = (req, res, parsedUrl) => {

  // GET /giftshoptransactions
  if (req.method === "GET") {
    const sql = "SELECT * FROM giftshoptransaction";

    db.query(sql, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /giftshoptransactions
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const sql = `
        INSERT INTO giftshoptransaction
        (transaction_id, user_id, transaction_datetime, total_amount, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.transaction_id,
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
            message: "Gift shop transaction added",
            id: result.insertId
          }));
        }
      );
    });
  }

else if (req.method === "PUT" && parsedUrl.pathname.split("/")[2]) {
  const id = parsedUrl.pathname.split("/")[2];
  let body = "";

  req.on("data", chunk => {
    body += chunk.toString();
  });

  req.on("end", () => {
    const data = JSON.parse(body);

    const sql = `
      UPDATE giftshoptransaction
      SET user_id = ?, transaction_datetime = ?, total_amount = ?, payment_method = ?
      WHERE transaction_id = ?
    `;

    db.query(
      sql,
      [
        data.user_id,
        data.transaction_datetime,
        data.total_amount,
        data.payment_method,
        id
      ],
      (err) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(err));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Gift shop transaction updated" }));
      }
    );
  });
}

else if (req.method === "DELETE") {
  const id = parsedUrl.pathname.split("/")[2];

  const sql = "DELETE FROM giftshoptransaction WHERE transaction_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(err));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Gift shop transaction deleted"
    }));
  });
}


  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};
