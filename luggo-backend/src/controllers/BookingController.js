import db from "../config/db.js";
import nodemailer from "nodemailer";
import { sendSMS } from "textlk-node";
import dotenv from "dotenv";
import cron from "node-cron";
dotenv.config();

/* ======================================================
   ✉️ Email Transporter Setup
====================================================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const createGroupBooking = (req, res) => {
  const { user_id, hub_id, date, mode, cart } = req.body;

  if (!user_id || !hub_id || !date || !mode || !cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // 1) Create main booking
  const bookingSql = `
      INSERT INTO bookings (user_id, hub_id, date, mode, total_amount, status)
      VALUES (?, ?, ?, ?, 0, 'pending')
  `;

  db.query(bookingSql, [user_id, hub_id, date, mode], (err, bookingRes) => {
    if (err) return res.status(500).json({ message: "DB Error (create booking)" });

    const booking_id = bookingRes.insertId;
    let totalAmount = 0;
    let insertsToComplete = 0;

    cart.forEach(item => {
      const locker_id = item.locker.id;

      if (item.type === "hourly") {
        item.slot_ids.forEach(slot_id => {
          const price = Number(item.locker.price_per_hour);
          totalAmount += price;
          insertsToComplete++;

          db.query(
            `INSERT INTO booking_items (booking_id, locker_id, slot_id, price)
             VALUES (?, ?, ?, ?)`,
            [booking_id, locker_id, slot_id, price],
            () => {
              insertsToComplete--;
              if (insertsToComplete === 0) finalizeTotal();
            }
          );
        });
      }

      if (item.type === "day") {
        const price = Number(item.locker.day_price);
        totalAmount += price;
        insertsToComplete++;

        db.query(
          `INSERT INTO booking_items (booking_id, locker_id, slot_id, price)
           VALUES (?, ?, NULL, ?)`,
          [booking_id, locker_id, price],
          () => {
            insertsToComplete--;
            if (insertsToComplete === 0) finalizeTotal();
          }
        );
      }
    });

    function finalizeTotal() {
      db.query(
        `UPDATE bookings SET total_amount=? WHERE id=?`,
        [totalAmount, booking_id],
        () => {
          return res.status(201).json({
            message: "Group booking created successfully (pending payment)",
            booking_id,
            total_amount: totalAmount
          });
        }
      );
    }
  });
};


/* ======================================================
   2️⃣ GET USER BOOKINGS
====================================================== */
export const getUserBookings = (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      b.id,
      b.date,
      b.mode,
      b.total_amount,
      b.status,
      h.name AS hub_name,
      h.city,
      COUNT(bi.id) AS lockers_count
    FROM bookings b
    JOIN hubs h ON b.hub_id = h.id
    LEFT JOIN booking_items bi ON bi.booking_id = b.id
    WHERE b.user_id = ?
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.log("getUserBookings Error:", err);
      return res.status(500).json({ message: "Database error fetching bookings" });
    }
    res.status(200).json({ bookings: results });
  });
};

/* ======================================================
   3️⃣ GET BOOKING BY ID
====================================================== */
export const getBookingById = (req, res) => {
  const { id } = req.params;

  // 1) Fetch main booking + user + hub
  db.query(
    `
    SELECT 
      b.id, b.date, b.mode, b.total_amount, b.status,
      u.name AS user_name, u.email AS user_email,
      h.name AS hub_name, h.city AS hub_city
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN hubs h ON b.hub_id = h.id
    WHERE b.id = ?
    `,
    [id],
    (err, bookingRows) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (!bookingRows.length) return res.status(404).json({ message: "Booking not found" });

      const booking = bookingRows[0];

      // 2) Fetch all booked lockers + slots under this group
      db.query(
        `
        SELECT 
          bi.id AS booking_item_id,
          bi.price,
          l.locker_number, l.size,
          s.slot_label, s.start_time, s.end_time
        FROM booking_items bi
        JOIN lockers l ON bi.locker_id = l.id
        LEFT JOIN slots s ON bi.slot_id = s.id
        WHERE bi.booking_id = ?
        ORDER BY l.locker_number ASC, s.start_time ASC
        `,
        [id],
        (err2, items) => {
          if (err2) return res.status(500).json({ message: "Failed to fetch booking items" });

          return res.status(200).json({
            booking,
            items
          });
        }
      );
    }
  );
};

