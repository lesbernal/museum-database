const db = require("../db");

module.exports = (req, res, parsedUrl) => {

  //Attendance per event
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

  //Total museum revenue
  if (req.method === "GET" && parsedUrl.pathname === "/reports/revenue") {

    const query = `
      SELECT 
        COALESCE(SUM(d.amount), 0) AS donation_revenue,
        COALESCE(SUM(t.final_price), 0) AS ticket_revenue,
        COALESCE(SUM(d.amount), 0) + COALESCE(SUM(t.final_price), 0) AS total_revenue
      FROM donation d
      LEFT JOIN ticket t ON 1=1
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