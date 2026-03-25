const db = require("../db");

module.exports = (req, res, parsedUrl) => {

  // Attendance per event
  if (req.method === "GET" && parsedUrl.pathname === "/reports/attendance") {

    const query = `
      SELECT 
        event_name,
        event_date,
        total_attendees
      FROM event
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        return res.end("Error fetching attendance report");
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(results));
    });
  }

  // Total museum revenue
  if (req.method === "GET" && parsedUrl.pathname === "/reports/revenue") {

    const query = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM donation) AS donation_revenue,
        (SELECT COALESCE(SUM(final_price), 0) FROM ticket) AS ticket_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM donation) + (SELECT COALESCE(SUM(final_price), 0) FROM ticket) AS total_revenue
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        return res.end("Error fetching revenue report");
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(results[0]));
    });
  }
};