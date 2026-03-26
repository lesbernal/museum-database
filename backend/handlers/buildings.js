// handlers/buildings.js

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // GET all buildings
  if (req.method === "GET" && urlParts.length === 1) {
    db.query("SELECT * FROM museumbuilding ORDER BY building_id", (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET building by id
  else if (req.method === "GET" && urlParts.length === 2) {
    db.query("SELECT * FROM museumbuilding WHERE building_id=?", [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0] || {});
    });
  }

  // POST building
  else if (req.method === "POST") {
    parseBody(req, (data) => {
      const sql = `
        INSERT INTO museumbuilding (building_name, address, square_footage, visitor_capacity)
        VALUES (?, ?, ?, ?)
      `;
      db.query(sql, [
        data.building_name || "",
        data.address || "",
        data.square_footage || null,
        data.visitor_capacity || null,
      ], (err, result) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Building added", building_id: result.insertId }, 201);
      });
    });
  }

  // PUT building
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, (data) => {
      const sql = `
        UPDATE museumbuilding SET
        building_name=?, address=?, square_footage=?, visitor_capacity=?
        WHERE building_id=?
      `;
      db.query(sql, [
        data.building_name || "",
        data.address || "",
        data.square_footage || null,
        data.visitor_capacity || null,
        urlParts[1],
      ], (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Building updated" });
      });
    });
  }

  // DELETE building
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query("DELETE FROM museumbuilding WHERE building_id=?", [urlParts[1]], (err) => {
      if (err) return sendError(res, err);
      sendJSON(res, { message: "Building deleted" });
    });
  }

  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
};

function parseBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", () => {
    try { callback(body ? JSON.parse(body) : {}); }
    catch { callback({}); }
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res, err) {
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: err.message || err }));
}