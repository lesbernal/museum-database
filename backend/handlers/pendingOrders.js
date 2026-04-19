// handlers/pendingOrders.js
// Manages large-order approval workflow.
//
// Routes:
//   POST   /pending-orders             — create a pending order (from checkout)
//   GET    /pending-orders             — get orders (by user_id OR department_id)
//   PATCH  /pending-orders/:id/approve — approve and execute the real inserts
//   PATCH  /pending-orders/:id/reject  — reject without inserting anything

const db = require("../db");

// ── helpers ──────────────────────────────────────────────────────────────────
function parseBody(req, cb) {
  let raw = "";
  req.on("data", c => (raw += c));
  req.on("end", () => { try { cb(raw ? JSON.parse(raw) : {}); } catch { cb({}); } });
}
function ok(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
function fail(res, err, status = 500) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: err?.message || err || "Unknown error" }));
}

// ── ticket insert helper (mirrors CheckoutPage.submitTickets) ─────────────────
function insertTickets(payload, cb) {
  const { user_id, visitDate, purchase_date, tickets, transaction_id } = payload;
  const rows = [];
  for (const t of tickets) {
    for (let i = 0; i < t.quantity; i++) {
      rows.push([
        user_id,
        purchase_date,
        visitDate,
        t.type,
        t.basePrice,
        t.discount_type || "None",
        t.finalPrice,
        "Credit Card",
        transaction_id,
      ]);
    }
  }
  if (rows.length === 0) return cb(null);

  let done = 0;
  let errored = false;
  rows.forEach(row => {
    db.query(
      `INSERT INTO ticket
       (user_id,purchase_date,visit_date,ticket_type,base_price,discount_type,final_price,payment_method,transaction_id)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      row,
      err => {
        if (errored) return;
        if (err) { errored = true; return cb(err); }
        if (++done === rows.length) cb(null);
      }
    );
  });
}

// ── cafe insert helper ────────────────────────────────────────────────────────
function insertCafeOrder(payload, cb) {
  const { user_id, transaction_datetime, total_amount, items, cafe_transaction_id, payment_method } = payload;
  db.query(
    `INSERT INTO cafetransaction
     (cafe_transaction_id,user_id,transaction_datetime,total_amount,payment_method)
     VALUES (?,?,?,?,?)`,
    [cafe_transaction_id, user_id, transaction_datetime, total_amount, payment_method || "Card"],
    err => {
      if (err) return cb(err);
      let done = 0;
      if (!items || items.length === 0) return cb(null);
      items.forEach((item, idx) => {
        db.query(
          `INSERT INTO cafetransactionitem
           (transaction_id,item_id,quantity,subtotal)
           VALUES (?,?,?,?)`,
          [cafe_transaction_id, item.item_id, item.quantity, Number((item.quantity * item.price).toFixed(2))],
          err2 => {
            if (err2) return cb(err2);
            if (++done === items.length) cb(null);
          }
        );
      });
    }
  );
}

// ── gift shop insert helper ───────────────────────────────────────────────────
function insertGiftShopOrder(payload, cb) {
  const { user_id, transaction_datetime, total_amount, items, transaction_id, payment_method, fulfillment_type, shipping_address } = payload;
  db.query(
    `INSERT INTO giftshoptransaction
     (transaction_id,user_id,transaction_datetime,total_amount,payment_method,fulfillment_type,shipping_address)
     VALUES (?,?,?,?,?,?,?)`,
    [transaction_id, user_id, transaction_datetime, total_amount, payment_method || "Card", fulfillment_type || "pickup", shipping_address || null],
    err => {
      if (err) return cb(err);
      let done = 0;
      if (!items || items.length === 0) return cb(null);
      items.forEach((item, idx) => {
        db.query(
          `INSERT INTO giftshoptransactionitem
           (transaction_id,item_id,quantity,subtotal)
           VALUES (?,?,?,?)`,
          [transaction_id, item.item_id, item.quantity, Number((item.quantity * item.price).toFixed(2))],
          err2 => {
            if (err2) return cb(err2);
            if (++done === items.length) cb(null);
          }
        );
      });
    }
  );
}

// ── main export ───────────────────────────────────────────────────────────────
module.exports = (req, res, parsedUrl) => {
  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  // parts[0] = "pending-orders"
  // parts[1] = id (optional)
  // parts[2] = "approve" | "reject" (optional)

  // ── POST /pending-orders ──────────────────────────────────────────────────
  if (req.method === "POST" && parts.length === 1) {
    parseBody(req, data => {
      const { user_id, order_type, department_id, order_data, total_amount, item_count } = data;
      if (!user_id || !order_type || !department_id || !order_data) {
        return fail(res, "Missing required fields", 400);
      }
      db.query(
        `INSERT INTO pending_order
         (user_id,order_type,department_id,order_data,total_amount,item_count,status)
         VALUES (?,?,?,?,?,?,'pending')`,
        [user_id, order_type, department_id, JSON.stringify(order_data), total_amount || 0, item_count || 0],
        (err, result) => {
          if (err) return fail(res, err);
          ok(res, { message: "Order submitted for approval", pending_id: result.insertId }, 201);
        }
      );
    });
    return;
  }

  // ── GET /pending-orders?user_id=X  OR  ?department_id=X&status=pending ───
  if (req.method === "GET" && parts.length === 1) {
    const { user_id, department_id, status } = parsedUrl.query || {};

    if (user_id) {
      // User checking their own pending orders
      db.query(
        `SELECT pending_id,order_type,total_amount,item_count,status,submitted_at,reviewed_at
         FROM pending_order WHERE user_id = ? ORDER BY submitted_at DESC`,
        [user_id],
        (err, rows) => {
          if (err) return fail(res, err);
          ok(res, rows);
        }
      );
    } else if (department_id) {
      // Employee dashboard — may filter by status
      const statusFilter = status ? " AND status = ?" : "";
      const params = status ? [department_id, status] : [department_id];
      db.query(
        `SELECT po.*,
                u.first_name, u.last_name, u.email
         FROM pending_order po
         JOIN user u ON po.user_id = u.user_id
         WHERE po.department_id = ?${statusFilter}
         ORDER BY po.submitted_at DESC`,
        params,
        (err, rows) => {
          if (err) return fail(res, err);
          // Parse order_data JSON for each row
          const parsed = rows.map(r => ({
            ...r,
            order_data: typeof r.order_data === "string" ? JSON.parse(r.order_data) : r.order_data,
          }));
          ok(res, parsed);
        }
      );
    } else {
      // Admin — all pending orders
      db.query(
        `SELECT po.*,
                u.first_name, u.last_name, u.email
         FROM pending_order po
         JOIN user u ON po.user_id = u.user_id
         ORDER BY po.submitted_at DESC`,
        [],
        (err, rows) => {
          if (err) return fail(res, err);
          const parsed = rows.map(r => ({
            ...r,
            order_data: typeof r.order_data === "string" ? JSON.parse(r.order_data) : r.order_data,
          }));
          ok(res, parsed);
        }
      );
    }
    return;
  }

  // ── PATCH /pending-orders/:id/approve ────────────────────────────────────
  if (req.method === "PATCH" && parts.length === 3 && parts[2] === "approve") {
    const pendingId = parts[1];
    parseBody(req, data => {
      const reviewedBy = data.reviewed_by || null;

      db.query(
        "SELECT * FROM pending_order WHERE pending_id = ? AND status = 'pending'",
        [pendingId],
        (err, rows) => {
          if (err) return fail(res, err);
          if (!rows.length) return fail(res, "Order not found or already processed", 404);

          const row = rows[0];
          const payload = typeof row.order_data === "string" ? JSON.parse(row.order_data) : row.order_data;

          const insertFn =
            row.order_type === "tickets"  ? insertTickets :
            row.order_type === "cafe"     ? insertCafeOrder :
            row.order_type === "giftshop" ? insertGiftShopOrder : null;

          if (!insertFn) return fail(res, "Unknown order type");

          insertFn(payload, insertErr => {
            if (insertErr) return fail(res, insertErr);

            const now = new Date().toISOString().slice(0, 19).replace("T", " ");
            db.query(
              `UPDATE pending_order
               SET status='approved', reviewed_at=?, reviewed_by=?
               WHERE pending_id=?`,
              [now, reviewedBy, pendingId],
              err2 => {
                if (err2) return fail(res, err2);
                ok(res, { message: "Order approved and processed successfully" });
              }
            );
          });
        }
      );
    });
    return;
  }

  // ── PATCH /pending-orders/:id/reject ─────────────────────────────────────
  if (req.method === "PATCH" && parts.length === 3 && parts[2] === "reject") {
    const pendingId = parts[1];
    parseBody(req, data => {
      const reviewedBy = data.reviewed_by || null;
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      db.query(
        `UPDATE pending_order
         SET status='rejected', reviewed_at=?, reviewed_by=?
         WHERE pending_id=? AND status='pending'`,
        [now, reviewedBy, pendingId],
        (err, result) => {
          if (err) return fail(res, err);
          if (result.affectedRows === 0) return fail(res, "Order not found or already processed", 404);
          ok(res, { message: "Order rejected" });
        }
      );
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
};