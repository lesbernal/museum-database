const db = require("../db");

module.exports = (req, res) => {
  if (req.method === "GET") {
    return db.query("SELECT * FROM donation", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(results));
    });
  }

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
        INSERT INTO donation (user_id, donation_date, amount, donation_type)
        VALUES (?, ?, ?, ?)
      `;

      return db.query(sql,
        [data.user_id, data.donation_date, data.amount, data.donation_type],
        (err) => {
          if (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: err.sqlMessage }));
          }

          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Donation added" }));
        }
      );
    });
  }

  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};