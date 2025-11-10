import cron from "node-cron";
import db from "../config/db.js";

// Run every 1 minute
cron.schedule("* * * * *", () => {

  // pending → active when time starts
  db.query(
    `UPDATE sessions SET status='active'
     WHERE status='pending' 
     AND NOW() >= start_time 
     AND NOW() <= grace_until`
  );

  // active → expired after grace time
  db.query(
    `UPDATE sessions SET status='expired', locker_state='locked'
     WHERE status='active' 
     AND NOW() > grace_until`
  );

});
