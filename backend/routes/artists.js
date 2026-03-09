const express = require("express");
const router = express.Router();
const db = require("../db"); // import the connection

// GET all artists
router.get("/", (req, res) => {
  db.query("SELECT * FROM artist", (err, results) => {
    if (err) {
      console.error("Query failed:", err);
      return res.status(500).json({ fatal: true });
    }
    res.json(results);
  });
});

module.exports = router;