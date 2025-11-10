// src/config/db.js
import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();
console.log("🔍 Loaded DB Config:");
console.log("HOST:", process.env.DB_HOST);
console.log("PORT:", process.env.DB_PORT);
console.log("USER:", process.env.DB_USER);
console.log("PASS:", process.env.DB_PASS ? "**** (hidden)" : "NOT SET");
console.log("DB:", process.env.DB_NAME);




const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // no need Number()
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000
});

// ✅ Proper check for connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database successfully!");
    connection.release();
  }
});

export default db;
