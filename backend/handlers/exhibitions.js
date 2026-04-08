// handlers/exhibitions.js
// NOTE: Run this migration first:
//   ALTER TABLE exhibition ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
//   ALTER TABLE gallery    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // GET all ACTIVE exhibitions with gallery name
  // e.g. GET /exhibitions
  if (req.method === "GET" && urlParts.length === 1) {
    const sql = `
      SELECT e.*,
             g.gallery_name
      FROM exhibition e
      LEFT JOIN gallery g ON e.gallery_id = g.gallery_id
      WHERE e.is_active = 1
      ORDER BY e.exhibition_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET all ARCHIVED (soft-deleted) exhibitions
  // e.g. GET /exhibitions/archived
  else if (req.method === "GET" && urlParts.length === 2 && urlParts[1] === "archived") {
    const sql = `
      SELECT e.*,
             g.gallery_name
      FROM exhibition e
      LEFT JOIN gallery g ON e.gallery_id = g.gallery_id
      WHERE e.is_active = 0
      ORDER BY e.exhibition_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET exhibition by id
  // e.g. GET /exhibitions/5
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
  else if (req.method === "POST" && urlParts.length === 1) {
    parseBody(req, (data) => {
      const sql = `
        INSERT INTO exhibition
        (gallery_id, exhibition_name, start_date, end_date, exhibition_type, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
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

  // PUT exhibition (full update)
  // e.g. PUT /exhibitions/5
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

  // PATCH /exhibitions/5/deactivate  → soft delete (is_active = 0)
  else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "deactivate") {
    db.query(
      "UPDATE exhibition SET is_active = 0 WHERE exhibition_id = ?",
      [urlParts[1]],
      (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition deactivated" });
      }
    );
  }

  // PATCH /exhibitions/5/reactivate  → restore (is_active = 1)
  else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "reactivate") {
    db.query(
      "UPDATE exhibition SET is_active = 1 WHERE exhibition_id = ?",
      [urlParts[1]],
      (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition reactivated" });
      }
    );
  }

  // Hard DELETE (admin only, use sparingly)
  // e.g. DELETE /exhibitions/5
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query("DELETE FROM exhibitionartwork WHERE exhibition_id=?", [urlParts[1]], (err) => {
      if (err) return sendError(res, err);
      db.query("DELETE FROM exhibition WHERE exhibition_id=?", [urlParts[1]], (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition permanently deleted" });
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