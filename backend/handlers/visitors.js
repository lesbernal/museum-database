// visitors

const db = require("../db");
//const { verifyToken } = require("./authHelpers");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  /*const user = verifyToken(req);
  if (!user || !["admin", "employee"].includes(user.role)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Forbidden: insufficient permissions" }));
  }
*/
  // ============================ VISITORS ============================

  // GET all visitors (joined with user for full info)
  if (req.method === "GET" && urlParts.length === 1) {
    const sql = `
      SELECT v.user_id, u.first_name, u.last_name, u.email,
             v.last_visit_date, v.total_visits
      FROM visitor v
      JOIN user u ON v.user_id = u.user_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET visitor by id
  else if (req.method === "GET" && urlParts.length === 2) {
    const sql = `
      SELECT v.user_id, u.first_name, u.last_name, u.email,
             v.last_visit_date, v.total_visits
      FROM visitor v
      JOIN user u ON v.user_id = u.user_id
      WHERE v.user_id=?
    `;
    db.query(sql, [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0] || {});
    });
  }

  // POST visitor (user must already exist)
  else if (req.method === "POST") {
    parseBody(req, data => {
      const sql = `
        INSERT INTO visitor
        (user_id, last_visit_date, total_visits)
        VALUES (?,?,?)
      `;

      db.query(sql, [
        data.user_id || null,
        data.last_visit_date || null,
        data.total_visits || 0
      ], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Visitor added" }, 201);
      });
    });
  }

  // PUT visitor
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, data => {
      const sql = `
        UPDATE visitor SET
        last_visit_date=?, total_visits=?
        WHERE user_id=?
      `;

      db.query(sql, [
        data.last_visit_date || null,
        data.total_visits || 0,
        urlParts[1]
      ], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Visitor updated" });
      });
    });
  }

  // DELETE visitor
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query(
      "DELETE FROM visitor WHERE user_id=?",
      [urlParts[1]],
      err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Visitor deleted" });
      }
    );
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