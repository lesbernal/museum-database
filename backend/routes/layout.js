const express = require("express");
const router = express.Router();
// You'll need to import your database connection here too

// Example: Create a new Gallery (CRUD)
router.post("/galleries", (req, res) => {
  const { gallery_id, building_id, gallery_name } = req.body;
  
  // VALIDATION (Your Role!):
  if (!gallery_name) {
    return res.status(400).json({ error: "Gallery Name is required!" });
  }

  // SQL Logic goes here...
  res.send("Gallery added!");
});

// *** 
const PDFDocument = require('pdfkit');
const mysql = require('mysql2');
const fs = require('fs');

// Exhibition Schedule
app.get('/api/reports/exhibitions', (req, res) => {
    const doc = new PDFDocument();
    const filename = "Exhibition_Schedule.pdf";

    // Set headers so the browser knows it's a PDF
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res); // Send the PDF directly to the user's download folder

    // 1. Your SQL Query (Joining Tables for your Layout Role)
    const sql = `
        SELECT e.exhibition_name, e.start_date, e.end_date, g.gallery_name 
        FROM exhibition AS e
        JOIN gallery AS g ON e.gallery_id = g.gallery_id
        ORDER BY e.start_date ASC`;

    db.query(sql, (err, results) => {
        if (err) throw err;

        // Header
        doc.fontSize(20).text('Museum Exhibition Schedule', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Loop through SQL data and add to PDF
        results.forEach(row => {
            doc.fontSize(14).fillColor('blue').text(`Exhibition: ${row.exhibition_name}`);
            doc.fontSize(12).fillColor('black').text(`Location: ${row.gallery_name}`);
            doc.text(`Dates: ${row.start_date.toDateString()} - ${row.end_date.toDateString()}`);
            doc.moveDown();
        });

        doc.end(); // Finalize the PDF
    });
});

// Gallery Usage
app.get('/api/reports/exhibitions', (req, res) => {
    const doc = new PDFDocument();
    const filename = "Exhibition_Schedule.pdf";

    // Set headers so the browser knows it's a PDF
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res); // Send the PDF directly to the user's download folder

    // 1. Your SQL Query (Joining Tables for your Layout Role)
    const sql = `
        SELECT e.exhibition_name, e.start_date, e.end_date, g.gallery_name, m.building_name  
        FROM exhibition AS e, museumbuilding AS m
        JOIN gallery AS g ON e.gallery_id = g.gallery_id
        ORDER BY e.start_date ASC`;

    db.query(sql, (err, results) => {
        if (err) throw err;

        // Header
        doc.fontSize(20).text('Museum Exhibition Schedule', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Loop through SQL data and add to PDF
        results.forEach(row => {
            doc.fontSize(14).fillColor('blue').text(`Exhibition: ${row.exhibition_name}`);
            doc.fontSize(12).fillColor('black').text(`Location: ${row.gallery_name}`);
            doc.text(`Dates: ${row.start_date.toDateString()} - ${row.end_date.toDateString()}`);
            doc.moveDown();
        });

        doc.end(); // Finalize the PDF
    });
});

module.exports = router;