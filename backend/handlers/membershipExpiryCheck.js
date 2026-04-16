// handlers/membershipExpiryCheck.js
// Called on member dashboard load to process expired memberships.
// If pending_level = 'cancelled' and membership is expired, reverts user to visitor.
// If pending_level = a tier name and membership is expired, clears it so they can renew at that tier.

const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  req.on("data", chunk => (body += chunk.toString()));
  req.on("end", () => {
    let data;
    try { data = body ? JSON.parse(body) : {}; }
    catch { data = {}; }

    const { user_id } = data;
    if (!user_id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "user_id required" }));
    }

    const today = new Date().toISOString().slice(0, 10);

    db.query(
      "SELECT * FROM member WHERE user_id = ? AND expiration_date < ?",
      [user_id, today],
      (err, rows) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: err.message }));
        }

        // Membership not expired — nothing to do
        if (rows.length === 0) {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ action: "none" }));
        }

        const pending = rows[0].pending_level;

        if (pending === "cancelled") {
          // Revert role to visitor, clear pending_level
          db.query(
            "UPDATE user SET role = 'visitor' WHERE user_id = ?",
            [user_id],
            (err) => {
              if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: err.message }));
              }
              db.query(
                "UPDATE member SET pending_level = NULL WHERE user_id = ?",
                [user_id],
                (err) => {
                  if (err) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: err.message }));
                  }
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ action: "cancelled" }));
                }
              );
            }
          );
        } else {
          // Expired with a pending tier change or no pending — just report it
          // The pending_level is preserved so when they renew it pre-selects that tier
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            action: "expired",
            pending_level: pending || null,
          }));
        }
      }
    );
  });
};