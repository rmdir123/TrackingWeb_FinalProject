// db.js
const mysql = require('mysql2');
require('dotenv').config(); // มั่นใจว่าโหลดค่าจาก .env แล้ว

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db-web.c52q2wqa6rvh.ap-southeast-7.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'zaza10250',
  database: process.env.DB_NAME || 'webdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // สำหรับ RDS บางครั้งอาจต้องระบุ Port (ค่าเริ่มต้นคือ 3306)
  port: 3306 
});

// ใช้ .promise() เพื่อให้เขียนโค้ดง่ายขึ้น
const promisePool = pool.promise();

console.log('Connecting to Amazon RDS MySQL...');

module.exports = promisePool;
