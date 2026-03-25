// scripts/hashExistingPasswords.js
// Run ONCE from your backend folder: node scripts/hashExistingPasswords.js
// DELETE this file after running it.

const db     = require("../db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

async function migrate() {
  console.log("Fetching all users...");

  db.query("SELECT user_id, password FROM user", async (err, users) => {
    if (err) {
      console.error("DB error:", err);
      process.exit(1);
    }

    console.log(`Found ${users.length} users. Hashing passwords...`);

    for (const user of users) {
      // Skip if already hashed (bcrypt hashes start with $2b$)
      if (user.password?.startsWith("$2b$")) {
        console.log(`  User ${user.user_id} — already hashed, skipping`);
        continue;
      }

      try {
        const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
        await new Promise((resolve, reject) => {
          db.query(
            "UPDATE user SET password = ? WHERE user_id = ?",
            [hashed, user.user_id],
            (err) => err ? reject(err) : resolve()
          );
        });
        console.log(`  User ${user.user_id} — hashed successfully`);
      } catch (e) {
        console.error(`  User ${user.user_id} — FAILED:`, e.message);
      }
    }

    console.log("Done. You can delete this script now.");
    process.exit(0);
  });
}

migrate();