/* ======================================================
   4️⃣ CANCEL BOOKING (email/SMS notice)
====================================================== */
export const cancelBooking = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM bookings WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ message: "Booking not found" });

    const booking = results[0];
    if (booking.status === "cancelled")
      return res.status(400).json({ message: "Already cancelled" });

    db.query("UPDATE bookings SET status='cancelled' WHERE id=?", [id], (err) => {
      if (err) return res.status(500).json({ message: "Failed to cancel" });

      db.query("UPDATE lockers SET availability_status='available' WHERE id=?", [booking.locker_id]);

      // Notify user
      db.query(
        `SELECT u.name,u.email,u.phone,u.signup_method,h.name AS hub_name,l.locker_number
         FROM users u
         JOIN lockers l ON l.id=? 
         JOIN hubs h ON h.id=? 
         WHERE u.id=?`,
        [booking.locker_id, booking.hub_id, booking.user_id],
        (err, r) => {
          if (!err && r.length > 0) {
            const { name, email, phone, signup_method, hub_name, locker_number } = r[0];
            const msg = `Hello ${name},
Your booking for locker ${locker_number} at ${hub_name} has been cancelled.`;

            if (signup_method === "email") {
              transporter.sendMail({
                from: "luggo@demo.lk",
                to: email,
                subject: "Luggo Booking Cancelled",
                text: msg,
              });
            } else {
              sendSMS({
                phoneNumber: `94${phone.replace(/^0/, "")}`,
                message: msg,
              });
            }
          }
        }
      );

      res.status(200).json({ message: "Booking cancelled successfully" });
    });
  });
};

/* ======================================================
   EXTEND BOOKING (Slot-Based + Payment Option)
====================================================== */
export const extendBooking = (req, res) => {
  const { id } = req.params;                   // booking ID
  const { new_slot_ids, payment_method } = req.body;

  if (!new_slot_ids || !Array.isArray(new_slot_ids) || new_slot_ids.length === 0)
    return res.status(400).json({ message: "new_slot_ids must be a non-empty array" });

  if (!payment_method || !["online", "cash"].includes(payment_method))
    return res.status(400).json({ message: "payment_method must be 'online' or 'cash'" });

  // 1. Fetch booking
  db.query("SELECT * FROM bookings WHERE id=?", [id], (err, bRes) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (bRes.length === 0)
      return res.status(404).json({ message: "Booking not found" });

    const booking = bRes[0];

    // 2. Check slots are sequential and after current booking slot
    const firstNewSlot = Math.min(...new_slot_ids);
    if (firstNewSlot <= booking.slot_id)
      return res.status(400).json({ message: "Selected slots must be after current slot" });

    // 3. Check availability
    const mark = new_slot_ids.map(() => "?").join(",");
   db.query(
  `SELECT slot_id FROM bookings 
   WHERE locker_id=? AND slot_id IN (${mark}) AND status IN ('pending_payment','confirmed','pending_extension_payment')`,
  [booking.locker_id, ...new_slot_ids],
  (err, conflict) => {
    if (err) return res.status(500).json({ message: "Conflict check error" });
    if (conflict.length > 0)
      return res.status(409).json({ message: "One or more selected slots are already booked" });

        // 4. Get slot durations
        db.query(
          `SELECT slot_label, end_time,
           (TIME_TO_SEC(end_time) - TIME_TO_SEC(start_time))/3600 AS hours
           FROM slots WHERE id IN (${mark}) ORDER BY id ASC`,
          new_slot_ids,
          (err, slots) => {
            if (err) return res.status(500).json({ message: "Slot loading error" });

            const extraHours = slots.reduce((t, s) => t + s.hours, 0);
            const newEndTime = `${booking.start_time.split(" ")[0]} ${slots[slots.length - 1].end_time}`;

            // 5. Calculate cost
            db.query("SELECT price_per_hour FROM lockers WHERE id=?", [booking.locker_id], (err, lRes) => {
              if (err) return res.status(500).json({ message: "Locker lookup failed" });

              const extraCost = lRes[0].price_per_hour * extraHours;

              // 6. Payment handling
              const extendPaymentStatus = payment_method === "cash" ? "pending" : "paid";
              const newBookingStatus = payment_method === "cash" ? "pending_extension_payment" : "confirmed";

              // 7. Update booking
              db.query(
                `UPDATE bookings 
                 SET slot_id=?, end_time=?, total_hours=total_hours+?, total_amount=total_amount+?,
                     extend_payment_status=?, extended_slot_ids=?, status=?
                 WHERE id=?`,
                [
                  new_slot_ids[new_slot_ids.length - 1], newEndTime,
                  extraHours, extraCost,
                  extendPaymentStatus, new_slot_ids.join(","),
                  newBookingStatus, id
                ],
                (err) => {
                  if (err) return res.status(500).json({ message: "Update failed" });

                  return res.status(200).json({
                    message: payment_method === "cash" 
                      ? "Extension added — Payment required at hub before unlock"
                      : "Extension successful",
                    added_slots: new_slot_ids.length,
                    extra_hours: extraHours,
                    extra_cost: extraCost,
                    new_end_time: newEndTime,
                    extend_payment_status: extendPaymentStatus
                  });
                }
              );
            });
          }
        );
      }
    );
  });
};
/* ======================================================
   6️⃣ ACTIVE BOOKINGS
====================================================== */
export const getActiveBookings = (req, res) => {
  const { userId } = req.params;
  const now = new Date();
  db.query(
    `SELECT b.*,l.locker_number,l.size,h.name AS hub_name,h.city
     FROM bookings b
     JOIN lockers l ON b.locker_id=l.id
     JOIN hubs h ON l.hub_id=h.id
     WHERE b.user_id=? AND b.end_time>? AND b.status='confirmed'
     ORDER BY b.start_time ASC`,
    [userId, now],
    (err, r) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json({ active_bookings: r });
    }
  );
};

