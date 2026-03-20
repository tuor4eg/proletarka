import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";
import { hash } from "bcryptjs";

const ADMIN = {
  email: "admin@proletarka.ru",
  name: "Администратор",
  password: "admin",
};

async function reset() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const sql = readFileSync(join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
  await client.query(sql);

  const passwordHash = await hash(ADMIN.password, 12);
  await client.query(
    `INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, 'admin')`,
    [ADMIN.email, ADMIN.name, passwordHash]
  );

  console.log("Database reset complete");
  await client.end();
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
