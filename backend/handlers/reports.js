const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const query = parsedUrl.query;
  console.log("📊 reports.js handler called for:", parsedUrl.pathname);

  // ==================== TEST ENDPOINT ====================
  if (parsedUrl.pathname === "/reports/test") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Reports handler is working!", timestamp: Date.now() }));
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
        SELECT 'Ticket' as source, t.ticket_id as id, t.purchase_date as date,
          t.ticket_type as type, t.final_price as amount, t.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM ticket t LEFT JOIN user u ON t.user_id = u.user_id
        WHERE t.purchase_date >= ? AND t.purchase_date <= ?
      `);
      params.push(startDate, endDate);
    }
    if (type === "donation" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 'Donation' as source, d.donation_id as id, d.donation_date as date,
          d.donation_type as type, d.amount as amount, NULL as payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM donation d LEFT JOIN user u ON d.user_id = u.user_id
        WHERE d.donation_date >= ? AND d.donation_date <= ?
      `);
      params.push(startDate, endDate);
    }
    if (type === "cafe" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 'Cafe' as source, ct.cafe_transaction_id as id, DATE(ct.transaction_datetime) as date,
          NULL as type, ct.total_amount as amount, ct.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM cafetransaction ct LEFT JOIN user u ON ct.user_id = u.user_id
        WHERE DATE(ct.transaction_datetime) >= ? AND DATE(ct.transaction_datetime) <= ?
      `);
      params.push(startDate, endDate);
    }
    if (type === "gift" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 'Gift Shop' as source, gt.transaction_id as id, DATE(gt.transaction_datetime) as date,
          NULL as type, gt.total_amount as amount, gt.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM giftshoptransaction gt LEFT JOIN user u ON gt.user_id = u.user_id
        WHERE DATE(gt.transaction_datetime) >= ? AND DATE(gt.transaction_datetime) <= ?
      `);
      params.push(startDate, endDate);
    }
    const finalSql = sqlParts.join(" ") + " ORDER BY date DESC";
    db.query(finalSql, params, (err, results) => {
      if (err) { console.error("Revenue query error:", err); return sendError(res, err); }
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
      startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate,
      startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate
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
        totalRevenue, totalTransactions,
        avgTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        ticketRevenue, donationRevenue, cafeRevenue, giftShopRevenue: giftRevenue
      });
    });
    return;
  }

  // ==================== REPORT 2: ART COLLECTION REPORT ====================
  if (parsedUrl.pathname === "/reports/art-collection-data") {
    const artistId  = query.artistId  || "";
    const startYear = query.startYear || "";
    const endYear   = query.endYear   || "";
    const status    = query.status    || "";
    const medium    = query.medium    || "";
    const minValue  = query.minValue  || "";
    const maxValue  = query.maxValue  || "";
    let sql = `
      SELECT a.artwork_id, a.title, a.creation_year, a.medium, a.dimensions,
        a.current_display_status, a.insurance_value,
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        ar.nationality as artist_nationality,
        g.gallery_name, g.is_active as gallery_active, b.building_name, b.building_id
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      LEFT JOIN gallery g ON a.gallery_id = g.gallery_id
      LEFT JOIN museumbuilding b ON g.building_id = b.building_id
      WHERE a.is_active = 1
    `;
    const params = [];
    if (artistId)  { sql += ` AND a.artist_id = ?`;              params.push(artistId); }
    if (startYear) { sql += ` AND a.creation_year >= ?`;         params.push(startYear); }
    if (endYear)   { sql += ` AND a.creation_year <= ?`;         params.push(endYear); }
    if (status)    { sql += ` AND a.current_display_status = ?`; params.push(status); }
    if (medium)    { sql += ` AND a.medium = ?`;                 params.push(medium); }
    if (minValue)  { sql += ` AND a.insurance_value >= ?`;       params.push(minValue); }
    if (maxValue)  { sql += ` AND a.insurance_value <= ?`;       params.push(maxValue); }
    sql += ` ORDER BY a.creation_year DESC`;
    db.query(sql, params, (err, results) => {
      if (err) return sendError(res, err);
      const statsSql = `
        SELECT COUNT(*) as total_artworks, ROUND(SUM(insurance_value), 2) as total_value,
          ROUND(AVG(insurance_value), 2) as avg_value, COUNT(DISTINCT artist_id) as total_artists,
          COUNT(DISTINCT medium) as total_mediums, COUNT(DISTINCT gallery_id) as total_galleries_used
        FROM artwork a WHERE a.is_active = 1
      `;
      db.query(statsSql, (err, stats) => {
        if (err) return sendError(res, err);
        sendJSON(res, { data: results, summary: stats[0] });
      });
    });
    return;
  }

  // ==================== REPORT 3: MEMBERSHIP & DONOR REPORT ====================
  if (parsedUrl.pathname === "/reports/membership-donor") {
    const startDate = query.startDate || "1900-01-01";
    const endDate = query.endDate || new Date().toISOString().split('T')[0];
    
    // 1. MEMBERSHIP SUMMARY
    const membershipSummarySql = `
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN expiration_date >= CURDATE() THEN 1 END) as active_members,
        COUNT(CASE WHEN expiration_date < CURDATE() THEN 1 END) as expired_members,
        ROUND(AVG(DATEDIFF(expiration_date, join_date)), 0) as avg_membership_days
      FROM member
    `;
    
    // 2. MEMBERSHIP LEVEL BREAKDOWN
    const membershipLevelsSql = `
      SELECT 
        membership_level,
        COUNT(*) as count,
        ROUND(AVG(DATEDIFF(expiration_date, join_date)), 0) as avg_duration_days
      FROM member
      WHERE expiration_date >= CURDATE()
      GROUP BY membership_level
      ORDER BY 
        CASE membership_level
          WHEN 'Bronze' THEN 1
          WHEN 'Silver' THEN 2
          WHEN 'Gold' THEN 3
          WHEN 'Platinum' THEN 4
          WHEN 'Benefactor' THEN 5
          WHEN 'Leadership Circle' THEN 6
          ELSE 7
        END
    `;
    
    // 3. DONATION SUMMARY
    const donationSummarySql = `
      SELECT 
        ROUND(SUM(amount), 2) as total_donations,
        COUNT(*) as total_donations_count,
        ROUND(AVG(amount), 2) as avg_donation,
        COUNT(DISTINCT user_id) as unique_donors
      FROM donation
      WHERE donation_date BETWEEN ? AND ?
    `;
    
    // 4. DONATION TRENDS BY MONTH
    const donationTrendsSql = `
      SELECT 
        DATE_FORMAT(donation_date, '%Y-%m') as month,
        ROUND(SUM(amount), 2) as total,
        COUNT(*) as count,
        ROUND(AVG(amount), 2) as avg_amount
      FROM donation
      WHERE donation_date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(donation_date, '%Y-%m')
      ORDER BY month ASC
    `;
    
    // 5. DONATION BREAKDOWN BY TYPE
    const donationByTypeSql = `
      SELECT 
        donation_type,
        ROUND(SUM(amount), 2) as total,
        COUNT(*) as count,
        ROUND(AVG(amount), 2) as avg_amount
      FROM donation
      WHERE donation_date BETWEEN ? AND ?
      GROUP BY donation_type
      ORDER BY total DESC
    `;
    
    // 6. MEMBERSHIP TRANSACTIONS (New/Renewal/Upgrade)
    const membershipTransactionsSql = `
      SELECT 
        transaction_type,
        COUNT(*) as count,
        ROUND(SUM(amount), 2) as total_amount,
        ROUND(AVG(amount), 2) as avg_amount
      FROM membershiptransaction
      WHERE transaction_date BETWEEN ? AND ?
      GROUP BY transaction_type
    `;
    
    // 7. TOP DONORS
    const topDonorsSql = `
      SELECT 
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.city,
        u.state,
        COUNT(d.donation_id) as donation_count,
        ROUND(SUM(d.amount), 2) as total_donated,
        MAX(d.donation_date) as last_donation_date,
        CASE WHEN m.user_id IS NOT NULL THEN m.membership_level ELSE NULL END as membership_level
      FROM donation d
      JOIN user u ON d.user_id = u.user_id
      LEFT JOIN member m ON u.user_id = m.user_id AND m.expiration_date >= CURDATE()
      WHERE d.donation_date BETWEEN ? AND ?
      GROUP BY u.user_id, u.first_name, u.last_name, u.city, u.state, m.membership_level
      ORDER BY total_donated DESC
      LIMIT 10
    `;
    
    // 8. RECENT MEMBERSHIP ACTIVITY
    const recentMembershipActivitySql = `
      SELECT 
        mt.transaction_id,
        CONCAT(u.first_name, ' ', u.last_name) as member_name,
        mt.membership_level,
        mt.transaction_type,
        mt.transaction_date,
        mt.amount,
        mt.payment_method
      FROM membershiptransaction mt
      JOIN user u ON mt.user_id = u.user_id
      WHERE mt.transaction_date BETWEEN ? AND ?
      ORDER BY mt.transaction_date DESC
      LIMIT 20
    `;
    
    Promise.all([
      new Promise((res, rej) => db.query(membershipSummarySql, (err, r) => err ? rej(err) : res(r[0]))),
      new Promise((res, rej) => db.query(membershipLevelsSql, (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(donationSummarySql, [startDate, endDate], (err, r) => err ? rej(err) : res(r[0]))),
      new Promise((res, rej) => db.query(donationTrendsSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(donationByTypeSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(membershipTransactionsSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(topDonorsSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(recentMembershipActivitySql, [startDate, endDate], (err, r) => err ? rej(err) : res(r)))
    ])
    .then(([membershipSummary, membershipLevels, donationSummary, donationTrends, donationByType, membershipTransactions, topDonors, recentActivity]) => {
      
      // Calculate upgrade rate from transactions
      const totalTransactions = (membershipTransactions[0]?.count || 0) + 
                                (membershipTransactions[1]?.count || 0) + 
                                (membershipTransactions[2]?.count || 0);
      const upgrades = membershipTransactions.find(t => t.transaction_type === 'Upgrade')?.count || 0;
      const upgradeRate = totalTransactions > 0 ? ((upgrades / totalTransactions) * 100).toFixed(1) : 0;
      
      const enhancedMembershipSummary = {
        ...membershipSummary,
        upgrade_rate: upgradeRate,
        total_members: membershipSummary.total_members || 0,
        active_members: membershipSummary.active_members || 0,
        expired_members: membershipSummary.expired_members || 0
      };
      
      sendJSON(res, {
        summary: enhancedMembershipSummary,
        membershipLevels,
        donationSummary,
        donationTrends,
        donationByType,
        membershipTransactions,
        topDonors,
        recentActivity
      });
    })
    .catch(err => sendError(res, err));
    return;
  }

  // ==================== REPORT: VISITOR ANALYTICS ====================
  if (parsedUrl.pathname === "/reports/visitor-analytics") {
    const startDate = query.startDate || "1900-01-01";
    const endDate = query.endDate || new Date().toISOString().split('T')[0];
    
    // 1. OVERALL SUMMARY
    const summarySql = `
      SELECT 
        (SELECT COUNT(*) FROM user WHERE role IN ('visitor', 'member')) as total_visitors,
        (SELECT COUNT(*) FROM member WHERE expiration_date >= CURDATE()) as active_members,
        (SELECT COUNT(*) FROM ticket WHERE purchase_date BETWEEN ? AND ?) as total_tickets_sold,
        (SELECT ROUND(SUM(final_price), 2) FROM ticket WHERE purchase_date BETWEEN ? AND ?) as total_ticket_revenue,
        (SELECT COUNT(DISTINCT user_id) FROM ticket WHERE purchase_date BETWEEN ? AND ?) as unique_paying_visitors,
        (SELECT ROUND(AVG(total_visits), 1) FROM visitor WHERE total_visits > 0) as avg_visits_per_visitor,
        (SELECT COUNT(*) FROM event_signup WHERE signup_date BETWEEN ? AND ?) as total_event_signups,
        (SELECT ROUND(SUM(amount), 2) FROM donation WHERE donation_date BETWEEN ? AND ?) as total_donations
    `;
    
    // 2. DAILY VISITOR TRENDS
    const dailyTrendsSql = `
      SELECT 
        DATE(t.purchase_date) as date,
        COUNT(DISTINCT t.user_id) as unique_visitors,
        COUNT(*) as tickets_sold,
        ROUND(SUM(t.final_price), 2) as revenue,
        COUNT(DISTINCT CASE WHEN m.user_id IS NOT NULL THEN t.user_id END) as member_visitors
      FROM ticket t
      LEFT JOIN member m ON t.user_id = m.user_id AND m.expiration_date >= CURDATE()
      WHERE t.purchase_date BETWEEN ? AND ?
      GROUP BY DATE(t.purchase_date)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    // 3. VISITOR TYPE BREAKDOWN
    const visitorBreakdownSql = `
      SELECT 
        CASE 
          WHEN m.user_id IS NOT NULL AND m.expiration_date >= CURDATE() THEN 'Member'
          ELSE 'Non-Member'
        END as visitor_type,
        COUNT(DISTINCT t.user_id) as visitor_count,
        COUNT(t.ticket_id) as tickets_purchased,
        ROUND(SUM(t.final_price), 2) as total_spent,
        ROUND(AVG(t.final_price), 2) as avg_ticket_price
      FROM ticket t
      LEFT JOIN member m ON t.user_id = m.user_id AND m.expiration_date >= CURDATE()
      WHERE t.purchase_date BETWEEN ? AND ?
      GROUP BY visitor_type
    `;
    
    // 4. TOP VISITORS (most frequent)
    const topVisitorsSql = `
      SELECT 
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.city,
        u.state,
        COUNT(DISTINCT DATE(t.purchase_date)) as visit_days,
        COUNT(t.ticket_id) as tickets_purchased,
        ROUND(SUM(t.final_price), 2) as total_spent,
        MAX(t.purchase_date) as last_visit,
        CASE WHEN m.user_id IS NOT NULL AND m.expiration_date >= CURDATE() 
            THEN m.membership_level 
            ELSE NULL 
        END as membership_level
      FROM ticket t
      JOIN user u ON t.user_id = u.user_id
      LEFT JOIN member m ON u.user_id = m.user_id AND m.expiration_date >= CURDATE()
      WHERE t.purchase_date BETWEEN ? AND ?
      GROUP BY u.user_id, u.first_name, u.last_name, u.city, u.state, m.membership_level
      ORDER BY visit_days DESC, total_spent DESC
      LIMIT 10
    `;
    
    // 5. PEAK VISITING HOURS (based on ticket purchase times - approximated)
    const peakHoursSql = `
      SELECT 
        HOUR(t.purchase_date) as hour,
        COUNT(*) as tickets_sold,
        COUNT(DISTINCT t.user_id) as unique_visitors
      FROM ticket t
      WHERE t.purchase_date BETWEEN ? AND ?
      GROUP BY HOUR(t.purchase_date)
      ORDER BY hour ASC
    `;
    
    Promise.all([
      new Promise((res, rej) => db.query(summarySql, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate], (err, r) => err ? rej(err) : res(r[0]))),
      new Promise((res, rej) => db.query(dailyTrendsSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(visitorBreakdownSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(topVisitorsSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(peakHoursSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r)))
    ])
    .then(([summary, dailyTrends, visitorBreakdown, topVisitors, peakHours]) => {
      // Calculate additional insights
      const totalRevenue = summary.total_ticket_revenue || 0;
      const uniqueVisitors = summary.unique_paying_visitors || 1;
      
      const enhancedSummary = {
        ...summary,
        avg_revenue_per_visitor: (totalRevenue / uniqueVisitors).toFixed(2),
        new_visitors: dailyTrends.filter(d => d.unique_visitors > 0).length || 0
      };
      
      sendJSON(res, {
        summary: enhancedSummary,
        dailyTrends,
        visitorBreakdown,
        topVisitors,
        peakHours
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
    if (type === "statuses") { sendJSON(res, ["On Display", "In Storage", "On Loan", "Under Restoration"]); return; }
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