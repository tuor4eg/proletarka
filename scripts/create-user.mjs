import pg from "pg"
import { hash } from "bcryptjs"

const email = process.env.USER_EMAIL?.trim().toLowerCase()
const name = process.env.USER_NAME?.trim() || "Admin"
const password = process.env.USER_PASSWORD

if (!process.env.DATABASE_URL || !email || !password) {
    console.error(
        "Required environment: DATABASE_URL, USER_EMAIL, USER_PASSWORD; optional: USER_NAME.",
    )
    process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
    const passwordHash = await hash(password, 12)
    await pool.query("INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4)", [
        email,
        name,
        passwordHash,
        "admin",
    ])
    console.log(`Administrator ${email} created.`)
} catch (error) {
    console.error(
        error.code === "23505"
            ? "An administrator with this email already exists; no changes made."
            : "Failed to create administrator. Check database connection and run db:migrate first.",
    )
    process.exitCode = 1
} finally {
    await pool.end()
}