/* ======================================================
   7️⃣ BOOKING HISTORY
====================================================== */
export const getBookingHistory = (req, res) => {
  const { userId } = req.params;
  db.query(
    `SELECT b.*,l.locker_number,l.size,h.name AS hub_name,h.city
     FROM bookings b
     JOIN lockers l ON b.locker_id=l.id
     JOIN hubs h ON l.hub_id=h.id
     WHERE b.user_id=? AND b.status IN ('cancelled','completed')
     ORDER BY b.end_time DESC`,
    [userId],
    (err, r) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json({ booking_history: r });
    }
  );
};

/* ======================================================
   2️⃣ CHECK LOCKER AVAILABILITY BY SLOT
====================================================== */
export const checkAvailabilityBeforeBooking = (req, res) => {
  const { locker_id, slot_id } = req.body;

  if (!locker_id || !slot_id)
    return res.status(400).json({ message: "locker_id and slot_id required" });

  db.query(
    "SELECT id FROM bookings WHERE locker_id = ? AND slot_id = ? AND status IN ('pending_payment','confirmed','pending_extension_payment') LIMIT 1",
    [locker_id, slot_id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (rows.length > 0) return res.status(409).json({ message: "Locker unavailable" });
      res.status(200).json({ message: "Locker available" });
    }
  );
};

/* ======================================================
   🔍 Get Available Lockers for a Slot (UI uses this)
====================================================== */
export const getAvailableLockersBySlot = (req, res) => {
  const { hub_id, slot_id, date } = req.query;

  if (!hub_id || !slot_id || !date) {
    return res.status(400).json({ message: "hub_id, slot_id and date are required" });
  }

  const sql = `
 SELECT l.*
FROM lockers l
WHERE l.hub_id = ?
  AND l.id NOT IN (
    SELECT bi.locker_id
    FROM booking_items bi
    JOIN bookings b ON bi.booking_id = b.id
    WHERE b.date = ?
      AND bi.slot_id = ?
      AND bi.status IN ('pending','confirmed')  -- ✅ correct for your logic
  )
ORDER BY l.locker_number ASC
  `;

  db.query(sql, [hub_id, date, slot_id], (err, results) => {
    if (err) {
      console.log("Availability Error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.status(200).json({ available_lockers: results });
  });
};


export const getAvailableLockersByDay = (req, res) => {
  const { hub_id, date } = req.query;
  if (!hub_id || !date)
    return res.status(400).json({ message: "hub_id and date required" });

  const sql = `
    SELECT l.*
FROM lockers l
WHERE l.hub_id = ?
  AND l.id NOT IN (
    SELECT bi.locker_id
    FROM booking_items bi
    JOIN bookings b ON bi.booking_id = b.id
    WHERE b.date = ?
      AND bi.status IN ('pending','confirmed')  -- ✅ correct here too
  )
ORDER BY l.locker_number ASC

  `;

  db.query(sql, [hub_id, date], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });

    const DAY_PRICE = {
      small: 800,
      medium: 1200,
      large: 2000,
    };

    const withPrices = rows.map(l => ({
      ...l,
      day_price: DAY_PRICE[l.size] ?? null
    }));

    res.status(200).json({ available_lockers: withPrices });
  });
};


