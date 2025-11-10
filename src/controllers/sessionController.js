import db from "../config/db.js";

function toDateTimeString(date, time) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${time}`;
}

/* ======================================================
   GET SIMPLE ACTIVE SESSIONS FOR MY BOOKINGS PAGE
====================================================== */
export const getActiveSessionsForUser = (req, res) => {
  const { userId } = req.params;
  db.query(
    `SELECT s.*, l.locker_number
     FROM sessions s
     JOIN lockers l ON l.id = s.locker_id
     WHERE s.user_id=? AND s.status='active'`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ sessions: rows });
    }
  );
};

/* ======================================================
   LOCKER ACCESS CONTROL
====================================================== */
export const unlockLocker = (req, res) => {
  const { sessionId } = req.params;

  db.query(`SELECT * FROM sessions WHERE id=?`, [sessionId], (err, rows) => {
    if (!rows.length) return res.status(404).json({ message: "Session not found" });

    const s = rows[0];
    if (!(s.status === "active" && new Date() <= new Date(s.grace_until))) {
      return res.status(403).json({ message: "Access window closed" });
    }

    db.query(`UPDATE sessions SET locker_state='unlocked' WHERE id=?`, [sessionId]);
    res.json({ message: "Locker Unlocked ✅" });
  });
};

export const lockLocker = (req, res) => {
  const { sessionId } = req.params;
  db.query(`UPDATE sessions SET locker_state='locked' WHERE id=?`, [sessionId]);
  res.json({ message: "Locker Locked 🔒" });
};

export const releaseLocker = (req, res) => {
  const { sessionId } = req.params;
  console.log("🟡 Releasing session ID:", sessionId);

  db.query(
    `UPDATE sessions 
     SET status='expired', locker_state='locked' 
     WHERE id=?`,
    [sessionId],
    (err, result) => {
      if (err) {
        console.error("❌ SQL Error details:", err);
        return res.status(500).json({
          message: "Failed to update the session",
          error: err.sqlMessage || err.message
        });
      }

      console.log("🟢 SQL update result:", result);
      res.json({ message: "Locker Released ✅" });
    }
  );
};


/* ======================================================
   CREATE SESSIONS AFTER PAYMENT CONFIRMATION
====================================================== */
export const createSessionsForBooking = (bookingId, callback) => {
  console.log("🔍 Running createSessionsForBooking for booking:", bookingId);

  const sql = `
    SELECT 
      b.id AS booking_id, 
      b.user_id, 
      b.hub_id, 
      b.mode, 
      b.date,
      bi.id AS booking_item_id,
      bi.locker_id, 
      bi.slot_id,
      s.start_time, 
      s.end_time
    FROM bookings b
    JOIN booking_items bi ON bi.booking_id = b.id
    LEFT JOIN slots s ON bi.slot_id = s.id
    WHERE b.id = ? AND bi.status = 'confirmed'
    ORDER BY bi.locker_id, s.start_time
  `;

  db.query(sql, [bookingId], (err, rows) => {
    if (err) return callback(err);
    if (!rows.length) return callback(null);

    console.log("📌 Booking Items:", rows);

    const booking = rows[0];

    /* ✅ FULL DAY MODE */
    if (booking.mode === "day") {
      const start = toDateTimeString(booking.date, "00:00:00");
      const end = toDateTimeString(booking.date, "23:59:59");

      return db.query(
        `INSERT INTO sessions 
         (booking_id, booking_item_id, user_id, locker_id, start_time, end_time, grace_until, status)
         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL 10 MINUTE), 'pending')`,
        [booking.booking_id, booking.booking_item_id, booking.user_id, booking.locker_id, start, end, end],
        callback
      );
    }

    /* ✅ HOURLY (MERGED SLOT BLOCKS INTO SINGLE SESSION PER LOCKER) */
    const lockers = new Map();
    rows.forEach(r => {
      const start = toDateTimeString(booking.date, r.start_time);
      const end = toDateTimeString(booking.date, r.end_time);

      if (!lockers.has(r.locker_id)) {
        lockers.set(r.locker_id, { booking_item_id: r.booking_item_id, start, end });
      } else {
        lockers.get(r.locker_id).end = end;
      }
    });

    let pending = lockers.size;
    lockers.forEach(({ start, end, booking_item_id }, locker_id) => {
      console.log("🟡 Attempting session insert:", { booking_id: booking.booking_id, booking_item_id, locker_id, start, end });

      db.query(
        `INSERT INTO sessions 
         (booking_id, booking_item_id, user_id, locker_id, start_time, end_time, grace_until, status)
         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL 10 MINUTE), 'pending')`,
        [booking.booking_id, booking_item_id, booking.user_id, locker_id, start, end, end],
        (err) => {
          if (err) console.log("❌ SESSION INSERT ERROR:", err.sqlMessage);
          pending--;
          if (pending === 0) callback(null);
        }
      );
    });
  });
};

/* ======================================================
   FULL ACTIVE SESSION LIST FOR UI
====================================================== */
export const getActiveSessions = (req, res) => {
  const { userId } = req.params;

  db.query(
    `SELECT 
      s.id AS session_id,
      s.booking_id,
      s.locker_id,
      s.start_time,
      s.end_time,
      s.grace_until,
      s.status,
      l.locker_number,
      l.size,
      h.name AS hub_name,
      h.city
    FROM sessions s
    JOIN lockers l ON s.locker_id = l.id
    JOIN hubs h ON l.hub_id = h.id
    WHERE s.user_id = ? AND s.status = 'active'
    ORDER BY s.start_time ASC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB Error" });
      res.json({ sessions: rows });
    }
  );
};

