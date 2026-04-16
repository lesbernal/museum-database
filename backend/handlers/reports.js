const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const query = parsedUrl.query;
  console.log("📊 reports.js handler called for:", parsedUrl.pathname);

  // ==================== TEST ENDPOINT ====================
  if (parsedUrl.pathname === "/reports/test") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      message: "Reports handler is working!", 
      timestamp: Date.now()
    }));
    return;
  }

  // ==================== REPORT 1: REVENUE REPORT ====================
  if (parsedUrl.pathname === "/reports/revenue-data") {
    let startDate = query.startDate;
    let endDate = query.endDate;
    const type = query.type || "all";
    
    if (!startDate || startDate === "") startDate = "1900-01-01";
    if (!endDate || endDate === "") endDate = "2099-12-31";
    
    console.log("Revenue query - startDate:", startDate, "endDate:", endDate, "type:", type);
    
    let sqlParts = [];
    let params = [];
    
    if (type === "ticket" || type === "all") {
      sqlParts.push(`
        SELECT 
          'Ticket' as source,
          t.ticket_id as id,
          t.purchase_date as date,
          t.ticket_type as type,
          t.final_price as amount,
          t.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM ticket t
        LEFT JOIN user u ON t.user_id = u.user_id
        WHERE t.purchase_date >= ? AND t.purchase_date <= ?
      `);
      params.push(startDate, endDate);
    }
    
    if (type === "donation" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 
          'Donation' as source,
          d.donation_id as id,
          d.donation_date as date,
          d.donation_type as type,
          d.amount as amount,
          NULL as payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM donation d
        LEFT JOIN user u ON d.user_id = u.user_id
        WHERE d.donation_date >= ? AND d.donation_date <= ?
      `);
      params.push(startDate, endDate);
    }
    
    if (type === "cafe" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 
          'Cafe' as source,
          ct.cafe_transaction_id as id,
          DATE(ct.transaction_datetime) as date,
          NULL as type,
          ct.total_amount as amount,
          ct.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM cafetransaction ct
        LEFT JOIN user u ON ct.user_id = u.user_id
        WHERE DATE(ct.transaction_datetime) >= ? AND DATE(ct.transaction_datetime) <= ?
      `);
      params.push(startDate, endDate);
    }
    
    if (type === "gift" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 
          'Gift Shop' as source,
          gt.transaction_id as id,
          DATE(gt.transaction_datetime) as date,
          NULL as type,
          gt.total_amount as amount,
          gt.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM giftshoptransaction gt
        LEFT JOIN user u ON gt.user_id = u.user_id
        WHERE DATE(gt.transaction_datetime) >= ? AND DATE(gt.transaction_datetime) <= ?
      `);
      params.push(startDate, endDate);
    }
    
    const finalSql = sqlParts.join(" ") + " ORDER BY date DESC";
    
    db.query(finalSql, params, (err, results) => {
      if (err) {
        console.error("Revenue query error:", err);
        return sendError(res, err);
      }
      console.log("Revenue query returned:", results.length, "records");
      sendJSON(res, results);
    });
    return;
  }

  // ==================== REVENUE SUMMARY ====================
  if (parsedUrl.pathname === "/reports/revenue-summary") {
    let startDate = query.startDate;
    let endDate = query.endDate;
    
    if (!startDate || startDate === "") startDate = "1900-01-01";
    if (!endDate || endDate === "") endDate = "2099-12-31";
    
    const sql = `
      SELECT 
        COALESCE((SELECT SUM(final_price) FROM ticket WHERE purchase_date >= ? AND purchase_date <= ?), 0) as ticket_revenue,
        COALESCE((SELECT COUNT(*) FROM ticket WHERE purchase_date >= ? AND purchase_date <= ?), 0) as ticket_count,
        COALESCE((SELECT SUM(amount) FROM donation WHERE donation_date >= ? AND donation_date <= ?), 0) as donation_revenue,
        COALESCE((SELECT COUNT(*) FROM donation WHERE donation_date >= ? AND donation_date <= ?), 0) as donation_count,
        COALESCE((SELECT SUM(total_amount) FROM cafetransaction WHERE DATE(transaction_datetime) >= ? AND DATE(transaction_datetime) <= ?), 0) as cafe_revenue,
        COALESCE((SELECT COUNT(*) FROM cafetransaction WHERE DATE(transaction_datetime) >= ? AND DATE(transaction_datetime) <= ?), 0) as cafe_count,
        COALESCE((SELECT SUM(total_amount) FROM giftshoptransaction WHERE DATE(transaction_datetime) >= ? AND DATE(transaction_datetime) <= ?), 0) as gift_revenue,
        COALESCE((SELECT COUNT(*) FROM giftshoptransaction WHERE DATE(transaction_datetime) >= ? AND DATE(transaction_datetime) <= ?), 0) as gift_count
    `;
    
    const params = [
      startDate, endDate, startDate, endDate,
      startDate, endDate, startDate, endDate,
      startDate, endDate, startDate, endDate,
      startDate, endDate, startDate, endDate
    ];
    
    db.query(sql, params, (err, results) => {
      if (err) return sendError(res, err);
      const summary = results[0];
      
      const ticketRevenue   = Number(summary.ticket_revenue)   || 0;
      const donationRevenue = Number(summary.donation_revenue) || 0;
      const cafeRevenue     = Number(summary.cafe_revenue)     || 0;
      const giftRevenue     = Number(summary.gift_revenue)     || 0;
      const ticketCount     = Number(summary.ticket_count)     || 0;
      const donationCount   = Number(summary.donation_count)   || 0;
      const cafeCount       = Number(summary.cafe_count)       || 0;
      const giftCount       = Number(summary.gift_count)       || 0;
      
      const totalRevenue      = ticketRevenue + donationRevenue + cafeRevenue + giftRevenue;
      const totalTransactions = ticketCount + donationCount + cafeCount + giftCount;
      
      sendJSON(res, {
        totalRevenue,
        totalTransactions,
        avgTransaction:   totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        ticketRevenue,
        donationRevenue,
        cafeRevenue,
        giftShopRevenue:  giftRevenue
      });
    });
    return;
  }

  // ==================== REPORT 2: ART COLLECTION REPORT ====================
  // Tables: artwork, artist, gallery, museumbuilding
  // Each artwork appears once with its CURRENT gallery info (from artwork.gallery_id)

  if (parsedUrl.pathname === "/reports/art-collection-data") {
    const artistId = query.artistId || "";
    const startYear = query.startYear || "";
    const endYear = query.endYear || "";
    const status = query.status || "";
    const medium = query.medium || "";
    const minValue = query.minValue || "";
    const maxValue = query.maxValue || "";
    
    let sql = `
      SELECT 
        a.artwork_id,
        a.title,
        a.creation_year,
        a.medium,
        a.dimensions,
        a.current_display_status,
        a.insurance_value,
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        ar.nationality as artist_nationality,
        g.gallery_name,
        g.is_active as gallery_active,
        b.building_name,
        b.building_id
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      LEFT JOIN gallery g ON a.gallery_id = g.gallery_id
      LEFT JOIN museumbuilding b ON g.building_id = b.building_id
      WHERE a.is_active = 1
    `;
    
    const params = [];
    
    if (artistId) {
      sql += ` AND a.artist_id = ?`;
      params.push(artistId);
    }
    if (startYear) {
      sql += ` AND a.creation_year >= ?`;
      params.push(startYear);
    }
    if (endYear) {
      sql += ` AND a.creation_year <= ?`;
      params.push(endYear);
    }
    if (status) {
      sql += ` AND a.current_display_status = ?`;
      params.push(status);
    }
    if (medium) {
      sql += ` AND a.medium = ?`;
      params.push(medium);
    }
    if (minValue) {
      sql += ` AND a.insurance_value >= ?`;
      params.push(minValue);
    }
    if (maxValue) {
      sql += ` AND a.insurance_value <= ?`;
      params.push(maxValue);
    }
    
    sql += ` ORDER BY a.creation_year DESC`;
    
    db.query(sql, params, (err, results) => {
      if (err) return sendError(res, err);
      
      // Summary statistics
      const statsSql = `
        SELECT 
          COUNT(*) as total_artworks,
          ROUND(SUM(insurance_value), 2) as total_value,
          ROUND(AVG(insurance_value), 2) as avg_value,
          COUNT(DISTINCT artist_id) as total_artists,
          COUNT(DISTINCT medium) as total_mediums,
          COUNT(DISTINCT gallery_id) as total_galleries_used
        FROM artwork a
        WHERE a.is_active = 1
      `;
      db.query(statsSql, (err, stats) => {
        if (err) return sendError(res, err);
        sendJSON(res, { data: results, summary: stats[0] });
      });
    });
    return;
  }

  // ==================== REPORT 3: GIFT SHOP REPORT ====================
  if (parsedUrl.pathname === "/reports/giftshop-data") {
    const startDate = query.startDate || "1900-01-01";
    const endDate   = query.endDate   || "2099-12-31";
    const category  = query.category  || "";
    
    let sql = `
      SELECT 
        ti.shop_item_id,
        i.item_name,
        i.category,
        i.price,
        ti.quantity,
        ti.subtotal,
        t.transaction_datetime,
        t.payment_method,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM giftshoptransactionitem ti
      JOIN giftshopitem i ON ti.item_id = i.item_id
      JOIN giftshoptransaction t ON ti.transaction_id = t.transaction_id
      JOIN user u ON t.user_id = u.user_id
      WHERE t.transaction_datetime BETWEEN ? AND ?
    `;
    
    const params = [startDate, endDate];
    
    if (category) {
      sql += ` AND i.category = ?`;
      params.push(category);
    }
    
    sql += ` ORDER BY t.transaction_datetime DESC`;
    
    db.query(sql, params, (err, results) => {
      if (err) return sendError(res, err);
      
      const statsSql = `
        SELECT 
          (SELECT COUNT(*) FROM giftshoptransaction 
           WHERE transaction_datetime BETWEEN ? AND ?) as total_transactions,
          (SELECT ROUND(SUM(total_amount), 2) FROM giftshoptransaction 
           WHERE transaction_datetime BETWEEN ? AND ?) as total_revenue,
          (SELECT ROUND(AVG(total_amount), 2) FROM giftshoptransaction 
           WHERE transaction_datetime BETWEEN ? AND ?) as avg_transaction,
          (SELECT COUNT(DISTINCT category) FROM giftshopitem) as total_categories,
          (SELECT COUNT(*) FROM giftshopitem WHERE stock_quantity < 10) as low_stock_items
      `;
      db.query(statsSql, [startDate, endDate, startDate, endDate, startDate, endDate], (err, stats) => {
        if (err) return sendError(res, err);
        sendJSON(res, { data: results, summary: stats[0] });
      });
    });
    return;
  }

  // ==================== REPORT: VISITOR ANALYTICS ====================
  if (parsedUrl.pathname === "/reports/visitor-analytics") {
    const startDate       = query.startDate       || "1900-01-01";
    const endDate         = query.endDate         || new Date().toISOString().split('T')[0];
    const membershipLevel = query.membershipLevel || "";
    const ticketType      = query.ticketType      || "";
    
    const visitorsSql = `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.city,
        u.state,
        DATE(u.date_of_birth) as date_of_birth,
        v.total_visits,
        v.last_visit_date,
        CASE WHEN m.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as is_member,
        m.membership_level,
        m.join_date,
        m.expiration_date
      FROM user u
      LEFT JOIN visitor v ON u.user_id = v.user_id
      LEFT JOIN member m ON u.user_id = m.user_id
      WHERE u.role IN ('visitor', 'member')
      ORDER BY v.total_visits DESC
    `;
    
    const ticketsSql = `
      SELECT 
        ticket_type,
        COUNT(*) as count,
        ROUND(SUM(final_price), 2) as total_revenue,
        ROUND(AVG(final_price), 2) as avg_price,
        DATE(purchase_date) as purchase_date
      FROM ticket
      WHERE purchase_date BETWEEN ? AND ?
      GROUP BY ticket_type, DATE(purchase_date)
      ORDER BY purchase_date DESC
    `;
    
    const attendanceSql = `
      SELECT 
        DATE(t.purchase_date) as date,
        COUNT(DISTINCT t.user_id) as unique_visitors,
        COUNT(*) as total_tickets_sold,
        ROUND(SUM(t.final_price), 2) as daily_revenue
      FROM ticket t
      WHERE t.purchase_date BETWEEN ? AND ?
      GROUP BY DATE(t.purchase_date)
      ORDER BY date DESC
    `;
    
    const memberStatsSql = `
      SELECT 
        membership_level,
        COUNT(*) as count,
        ROUND(AVG(DATEDIFF(expiration_date, join_date))) as avg_membership_days
      FROM member
      GROUP BY membership_level
    `;
    
    const eventSql = `
      SELECT 
        e.event_name,
        e.event_date,
        e.capacity,
        e.total_attendees,
        ROUND((e.total_attendees / e.capacity) * 100, 1) as attendance_percentage
      FROM event e
      WHERE e.event_date BETWEEN ? AND ?
      ORDER BY e.event_date DESC
    `;
    
    Promise.all([
      new Promise((resolve, reject) => {
        db.query(visitorsSql, (err, results) => { if (err) reject(err); else resolve(results); });
      }),
      new Promise((resolve, reject) => {
        db.query(ticketsSql, [startDate, endDate], (err, results) => { if (err) reject(err); else resolve(results); });
      }),
      new Promise((resolve, reject) => {
        db.query(attendanceSql, [startDate, endDate], (err, results) => { if (err) reject(err); else resolve(results); });
      }),
      new Promise((resolve, reject) => {
        db.query(memberStatsSql, (err, results) => { if (err) reject(err); else resolve(results); });
      }),
      new Promise((resolve, reject) => {
        db.query(eventSql, [startDate, endDate], (err, results) => { if (err) reject(err); else resolve(results); });
      })
    ])
    .then(([visitors, tickets, attendance, memberStats, events]) => {
      const summary = {
        total_visitors:       visitors.length,
        total_members:        visitors.filter(v => v.is_member === 'Yes').length,
        total_visits:         visitors.reduce((sum, v) => sum + (v.total_visits || 0), 0),
        avg_visits_per_visitor: (visitors.reduce((sum, v) => sum + (v.total_visits || 0), 0) / visitors.length || 0).toFixed(1),
        total_tickets_sold:   tickets.reduce((sum, t) => sum + t.count, 0),
        total_ticket_revenue: tickets.reduce((sum, t) => sum + t.total_revenue, 0),
        most_popular_ticket:  tickets.reduce((a, b) => a.count > b.count ? a : b, { ticket_type: 'None', count: 0 }).ticket_type,
        total_events:         events.length,
        avg_event_attendance: (events.reduce((sum, e) => sum + e.total_attendees, 0) / events.length || 0).toFixed(1)
      };
      
      sendJSON(res, { summary, visitors, tickets, attendance, memberStats, events });
    })
    .catch(err => sendError(res, err));
    return;
  }

  // ==================== HELPER: Get filter options ====================
  if (parsedUrl.pathname === "/reports/filter-options") {
    const type = query.type || "";
    
    if (type === "artists") {
      db.query("SELECT artist_id, first_name, last_name FROM artist ORDER BY last_name", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results);
      });
      return;
    }
    if (type === "mediums") {
      db.query("SELECT DISTINCT medium FROM artwork WHERE medium IS NOT NULL AND medium != '' ORDER BY medium", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results.map(r => r.medium));
      });
      return;
    }
    if (type === "statuses") {
      sendJSON(res, ["On Display", "In Storage", "On Loan", "Under Restoration"]);
      return;
    }
    if (type === "categories") {
      db.query("SELECT DISTINCT category FROM giftshopitem ORDER BY category", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results.map(r => r.category));
      });
      return;
    }
    if (type === "ticket-types") {
      db.query("SELECT DISTINCT ticket_type FROM ticket ORDER BY ticket_type", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results.map(r => r.ticket_type));
      });
      return;
    }
    if (type === "membership-levels") {
      db.query("SELECT DISTINCT membership_level FROM member ORDER BY membership_level", (err, results) => {
        if (err) return sendError(res, err);
        sendJSON(res, results.map(r => r.membership_level));
      });
      return;
    }
    
    sendJSON(res, { message: "No options found" });
    return;
  }

  // ==================== REPORT: TOP EVENT ATTENDEES ====================
  // Tables: event_signup, user, event
  if (parsedUrl.pathname === "/reports/top-event-attendees") {
    const limit = parseInt(query.limit) || 10;

    const sql = `
      SELECT 
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.email,
        u.role,
        COUNT(DISTINCT es.event_id) as total_events,
        SUM(es.quantity) as total_spots,
        MAX(es.signup_date) as last_signup_date,
        GROUP_CONCAT(DISTINCT e.event_type ORDER BY e.event_type SEPARATOR ', ') as event_types_attended
      FROM event_signup es
      JOIN user u ON es.user_id = u.user_id
      JOIN event e ON es.event_id = e.event_id
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.role
      ORDER BY total_events DESC, total_spots DESC
      LIMIT ?
    `;

    db.query(sql, [limit], (err, results) => {
      if (err) return sendError(res, err);

      const summarySql = `
        SELECT
          COUNT(DISTINCT user_id) as total_users_signed_up,
          COUNT(DISTINCT event_id) as total_events_with_signups,
          SUM(quantity) as total_spots_reserved,
          ROUND(AVG(quantity), 1) as avg_spots_per_signup,
          MAX(signup_date) as most_recent_signup
        FROM event_signup
      `;

      db.query(summarySql, (err, stats) => {
        if (err) return sendError(res, err);
        sendJSON(res, { data: results, summary: stats[0] });
      });
    });
    return;
  }

  // ==================== REPORT: EVENT PARTICIPATION VS TICKET PURCHASES ====================
  // Tables: event_signup, ticket, user
  if (parsedUrl.pathname === "/reports/event-vs-tickets") {

    const sql = `
      SELECT
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.email,
        u.role,
        COUNT(DISTINCT es.event_id) as events_signed_up,
        COUNT(DISTINCT t.ticket_id) as tickets_purchased,
        CASE
          WHEN COUNT(DISTINCT es.event_id) > 0 AND COUNT(DISTINCT t.ticket_id) > 0 THEN 'Both'
          WHEN COUNT(DISTINCT es.event_id) > 0 AND COUNT(DISTINCT t.ticket_id) = 0 THEN 'Events Only'
          WHEN COUNT(DISTINCT es.event_id) = 0 AND COUNT(DISTINCT t.ticket_id) > 0 THEN 'Tickets Only'
          ELSE 'Neither'
        END as engagement_type,
        ROUND(SUM(t.final_price), 2) as total_ticket_spend
      FROM user u
      LEFT JOIN event_signup es ON u.user_id = es.user_id
      LEFT JOIN ticket t ON u.user_id = t.user_id
      WHERE u.role IN ('visitor', 'member')
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.role
      ORDER BY events_signed_up DESC, tickets_purchased DESC
    `;

    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);

      const both        = results.filter(r => r.engagement_type === 'Both').length;
      const eventsOnly  = results.filter(r => r.engagement_type === 'Events Only').length;
      const ticketsOnly = results.filter(r => r.engagement_type === 'Tickets Only').length;
      const neither     = results.filter(r => r.engagement_type === 'Neither').length;
      const totalUsers  = results.length;

      const engagementBreakdown = [
        { type: "Both",         count: both,        percentage: totalUsers > 0 ? ((both / totalUsers) * 100).toFixed(1) : 0 },
        { type: "Events Only",  count: eventsOnly,  percentage: totalUsers > 0 ? ((eventsOnly / totalUsers) * 100).toFixed(1) : 0 },
        { type: "Tickets Only", count: ticketsOnly, percentage: totalUsers > 0 ? ((ticketsOnly / totalUsers) * 100).toFixed(1) : 0 },
        { type: "Neither",      count: neither,     percentage: totalUsers > 0 ? ((neither / totalUsers) * 100).toFixed(1) : 0 },
      ];

      sendJSON(res, {
        data: results,
        summary: {
          total_users:   totalUsers,
          both,
          events_only:   eventsOnly,
          tickets_only:  ticketsOnly,
          neither,
          most_engaged:  results[0]?.full_name || "—",
        },
        engagementBreakdown,
      });
    });
    return;
  }

// ==================== REPORT: MEMBER EVENT PARTICIPATION ====================
// Tables: event_signup, member, event
if (parsedUrl.pathname === "/reports/member-event-participation") {
  const sql = `
    SELECT m.user_id, CONCAT(u.first_name, ' ', u.last_name) as full_name,
      u.email, m.membership_level, m.join_date, m.expiration_date,
      COUNT(DISTINCT es.event_id) as total_events_attended,
      SUM(es.quantity) as total_spots_reserved,
      MAX(es.signup_date) as last_event_signup,
      GROUP_CONCAT(DISTINCT e.event_type ORDER BY e.event_type SEPARATOR ', ') as event_types_attended
    FROM member m
    JOIN user u ON m.user_id = u.user_id
    LEFT JOIN event_signup es ON m.user_id = es.user_id
    LEFT JOIN event e ON es.event_id = e.event_id
    GROUP BY m.user_id, u.first_name, u.last_name, u.email, m.membership_level, m.join_date, m.expiration_date
    ORDER BY total_events_attended DESC, m.membership_level
  `;
  db.query(sql, (err, results) => {
    if (err) return sendError(res, err);
    const byLevelSql = `
      SELECT m.membership_level,
        COUNT(DISTINCT m.user_id) as total_members,
        COUNT(DISTINCT es.signup_id) as total_signups,
        SUM(es.quantity) as total_spots,
        ROUND(AVG(sub.event_count), 1) as avg_events_per_member
      FROM member m
      LEFT JOIN event_signup es ON m.user_id = es.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(DISTINCT event_id) as event_count
        FROM event_signup GROUP BY user_id
      ) sub ON m.user_id = sub.user_id
      GROUP BY m.membership_level
      ORDER BY total_signups DESC
    `;
    db.query(byLevelSql, (err, byLevel) => {
      if (err) return sendError(res, err);
      const summarySql = `
        SELECT COUNT(DISTINCT m.user_id) as total_members,
          COUNT(DISTINCT es.user_id) as members_who_attended,
          COUNT(DISTINCT es.event_id) as unique_events_attended,
          SUM(es.quantity) as total_spots_reserved,
          ROUND(AVG(sub.event_count), 1) as avg_events_per_active_member
        FROM member m
        LEFT JOIN event_signup es ON m.user_id = es.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(DISTINCT event_id) as event_count
          FROM event_signup GROUP BY user_id
        ) sub ON m.user_id = sub.user_id
        WHERE es.user_id IS NOT NULL
      `;
      db.query(summarySql, (err, stats) => {
        if (err) return sendError(res, err);
        sendJSON(res, { data: results, summary: stats[0], byLevel: byLevel });
      });
    });
  });
  return;
}

  // 404 for unmatched routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Report endpoint not found" }));
};

function sendJSON(res, data, status = 200) {
  res.setHeader("Content-Type", "application/json");
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function sendError(res, err) {
  console.error("Database error:", err);
  res.setHeader("Content-Type", "application/json");
  res.writeHead(500);
  res.end(JSON.stringify({ error: err.message || err }));
}