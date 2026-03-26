const db = require("../db");

function verifyUser(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

module.exports = (req, res, parsedUrl) => {
  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  const eventId = parts[1];

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
  else if (req.method === "POST" && !eventId) {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      let data;
      try { data = JSON.parse(body); }
      catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }

      const sql = `
        INSERT INTO event
        (gallery_id, event_name, description, event_date, capacity, member_only, total_attendees)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      return db.query(sql,
        [data.gallery_id, data.event_name, data.description, data.event_date, data.capacity, data.member_only, data.total_attendees],
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

  // PATCH /events/:id — signup with quantity
  else if (req.method === "PATCH" && eventId) {
    const userId = verifyUser(req);

    if (!userId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "You must be logged in to sign up." }));
    }

    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      let data;
      try { data = JSON.parse(body); }
      catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }

      const quantity = parseInt(data.quantity) || 1;

      // Check event exists and has enough spots
      db.query("SELECT capacity, total_attendees FROM event WHERE event_id = ?", [eventId], (err, results) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: err.sqlMessage }));
        }

        if (results.length === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Event not found." }));
        }

        const event = results[0];
        const spotsLeft = event.capacity - event.total_attendees;

        // Check if enough spots for requested quantity
        if (quantity > spotsLeft) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({
            error: spotsLeft === 0
              ? "This event is fully booked."
              : `Only ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining.`
          }));
        }

        // Increment total_attendees by quantity
        db.query(
          "UPDATE event SET total_attendees = total_attendees + ? WHERE event_id = ?",
          [quantity, eventId],
          (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: err.sqlMessage }));
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: `Successfully signed up ${quantity} attendee${quantity !== 1 ? "s" : ""}!` }));
          }
        );
      });
    });
  }

  // Method not allowed
  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};