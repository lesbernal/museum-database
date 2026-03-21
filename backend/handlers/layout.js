const mysql = require('mysql2');
const PDFDocument = require('pdfkit');

// Update these with your actual MySQL info!
const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'YOUR_PASSWORD',
    database: 'museum'
});

module.exports = (req, res, parsedUrl) => {
    // --- 1. REPORT: Exhibition Schedule PDF ---
    if (req.method === "GET" && parsedUrl.pathname === "/layout/reports/exhibitions") {
        const doc = new PDFDocument();
        res.setHeader('Content-disposition', 'attachment; filename="Exhibition_Schedule.pdf"');
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        const sql = `
            SELECT e.exhibition_name, e.start_date, e.end_date, g.gallery_name 
            FROM exhibition AS e
            JOIN gallery AS g ON e.gallery_id = g.gallery_id
            ORDER BY e.start_date ASC`;

        db.query(sql, (err, results) => {
            if (err) {
                res.writeHead(500);
                return res.end(JSON.stringify(err));
            }
            doc.fontSize(20).text('Museum Exhibition Schedule', { align: 'center' });
            doc.moveDown().fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`).moveDown();

            results.forEach(row => {
                doc.fontSize(14).fillColor('blue').text(`Exhibition: ${row.exhibition_name}`);
                doc.fontSize(12).fillColor('black').text(`Location: ${row.gallery_name}`);
                doc.text(`Dates: ${row.start_date.toDateString()} - ${row.end_date.toDateString()}`).moveDown();
            });
            doc.end();
        });
    }

    // --- 2. REPORT: Gallery Usage PDF ---
    else if (req.method === "GET" && parsedUrl.pathname === "/layout/reports/galleries") {
        const doc = new PDFDocument();
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        const sql = `
            SELECT g.gallery_name, b.building_name, g.square_footage 
            FROM gallery AS g
            JOIN museumbuilding AS b ON g.building_id = b.building_id`;

        db.query(sql, (err, results) => {
            if (err) {
                res.writeHead(500);
                return res.end(JSON.stringify(err));
            }
            doc.fontSize(20).text('Gallery Usage Report', { align: 'center' }).moveDown();
            results.forEach(row => {
                doc.fontSize(14).text(`Gallery: ${row.gallery_name}`);
                doc.fontSize(12).text(`Building: ${row.building_name} | Size: ${row.square_footage} sq ft`).moveDown();
            });
            doc.end();
        });
    }

    // --- 3. CRUD: Create New Gallery ---
    else if (req.method === "POST" && parsedUrl.pathname === "/layout/galleries") {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const { gallery_id, building_id, gallery_name } = JSON.parse(body);
            
            if (!gallery_name) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: "Gallery Name is required!" }));
            }

            db.query("INSERT INTO gallery (gallery_id, building_id, gallery_name) VALUES (?, ?, ?)", 
            [gallery_id, building_id, gallery_name], (err) => {
                if (err) {
                    res.writeHead(500);
                    return res.end(JSON.stringify(err));
                }
                res.writeHead(201);
                res.end(JSON.stringify({ message: "Gallery added successfully!" }));
            });
        });
    }

    // --- 4. 404 Fallback ---
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: "Layout route not found" }));
    }
};