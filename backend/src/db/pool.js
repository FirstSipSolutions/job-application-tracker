const { Pool } = require("pg");
require("dotenv").config();

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? { rejectUnauthorized: false }
    : false,
});

pool.on("connect", () => console.log("Connected to PostgreSQL"));
pool.on("error", (err) => {
  console.error("Unexpected database error", err);
  process.exit(-1);
});
module.exports = pool;
