// artist, artwork, provenance

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // ============================ ARTISTS ============================
  if (urlParts[0] === "artists") {

    // GET all artists
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM artist", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET artist by id
    else if (req.method === "GET" && urlParts.length === 2) {
      db.query(
        "SELECT * FROM artist WHERE artist_id=?",
        [urlParts[1]],
        (err, results) => {
          if (err) return sendError(res, err);
          sendJSON(res, results[0] || {});
        }
      );
    }

    // POST artist
    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO artist
          (first_name,last_name,birth_year,death_year,nationality,biography)
          VALUES (?,?,?,?,?,?)
        `;

        db.query(sql, [
          data.first_name || "",
          data.last_name || "",
          data.birth_year || null,
          data.death_year || null,
          data.nationality || "",
          data.biography || ""
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist added" }, 201);
        });
      });
    }

    // PUT artist
    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
        const sql = `
          UPDATE artist SET
          first_name=?, last_name=?, birth_year=?, death_year=?,
          nationality=?, biography=?
          WHERE artist_id=?
        `;

        db.query(sql, [
          data.first_name || "",
          data.last_name || "",
          data.birth_year || null,
          data.death_year || null,
          data.nationality || "",
          data.biography || "",
          urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist updated" });
        });
      });
    }

    // DELETE artist
    else if (req.method === "DELETE" && urlParts.length === 2) {
      db.query(
        "DELETE FROM artist WHERE artist_id=?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist deleted" });
        }
      );
    }
  }

  // ============================ ARTWORK ============================
  else if (urlParts[0] === "artwork") {

    // GET all
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM artwork", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET by id
    else if (req.method === "GET" && urlParts.length === 2) {
      db.query(
        "SELECT * FROM artwork WHERE artwork_id=?",
        [urlParts[1]],
        (err, results) => {
          if (err) return sendError(res, err);
          sendJSON(res, results[0] || {});
        }
      );
    }

    // POST
    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO artwork
          (artist_id,title,description,creation_year,
           medium,dimensions,acquisition_date,
           insurance_value,current_display_status)
          VALUES (?,?,?,?,?,?,?,?,?)
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
          data.current_display_status || "Display"
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork added" }, 201);
        });
      });
    }

    // PUT
    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
        const sql = `
          UPDATE artwork SET
          artist_id=?, title=?, description=?, creation_year=?,
          medium=?, dimensions=?, acquisition_date=?,
          insurance_value=?, current_display_status=?
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
          data.current_display_status || "Display",
          urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork updated" });
        });
      });
    }

    // DELETE
    else if (req.method === "DELETE" && urlParts.length === 2) {
      db.query(
        "DELETE FROM artwork WHERE artwork_id=?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork deleted" });
        }
      );
    }
  }

  // ============================ PROVENANCE ============================
  else if (urlParts[0] === "provenance") {

    // GET all
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM provenance", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET by id
    else if (req.method === "GET" && urlParts.length === 2) {
      db.query(
        "SELECT * FROM provenance WHERE provenance_id=?",
        [urlParts[1]],
        (err, results) => {
          if (err) return sendError(res, err);
          sendJSON(res, results[0] || {});
        }
      );
    }

    // POST
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

    // PUT
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

    // DELETE
    else if (req.method === "DELETE" && urlParts.length === 2) {
      db.query(
        "DELETE FROM provenance WHERE provenance_id=?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Provenance deleted" });
        }
      );
    }
  }

  // ============================ NOT FOUND ============================
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
};

// ============================ HELPERS ============================

function parseBody(req, callback) {
  let body = "";
  req.on("data", chunk => (body += chunk.toString()));
  req.on("end", () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(data);
    } catch {
      callback({});
    }
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