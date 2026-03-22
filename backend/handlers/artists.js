//artist, artwork, provenance

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean); // split path

  // ------------------------------ ARTISTS ------------------------------
  if (urlParts[0] === "artists") {

    // GET all artists
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM artist", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET artist by ID
    else if (req.method === "GET" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("SELECT * FROM artist WHERE artist_id = ?", [id], (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      });
    }

    // POST new artist
    else if (req.method === "POST") {
      parseBody(req, data => {
        console.log("POST /artists received:", data); // debug

        const sql = `
          INSERT INTO artist
          (first_name, last_name, birth_year, death_year, nationality, biography)
          VALUES (?, ?, ?, ?, ?, ?)
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

    // PUT update artist
    else if (req.method === "PUT" && urlParts.length === 2) {
      const id = urlParts[1];
      parseBody(req, data => {
        const sql = `
          UPDATE artist SET first_name=?, last_name=?, birth_year=?, death_year=?, nationality=?, biography=?
          WHERE artist_id=?
        `;
        db.query(sql, [
          data.first_name || "",
          data.last_name || "",
          data.birth_year || null,
          data.death_year || null,
          data.nationality || "",
          data.biography || "",
          id
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist updated" });
        });
      });
    }

    // DELETE artist
    else if (req.method === "DELETE" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("DELETE FROM artist WHERE artist_id = ?", [id], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Artist deleted" });
      });
    }

    // unmatched artist route
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Artist route not found" }));
    }

  } else {
    // not an artist route
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
};

// -------------------- helpers --------------------
function parseBody(req, callback) {
  let body = "";
  req.on("data", chunk => body += chunk.toString());
  req.on("end", () => {
    try {
      const data = body && body.length ? JSON.parse(body) : {};
      callback(data);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
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

/* const db = require("../db");

module.exports = (req, res) => {

  const urlParts = req.url.split("/").filter(Boolean); // split path

  // ------------------------------
  // ARTISTS
  // ------------------------------
  if (urlParts[0] === "artists") {

    // GET all artists
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM artist", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET artist by ID
    else if (req.method === "GET" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("SELECT * FROM artist WHERE artist_id = ?", [id], (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      });
    }


    // POST new artist
    else if (req.method === "POST" && urlParts[0] === "artists") {
      parseBody(req, data => {
        console.log("POST /artists received:", data); // debug line

        const first_name = data.first_name || "";
        const last_name = data.last_name || "";
        const birth_year = data.birth_year || null;
        const death_year = data.death_year || null;
        const nationality = data.nationality || "";
        const biography = data.biography || "";

        const sql = `
          INSERT INTO artist
          (first_name, last_name, birth_year, death_year, nationality, biography)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [first_name, last_name, birth_year, death_year, nationality, biography], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist added" }, 201);
        });
      });
    }

    // PUT update artist
    else if (req.method === "PUT" && urlParts.length === 2) {
      const id = urlParts[1];
      parseBody(req, data => {
        const sql = `
          UPDATE artist SET first_name=?, last_name=?, birth_year=?, death_year=?, nationality=?
          WHERE artist_id=?
        `;
        db.query(sql, [
          data.first_name,
          data.last_name,
          data.birth_year,
          data.death_year,
          data.nationality,
          id
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artist updated" });
        });
      });
    }

    // DELETE artist
    else if (req.method === "DELETE" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("DELETE FROM artist WHERE artist_id = ?", [id], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Artist deleted" });
      });
    }

  }

  // ------------------------------
  // ARTWORKS
  // ------------------------------
  else if (urlParts[0] === "artworks") {

    // GET all artworks
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM artwork", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET artwork by ID
    else if (req.method === "GET" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("SELECT * FROM artwork WHERE artwork_id = ?", [id], (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      });
    }

    // POST new artwork
    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO artwork
          (artist_id, title, description, creation_year, medium, dimensions, acquisition_date, insurance_value, current_display_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
          data.artist_id,
          data.title,
          data.description,
          data.creation_year,
          data.medium,
          data.dimensions,
          data.acquisition_date,
          data.insurance_value,
          data.current_display_status
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork added" }, 201);
        });
      });
    }

    // PUT update artwork
    else if (req.method === "PUT" && urlParts.length === 2) {
      const id = urlParts[1];
      parseBody(req, data => {
        const sql = `
          UPDATE artwork
          SET artist_id=?, title=?, description=?, creation_year=?, medium=?, dimensions=?, acquisition_date=?, insurance_value=?, current_display_status=?
          WHERE artwork_id=?
        `;
        db.query(sql, [
          data.artist_id,
          data.title,
          data.description,
          data.creation_year,
          data.medium,
          data.dimensions,
          data.acquisition_date,
          data.insurance_value,
          data.current_display_status,
          id
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Artwork updated" });
        });
      });
    }

    // DELETE artwork
    else if (req.method === "DELETE" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("DELETE FROM artwork WHERE artwork_id = ?", [id], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Artwork deleted" });
      });
    }

  }

  // ------------------------------
  // PROVENANCE
  // ------------------------------
  else if (urlParts[0] === "provenance") {

    // GET all provenance
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM provenance", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET provenance by ID
    else if (req.method === "GET" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("SELECT * FROM provenance WHERE provenance_id = ?", [id], (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      });
    }

    // POST new provenance
    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO provenance
          (artwork_id, owner_name, acquisition_date, acquisition_method, price_paid, transfer_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
          data.artwork_id,
          data.owner_name,
          data.acquisition_date,
          data.acquisition_method,
          data.price_paid,
          data.transfer_date
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Provenance added" }, 201);
        });
      });
    }

    // PUT update provenance
    else if (req.method === "PUT" && urlParts.length === 2) {
      const id = urlParts[1];
      parseBody(req, data => {
        const sql = `
          UPDATE provenance
          SET artwork_id=?, owner_name=?, acquisition_date=?, acquisition_method=?, price_paid=?, transfer_date=?
          WHERE provenance_id=?
        `;
        db.query(sql, [
          data.artwork_id,
          data.owner_name,
          data.acquisition_date,
          data.acquisition_method,
          data.price_paid,
          data.transfer_date,
          id
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Provenance updated" });
        });
      });
    }

    // DELETE provenance
    else if (req.method === "DELETE" && urlParts.length === 2) {
      const id = urlParts[1];
      db.query("DELETE FROM provenance WHERE provenance_id = ?", [id], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Provenance deleted" });
      });
    }

  }

  // ------------------------------
  // NOT FOUND
  // ------------------------------
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
};

// ------------------------------
// HELPERS
// ------------------------------
function parseBody(req, callback) {
  let body = "";

  req.on("data", chunk => { body += chunk.toString(); });

  req.on("end", () => {
    try {
      const data = body && body.length ? JSON.parse(body) : {};
      console.log("Parsed body inside parseBody:", data); // <-- debug
      callback(data);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
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

*/