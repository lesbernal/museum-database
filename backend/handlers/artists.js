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

