import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import fs from "node:fs"
import { env } from "@/lib/env"

const pool = new Pool({ connectionString: env.databaseUrl })
const db = drizzle(pool)

const journal = JSON.parse(fs.readFileSync("./drizzle/meta/_journal.json", "utf-8"))
const entries: { tag: string; when: number }[] = journal.entries

let lastAppliedAt = 0
try {
    const result = await pool.query(
        `SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1`,
    )
    if (result.rows.length > 0) {
        lastAppliedAt = Number(result.rows[0].created_at)
    }
} catch {
    // таблица ещё не существует — все миграции новые
}

const pending = entries.filter((e) => e.when > lastAppliedAt)

if (pending.length === 0) {
    console.log("No new migrations.")
} else {
    console.log(`Running ${pending.length} migration(s):`)
    for (const e of pending) {
        console.log(`  → ${e.tag}`)
    }
}

await migrate(db, { migrationsFolder: "./drizzle" })

if (pending.length > 0) {
    console.log("Done.")
}

await pool.end()
