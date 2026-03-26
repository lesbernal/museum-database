// handlers/users.js — UPDATED with bcrypt hashing
// Changes from previous version:
//   1. require bcrypt at top
//   2. POST: hash password before inserting
//   3. PUT: if password field is included, hash it before updating
// Run: npm install bcrypt  (in your backend folder)

const db     = require("../db");
const bcrypt = require("bcrypt");
const { verifyToken } = require("./authHelpers");

const SALT_ROUNDS = 10;

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  const user = verifyToken(req);
  const isSelfLookup =
    req.method === "GET" &&
    urlParts.length === 2 &&
    user &&
    String(user.user_id) === String(urlParts[1]);

  const isPrivileged = user && ["admin", "employee"].includes(user.role);

  if (!user || (!isPrivileged && !isSelfLookup)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Forbidden: insufficient permissions" }));
  }

  // ============================ USERS ============================

  // GET all users
  if (req.method === "GET" && urlParts.length === 1) {
    if (!isPrivileged) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Forbidden: insufficient permissions" }));
    }
    db.query("SELECT * FROM user", (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET user by id
  else if (req.method === "GET" && urlParts.length === 2) {
    db.query(
      "SELECT * FROM user WHERE user_id=?",
      [urlParts[1]],
      (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      }
    );
  }

  // POST user — hash password before insert
  else if (req.method === "POST") {
    parseBody(req, async data => {
      try {
        const hashedPassword = await bcrypt.hash(data.password || "", SALT_ROUNDS);

        const sql = `
          INSERT INTO user
          (first_name, last_name, email, password, role, phone_number,
           street_address, city, state, zip_code, date_of_birth)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)
        `;

        db.query(sql, [
          data.first_name     || "",
          data.last_name      || "",
          data.email          || "",
          hashedPassword,              // hashed
          data.role           || "visitor",
          data.phone_number   || "",
          data.street_address || "",
          data.city           || "",
          data.state          || "",
          data.zip_code       || "",
          data.date_of_birth  || null
        ], (err, result) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              return sendJSON(res, { error: "Email already exists" }, 409);
            }
            return sendError(res, err);
          }
          sendJSON(res, { message: "User added", user_id: result.insertId }, 201);
        });
      } catch (err) {
        sendError(res, err);
      }
    });
  }

  // PUT user — hash password only if it's being updated
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, async data => {
      try {
        // If password is being changed, hash it first
        if (data.password) {
          data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        }

        const sql = `
          UPDATE user SET
          first_name=?, last_name=?, email=?, phone_number=?,
          street_address=?, city=?, state=?, zip_code=?, date_of_birth=?
          ${data.password ? ", password=?" : ""}
          WHERE user_id=?
        `;

        const values = [
          data.first_name     || "",
          data.last_name      || "",
          data.email          || "",
          data.phone_number   || "",
          data.street_address || "",
          data.city           || "",
          data.state          || "",
          data.zip_code       || "",
          data.date_of_birth  || null,
        ];

        if (data.password) values.push(data.password);
        values.push(urlParts[1]);

        db.query(sql, values, err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "User updated" });
        });
      } catch (err) {
        sendError(res, err);
      }
    });
  }

  // DELETE user
  else if (req.method === "DELETE" && urlParts.length === 2) {
    db.query(
      "DELETE FROM user WHERE user_id=?",
      [urlParts[1]],
      err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "User deleted" });
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
