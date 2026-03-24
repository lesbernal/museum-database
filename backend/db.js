require('dotenv').config(); 
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "museumdb.mysql.database.azure.com",
  user: process.env.DB_USER || "jackson", // fallback to default
  password: process.env.DB_PASSWORD || "jacksonteam12", // fallback to default
  database: process.env.DB_NAME || "museum",
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false // ensures secure SSL
  }
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // stop the server if DB fails
  }
  console.log("Connected to MySQL!");
});

module.exports = db;