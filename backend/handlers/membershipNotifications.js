// handlers/membershipNotifications.js
// Routes:
//   GET   /membership-notifications?user_id=X  — fetch undismissed notifications
//   PATCH /membership-notifications/:id/dismiss — mark one as dismissed

const db = require("../db");

function ok(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
function fail(res, err, status = 500) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: err?.message || err }));
}

module.exports = (req, res, parsedUrl) => {
  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  // parts[0] = "membership-notifications"
  // parts[1] = id   (optional)
  // parts[2] = "dismiss" (optional)

  // GET /membership-notifications?user_id=X
  if (req.method === "GET" && parts.length === 1) {
    const userId = parsedUrl.query?.user_id;
    if (!userId) return fail(res, "user_id required", 400);

    db.query(
      `SELECT notification_id, notification_type, message, created_at
       FROM membership_notification
       WHERE user_id = ? AND dismissed = 0
       ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) return fail(res, err);
        ok(res, rows);
      }
    );
    return;
  }

  // PATCH /membership-notifications/:id/dismiss
  if (req.method === "PATCH" && parts.length === 3 && parts[2] === "dismiss") {
    const notifId = parts[1];
    db.query(
      "UPDATE membership_notification SET dismissed = 1 WHERE notification_id = ?",
      [notifId],
      (err) => {
        if (err) return fail(res, err);
        ok(res, { message: "Notification dismissed" });
      }
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
};