const db = require("../db");

module.exports = (req, res) => {
  // GET /events
  if (req.method === "GET") {
    return db.query("SELECT * FROM event", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(results));
    });
  }

  // POST /events
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
        INSERT INTO event
        (gallery_id, event_name, description, event_date, capacity, member_only, total_attendees)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      return db.query(sql,
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
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: err.sqlMessage }));
          }

          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Event added" }));
        }
      );
    });
  }

  // Method not allowed
  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};