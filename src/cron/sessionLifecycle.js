// src/utils/sessionLifecycle.js (or wherever your file is)
import db from "../config/db.js";
import cron from "node-cron";

console.log("🔄 Session lifecycle scheduler initialized...");

// Runs every 1 minute
cron.schedule("*/1 * * * *", () => {

  // 1) pending → active (start time reached)
  db.query(
    `UPDATE sessions 
     SET status='active' 
     WHERE status='pending' AND start_time <= NOW()`,
    (err, result) => {
      if (err) console.log("❌ Error activating sessions:", err);
      else if (result.affectedRows > 0)
        console.log(`✅ Activated ${result.affectedRows} session(s)`);
    }
  );

  // 2) active → expired (grace period passed and not released)
  db.query(
    `UPDATE sessions 
     SET status='expired', locker_state='locked' 
     WHERE status='active' AND grace_until < NOW()`,
    (err, result) => {
      if (err) console.log("❌ Error expiring sessions:", err);
      else if (result.affectedRows > 0)
        console.log(`⚠️ Expired ${result.affectedRows} session(s)`);
    }
  );

});
