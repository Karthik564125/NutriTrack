import cron from "node-cron";
import { sendEmail } from "../services/email.js";
import db from "../db/db.js";

// Runs every day at 9:00 AM IST (server time)
cron.schedule("0 9 * * *", async () => {
  console.log("📅 Running daily streak notifications...");

  try {
    const [users] = await db.execute("SELECT email FROM users");
    for (const user of users) {
      try {
        await sendEmail(
          user.email,
          "Your Daily Streak Reminder",
          "Don't forget to complete today's challenge!"
        );
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
      }
    }
  } catch (dbError) {
    console.error("Error fetching users:", dbError);
  }
});
