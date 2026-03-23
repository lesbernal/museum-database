const db = require("../db");

module.exports = (req, res) => {

  // GET /events
  if (req.method === "GET") {
    db.query("SELECT * FROM event", (err, results) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify(err));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // POST /events
  else if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);

      const sql = `
        INSERT INTO event
        (gallery_id, event_name, description, event_date, capacity, member_only, total_attendees)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          data.gallery_id,
          data.event_name,
          data.description,
          data.event_date,
          data.capacity,
          data.member_only,
          data.total_attendees
        ],
        (err) => {
          if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify(err));
          }

          res.writeHead(201);
          res.end(JSON.stringify({ message: "Event added" }));
        }
      );
    });
  }
};