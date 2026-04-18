// handlers/artists_artwork_provenance.js
// ALTER TABLE artwork ADD COLUMN archive_reason VARCHAR(500) NULL;

const db = require("../db");
const { verifyToken } = require("./authHelpers");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // ============================ ARTISTS ============================
  if (urlParts[0] === "artists") {

    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM artist", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    else if (req.method === "GET" && urlParts.length === 2) {
      db.query("SELECT * FROM artist WHERE artist_id=?", [urlParts[1]], (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      });
    }

    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO artist
          (first_name, last_name, birth_year, death_year, nationality, biography, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
          data.first_name || "", data.last_name || "",
          data.birth_year || null, data.death_year || null,
          data.nationality || "", data.biography || "",
          data.image_url || null
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist added" }, 201);
        });
      });
    }

    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
        const sql = `
          UPDATE artist SET
          first_name=?, last_name=?, birth_year=?, death_year=?,
          nationality=?, biography=?, image_url=?
          WHERE artist_id=?
        `;
        db.query(sql, [
          data.first_name || "", data.last_name || "",
          data.birth_year || null, data.death_year || null,
          data.nationality || "", data.biography || "",
          data.image_url || null, urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist updated" });
        });
      });
    }

    else if (req.method === "DELETE" && urlParts.length === 2) {
      db.query("DELETE FROM artist WHERE artist_id=?", [urlParts[1]], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Artist deleted" });
      });
    }
  }

  // ============================ ARTWORK ============================
  else if (urlParts[0] === "artwork") {

    // GET all active artworks
    if (req.method === "GET" && urlParts.length === 1) {
      const sql = `
        SELECT a.*,
              ar.first_name, ar.last_name,
              CONCAT(ar.first_name, ' ', ar.last_name) AS artist_name,
              DATE(a.acquisition_date) as acquisition_date
        FROM artwork a
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        WHERE a.is_active = 1
        ORDER BY a.artwork_id
      `;
      db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
      return;
    }

    // GET archived artworks
    else if (req.method === "GET" && urlParts.length === 2 && urlParts[1] === "archived") {
      const sql = `
        SELECT a.*,
              ar.first_name, ar.last_name,
              CONCAT(ar.first_name, ' ', ar.last_name) AS artist_name,
              DATE(a.acquisition_date) as acquisition_date
        FROM artwork a
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        WHERE a.is_active = 0
        ORDER BY a.artwork_id
      `;
      db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
      return;
    }

    // GET artwork by id
    else if (req.method === "GET" && urlParts.length === 2) {
      const sql = `
        SELECT a.*,
              ar.first_name, ar.last_name,
              CONCAT(ar.first_name, ' ', ar.last_name) AS artist_name,
              DATE(a.acquisition_date) as acquisition_date
        FROM artwork a
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        WHERE a.artwork_id = ?
      `;
      db.query(sql, [urlParts[1]], (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      });
      return;
    }

    // POST artwork
    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO artwork
          (artist_id, title, description, creation_year,
          medium, dimensions, acquisition_date,
          insurance_value, current_display_status, image_url, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;
        db.query(sql, [
          data.artist_id || null,
          data.title || "",
          data.description || "",
          data.creation_year || null,
          data.medium || "",
          data.dimensions || "",
          data.acquisition_date || null,
          data.insurance_value || null,
          data.current_display_status || "On Display",
          data.image_url || null
        ], (err, result) => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork added", artwork_id: result.insertId }, 201);
        });
      });
      return;
    }

    // PUT artwork
    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
        const sql = `
          UPDATE artwork SET
          artist_id=?, title=?, description=?, creation_year=?,
          medium=?, dimensions=?, acquisition_date=?,
          insurance_value=?, current_display_status=?, image_url=?
          WHERE artwork_id=?
        `;
        db.query(sql, [
          data.artist_id || null,
          data.title || "",
          data.description || "",
          data.creation_year || null,
          data.medium || "",
          data.dimensions || "",
          data.acquisition_date || null,
          data.insurance_value || null,
          data.current_display_status || "On Display",
          data.image_url || null,
          urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork updated" });
        });
      });
      return;
    }

    // PATCH /artwork/:id/deactivate — archive with optional reason
    else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "deactivate") {
      parseBody(req, (data) => {
        db.query(
          "UPDATE artwork SET is_active = 0, archive_reason = ? WHERE artwork_id = ?",
          [data.reason || null, urlParts[1]],
          err => {
            if (err) return sendError(res, err);
            sendJSON(res, { message: "Artwork archived" });
          }
        );
      });
      return;
    }

    // PATCH /artwork/:id/reactivate — restore
    else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "reactivate") {
      db.query(
        "UPDATE artwork SET is_active = 1, archive_reason = NULL WHERE artwork_id = ?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork restored" });
        }
      );
      return;
    }

    // PATCH /artwork/:id/deaccession
    else if (req.method === "PATCH" && urlParts.length === 3 && urlParts[2] === "deaccession") {
      db.query(
        "UPDATE artwork SET current_display_status = 'Deaccessioned' WHERE artwork_id = ?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork marked as deaccessioned" });
        }
      );
      return;
    }
  }

  // ============================ PROVENANCE ============================
  else if (urlParts[0] === "provenance") {

    if (req.method === "GET" && urlParts.length === 1) {
      const sql = `
        SELECT p.*,
               a.title AS artwork_title,
               CONCAT(ar.first_name, ' ', ar.last_name) AS artist_name
        FROM provenance p
        LEFT JOIN artwork a ON p.artwork_id = a.artwork_id
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        ORDER BY p.provenance_id
      `;
      db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    else if (req.method === "GET" && urlParts.length === 2) {
      const sql = `
        SELECT p.*,
               a.title AS artwork_title,
               CONCAT(ar.first_name, ' ', ar.last_name) AS artist_name
        FROM provenance p
        LEFT JOIN artwork a ON p.artwork_id = a.artwork_id
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        WHERE p.provenance_id = ?
      `;
      db.query(sql, [urlParts[1]], (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      });
    }

    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO provenance
          (artwork_id, owner_name, acquisition_date,
           acquisition_method, price_paid, transfer_date)
          VALUES (?,?,?,?,?,?)
        `;
        db.query(sql, [
          data.artwork_id || null,
          data.owner_name || "",
          data.acquisition_date || null,
          data.acquisition_method || "",
          data.price_paid || null,
          data.transfer_date || null
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Provenance added" }, 201);
        });
      });
    }

    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
        const sql = `
          UPDATE provenance SET
          artwork_id=?, owner_name=?, acquisition_date=?,
          acquisition_method=?, price_paid=?, transfer_date=?
          WHERE provenance_id=?
        `;
        db.query(sql, [
          data.artwork_id || null,
          data.owner_name || "",
          data.acquisition_date || null,
          data.acquisition_method || "",
          data.price_paid || null,
          data.transfer_date || null,
          urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Provenance updated" });
        });
      });
    }

    else if (req.method === "DELETE" && urlParts.length === 2) {
      db.query("DELETE FROM provenance WHERE provenance_id=?", [urlParts[1]], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Provenance deleted" });
      });
    }
  }

  // ============================ NOT FOUND ============================
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
};

function parseBody(req, callback) {
  let body = "";
  req.on("data", chunk => (body += chunk.toString()));
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