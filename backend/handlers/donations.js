const db = require("../db");

module.exports = (req, res) => {

  // GET /donations
  if (req.method === "GET") {
    db.query("SELECT * FROM donation", (err, results) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /donations
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const sql = `
        INSERT INTO donation
        (user_id, donation_date, amount, donation_type)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.user_id,
          data.donation_date,
          data.amount,
          data.donation_type
        ],
        (err) => {
          if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify(err));
          }

          res.writeHead(201);
          res.end(JSON.stringify({ message: "Donation added" }));
        }
      );
    });
  }
};