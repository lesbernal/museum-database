// handlers/exhibitions.js

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // GET all exhibitions with gallery name
  if (req.method === "GET" && urlParts.length === 1) {
    const sql = `
      SELECT e.*,
             g.gallery_name
      FROM exhibition e
      LEFT JOIN gallery g ON e.gallery_id = g.gallery_id
      ORDER BY e.exhibition_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET exhibition by id
  else if (req.method === "GET" && urlParts.length === 2) {
    const sql = `
      SELECT e.*,
             g.gallery_name
      FROM exhibition e
      LEFT JOIN gallery g ON e.gallery_id = g.gallery_id
      WHERE e.exhibition_id = ?
    `;
    db.query(sql, [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0] || {});
    });
  }

  // POST exhibition
  else if (req.method === "POST") {
    parseBody(req, (data) => {
      const sql = `
        INSERT INTO exhibition
        (gallery_id, exhibition_name, start_date, end_date, exhibition_type)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(sql, [
        data.gallery_id || null,
        data.exhibition_name || "",
        data.start_date || null,
        data.end_date || null,
        data.exhibition_type || "Temporary",
      ], (err, result) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition added", exhibition_id: result.insertId }, 201);
      });
    });
  }

  // PUT exhibition
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, (data) => {
      const sql = `
        UPDATE exhibition SET
        gallery_id=?, exhibition_name=?, start_date=?,
        end_date=?, exhibition_type=?
        WHERE exhibition_id=?
      `;
      db.query(sql, [
        data.gallery_id || null,
        data.exhibition_name || "",
        data.start_date || null,
        data.end_date || null,
        data.exhibition_type || "Temporary",
        urlParts[1],
      ], (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition updated" });
      });
    });
  }

  // DELETE exhibition
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query("DELETE FROM exhibitionartwork WHERE exhibition_id=?", [urlParts[1]], (err) => {
      if (err) return sendError(res, err);
      db.query("DELETE FROM exhibition WHERE exhibition_id=?", [urlParts[1]], (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition deleted" });
      });
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
  res.setHeader("Content-Type", "application/json");
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function sendError(res, err) {
  res.setHeader("Content-Type", "application/json");
  res.writeHead(500);
  res.end(JSON.stringify({ error: err.message || err }));
}