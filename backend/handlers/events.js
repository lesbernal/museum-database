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
  const action  = parts[2];

  // GET /events/archived
  if (req.method === "GET" && eventId === "archived") {
    return db.query("SELECT * FROM event WHERE is_active = 0", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(results));
    });
  }

  // GET /events — only active
  if (req.method === "GET") {
    return db.query("SELECT * FROM event WHERE is_active = 1", (err, results) => {
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
        [data.gallery_id, data.event_name, data.description, data.event_date, data.capacity, data.member_only, data.total_attendees || 0],
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

  // PUT /events/:id — edit event
  else if (req.method === "PUT" && eventId && !action) {
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
        UPDATE event
        SET gallery_id = ?, event_name = ?, description = ?, event_date = ?,
            capacity = ?, member_only = ?
        WHERE event_id = ?
      `;

      db.query(sql,
        [data.gallery_id, data.event_name, data.description, data.event_date, data.capacity, data.member_only, eventId],
        (err) => {
          if (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: err.sqlMessage }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Event updated" }));
        }
      );
    });
  }

  // PATCH /events/:id/deactivate — archive
  else if (req.method === "PATCH" && eventId && action === "deactivate") {
    db.query("UPDATE event SET is_active = 0 WHERE event_id = ?", [eventId], (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Event archived" }));
    });
  }

  // PATCH /events/:id/reactivate — restore
  else if (req.method === "PATCH" && eventId && action === "reactivate") {
    db.query("UPDATE event SET is_active = 1 WHERE event_id = ?", [eventId], (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Event restored" }));
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

      db.query("SELECT capacity, total_attendees FROM event WHERE event_id = ? AND is_active = 1", [eventId], (err, results) => {
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

        if (quantity > spotsLeft) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({
            error: spotsLeft === 0
              ? "This event is fully booked."
              : `Only ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining.`
          }));
        }

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

  // DELETE /events/:id — soft delete
  else if (req.method === "DELETE" && eventId) {
    db.query("UPDATE event SET is_active = 0 WHERE event_id = ?", [eventId], (err) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.sqlMessage }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Event archived" }));
    });
  }

  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
};