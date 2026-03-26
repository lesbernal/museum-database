// handlers/galleries.js

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // GET all galleries with building name
  if (req.method === "GET" && urlParts.length === 1) {
    const sql = `
      SELECT g.*,
             mb.building_name
      FROM gallery g
      LEFT JOIN museumbuilding mb ON g.building_id = mb.building_id
      ORDER BY g.gallery_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET gallery by id
  else if (req.method === "GET" && urlParts.length === 2) {
    const sql = `
      SELECT g.*,
             mb.building_name
      FROM gallery g
      LEFT JOIN museumbuilding mb ON g.building_id = mb.building_id
      WHERE g.gallery_id = ?
    `;
    db.query(sql, [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0] || {});
    });
  }

  // POST gallery
  else if (req.method === "POST") {
    parseBody(req, (data) => {
      const sql = `
        INSERT INTO gallery
        (building_id, gallery_name, floor_number, square_footage, climate_controlled)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(sql, [
        data.building_id || null,
        data.gallery_name || "",
        data.floor_number ?? null,
        data.square_footage || null,
        data.climate_controlled ?? null,
      ], (err, result) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Gallery added", gallery_id: result.insertId }, 201);
      });
    });
  }

  // PUT gallery
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, (data) => {
      console.log("PUT gallery data:", data);
      const sql = `
        UPDATE gallery SET
        building_id=?, gallery_name=?, floor_number=?,
        square_footage=?, climate_controlled=?
        WHERE gallery_id=?
      `;
      db.query(sql, [
        data.building_id || null,
        data.gallery_name || "",
        data.floor_number ?? null,
        data.square_footage || null,
        data.climate_controlled ?? null,
        urlParts[1],
      ], (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Gallery updated" });
      });
    });
  }

  // DELETE gallery
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query("DELETE FROM gallery WHERE gallery_id=?", [urlParts[1]], (err) => {
      if (err) return sendError(res, err);
      sendJSON(res, { message: "Gallery deleted" });
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