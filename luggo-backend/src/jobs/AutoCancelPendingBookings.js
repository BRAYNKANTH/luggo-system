import cron from "node-cron";
import db from "../config/db.js";

// Run every 1 minute
cron.schedule("* * * * *", () => {
  // Cancel bookings that remained unpaid for 10 minutes
  db.query(
    `UPDATE bookings 
SET status = 'cancelled' 
WHERE status = 'pending' 
AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= 10
AND id > 0`,
    (err, result) => {
      if (!err && result.affectedRows > 0) {
        console.log(`🗑️ Auto-cancelled ${result.affectedRows} pending bookings (10min timeout)`);
      }
    }
  );

  // Make lockers available again after cancel
  db.query(
    `UPDATE lockers l
     JOIN booking_items bi ON bi.locker_id = l.id
     JOIN bookings b ON bi.booking_id = b.id
     SET l.availability_status = 'available'
     WHERE b.status = 'cancelled'`,
    (err) => {
      if (err) {
        console.log("⚠️ Locker availability reset failed", err);
      }
    }
  );
});
