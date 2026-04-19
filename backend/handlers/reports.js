const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const query = parsedUrl.query;
  console.log("reports.js handler called for:", parsedUrl.pathname);

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
    
    let sqlParts = [];
    let params = [];
    
    if (type === "ticket" || type === "all") {
      sqlParts.push(`
        SELECT 
          'Ticket' as source,
          'Ticket' as source_with_icon,
          t.purchase_date as date,
          DAYNAME(t.purchase_date) as day_of_week,
          WEEK(t.purchase_date) as week_number,
          MONTHNAME(t.purchase_date) as month_name,
          t.ticket_type as type,
          t.final_price as amount,
          t.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          CASE WHEN m.user_id IS NOT NULL THEN 'Member' ELSE 'Non-Member' END as customer_type,
          CASE 
            WHEN t.final_price >= 100 THEN 'High ($100+)'
            WHEN t.final_price >= 50 THEN 'Medium ($50-99)'
            WHEN t.final_price >= 20 THEN 'Low ($20-49)'
            ELSE 'Small (<$20)'
          END as revenue_tier
        FROM ticket t 
        LEFT JOIN user u ON t.user_id = u.user_id
        LEFT JOIN member m ON t.user_id = m.user_id AND m.expiration_date >= CURDATE()
        WHERE t.purchase_date >= ? AND t.purchase_date <= ?
      `);
      params.push(startDate, endDate);
    }
    
    if (type === "donation" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 
          'Donation' as source,
          'Donation' as source_with_icon,
          d.donation_date as date,
          DAYNAME(d.donation_date) as day_of_week,
          WEEK(d.donation_date) as week_number,
          MONTHNAME(d.donation_date) as month_name,
          d.donation_type as type,
          d.amount as amount,
          NULL as payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          CASE WHEN m.user_id IS NOT NULL THEN 'Member' ELSE 'Non-Member' END as customer_type,
          CASE 
            WHEN d.amount >= 1000 THEN 'Major ($1000+)'
            WHEN d.amount >= 500 THEN 'Significant ($500-999)'
            WHEN d.amount >= 100 THEN 'Moderate ($100-499)'
            ELSE 'Small (<$100)'
          END as revenue_tier
        FROM donation d 
        LEFT JOIN user u ON d.user_id = u.user_id
        LEFT JOIN member m ON d.user_id = m.user_id AND m.expiration_date >= CURDATE()
        WHERE d.donation_date >= ? AND d.donation_date <= ?
      `);
      params.push(startDate, endDate);
    }
    
    if (type === "cafe" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 
          'Cafe' as source,
          'Cafe' as source_with_icon,
          DATE(ct.transaction_datetime) as date,
          DAYNAME(ct.transaction_datetime) as day_of_week,
          WEEK(ct.transaction_datetime) as week_number,
          MONTHNAME(ct.transaction_datetime) as month_name,
          'Cafe Purchase' as type,
          ct.total_amount as amount,
          ct.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          CASE WHEN m.user_id IS NOT NULL THEN 'Member' ELSE 'Non-Member' END as customer_type,
          CASE 
            WHEN ct.total_amount >= 50 THEN 'High ($50+)'
            WHEN ct.total_amount >= 25 THEN 'Medium ($25-49)'
            ELSE 'Small (<$25)'
          END as revenue_tier
        FROM cafetransaction ct 
        LEFT JOIN user u ON ct.user_id = u.user_id
        LEFT JOIN member m ON ct.user_id = m.user_id AND m.expiration_date >= CURDATE()
        WHERE DATE(ct.transaction_datetime) >= ? AND DATE(ct.transaction_datetime) <= ?
      `);
      params.push(startDate, endDate);
    }
    
    if (type === "gift" || type === "all") {
      if (sqlParts.length > 0) sqlParts.push("UNION ALL");
      sqlParts.push(`
        SELECT 
          'Gift Shop' as source,
          'Gift Shop' as source_with_icon,
          DATE(gt.transaction_datetime) as date,
          DAYNAME(gt.transaction_datetime) as day_of_week,
          WEEK(gt.transaction_datetime) as week_number,
          MONTHNAME(gt.transaction_datetime) as month_name,
          'Gift Purchase' as type,
          gt.total_amount as amount,
          gt.payment_method,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          CASE WHEN m.user_id IS NOT NULL THEN 'Member' ELSE 'Non-Member' END as customer_type,
          CASE 
            WHEN gt.total_amount >= 100 THEN 'High ($100+)'
            WHEN gt.total_amount >= 50 THEN 'Medium ($50-99)'
            ELSE 'Small (<$50)'
          END as revenue_tier
        FROM giftshoptransaction gt 
        LEFT JOIN user u ON gt.user_id = u.user_id
        LEFT JOIN member m ON gt.user_id = m.user_id AND m.expiration_date >= CURDATE()
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

  // ==================== REPORT 2: ART COLLECTION REPORT (ENHANCED) ====================
  if (parsedUrl.pathname === "/reports/art-collection-data") {
    const artistId  = query.artistId  || "";
    const startYear = query.startYear || "";
    const endYear   = query.endYear   || "";
    const status    = query.status    || "";
    const medium    = query.medium    || "";
    const minValue  = query.minValue  || "";
    const maxValue  = query.maxValue  || "";
    
    let sql = `
      SELECT 
        a.artwork_id, 
        a.title, 
        a.image_url,
        a.creation_year, 
        a.medium, 
        a.current_display_status, 
        a.insurance_value,
        a.acquisition_date,
        
        -- REPLACED COLUMNS (calculated data instead of raw)
        (YEAR(CURDATE()) - a.creation_year) as age_years,          
        CASE 
          WHEN a.insurance_value >= 100000000 THEN 'Iconic ($100M+)'
          WHEN a.insurance_value >= 50000000 THEN 'Priceless ($50M-100M)'
          WHEN a.insurance_value >= 10000000 THEN 'Major ($10M-50M)'
          WHEN a.insurance_value >= 1000000 THEN 'Significant ($1M-10M)'
          ELSE 'Standard (<$1M)'
        END as value_category,                                      
        (a.creation_year - ar.birth_year) as artist_age_at_creation, 
        -- Artist info
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        ar.nationality as artist_nationality,
        
        -- Gallery info
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
        SELECT 
          COUNT(*) as total_artworks, 
          ROUND(SUM(insurance_value), 2) as total_value,
          ROUND(AVG(insurance_value), 2) as avg_value, 
          COUNT(DISTINCT artist_id) as total_artists,
          COUNT(DISTINCT medium) as total_mediums, 
          COUNT(DISTINCT gallery_id) as total_galleries_used,
          
          -- Additional calculated summary stats
          ROUND(AVG(YEAR(CURDATE()) - creation_year), 1) as avg_age_years,
          MIN(creation_year) as oldest_artwork_year,
          MAX(creation_year) as newest_artwork_year,
          COUNT(CASE WHEN current_display_status = 'On Display' THEN 1 END) as on_display_count,
          COUNT(CASE WHEN current_display_status = 'In Storage' THEN 1 END) as in_storage_count,
          COUNT(CASE WHEN current_display_status = 'On Loan' THEN 1 END) as on_loan_count,
          COUNT(CASE WHEN current_display_status = 'Under Restoration' THEN 1 END) as under_restoration_count,
          ROUND(SUM(CASE WHEN current_display_status = 'On Display' THEN insurance_value ELSE 0 END), 2) as value_on_display,
          ROUND(SUM(CASE WHEN current_display_status IN ('On Loan', 'In Storage') THEN insurance_value ELSE 0 END), 2) as value_at_risk
          
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

  // ==================== REPORT: VISITOR ANALYTICS (FOCUSED ON BEHAVIOR, NOT REVENUE) ====================
  if (parsedUrl.pathname === "/reports/visitor-analytics") {
    let startDate = query.startDate;
    let endDate = query.endDate;
    
    // If no date range provided, use a wide default range
    if (!startDate || startDate === "") startDate = "1900-01-01";
    if (!endDate || endDate === "") endDate = new Date().toISOString().split('T')[0];
    
    // 1. OVERALL SUMMARY
    const summarySql = `
      SELECT 
        (SELECT COUNT(*) FROM user WHERE role IN ('visitor', 'member')) as total_visitors,
        (SELECT COUNT(*) FROM member WHERE expiration_date >= CURDATE()) as active_members,
        (SELECT COUNT(DISTINCT user_id) FROM ticket WHERE purchase_date BETWEEN ? AND ?) as unique_visitors,
        (SELECT ROUND(AVG(total_visits), 1) FROM visitor WHERE total_visits > 0) as avg_visits_per_visitor,
        (SELECT COUNT(*) FROM event_signup WHERE signup_date BETWEEN ? AND ?) as total_event_signups,
        (SELECT COUNT(DISTINCT user_id) FROM event_signup WHERE signup_date BETWEEN ? AND ?) as unique_event_participants,
        (SELECT COUNT(DISTINCT user_id) FROM donation WHERE donation_date BETWEEN ? AND ?) as unique_donors,
        (SELECT COUNT(*) FROM ticket WHERE purchase_date BETWEEN ? AND ?) as total_tickets_sold,
        (SELECT COUNT(DISTINCT DATE(purchase_date)) FROM ticket WHERE purchase_date BETWEEN ? AND ?) as active_days
      `;
    
    // 2. DAILY VISITOR TRENDS
    const dailyTrendsSql = `
      SELECT 
        DATE(t.purchase_date) as date,
        COUNT(DISTINCT t.user_id) as unique_visitors,
        COUNT(*) as tickets_sold,
        COUNT(DISTINCT CASE WHEN m.user_id IS NOT NULL THEN t.user_id END) as member_visitors,
        COUNT(DISTINCT CASE WHEN m.user_id IS NULL THEN t.user_id END) as non_member_visitors
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
        COUNT(DISTINCT DATE(t.purchase_date)) as unique_visit_days
      FROM ticket t
      LEFT JOIN member m ON t.user_id = m.user_id AND m.expiration_date >= CURDATE()
      WHERE t.purchase_date BETWEEN ? AND ?
      GROUP BY visitor_type
    `;
    
    // 4. ALL VISITORS (removed LIMIT to show everyone)
    const topVisitorsSql = `
      SELECT 
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.city,
        u.state,
        COUNT(DISTINCT DATE(t.purchase_date)) as visit_days,
        COUNT(t.ticket_id) as tickets_purchased,
        MAX(t.purchase_date) as last_visit,
        CASE WHEN m.user_id IS NOT NULL AND m.expiration_date >= CURDATE() 
            THEN m.membership_level 
            ELSE NULL 
        END as membership_level,
        (SELECT COUNT(*) FROM event_signup es WHERE es.user_id = u.user_id) as events_attended
      FROM ticket t
      JOIN user u ON t.user_id = u.user_id
      LEFT JOIN member m ON u.user_id = m.user_id AND m.expiration_date >= CURDATE()
      WHERE t.purchase_date BETWEEN ? AND ?
      GROUP BY u.user_id, u.first_name, u.last_name, u.city, u.state, m.membership_level
      ORDER BY visit_days DESC, tickets_purchased DESC
    `;
    
    // 5. VISIT FREQUENCY DISTRIBUTION
    const frequencyDistributionSql = `
      SELECT 
        CASE 
          WHEN visit_counts.visit_count = 1 THEN 'First-time'
          WHEN visit_counts.visit_count BETWEEN 2 AND 3 THEN 'Occasional (2-3 visits)'
          WHEN visit_counts.visit_count BETWEEN 4 AND 6 THEN 'Regular (4-6 visits)'
          WHEN visit_counts.visit_count >= 7 THEN 'Frequent (7+ visits)'
          ELSE 'Unknown'
        END as frequency_group,
        COUNT(*) as visitor_count
      FROM (
        SELECT t.user_id, COUNT(DISTINCT DATE(t.purchase_date)) as visit_count
        FROM ticket t
        WHERE t.purchase_date BETWEEN ? AND ?
        GROUP BY t.user_id
      ) as visit_counts
      GROUP BY frequency_group
      ORDER BY 
        CASE frequency_group
          WHEN 'First-time' THEN 1
          WHEN 'Occasional (2-3 visits)' THEN 2
          WHEN 'Regular (4-6 visits)' THEN 3
          WHEN 'Frequent (7+ visits)' THEN 4
          ELSE 5
        END
    `;
    
    // 6. RETENTION RATE (FIXED - based on multiple visits within the period, not first visit date)
    const retentionRateSql = `
      SELECT 
        COUNT(DISTINCT t.user_id) as total_visitors_in_period,
        COUNT(DISTINCT CASE 
          WHEN visit_counts.visit_count >= 2 THEN t.user_id 
        END) as returning_visitors
      FROM ticket t
      INNER JOIN (
        SELECT user_id, COUNT(DISTINCT DATE(purchase_date)) as visit_count
        FROM ticket
        WHERE purchase_date BETWEEN ? AND ?
        GROUP BY user_id
      ) as visit_counts ON t.user_id = visit_counts.user_id
      WHERE t.purchase_date BETWEEN ? AND ?
    `;
    
    Promise.all([
      new Promise((res, rej) => db.query(summarySql, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate], (err, r) => err ? rej(err) : res(r[0]))),
      new Promise((res, rej) => db.query(dailyTrendsSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(visitorBreakdownSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(topVisitorsSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(frequencyDistributionSql, [startDate, endDate], (err, r) => err ? rej(err) : res(r))),
      new Promise((res, rej) => db.query(retentionRateSql, [startDate, endDate, startDate, endDate], (err, r) => err ? rej(err) : res(r[0])))
    ])
    .then(([summary, dailyTrends, visitorBreakdown, topVisitors, frequencyDistribution, retentionData]) => {
      
      // Calculate retention rate from the retention query
      const totalVisitorsInPeriod = retentionData.total_visitors_in_period || summary.unique_visitors || 0;
      const returningVisitors = retentionData.returning_visitors || 0;
      const retentionRate = totalVisitorsInPeriod > 0 ? ((returningVisitors / totalVisitorsInPeriod) * 100).toFixed(1) : 0;
      
      const enhancedSummary = {
        ...summary,
        retention_rate: retentionRate,
        returning_visitors: returningVisitors,
        new_visitors: totalVisitorsInPeriod - returningVisitors
      };
      
      sendJSON(res, {
        summary: enhancedSummary,
        dailyTrends,
        visitorBreakdown,
        topVisitors,
        frequencyDistribution
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