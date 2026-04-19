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
        // Build dynamic SQL for privileged users
        const updateFields = [];
        const values = [];
        
        if (data.first_name !== undefined) { updateFields.push("first_name = ?"); values.push(data.first_name); }
        if (data.last_name !== undefined) { updateFields.push("last_name = ?"); values.push(data.last_name); }
        if (data.email !== undefined) { updateFields.push("email = ?"); values.push(data.email); }
        if (data.phone_number !== undefined) { updateFields.push("phone_number = ?"); values.push(data.phone_number); }
        if (data.street_address !== undefined) { updateFields.push("street_address = ?"); values.push(data.street_address); }
        if (data.city !== undefined) { updateFields.push("city = ?"); values.push(data.city); }
        if (data.state !== undefined) { updateFields.push("state = ?"); values.push(data.state); }
        if (data.zip_code !== undefined) { updateFields.push("zip_code = ?"); values.push(data.zip_code); }
        if (data.date_of_birth !== undefined) { updateFields.push("date_of_birth = ?"); values.push(data.date_of_birth); }
        if (data.role !== undefined) { updateFields.push("role = ?"); values.push(data.role); }
        if (data.password !== undefined && data.password.length > 0) { updateFields.push("password = ?"); values.push(data.password); }
        
        if (updateFields.length === 0) {
          return sendJSON(res, { message: "No fields to update" });
        }
        
        values.push(urlParts[1]);
        const sql = `UPDATE user SET ${updateFields.join(", ")} WHERE user_id = ?`;
        
        db.query(sql, values, err => {
          if (err) return sendError(res, err);
          sendJSON(res, { message: "User updated" });
        });
      } else {
        // Self-update for non-privileged users (visitors/members)
        db.query(
          "SELECT * FROM user WHERE user_id = ?",
          [urlParts[1]],
          (err, rows) => {
            if (err) return sendError(res, err);
            const current = rows[0] || {};

            const updateFields = [];
            const values = [];
            
            if (data.first_name !== undefined) { updateFields.push("first_name = ?"); values.push(data.first_name); }
            if (data.last_name !== undefined) { updateFields.push("last_name = ?"); values.push(data.last_name); }
            if (data.email !== undefined) { updateFields.push("email = ?"); values.push(data.email); }
            if (data.phone_number !== undefined) { updateFields.push("phone_number = ?"); values.push(data.phone_number); }
            if (data.street_address !== undefined) { updateFields.push("street_address = ?"); values.push(data.street_address); }
            if (data.city !== undefined) { updateFields.push("city = ?"); values.push(data.city); }
            if (data.state !== undefined) { updateFields.push("state = ?"); values.push(data.state); }
            if (data.zip_code !== undefined) { updateFields.push("zip_code = ?"); values.push(data.zip_code); }
            if (data.date_of_birth !== undefined) { updateFields.push("date_of_birth = ?"); values.push(data.date_of_birth); }
            if (data.password !== undefined && data.password.length > 0) { updateFields.push("password = ?"); values.push(data.password); }
            
            if (updateFields.length === 0) {
              return sendJSON(res, { message: "No fields to update" });
            }
            
            values.push(urlParts[1]);
            const sql = `UPDATE user SET ${updateFields.join(", ")} WHERE user_id = ?`;
            
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