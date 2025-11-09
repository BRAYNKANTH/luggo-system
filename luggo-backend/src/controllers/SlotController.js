import db from "../config/db.js";

export const getSlots = (req, res) => {
  db.query("SELECT * FROM slots ORDER BY id ASC", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ slots: results });
  });
};

export const getNextExtendableSlots = (req, res) => {
  const { locker_id, after } = req.query;

  if (!locker_id || !after) {
    return res.status(400).json({ message: "locker_id and after are required" });
  }

  const date = after.split(" ")[0];

  const sql = `
    SELECT s.id, s.slot_label, s.start_time, s.end_time
    FROM slots s
    WHERE s.start_time > (
      SELECT TIME(end_time) FROM sessions 
      WHERE locker_id = ? AND DATE(start_time) = ? 
      ORDER BY end_time DESC LIMIT 1
    )
    AND s.id NOT IN (
      SELECT bi.slot_id 
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.locker_id = ? 
      AND b.date = ? 
      AND bi.status IN ('pending','confirmed')
    )
    ORDER BY s.start_time ASC
  `;

  db.query(sql, [locker_id, date, locker_id, date], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    res.json({ slots: rows });
  });
};
