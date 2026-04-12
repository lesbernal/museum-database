// handlers/exhibitionartwork.js
const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);
  // urlParts[0] = "exhibitionartwork", urlParts[1] = exhibition_id

  // GET /exhibitionartwork/:exhibition_id
  // Returns all artworks for a given exhibition with artwork + artist details
  if (req.method === "GET" && urlParts.length >= 2 && urlParts[1]) {
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
      JOIN artwork a  ON ea.artwork_id  = a.artwork_id
      LEFT JOIN artist ar ON a.artist_id = ar.artist_id
      WHERE ea.exhibition_id = ?
      ORDER BY a.title
    `;
    db.query(sql, [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
};

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