// departments

const db = require("../db");
const { verifyToken } = require("./authHelpers");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  const user = verifyToken(req);
  if (!user || !["admin", "employee"].includes(user.role)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Forbidden: insufficient permissions" }));
  }

  // ============================ DEPARTMENTS ============================

  // GET all departments
  if (req.method === "GET" && urlParts.length === 1) {
    db.query("SELECT * FROM department", (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET department by id
  else if (req.method === "GET" && urlParts.length === 2) {
    db.query(
      "SELECT * FROM department WHERE department_id=?",
      [urlParts[1]],
      (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      }
    );
  }

  // POST department
  else if (req.method === "POST") {
    parseBody(req, data => {
      const sql = `
        INSERT INTO department
        (department_id, department_name, budget, phone_extension)
        VALUES (?,?,?,?)
      `;

      db.query(sql, [
        data.department_id   || null,
        data.department_name || "",
        data.budget          || 0,
        data.phone_extension || ""
      ], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return sendJSON(res, { error: "Department name already exists" }, 409);
          }
          return sendError(res, err);
        }
        sendJSON(res, { message: "Department added", department_id: data.department_id }, 201);
      });
    });
  }

  // PUT department
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, data => {
      const sql = `
        UPDATE department SET
        department_name=?, budget=?, phone_extension=?
        WHERE department_id=?
      `;

      db.query(sql, [
        data.department_name || "",
        data.budget          || 0,
        data.phone_extension || "",
        urlParts[1]
      ], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Department updated" });
      });
    });
  }

  // DELETE department
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query(
      "DELETE FROM department WHERE department_id=?",
      [urlParts[1]],
      err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Department deleted" });
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