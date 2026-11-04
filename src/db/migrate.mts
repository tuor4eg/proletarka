import { drizzle } from "drizzle-orm/node-postgres"
import { readMigrationFiles } from "drizzle-orm/migrator"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
    const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" })
    let applied: { hash: string; created_at: string }[] = []
    try {
        const result = await pool.query<{ hash: string; created_at: string }>(
            `SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
        )
        applied = result.rows
    } catch (error) {
        if ((error as { code?: string }).code !== "42P01") throw error
    }

    const knownHashes = new Set(migrations.map((migration) => migration.hash))
    if (applied.some((migration) => !knownHashes.has(migration.hash))) {
        throw new Error(
            "This database has an incompatible migration history. The new init requires an empty database; do not apply it to an old installation.",
        )
    }

    const lastAppliedAt = Number(applied.at(-1)?.created_at ?? 0)
    const pending = migrations.filter((migration) => migration.folderMillis > lastAppliedAt)
    console.log(pending.length ? `Running ${pending.length} migration(s).` : "No new migrations.")
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" })
    if (pending.length) console.log("Done.")
} finally {
    await pool.end()
}
