//exhibition, exhibitionartwork, gallery, museumbuilding

// exhibitions, exhibitionartwork, gallery, museumbuilding

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // ============================ EXHIBITIONS ============================
  if (urlParts[0] === "exhibitions") {

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

    // GET exhibition by id with gallery name
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

    // POST exhibition (+ optional ExhibitionArtwork rows)
    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO exhibition
          (gallery_id, title, start_date, end_date, type, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
          data.gallery_id || null,
          data.title || "",
          data.start_date || null,
          data.end_date || null,
          data.type || "",
          data.description || ""
        ], (err, result) => {
          if (err) return sendError(res, err);
          const exhibitionId = result.insertId;

          // Insert ExhibitionArtwork rows if provided
          const artworks = data.artworks || [];
          if (artworks.length === 0) {
            return sendJSON(res, { message: "Exhibition added", exhibition_id: exhibitionId }, 201);
          }

          const artworkValues = artworks.map(a => [
            exhibitionId,
            a.artwork_id,
            a.display_start_date || null,
            a.display_end_date || null
          ]);

          db.query(
            "INSERT INTO exhibitionartwork (exhibition_id, artwork_id, display_start_date, display_end_date) VALUES ?",
            [artworkValues],
            err => {
              if (err) return sendError(res, err);
              sendJSON(res, { message: "Exhibition added", exhibition_id: exhibitionId }, 201);
            }
          );
        });
      });
    }

    // PUT exhibition
    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
        const sql = `
          UPDATE exhibition SET
          gallery_id=?, title=?, start_date=?, end_date=?, type=?, description=?
          WHERE exhibition_id=?
        `;
        db.query(sql, [
          data.gallery_id || null,
          data.title || "",
          data.start_date || null,
          data.end_date || null,
          data.type || "",
          data.description || "",
          urlParts[1]
        ], (err) => {
          if (err) return sendError(res, err);

          // Replace ExhibitionArtwork rows if provided
          const artworks = data.artworks;
          if (!artworks) {
            return sendJSON(res, { message: "Exhibition updated" });
          }

          // Delete existing rows then re-insert
          db.query(
            "DELETE FROM exhibitionartwork WHERE exhibition_id=?",
            [urlParts[1]],
            err => {
              if (err) return sendError(res, err);
              if (artworks.length === 0) {
                return sendJSON(res, { message: "Exhibition updated" });
              }

              const artworkValues = artworks.map(a => [
                urlParts[1],
                a.artwork_id,
                a.display_start_date || null,
                a.display_end_date || null
              ]);

              db.query(
                "INSERT INTO exhibitionartwork (exhibition_id, artwork_id, display_start_date, display_end_date) VALUES ?",
                [artworkValues],
                err => {
                  if (err) return sendError(res, err);
                  sendJSON(res, { message: "Exhibition updated" });
                }
              );
            }
          );
        });
      });
    }

    // DELETE exhibition
    else if (req.method === "DELETE" && urlParts.length === 2) {
      // ExhibitionArtwork rows are deleted first (foreign key safety)
      db.query(
        "DELETE FROM exhibitionartwork WHERE exhibition_id=?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          db.query(
            "DELETE FROM exhibition WHERE exhibition_id=?",
            [urlParts[1]],
            err => {
              if (err) return sendError(res, err);
              sendJSON(res, { message: "Exhibition deleted" });
            }
          );
        }
      );
    }
  }

  // ============================ GALLERIES ============================
  else if (urlParts[0] === "galleries") {

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
        console.log("Gallery results:", err, results); // add this
        sendJSON(res, results);
      });
    }

    // GET gallery by id with building name
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
      parseBody(req, data => {
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
          data.climate_control_range || null
        ], (err, result) => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Gallery added", gallery_id: result.insertId }, 201);
        });
      });
    }

    // PUT gallery
    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
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
          data.climate_control_range || null,
          urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Gallery updated" });
        });
      });
    }

    // DELETE gallery
    else if (req.method === "DELETE" && urlParts.length === 2) {
      db.query(
        "DELETE FROM gallery WHERE gallery_id=?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Gallery deleted" });
        }
      );
    }
  }

  // ============================ BUILDINGS ============================
  else if (urlParts[0] === "buildings") {

    // GET all buildings
    if (req.method === "GET" && urlParts.length === 1) {
      db.query("SELECT * FROM museumbuilding ORDER BY building_id", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
    }

    // GET building by id
    else if (req.method === "GET" && urlParts.length === 2) {
      db.query(
        "SELECT * FROM museumbuilding WHERE building_id=?",
        [urlParts[1]],
        (err, results) => {
          if (err) return sendError(res, err);
          sendJSON(res, results[0] || {});
        }
      );
    }

    // POST building
    else if (req.method === "POST") {
      parseBody(req, data => {
        const sql = `
          INSERT INTO museumbuilding (building_name, address, square_footage)
          VALUES (?, ?, ?)
        `;
        db.query(sql, [
          data.building_name || "",
          data.address || "",
          data.square_footage || null
        ], (err, result) => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Building added", building_id: result.insertId }, 201);
        });
      });
    }

    // PUT building
    else if (req.method === "PUT" && urlParts.length === 2) {
      parseBody(req, data => {
        const sql = `
          UPDATE museumbuilding SET
          building_name=?, address=?, square_footage=?
          WHERE building_id=?
        `;
        db.query(sql, [
          data.building_name || "",
          data.address || "",
          data.square_footage || null,
          urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Building updated" });
        });
      });
    }

    // DELETE building
    else if (req.method === "DELETE" && urlParts.length === 2) {
      db.query(
        "DELETE FROM museumbuilding WHERE building_id=?",
        [urlParts[1]],
        err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "Building deleted" });
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