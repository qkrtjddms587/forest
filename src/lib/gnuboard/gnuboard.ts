import mysql from "mysql2/promise";

// 커넥션 풀 생성
export const gnuDb = mysql.createPool({
  host: process.env.GNU_DB_HOST,
  user: process.env.GNU_DB_USER,
  password: process.env.GNU_DB_PASSWORD,
  database: process.env.GNU_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // 최대 동시 연결 수
  queueLimit: 0,
});
