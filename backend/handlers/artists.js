const db = require("../db");

module.exports = (req, res) => {

  // GET /artists
  if (req.method === "GET") {
    db.query("SELECT * FROM artist", (err, results) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /artists
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const sql = `
        INSERT INTO artist
        (first_name, last_name, birth_year, death_year, nationality)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.first_name,
          data.last_name,
          data.birth_year,
          data.death_year,
          data.nationality
        ],
        (err) => {
          if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify(err));
          }

          res.writeHead(201);
          res.end(JSON.stringify({ message: "Artist added" }));
        }
      );
    });
  }
};