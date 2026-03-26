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

  // ==================== REPORT 1: REVENUE (Tickets + Donations) ====================
  if (parsedUrl.pathname === "/reports/revenue-summary") {
    const sql = `
      SELECT 
        -- Ticket Summary
        (SELECT ROUND(SUM(final_price), 2) FROM ticket) as total_ticket_revenue,
        (SELECT COUNT(*) FROM ticket) as total_tickets_sold,
        (SELECT ROUND(AVG(final_price), 2) FROM ticket) as avg_ticket_price,
        
        -- Ticket breakdown by type
        (SELECT ROUND(SUM(final_price), 2) FROM ticket WHERE ticket_type = 'Adult 19+') as adult_ticket_revenue,
        (SELECT COUNT(*) FROM ticket WHERE ticket_type = 'Adult 19+') as adult_tickets_sold,
        (SELECT ROUND(SUM(final_price), 2) FROM ticket WHERE ticket_type = 'Senior 65+') as senior_ticket_revenue,
        (SELECT COUNT(*) FROM ticket WHERE ticket_type = 'Senior 65+') as senior_tickets_sold,
        (SELECT ROUND(SUM(final_price), 2) FROM ticket WHERE ticket_type = 'Youth 13-18') as youth_ticket_revenue,
        (SELECT COUNT(*) FROM ticket WHERE ticket_type = 'Youth 13-18') as youth_tickets_sold,
        (SELECT ROUND(SUM(final_price), 2) FROM ticket WHERE ticket_type = 'Child 12 & Under') as child_ticket_revenue,
        (SELECT COUNT(*) FROM ticket WHERE ticket_type = 'Child 12 & Under') as child_tickets_sold,
        
        -- Donation Summary
        (SELECT ROUND(SUM(amount), 2) FROM donation) as total_donation_revenue,
        (SELECT COUNT(*) FROM donation) as total_donations,
        (SELECT ROUND(AVG(amount), 2) FROM donation) as avg_donation_amount,
        
        -- Donation breakdown by type
        (SELECT ROUND(SUM(amount), 2) FROM donation WHERE donation_type = 'One-time') as one_time_donations,
        (SELECT COUNT(*) FROM donation WHERE donation_type = 'One-time') as one_time_donation_count,
        (SELECT ROUND(SUM(amount), 2) FROM donation WHERE donation_type = 'Recurring') as recurring_donations,
        (SELECT COUNT(*) FROM donation WHERE donation_type = 'Recurring') as recurring_donation_count,
        
        -- Combined Totals
        (COALESCE((SELECT ROUND(SUM(final_price), 2) FROM ticket), 0) + 
         COALESCE((SELECT ROUND(SUM(amount), 2) FROM donation), 0)) as total_revenue,
        
        -- Date range
        (SELECT MIN(purchase_date) FROM ticket) as first_ticket_date,
        (SELECT MAX(purchase_date) FROM ticket) as latest_ticket_date,
        (SELECT MIN(donation_date) FROM donation) as first_donation_date,
        (SELECT MAX(donation_date) FROM donation) as latest_donation_date
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0]);
    });
    return;
  }

  // ==================== REPORT 2: ART COLLECTION (Artists + Artwork + Exhibitions) ====================
  if (parsedUrl.pathname === "/reports/art-collection-summary") {
    const sql = `
      SELECT 
        -- Artwork Summary
        (SELECT COUNT(*) FROM artwork) as total_artworks,
        (SELECT COUNT(*) FROM artist) as total_artists,
        (SELECT COUNT(DISTINCT nationality) FROM artist) as total_nationalities,
        (SELECT ROUND(SUM(insurance_value), 2) FROM artwork) as total_collection_value,
        (SELECT ROUND(AVG(insurance_value), 2) FROM artwork) as avg_artwork_value,
        
        -- Display Status
        (SELECT COUNT(*) FROM artwork WHERE current_display_status = 'On Display') as artworks_on_display,
        (SELECT COUNT(*) FROM artwork WHERE current_display_status = 'In Storage') as artworks_in_storage,
        (SELECT COUNT(*) FROM artwork WHERE current_display_status = 'On Loan') as artworks_on_loan,
        (SELECT COUNT(*) FROM artwork WHERE current_display_status = 'Under Restoration') as artworks_under_restoration,
        
        -- Date Range
        (SELECT MIN(creation_year) FROM artwork) as oldest_artwork,
        (SELECT MAX(creation_year) FROM artwork) as newest_artwork,
        
        -- Top Artists
        (SELECT CONCAT(first_name, ' ', last_name) FROM artist a 
         JOIN artwork art ON a.artist_id = art.artist_id 
         GROUP BY a.artist_id ORDER BY COUNT(art.artwork_id) DESC LIMIT 1) as top_artist_by_count,
        (SELECT COUNT(art.artwork_id) FROM artist a 
         JOIN artwork art ON a.artist_id = art.artist_id 
         GROUP BY a.artist_id ORDER BY COUNT(art.artwork_id) DESC LIMIT 1) as top_artist_count,
        
        -- Exhibition Summary
        (SELECT COUNT(*) FROM exhibition) as total_exhibitions,
        (SELECT COUNT(*) FROM exhibition WHERE exhibition_type = 'Permanent') as permanent_exhibitions,
        (SELECT COUNT(*) FROM exhibition WHERE exhibition_type = 'Temporary') as temporary_exhibitions,
        (SELECT COUNT(*) FROM exhibition WHERE exhibition_type = 'Traveling') as traveling_exhibitions,
        (SELECT COUNT(DISTINCT artwork_id) FROM exhibitionartwork) as artworks_in_exhibitions,
        
        -- Current Exhibition
        (SELECT exhibition_name FROM exhibition WHERE start_date <= CURDATE() AND end_date >= CURDATE() LIMIT 1) as current_exhibition
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0]);
    });
    return;
  }

  // ==================== REPORT 3: GIFT SHOP REPORT ====================
  if (parsedUrl.pathname === "/reports/giftshop-summary") {
    const sql = `
      SELECT 
        -- Revenue Summary
        (SELECT ROUND(SUM(total_amount), 2) FROM giftshoptransaction) as total_revenue,
        (SELECT COUNT(*) FROM giftshoptransaction) as total_transactions,
        (SELECT ROUND(AVG(total_amount), 2) FROM giftshoptransaction) as avg_transaction_value,
        (SELECT ROUND(MAX(total_amount), 2) FROM giftshoptransaction) as max_transaction,
        (SELECT ROUND(MIN(total_amount), 2) FROM giftshoptransaction) as min_transaction,
        
        -- Items Summary
        (SELECT COUNT(*) FROM giftshopitem) as total_items,
        (SELECT SUM(stock_quantity) FROM giftshopitem) as total_stock,
        (SELECT COUNT(*) FROM giftshopitem WHERE stock_quantity < 10) as low_stock_items,
        (SELECT COUNT(*) FROM giftshopitem WHERE stock_quantity = 0) as out_of_stock_items,
        
        -- Top Selling Items
        (SELECT item_name FROM giftshopitem i 
         JOIN giftshoptransactionitem ti ON i.item_id = ti.item_id 
         GROUP BY i.item_id ORDER BY SUM(ti.quantity) DESC LIMIT 1) as top_selling_item,
        (SELECT SUM(ti.quantity) FROM giftshopitem i 
         JOIN giftshoptransactionitem ti ON i.item_id = ti.item_id 
         GROUP BY i.item_id ORDER BY SUM(ti.quantity) DESC LIMIT 1) as top_selling_quantity,
        
        -- Best Revenue Item
        (SELECT item_name FROM giftshopitem i 
         JOIN giftshoptransactionitem ti ON i.item_id = ti.item_id 
         GROUP BY i.item_id ORDER BY SUM(ti.subtotal) DESC LIMIT 1) as top_revenue_item,
        (SELECT ROUND(SUM(ti.subtotal), 2) FROM giftshopitem i 
         JOIN giftshoptransactionitem ti ON i.item_id = ti.item_id 
         GROUP BY i.item_id ORDER BY SUM(ti.subtotal) DESC LIMIT 1) as top_revenue_amount,
        
        -- Category Summary
        (SELECT category FROM giftshopitem 
         GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1) as most_common_category,
        
        -- Payment Methods
        (SELECT payment_method FROM giftshoptransaction 
         GROUP BY payment_method ORDER BY COUNT(*) DESC LIMIT 1) as most_used_payment,
        
        -- Date Range
        (SELECT MIN(transaction_datetime) FROM giftshoptransaction) as first_sale_date,
        (SELECT MAX(transaction_datetime) FROM giftshoptransaction) as latest_sale_date
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0]);
    });
    return;
  }

  // ==================== REPORT 4: USER SUMMARY (Optional) ====================
  if (parsedUrl.pathname === "/reports/user-summary") {
    const sql = `
      SELECT 
        -- User Counts
        (SELECT COUNT(*) FROM user) as total_users,
        (SELECT COUNT(*) FROM user WHERE role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM user WHERE role = 'employee') as employee_count,
        (SELECT COUNT(*) FROM user WHERE role = 'member') as member_count,
        (SELECT COUNT(*) FROM user WHERE role = 'visitor') as visitor_count,
        
        -- Visitor Info
        (SELECT COUNT(*) FROM visitor) as visitors_with_visits,
        (SELECT ROUND(AVG(total_visits), 2) FROM visitor) as avg_visits_per_visitor,
        (SELECT MAX(total_visits) FROM visitor) as max_visits,
        
        -- Member Info
        (SELECT COUNT(*) FROM member) as active_members,
        (SELECT COUNT(*) FROM member WHERE expiration_date < CURDATE()) as expired_members,
        (SELECT membership_level FROM member GROUP BY membership_level ORDER BY COUNT(*) DESC LIMIT 1) as most_common_membership,
        
        -- Recent Activity
        (SELECT COUNT(*) FROM user WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as new_users_last_30_days
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0]);
    });
    return;
  }

  // ==================== DATA QUERIES ====================
  
  // Query 1: Artworks by Artist
  if (parsedUrl.pathname === "/queries/artworks-by-artist") {
    const artistName = query.name || "";
    const sql = `
      SELECT 
        a.artwork_id, 
        a.title, 
        a.creation_year, 
        a.medium, 
        a.dimensions,
        a.current_display_status,
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        a.insurance_value
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      WHERE CONCAT(ar.first_name, ' ', ar.last_name) LIKE ?
      ORDER BY a.creation_year
    `;
    db.query(sql, [`%${artistName}%`], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Query 2: Artworks by Year Range
  if (parsedUrl.pathname === "/queries/artworks-by-year") {
    const startYear = query.start || 0;
    const endYear = query.end || new Date().getFullYear();
    const sql = `
      SELECT 
        a.artwork_id, 
        a.title, 
        a.creation_year, 
        a.medium,
        a.insurance_value,
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      WHERE a.creation_year BETWEEN ? AND ?
      ORDER BY a.creation_year
    `;
    db.query(sql, [startYear, endYear], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Query 3: Gift Shop Low Stock Items
  if (parsedUrl.pathname === "/queries/giftshop-low-stock") {
    const sql = `
      SELECT item_id, item_name, category, price, stock_quantity
      FROM giftshopitem
      WHERE stock_quantity < 10
      ORDER BY stock_quantity ASC
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Query 4: Top Valued Artworks
  if (parsedUrl.pathname === "/queries/top-valued-artworks") {
    const limit = query.limit || 10;
    const sql = `
      SELECT 
        a.title,
        a.insurance_value,
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        a.creation_year,
        a.medium,
        a.current_display_status
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      WHERE a.insurance_value IS NOT NULL
      ORDER BY a.insurance_value DESC
      LIMIT ?
    `;
    db.query(sql, [parseInt(limit)], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
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