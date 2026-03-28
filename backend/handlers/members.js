const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // GET all members
  if (req.method === "GET" && urlParts.length === 1) {
    const sql = `
      SELECT m.user_id, u.first_name, u.last_name, u.email,
             m.membership_level, m.join_date, m.expiration_date,
             v.last_visit_date, v.total_visits
      FROM member m
      JOIN visitor v ON m.user_id = v.user_id
      JOIN user u ON v.user_id = u.user_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET member by id
  else if (req.method === "GET" && urlParts.length === 2) {
    const sql = `
      SELECT m.user_id, u.first_name, u.last_name, u.email,
             m.membership_level, m.join_date, m.expiration_date,
             v.last_visit_date, v.total_visits
      FROM member m
      JOIN visitor v ON m.user_id = v.user_id
      JOIN user u ON v.user_id = u.user_id
      WHERE m.user_id=?
    `;
    db.query(sql, [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);

      // ← key fix: return 404 instead of empty object
      if (!results[0]) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Member not found" }));
      }

      sendJSON(res, results[0]);
    });
  }

  // POST member
  else if (req.method === "POST") {
    parseBody(req, data => {
      const sql = `
        INSERT INTO member
        (user_id, membership_level, join_date, expiration_date)
        VALUES (?,?,?,?)
      `;
      db.query(sql, [
        data.user_id || null,
        data.membership_level || "",
        data.join_date || null,
        data.expiration_date || null
      ], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Member added" }, 201);
      });
    });
  }

  // PUT member
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, data => {
      const sql = `
        UPDATE member SET
        membership_level=?, join_date=?, expiration_date=?
        WHERE user_id=?
      `;
      db.query(sql, [
        data.membership_level || "",
        data.join_date || null,
        data.expiration_date || null,
        urlParts[1]
      ], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Member updated" });
      });
    });
  }

  // DELETE member
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query(
      "DELETE FROM member WHERE user_id=?",
      [urlParts[1]],
      err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Member deleted" });
      }
    );
  }

  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
};

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