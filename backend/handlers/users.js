// users

const db = require("../db");
//const { verifyToken } = require("./authHelpers");

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);
  
//commented out the authentication stuff for now
  /*const user = verifyToken(req);
  if (!user || !["admin", "employee"].includes(user.role)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Forbidden: insufficient permissions" }));
  }
*/
  // ============================ USERS ============================

  // GET all users (exclude password for security)
  if (req.method === "GET" && urlParts.length === 1) {
    db.query("SELECT user_id, first_name, last_name, email, role, phone_number, street_address, city, state, zip_code, date_of_birth FROM user", (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
  }

  // GET user by id (exclude password)
  else if (req.method === "GET" && urlParts.length === 2) {
    db.query(
      "SELECT user_id, first_name, last_name, email, role, phone_number, street_address, city, state, zip_code, date_of_birth FROM user WHERE user_id=?",
      [urlParts[1]],
      (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results[0] || {});
      }
    );
  }

  // POST user (create new user with password and role)
  else if (req.method === "POST") {
    parseBody(req, data => {
      const sql = `
        INSERT INTO user
        (first_name, last_name, email, password, role, phone_number,
         street_address, city, state, zip_code, date_of_birth)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `;

      db.query(sql, [
        data.first_name || "",
        data.last_name || "",
        data.email || "",
        data.password || "",
        data.role || "visitor",
        data.phone_number || "",
        data.street_address || "",
        data.city || "",
        data.state || "",
        data.zip_code || "",
        data.date_of_birth || null
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

  // PUT user (update user)
  else if (req.method === "PUT" && urlParts.length === 2) {
    parseBody(req, data => {
      // Build dynamic update query to handle optional fields
      const fields = [];
      const values = [];
      
      if (data.first_name !== undefined) {
        fields.push("first_name=?");
        values.push(data.first_name);
      }
      if (data.last_name !== undefined) {
        fields.push("last_name=?");
        values.push(data.last_name);
      }
      if (data.email !== undefined) {
        fields.push("email=?");
        values.push(data.email);
      }
      if (data.password !== undefined) {
        fields.push("password=?");
        values.push(data.password);
      }
      if (data.role !== undefined) {
        fields.push("role=?");
        values.push(data.role);
      }
      if (data.phone_number !== undefined) {
        fields.push("phone_number=?");
        values.push(data.phone_number);
      }
      if (data.street_address !== undefined) {
        fields.push("street_address=?");
        values.push(data.street_address);
      }
      if (data.city !== undefined) {
        fields.push("city=?");
        values.push(data.city);
      }
      if (data.state !== undefined) {
        fields.push("state=?");
        values.push(data.state);
      }
      if (data.zip_code !== undefined) {
        fields.push("zip_code=?");
        values.push(data.zip_code);
      }
      if (data.date_of_birth !== undefined) {
        fields.push("date_of_birth=?");
        values.push(data.date_of_birth);
      }
      
      if (fields.length === 0) {
        return sendJSON(res, { error: "No fields to update" }, 400);
      }
      
      values.push(urlParts[1]);
      const sql = `UPDATE user SET ${fields.join(", ")} WHERE user_id=?`;
      
      db.query(sql, values, err => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "User updated" });
      });
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