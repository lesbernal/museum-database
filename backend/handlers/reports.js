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
// Tables: ticket, donation, cafetransaction, giftshoptransaction
// Filter: startDate, endDate, type (ticket/donation/cafe/gift)
  if (parsedUrl.pathname === "/reports/revenue-data") {
    let startDate = query.startDate;
    let endDate = query.endDate;
    const type = query.type || "all";
    
    // If no dates provided, use a wide range (earliest possible to latest possible)
    if (!startDate || startDate === "") {
      startDate = "1900-01-01";
    }
    if (!endDate || endDate === "") {
      endDate = "2099-12-31";
    }
    
    console.log("Revenue query - startDate:", startDate, "endDate:", endDate, "type:", type);
    
    let sqlParts = [];
    let params = [];
    
    // TICKETS
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
    
    // DONATIONS
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
    
    // CAFE
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
    
    // GIFT SHOP
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
    
    console.log("Revenue query params:", params);
    
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
    
    if (!startDate || startDate === "") {
      startDate = "1900-01-01";
    }
    if (!endDate || endDate === "") {
      endDate = "2099-12-31";
    }
    
    console.log("Summary query - startDate:", startDate, "endDate:", endDate);
    
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
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate
    ];
    
    db.query(sql, params, (err, results) => {
      if (err) return sendError(res, err);
      const summary = results[0];
      
      const ticketRevenue = Number(summary.ticket_revenue) || 0;
      const donationRevenue = Number(summary.donation_revenue) || 0;
      const cafeRevenue = Number(summary.cafe_revenue) || 0;
      const giftRevenue = Number(summary.gift_revenue) || 0;
      const ticketCount = Number(summary.ticket_count) || 0;
      const donationCount = Number(summary.donation_count) || 0;
      const cafeCount = Number(summary.cafe_count) || 0;
      const giftCount = Number(summary.gift_count) || 0;
      
      const totalRevenue = ticketRevenue + donationRevenue + cafeRevenue + giftRevenue;
      const totalTransactions = ticketCount + donationCount + cafeCount + giftCount;
      
      sendJSON(res, {
        totalRevenue: totalRevenue,
        totalTransactions: totalTransactions,
        avgTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        ticketRevenue: ticketRevenue,
        donationRevenue: donationRevenue,
        cafeRevenue: cafeRevenue,
        giftShopRevenue: giftRevenue
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
  // Tables: giftshopitem, giftshoptransaction, giftshoptransactionitem
  // Filter: startDate, endDate, category
  
  if (parsedUrl.pathname === "/reports/giftshop-data") {
    const startDate = query.startDate || "1900-01-01";
    const endDate = query.endDate || "2099-12-31";
    const category = query.category || "";
    
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
      
      // Also get summary statistics
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
  // Tables: user, visitor, member, ticket, event
  // Filter: startDate, endDate, membershipLevel, ticketType
  
  if (parsedUrl.pathname === "/reports/visitor-analytics") {
    const startDate = query.startDate || "1900-01-01";
    const endDate = query.endDate || new Date().toISOString().split('T')[0];
    const membershipLevel = query.membershipLevel || "";
    const ticketType = query.ticketType || "";
    
    // 1. Get list of visitors with their details
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
    
    // 2. Get ticket sales summary
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
    
    // 3. Get daily attendance (visits)
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
    
    // 4. Get member statistics
    const memberStatsSql = `
      SELECT 
        membership_level,
        COUNT(*) as count,
        ROUND(AVG(DATEDIFF(expiration_date, join_date))) as avg_membership_days
      FROM member
      GROUP BY membership_level
    `;
    
    // 5. Get event attendance
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
    
    // Execute all queries in parallel
    Promise.all([
      new Promise((resolve, reject) => {
        db.query(visitorsSql, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(ticketsSql, [startDate, endDate], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(attendanceSql, [startDate, endDate], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(memberStatsSql, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(eventSql, [startDate, endDate], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
    ])
    .then(([visitors, tickets, attendance, memberStats, events]) => {
      // Calculate summary statistics
      const summary = {
        total_visitors: visitors.length,
        total_members: visitors.filter(v => v.is_member === 'Yes').length,
        total_visits: visitors.reduce((sum, v) => sum + (v.total_visits || 0), 0),
        avg_visits_per_visitor: (visitors.reduce((sum, v) => sum + (v.total_visits || 0), 0) / visitors.length || 0).toFixed(1),
        total_tickets_sold: tickets.reduce((sum, t) => sum + t.count, 0),
        total_ticket_revenue: tickets.reduce((sum, t) => sum + t.total_revenue, 0),
        most_popular_ticket: tickets.reduce((a, b) => a.count > b.count ? a : b, { ticket_type: 'None', count: 0 }).ticket_type,
        total_events: events.length,
        avg_event_attendance: (events.reduce((sum, e) => sum + e.total_attendees, 0) / events.length || 0).toFixed(1)
      };
      
      sendJSON(res, {
        summary,
        visitors,
        tickets,
        attendance,
        memberStats,
        events
      });
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
    
    sendJSON(res, { message: "No options found" });
    return;
  }

    // Helper: Get ticket types
  if (parsedUrl.pathname === "/reports/filter-options" && query.type === "ticket-types") {
    db.query("SELECT DISTINCT ticket_type FROM ticket ORDER BY ticket_type", (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results.map(r => r.ticket_type));
    });
    return;
  }
  
  // Helper: Get membership levels
  if (parsedUrl.pathname === "/reports/filter-options" && query.type === "membership-levels") {
    db.query("SELECT DISTINCT membership_level FROM member ORDER BY membership_level", (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results.map(r => r.membership_level));
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