export const extendHourlyBooking = (req, res) => {
  const { session_id } = req.params;
  const { slot_count } = req.body; // how many next slots user wants (1 or 2)

  if (![1, 2].includes(slot_count))
    return res.status(400).json({ message: "slot_count must be 1 or 2" });

  // 1) Load current session details
  const sqlSession = `
    SELECT s.id, s.booking_id, s.locker_id, s.start_time, s.end_time, b.date
    FROM sessions s
    JOIN bookings b ON s.booking_id=b.id
    WHERE s.id=?
  `;

  db.query(sqlSession, [session_id], (err, ssRows) => {
    if (err || !ssRows.length) return res.status(404).json({ message: "Session not found" });

    const ss = ssRows[0];

    // 2) Find current slot ID that matches end_time
    const sqlCurrentSlot = `
      SELECT id, end_time
      FROM slots
      WHERE end_time = TIME(?) 
      LIMIT 1
    `;
    db.query(sqlCurrentSlot, [ss.end_time], (err, csRows) => {
      if (err || !csRows.length) return res.status(500).json({ message: "Slot lookup failed" });

      let currentSlotId = csRows[0].id;
      const requestedSlots = [];

      for (let i = 1; i <= slot_count; i++) requestedSlots.push(currentSlotId + i);

      const marks = requestedSlots.map(() => "?").join(",");

      // 3) Check availability
      const sqlCheck = `
        SELECT bi.slot_id FROM booking_items bi 
        JOIN bookings b ON bi.booking_id=b.id
        WHERE b.date=? AND bi.locker_id=? AND bi.slot_id IN (${marks}) AND bi.status='confirmed'
      `;

      db.query(sqlCheck, [ss.date, ss.locker_id, ...requestedSlots], (err, conflicts) => {
        if (err) return res.status(500).json({ message: "Availability check failed" });
        if (conflicts.length > 0) return res.status(409).json({ message: "Some slots already booked" });

        // 4) Load slot times to compute new end_time
        const sqlTimes = `
          SELECT id, start_time, end_time
          FROM slots
          WHERE id IN (${marks})
          ORDER BY id ASC
        `;
        db.query(sqlTimes, requestedSlots, (err, slotRows) => {
          if (err || !slotRows.length) return res.status(500).json({ message: "Slot load failed" });

          const newEnd = `${ss.date.toISOString().slice(0,10)} ${slotRows[slotRows.length - 1].end_time}`;

          // 5) Add booking_items
          const inserts = slotRows.map(s => [ss.booking_id, ss.locker_id, s.id, 0]); // price later
          db.query(
            `INSERT INTO booking_items (booking_id, locker_id, slot_id, price) VALUES ?`,
            [inserts]
          );

          // 6) Get price per hour
          db.query(`SELECT price_per_hour FROM lockers WHERE id=?`, [ss.locker_id], (err, lr) => {
            const extraCost = lr[0].price_per_hour * slotRows.length;

            // 7) Update session and booking totals
            db.query(
              `UPDATE sessions 
               SET end_time=?, grace_until=DATE_ADD(?, INTERVAL 10 MINUTE)
               WHERE id=?`,
              [newEnd, newEnd, session_id]
            );

            db.query(
              `UPDATE bookings SET total_amount=total_amount+? WHERE id=?`,
              [extraCost, ss.booking_id]
            );

            return res.json({
              message: "Extension successful ✅",
              extended_slots: slotRows.length,
              added_cost: extraCost,
              new_end_time: newEnd
            });
          });
        });
      });
    });
  });
};
