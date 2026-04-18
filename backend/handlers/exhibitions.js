// handlers/exhibitions.js
// NOTE: Run this migration first:
//   ALTER TABLE exhibition ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
//   ALTER TABLE gallery    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
//   ALTER TABLE exhibition ADD COLUMN archive_reason VARCHAR(500) NULL;

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  if (urlParts[0] === "exhibitionartwork" && req.method === "GET" && urlParts.length === 2) {
    const sql = `
    SELECT
      ea.exhibition_id,
      ea.artwork_id,
      ea.display_start_date,
      ea.display_end_date,
      a.title,
      a.image_url,
      a.description,
      a.medium,
      a.creation_year,
      CONCAT(ar.first_name, ' ', ar.last_name) AS artist_name
    FROM exhibitionartwork ea
    JOIN artwork a ON ea.artwork_id = a.artwork_id
    LEFT JOIN artist ar ON a.artist_id = ar.artist_id
    WHERE ea.exhibition_id = ?
      AND (a.is_active = 1 OR a.is_active IS NULL)
    ORDER BY a.title
  `;
    db.query(sql, [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // GET all ACTIVE exhibitions with gallery name
  if (req.method === "GET" && urlParts.length === 1) {
    const sql = `
      SELECT e.*, g.gallery_name
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

  // GET all ARCHIVED exhibitions
  else if (req.method === "GET" && urlParts.length === 2 && urlParts[1] === "archived") {
    const sql = `
      SELECT e.*, g.gallery_name
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
  else if (req.method === "GET" && urlParts.length === 2) {
    const sql = `
      SELECT e.*, g.gallery_name
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

        const exhibitionId = result.insertId;
        const artworks = data.artworks || [];

        if (artworks.length === 0) {
          return sendJSON(res, { message: "Exhibition added", exhibition_id: exhibitionId }, 201);
        }

        const values = artworks.map(a => [
          exhibitionId,
          a.artwork_id,
          a.display_start_date || null,
          a.display_end_date || null,
        ]);

        db.query(
          "INSERT INTO exhibitionartwork (exhibition_id, artwork_id, display_start_date, display_end_date) VALUES ?",
          [values],
          (err) => {
            if (err) return sendError(res, err);
            sendJSON(res, { message: "Exhibition added", exhibition_id: exhibitionId }, 201);
          }
        );
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

        const artworks = data.artworks || [];

        db.query("DELETE FROM exhibitionartwork WHERE exhibition_id=?", [urlParts[1]], (err) => {
          if (err) return sendError(res, err);

          if (artworks.length === 0) {
            return sendJSON(res, { message: "Exhibition updated" });
          }

          const values = artworks.map(a => [
            urlParts[1],
            a.artwork_id,
            a.display_start_date || null,
            a.display_end_date || null,
          ]);

          db.query(
            "INSERT INTO exhibitionartwork (exhibition_id, artwork_id, display_start_date, display_end_date) VALUES ?",
            [values],
            (err) => {
              if (err) return sendError(res, err);
              sendJSON(res, { message: "Exhibition updated" });
            }
          );
        });
      });
    });
  }

  // PATCH /exhibitions/:id/deactivate → soft delete with optional reason
  else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "deactivate") {
    parseBody(req, (data) => {
      db.query(
        "UPDATE exhibition SET is_active = 0, archive_reason = ? WHERE exhibition_id = ?",
        [data.reason || null, urlParts[1]],
        (err) => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Exhibition deactivated" });
        }
      );
    });
  }

  // PATCH /exhibitions/:id/archive → alias for deactivate with optional reason
  else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "archive") {
    parseBody(req, (data) => {
      db.query(
        "UPDATE exhibition SET is_active = 0, archive_reason = ? WHERE exhibition_id = ?",
        [data.reason || null, urlParts[1]],
        (err) => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Exhibition archived" });
        }
      );
    });
  }

  // PATCH /exhibitions/:id/reactivate → restore
  else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "reactivate") {
    db.query(
      "UPDATE exhibition SET is_active = 1, archive_reason = NULL WHERE exhibition_id = ?",
      [urlParts[1]],
      (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition reactivated" });
      }
    );
  }

  // PATCH /exhibitions/:id/unarchive → alias for reactivate
  else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "unarchive") {
    db.query(
      "UPDATE exhibition SET is_active = 1, archive_reason = NULL WHERE exhibition_id = ?",
      [urlParts[1]],
      (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Exhibition unarchived" });
      }
    );
  }

  // Hard DELETE
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