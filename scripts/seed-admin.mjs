import pg from "pg"
import { readFileSync } from "fs"

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const sql = readFileSync("/app/scripts/seed-admin.sql", "utf8")
await pool.query(sql)
console.log("Admin created.")
await pool.end()
