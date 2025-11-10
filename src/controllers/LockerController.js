import db from "../config/db.js";

/* ======================================================
   1️⃣ Get all lockers in a specific hub
====================================================== */
export const getLockersByHub = (req, res) => {
  const { hubId } = req.params;
  const sql = "SELECT * FROM lockers WHERE hub_id = ?";
  db.query(sql, [hubId], (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Error fetching lockers" });
    }
    res.status(200).json({ lockers: results });
  });
};

/* ======================================================
   2️⃣ Get available lockers (basic filters)
====================================================== */
export const getAvailableLockers = (req, res) => {
  const { hubId, size, date, time } = req.query;
  let sql = "SELECT * FROM lockers WHERE availability_status = 'available'";
  const params = [];

  if (hubId) {
    sql += " AND hub_id = ?";
    params.push(hubId);
  }

  if (size) {
    sql += " AND size = ?";
    params.push(size);
  }

  // Optional debug
  if (date && time) {
    console.log(`Filtering lockers for ${date} ${time}`);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Error fetching available lockers" });
    }

    res.status(200).json({
      message: "Available lockers fetched successfully",
      count: results.length,
      lockers: results,
    });
  });
};

/* ======================================================
   3️⃣ Get locker by ID
====================================================== */
export const getLockerById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM lockers WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ message: "Locker not found" });
    res.status(200).json({ locker: results[0] });
  });
};


/* ======================================================
   4️⃣ Update locker status (available/booked/locked/unlocked)
====================================================== */
export const updateLockerStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["available", "booked", "locked", "unlocked"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  db.query(
    "UPDATE lockers SET availability_status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error updating locker status" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Locker not found" });

      res.status(200).json({
        message: `Locker status updated to '${status}' successfully`,
      });
    }
  );
};



/* ======================================================
   5️⃣ Get locker pricing overview for a hub
====================================================== */
export const getLockerPricesByHub = (req, res) => {
  const { hubId } = req.params;
  const sql = `
    SELECT size, MIN(price_per_hour) AS min_price, MAX(price_per_hour) AS max_price
    FROM lockers
    WHERE hub_id = ?
    GROUP BY size
  `;
  db.query(sql, [hubId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching prices" });
    res.status(200).json({ prices: results });
  });
};



/* ======================================================
   6️⃣ Lock or unlock a locker manually (demo control)
====================================================== */
export const toggleLocker = (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // "lock" or "unlock"

  if (!["lock", "unlock"].includes(action)) {
    return res
      .status(400)
      .json({ message: "Invalid action (use 'lock' or 'unlock')" });
  }

  const newStatus = action === "lock" ? "locked" : "unlocked";

  db.query(
    "UPDATE lockers SET availability_status = ? WHERE id = ?",
    [newStatus, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Locker not found" });

      res.status(200).json({
        message: `Locker ${id} is now ${newStatus}`,
      });
    }
  );
};



/* ======================================================
   7️⃣ Book locker(s)
====================================================== */
export const bookLocker = (req, res) => {
  const { user_id, hub_id, locker_ids, start_time, end_time } = req.body;

  if (!user_id || !hub_id || !locker_ids || locker_ids.length === 0)
    return res.status(400).json({ message: "Missing booking details" });

  const sql =
    "UPDATE lockers SET availability_status = 'booked' WHERE id IN (?) AND hub_id = ?";
  db.query(sql, [locker_ids, hub_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error during booking" });
    }

    res.status(200).json({
      message: "Lockers booked successfully",
      booked_lockers: locker_ids,
      affected: result.affectedRows,
    });
  });
};


export const getLiveAvailability = (req, res) => {
  const { hub_id } = req.query;
  if (!hub_id) return res.status(400).json({ message: "hub_id required" });

  const sql = `
    SELECT 
      l.id,
      l.hub_id,
      l.locker_number,
      l.size,
      l.price_per_hour,
      b.extend_payment_status,
      CASE
        WHEN b.extend_payment_status = 'pending' THEN 'awaiting_payment'
        WHEN s.status = 'active' AND s.end_time > NOW() THEN 'occupied'
        ELSE 'available'
      END AS live_status,
      l.availability_status,
      l.last_updated
    FROM lockers l
    LEFT JOIN bookings b 
      ON l.id = b.locker_id 
      AND b.status IN ('confirmed','pending_extension_payment')
    LEFT JOIN sessions s 
      ON l.id = s.locker_id
      AND s.status = 'active'
      AND s.end_time > NOW()
    WHERE l.hub_id = ?
    GROUP BY l.id
    ORDER BY l.locker_number ASC;
  `;

  db.query(sql, [hub_id], (err, results) => {
    if (err) {
      console.error("Live Availability Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(200).json({
      message: "✅ Live locker availability updated",
      count: results.length,
      lockers: results,
    });
  });
};
