// users

const db = require("../db");
const { verifyToken } = require("./authHelpers");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // DEBUG
  console.log("Users handler called");
  console.log("Authorization header:", req.headers.authorization);

  const user = verifyToken(req);
  console.log("Verified user:", user);
  console.log("User role:", user?.role);

  const isSelfLookup =
    req.method === "GET" &&
    urlParts.length === 2 &&
    user &&
    String(user.user_id) === String(urlParts[1]);

  const isSelfUpdate =
    req.method === "PUT" &&
    urlParts.length === 2 &&
    user &&
    String(user.user_id) === String(urlParts[1]);

  const isPrivileged = user && ["admin", "employee"].includes(user.role);

  console.log("isSelfLookup:", isSelfLookup);
  console.log("isSelfUpdate:", isSelfUpdate);
  console.log("isPrivileged:", isPrivileged);
  console.log("Request method:", req.method);
  console.log("URL parts:", urlParts);

  // Allow public signup — POST /users requires no token
  if (req.method === "POST" && urlParts.length === 1) {
    // falls through to POST handler below — no auth needed
  } else if (!user || (!isPrivileged && !isSelfLookup && !isSelfUpdate)) {
    console.log("Access denied - user:", user, "isPrivileged:", isPrivileged);
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

  // POST user (public signup — no auth required)
  else if (req.method === "POST") {
    parseBody(req, data => {
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
        data.password       || "",
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
    });
  }

  // PUT user
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, data => {

      if (isPrivileged) {
        // ── Admin / employee: can update role + date_of_birth ─────────────
        const sql = `
          UPDATE user SET
          first_name=?, last_name=?, email=?, phone_number=?,
          street_address=?, city=?, state=?, zip_code=?,
          date_of_birth=?, role=?
          WHERE user_id=?
        `;
        db.query(sql, [
          data.first_name     || "",
          data.last_name      || "",
          data.email          || "",
          data.phone_number   || "",
          data.street_address || "",
          data.city           || "",
          data.state          || "",
          data.zip_code       || "",
          data.date_of_birth  || null,
          data.role           || "visitor",
          urlParts[1]
        ], err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "User updated" });
        });

      } else {
        // ── Self-update: fetch current values first so no field gets
        //    accidentally nulled (fixes password change wiping date_of_birth)
        db.query(
          "SELECT * FROM user WHERE user_id = ?",
          [urlParts[1]],
          (err, rows) => {
            if (err) return sendError(res, err);
            const current = rows[0] || {};

            // Build SQL dynamically — include password only if provided
            const hasPassword = data.password && data.password.length > 0;

            const sql = hasPassword
              ? `UPDATE user SET
                 first_name=?, last_name=?, email=?, phone_number=?,
                 street_address=?, city=?, state=?, zip_code=?,
                 date_of_birth=?, password=?
                 WHERE user_id=?`
              : `UPDATE user SET
                 first_name=?, last_name=?, email=?, phone_number=?,
                 street_address=?, city=?, state=?, zip_code=?,
                 date_of_birth=?
                 WHERE user_id=?`;

            // Use incoming value if provided, otherwise keep existing DB value
            const values = [
              data.first_name     !== undefined ? data.first_name     : current.first_name,
              data.last_name      !== undefined ? data.last_name      : current.last_name,
              data.email          !== undefined ? data.email          : current.email,
              data.phone_number   !== undefined ? data.phone_number   : current.phone_number,
              data.street_address !== undefined ? data.street_address : current.street_address,
              data.city           !== undefined ? data.city           : current.city,
              data.state          !== undefined ? data.state          : current.state,
              data.zip_code       !== undefined ? data.zip_code       : current.zip_code,
              data.date_of_birth  !== undefined ? data.date_of_birth  : current.date_of_birth,
            ];

            if (hasPassword) values.push(data.password);
            values.push(urlParts[1]);

            db.query(sql, values, err => {
              if (err) return sendError(res, err);
              sendJSON(res, { message: "User updated" });
            });
          }
        );
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