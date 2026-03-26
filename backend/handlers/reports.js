const db = require("../db");

module.exports = (req, res, parsedUrl) => {
  const query = parsedUrl.query;
  console.log("📊 reports.js handler called for:", parsedUrl.pathname);

  // ==================== TEST ENDPOINT ====================
  if (parsedUrl.pathname === "/reports/test") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      message: "Reports handler is working!", 
      path: parsedUrl.pathname,
      timestamp: Date.now()
    }));
    return;
  }

  // ==================== DATA REPORTS (Multi-table) ====================
  
  // Report 1: Artwork Collection Summary with Artist Info
  if (parsedUrl.pathname === "/reports/artwork-summary") {
    const sql = `
      SELECT 
        COUNT(DISTINCT a.artwork_id) as total_artworks,
        COUNT(DISTINCT a.artist_id) as total_artists,
        COUNT(DISTINCT ar.nationality) as total_nationalities,
        SUM(CASE WHEN a.current_display_status = 'On Display' THEN 1 ELSE 0 END) as on_display,
        SUM(CASE WHEN a.current_display_status = 'In Storage' THEN 1 ELSE 0 END) as in_storage,
        SUM(CASE WHEN a.current_display_status = 'On Loan' THEN 1 ELSE 0 END) as on_loan,
        ROUND(AVG(a.insurance_value), 2) as avg_insurance_value,
        ROUND(SUM(a.insurance_value), 2) as total_insurance_value,
        MIN(a.creation_year) as oldest_artwork_year,
        MAX(a.creation_year) as newest_artwork_year
      FROM artwork a
      LEFT JOIN artist ar ON a.artist_id = ar.artist_id
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results[0]);
    });
    return;
  }

  // Report 2: Artist Statistics with Artwork Details
  if (parsedUrl.pathname === "/reports/artist-stats") {
    const sql = `
      SELECT 
        a.artist_id,
        CONCAT(a.first_name, ' ', a.last_name) as artist_name,
        a.nationality,
        a.birth_year,
        a.death_year,
        COUNT(art.artwork_id) as artwork_count,
        ROUND(AVG(art.insurance_value), 2) as avg_artwork_value,
        ROUND(SUM(art.insurance_value), 2) as total_artwork_value,
        MIN(art.creation_year) as earliest_work,
        MAX(art.creation_year) as latest_work,
        GROUP_CONCAT(DISTINCT art.medium ORDER BY art.medium SEPARATOR ', ') as mediums_used
      FROM artist a
      LEFT JOIN artwork art ON a.artist_id = art.artist_id
      GROUP BY a.artist_id
      ORDER BY artwork_count DESC
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Report 3: Sales Summary (Cafe only - using correct column names)
  if (parsedUrl.pathname === "/reports/sales-summary") {
    const sql = `
      SELECT 
        'Cafe' as category,
        COUNT(*) as total_transactions,
        ROUND(SUM(total_amount), 2) as total_sales,
        ROUND(AVG(total_amount), 2) as avg_transaction_value,
        MIN(transaction_datetime) as first_transaction,
        MAX(transaction_datetime) as last_transaction
      FROM cafetransaction
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Report 4: Exhibition Summary (using correct column names: exhibition_name, exhibition_type)
  if (parsedUrl.pathname === "/reports/exhibition-summary") {
    const sql = `
      SELECT 
        e.exhibition_id,
        e.exhibition_name as exhibition_title,
        e.start_date,
        e.end_date,
        e.exhibition_type as type,
        g.gallery_name,
        mb.building_name,
        DATEDIFF(e.end_date, e.start_date) as duration_days
      FROM exhibition e
      LEFT JOIN gallery g ON e.gallery_id = g.gallery_id
      LEFT JOIN museumbuilding mb ON g.building_id = mb.building_id
      ORDER BY e.start_date DESC
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Report 5: Cafe Sales by Month
  if (parsedUrl.pathname === "/reports/cafe-monthly-sales") {
    const sql = `
      SELECT 
        DATE_FORMAT(transaction_datetime, '%Y-%m') as month,
        COUNT(*) as transaction_count,
        ROUND(SUM(total_amount), 2) as total_sales,
        ROUND(AVG(total_amount), 2) as avg_transaction
      FROM cafetransaction
      GROUP BY DATE_FORMAT(transaction_datetime, '%Y-%m')
      ORDER BY month DESC
    `;
    db.query(sql, (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // ==================== DATA QUERIES ====================
  
  // Query 1: Artworks by Artist with Full Details
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
        ar.nationality as artist_nationality,
        p.owner_name as current_owner,
        p.acquisition_method
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      LEFT JOIN provenance p ON a.artwork_id = p.artwork_id AND p.provenance_id = (
        SELECT provenance_id FROM provenance WHERE artwork_id = a.artwork_id ORDER BY transfer_date DESC LIMIT 1
      )
      WHERE CONCAT(ar.first_name, ' ', ar.last_name) LIKE ?
      ORDER BY a.creation_year
    `;
    db.query(sql, [`%${artistName}%`], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Query 2: Artworks by Year Range with Artist and Provenance
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
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        ar.nationality,
        COUNT(p.provenance_id) as ownership_changes,
        GROUP_CONCAT(DISTINCT p.owner_name ORDER BY p.acquisition_date SEPARATOR ' → ') as ownership_history
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      LEFT JOIN provenance p ON a.artwork_id = p.artwork_id
      WHERE a.creation_year BETWEEN ? AND ?
      GROUP BY a.artwork_id
      ORDER BY a.creation_year
    `;
    db.query(sql, [startYear, endYear], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Query 3: Artworks by Medium with Artist and Exhibition Info
  if (parsedUrl.pathname === "/queries/artworks-by-medium") {
    const medium = query.medium || "";
    const sql = `
      SELECT 
        a.artwork_id, 
        a.title, 
        a.creation_year,
        a.dimensions,
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        a.current_display_status
      FROM artwork a
      JOIN artist ar ON a.artist_id = ar.artist_id
      WHERE a.medium LIKE ?
      ORDER BY a.title
    `;
    db.query(sql, [`%${medium}%`], (err, results) => {
      if (err) return sendError(res, err);
      sendJSON(res, results);
    });
    return;
  }

  // Query 4: Top Valued Artworks with Artist and Provenance
  if (parsedUrl.pathname === "/queries/top-valued-artworks") {
    const limit = query.limit || 10;
    const sql = `
      SELECT 
        a.title,
        a.insurance_value,
        CONCAT(ar.first_name, ' ', ar.last_name) as artist_name,
        a.creation_year,
        a.medium,
        a.current_display_status,
        (
          SELECT owner_name FROM provenance 
          WHERE artwork_id = a.artwork_id 
          ORDER BY transfer_date DESC LIMIT 1
        ) as current_owner
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