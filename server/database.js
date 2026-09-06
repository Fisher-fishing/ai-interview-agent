const mysql = require("mysql2/promise");

const requiredEnvironmentVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]) {
    throw new Error(
      `缺少环境变量：${variableName}`,
    );
  }
}

const database = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

module.exports = database;