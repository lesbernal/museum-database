// employees

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

  // ============================ EMPLOYEES ============================

  // GET all employees (joined with user + department)
  if (req.method === "GET" && urlParts.length === 1) {
    const sql = `
      SELECT e.user_id, u.first_name, u.last_name, u.email, u.phone_number,
             u.city, u.state, e.department_id, d.department_name,
             e.job_title, e.hire_date, e.salary, e.employment_type, e.is_manager
      FROM employee e
      JOIN user u ON e.user_id = u.user_id
      LEFT JOIN department d ON e.department_id = d.department_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET employee by id
  else if (req.method === "GET" && urlParts.length === 2) {
    const sql = `
      SELECT e.user_id, u.first_name, u.last_name, u.email, u.phone_number,
             u.city, u.state, e.department_id, d.department_name,
             e.job_title, e.hire_date, e.salary, e.employment_type, e.is_manager
      FROM employee e
      JOIN user u ON e.user_id = u.user_id
      LEFT JOIN department d ON e.department_id = d.department_id
      WHERE e.user_id=?
    `;
    db.query(sql, [urlParts[1]], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0] || {});
    });
  }

  // POST employee (user must already exist)
  else if (req.method === "POST") {
    parseBody(req, data => {
      const sql = `
        INSERT INTO employee
        (user_id, department_id, job_title, hire_date, salary, employment_type, is_manager)
        VALUES (?,?,?,?,?,?,?)
      `;
      db.query(sql, [
        data.user_id         || null,
        data.department_id   || null,
        data.job_title       || "",
        data.hire_date       || null,
        data.salary          || null,
        data.employment_type || "",
        data.is_manager      ? 1 : 0,
      ], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Employee added" }, 201);
      });
    });
  }

  // PUT employee
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, data => {
      const sql = `
        UPDATE employee SET
        department_id=?, job_title=?, hire_date=?, salary=?,
        employment_type=?, is_manager=?
        WHERE user_id=?
      `;
      db.query(sql, [
        data.department_id   || null,
        data.job_title       || "",
        data.hire_date       || null,
        data.salary          || null,
        data.employment_type || "",
        data.is_manager      ? 1 : 0,
        urlParts[1]
      ], err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Employee updated" });
      });
    });
  }

  // DELETE employee
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query(
      "DELETE FROM employee WHERE user_id=?",
      [urlParts[1]],
      err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Employee deleted" });
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