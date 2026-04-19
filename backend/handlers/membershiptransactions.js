// handlers/membershiptransactions.js

const db = require("../db");

const DONATION_TIERS     = ["Benefactor", "Leadership Circle"];
const PURCHASABLE_TIERS  = ["Bronze", "Silver", "Gold", "Platinum"];

module.exports = (req, res, parsedUrl) => {
  const urlParts = parsedUrl.pathname.split("/").filter(Boolean);

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const userId = parsedUrl.query?.user_id;
    const sql    = userId
      ? "SELECT * FROM membershiptransaction WHERE user_id = ? ORDER BY transaction_date DESC"
      : "SELECT * FROM membershiptransaction ORDER BY transaction_date DESC";
    db.query(sql, userId ? [userId] : [], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // ── PATCH /membershiptransactions/pending ─────────────────────────────────
  if (req.method === "PATCH" && urlParts[1] === "pending") {
    parseBody(req, data => {
      const { user_id, pending_level } = data;
      if (!user_id) return sendJSON(res, { error: "user_id required" }, 400);

      db.query(
        "UPDATE member SET pending_level = ? WHERE user_id = ?",
        [pending_level || null, user_id],
        (err) => {
          if (err) return sendError(res, err);
          sendJSON(res, {
            message: pending_level === "cancelled"
              ? "Membership cancellation scheduled. Your membership remains active until expiry."
              : pending_level
              ? `Tier change to ${pending_level} scheduled for next renewal.`
              : "Pending change cleared.",
          });
        }
      );
    });
    return;
  }

  // ── POST — create transaction AND update member + user tables ─────────────
  if (req.method === "POST") {
    parseBody(req, data => {
      const { user_id, membership_level, amount, payment_method, transaction_type } = data;

      if (!user_id || !membership_level || !amount || !payment_method) {
        return sendJSON(res, { error: "Missing required fields" }, 400);
      }

      const now    = new Date().toISOString().slice(0, 19).replace("T", " ");
      const today  = new Date().toISOString().slice(0, 10);
      const expiry = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().slice(0, 10);
      })();

      // Guard: Check if current membership is a donation tier before allowing purchase
      db.query(
        "SELECT membership_level, join_date FROM member WHERE user_id = ?",
        [user_id],
        (err, existing) => {
          if (err) return sendError(res, err);

          const currentLevel = existing[0]?.membership_level || null;

          // BLOCK: If user is currently a donation-tier member, do not allow purchasing
          // any purchasable tier — donation tiers can only be changed by the upgrade trigger.
          if (currentLevel && DONATION_TIERS.includes(currentLevel) && PURCHASABLE_TIERS.includes(membership_level)) {
            return sendJSON(res, {
              error: `Your current ${currentLevel} membership was earned through donations and cannot be replaced by purchasing a standard tier. Please contact us if you need assistance.`
            }, 403);
          }

          // Insert transaction record
          const txSql = `
            INSERT INTO membershiptransaction
            (user_id, membership_level, transaction_date, amount, payment_method, transaction_type)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          db.query(txSql,
            [user_id, membership_level, now, amount, payment_method, transaction_type || "New"],
            (err, txResult) => {
              if (err) return sendError(res, err);

              if (existing.length > 0) {
                // ── EXISTING MEMBER: Renewal / Upgrade / Downgrade ────────────
                // Preserve original join_date. Clear pending_level since they just acted.
                db.query(
                  `UPDATE member SET
                     membership_level = ?,
                     expiration_date  = ?,
                     pending_level    = NULL
                   WHERE user_id = ?`,
                  [membership_level, expiry, user_id],
                  (err) => {
                    if (err) return sendError(res, err);
                    updateUserRole(res, user_id, txResult.insertId, membership_level);
                  }
                );
              } else {
                // ── NEW MEMBER ─────────────────────────────────────────────────
                db.query(
                  "SELECT user_id FROM visitor WHERE user_id = ?",
                  [user_id],
                  (err, visitorRows) => {
                    if (err) return sendError(res, err);

                    function insertMemberRecord() {
                      db.query(
                        `INSERT INTO member
                           (user_id, membership_level, join_date, expiration_date, pending_level)
                           VALUES (?, ?, ?, ?, NULL)`,
                        [user_id, membership_level, today, expiry],
                        (err) => {
                          if (err) return sendError(res, err);
                          updateUserRole(res, user_id, txResult.insertId, membership_level);
                        }
                      );
                    }

                    if (visitorRows.length === 0) {
                      db.query(
                        `INSERT INTO visitor (user_id, last_visit_date, total_visits) VALUES (?, ?, 0)`,
                        [user_id, today],
                        (err) => {
                          if (err) return sendError(res, err);
                          insertMemberRecord();
                        }
                      );
                    } else {
                      insertMemberRecord();
                    }
                  }
                );
              }
            }
          );
        }
      );
    });
    return;
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method === "DELETE" && urlParts.length === 2) {
    db.query(
      "DELETE FROM membershiptransaction WHERE transaction_id = ?",
      [urlParts[1]],
      (err) => {
        if (err) return sendError(res, err);
        sendJSON(res, { message: "Transaction deleted" });
      }
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
};

function updateUserRole(res, user_id, transaction_id, membership_level) {
  db.query(
    "UPDATE user SET role = 'member' WHERE user_id = ?",
    [user_id],
    (err) => {
      if (err) return sendError(res, err);
      sendJSON(res, { message: "Membership updated successfully", transaction_id, membership_level }, 201);
    }
  );
}

function parseBody(req, callback) {
  let body = "";
  req.on("data", chunk => (body += chunk.toString()));
  req.on("end", () => {
    try { callback(body ? JSON.parse(body) : {}); }
    catch { callback({}); }
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