/* ======================================================
   EXTEND SESSION: GET AVAILABLE NEXT SLOTS
====================================================== */
export const getExtendableSlots = (req, res) => {
  const { session_id } = req.params;

  db.query(
    `SELECT s.id AS session_id, s.booking_id, s.locker_id, s.end_time, b.date
     FROM sessions s
     JOIN bookings b ON s.booking_id = b.id
     WHERE s.id = ?`,
    [session_id],
    (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: "Session not found" });

      const session = rows[0];

      db.query(
        `SELECT id, slot_label, start_time, end_time 
         FROM slots
         WHERE start_time > TIME(?)
         ORDER BY start_time ASC`,
        [session.end_time],
        (err2, slots) => {
          if (err2) return res.status(500).json({ message: "Slot lookup failed" });
          res.json({ available_slots: slots });
        }
      );
    }
  );
};

/* ======================================================
   EXTENSION COST CALCULATION
====================================================== */
export const calculateExtensionCost = (req, res) => {
  const { locker_id, new_slot_ids } = req.body;

  if (!locker_id || !new_slot_ids?.length) {
    return res.status(400).json({ message: "Missing data" });
  }

  db.query(
    `SELECT price_per_hour FROM lockers WHERE id=?`,
    [locker_id],
    (err, row) => {
      if (err || !row.length) return res.status(500).json({ message: "Locker lookup error" });

      const pricePerHour = row[0].price_per_hour;
      const extraCost = pricePerHour * new_slot_ids.length;

      res.json({ extra_cost: extraCost });
    }
  );
};


// ✅ Get a single session by ID
export const getSessionById = (req, res) => {
  const { sessionId } = req.params;

  const sql = `
    SELECT s.*, l.locker_number, h.name AS hub_name, h.city
    FROM sessions s
    JOIN lockers l ON s.locker_id = l.id
    JOIN hubs h ON l.hub_id = h.id
    WHERE s.id = ?
  `;

  db.query(sql, [sessionId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length) return res.status(404).json({ message: "Session not found" });

    res.json({ session: rows[0] });
  });
};

