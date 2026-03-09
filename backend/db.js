const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",  
  password: "123456", // change this
  database: "museum"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // stop the server if DB fails
  }
  console.log("Connected to MySQL!");
});

module.exports = db;