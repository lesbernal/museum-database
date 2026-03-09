require('dotenv').config(); 
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456", // fallback to default
  database: process.env.DB_NAME || "museum"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // stop the server if DB fails
  }
  console.log("Connected to MySQL!");
});

module.exports = db;