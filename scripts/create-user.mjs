import pg from "pg"

const { Pool } = pg

const email = process.env.USER_EMAIL
const name = process.env.USER_NAME ?? "Admin"
const password = process.env.USER_HASH

if (!email || !password) {
    console.error("Usage: USER_EMAIL=... USER_HASH=... node scripts/create-user.mjs")
    process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
await pool.query("INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4)", [
    email,
    name,
    password,
    "admin",
])
console.log(`User ${email} created.`)
await pool.end()
