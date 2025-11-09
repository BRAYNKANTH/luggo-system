import db from "../config/db.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { createSessionsForBooking } from "./sessionController.js";    

export const createPayhereSession = (req, res) => {
  const { booking_id } = req.body;

  db.query(
    `SELECT b.total_amount, u.name, u.email 
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     WHERE b.id = ?`,
    [booking_id],
    (err, rows) => {
      if (err || !rows.length)
        return res.status(404).json({ message: "Booking not found" });

      const { total_amount } = rows[0];

      const merchant_id = process.env.PAYHERE_MERCHANT_ID;
      const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
      const currency = "LKR";

      const amount = Number(total_amount).toFixed(2);

      // ✅ Generate UNIQUE order ID
      const order_id = `${booking_id}-${Date.now()}`;

      // ✅ Hash signature (correct format)
      const hashedSecret = crypto
        .createHash("md5")
        .update(merchant_secret)
        .digest("hex")
        .toUpperCase();

      const hash = crypto
        .createHash("md5")
        .update(merchant_id + order_id + amount + currency + hashedSecret)
        .digest("hex")
        .toUpperCase();

      return res.json({
        merchant_id,
        return_url: process.env.PAYHERE_RETURN_URL,
        cancel_url: process.env.PAYHERE_CANCEL_URL,
        notify_url: process.env.PAYHERE_NOTIFY_URL,
        order_id,
        items: "Luggo Group Booking",
        currency,
        amount,
        hash,
      });
    }
  );
};

export const confirmPayment = (req, res) => {
  const { booking_id } = req.params;

  console.log("🔔 Confirming payment for booking:", booking_id);

  // 1) Confirm booking
  db.query(
    `UPDATE bookings SET status='confirmed' WHERE id=?`,
    [booking_id],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to confirm booking" });

      // 2) Confirm all booking items
      db.query(
        `UPDATE booking_items SET status='confirmed' WHERE booking_id=?`,
        [booking_id],
        (err) => {
          if (err) return res.status(500).json({ message: "Failed to confirm booking items" });

          // 3) Create sessions
          createSessionsForBooking(booking_id, (err) => {
            if (err) return res.status(500).json({ message: "Failed to create sessions" });

            console.log("🎉 Sessions successfully created for booking:", booking_id);
            return res.status(200).json({ message: "Payment confirmed + sessions created ✅" });
          });
        }
      );
    }
  );
};

// 2) PayHere Server Notification Handler

/* ======================================================
   3️⃣ GET PAYMENT DETAILS BY BOOKING
====================================================== */
export const getPaymentByBooking = (req, res) => {
  const { bookingId } = req.params;
  db.query("SELECT * FROM payments WHERE booking_id = ?", [bookingId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length) return res.status(404).json({ message: "No payment found" });
    res.json({ payment: rows[0] });
  });
};

/* ======================================================
   4️⃣ GENERATE RECEIPT PDF
====================================================== */
export const generatePDFReceipt = (req, res) => {
  const { bookingId } = req.params;

  db.query(
    `
      SELECT 
        b.id, b.date, b.mode, b.total_amount, b.status,
        u.name, u.email,
        h.name AS hub_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN hubs h ON b.hub_id = h.id
      WHERE b.id = ?
    `,
    [bookingId],
    (err, bookingRows) => {
      if (err || !bookingRows.length)
        return res.status(404).json({ message: "Booking not found" });

      const booking = bookingRows[0];

      db.query(
        `
          SELECT 
            bi.locker_id, bi.slot_id, bi.price,
            l.locker_number, l.size,
            s.start_time, s.end_time, s.slot_label
          FROM booking_items bi
          JOIN lockers l ON bi.locker_id = l.id
          LEFT JOIN slots s ON bi.slot_id = s.id
          WHERE bi.booking_id = ?
          ORDER BY l.locker_number ASC, bi.slot_id ASC
        `,
        [bookingId],
        (err2, items) => {
          if (err2) return res.status(500).json({ message: "Cannot load booking items" });

          const pdf = new PDFDocument();
          const path = `./receipts/receipt_${bookingId}.pdf`;

          // ✅ Ensure folder exists
          if (!fs.existsSync("./receipts")) fs.mkdirSync("./receipts");

          const stream = fs.createWriteStream(path);
          pdf.pipe(stream);

          pdf.fontSize(18).text("LUGGO PAYMENT RECEIPT", { align: "center" });
          pdf.moveDown();

          pdf.fontSize(12).text(`Booking ID: ${booking.id}`);
          pdf.text(`Customer: ${booking.name} (${booking.email})`);
          pdf.text(`Hub: ${booking.hub_name}`);
          pdf.text(`Date: ${booking.date}`);
          pdf.text(`Mode: ${booking.mode.toUpperCase()}`);
          pdf.moveDown();

          pdf.fontSize(14).text("Booked Lockers:", { underline: true });
          pdf.moveDown(0.5);

          items.forEach((it) => {
            pdf.fontSize(12).text(
              `Locker ${it.locker_number} (${it.size}) — LKR ${it.price}`
            );
            if (booking.mode === "hourly" && it.slot_id) {
              pdf.text(`   Slot ${it.slot_label}: ${it.start_time} → ${it.end_time}`);
            } else {
              pdf.text(`   Full Day Access`);
            }
            pdf.moveDown(0.5);
          });

          pdf.moveDown();
          pdf.fontSize(16).text(`Total Paid: LKR ${booking.total_amount}`, { align: "right" });

          pdf.end();

          // ✅ Ensure download starts only after writing finished
          stream.on("finish", () => {
            res.setHeader("Content-Type", "application/pdf");
            return res.download(path);
          });
        }
      );
    }
  );
};







export const createExtensionPaymentSession = (req, res) => {
  const { session_id, slot_ids } = req.body;

  if (!session_id || !slot_ids?.length) {
    return res.status(400).json({ message: "session_id and slot_ids required" });
  }

  const q = `
    SELECT s.id, s.booking_id, s.locker_id, b.user_id, b.date,
           u.name, u.email, l.price_per_hour
    FROM sessions s
    JOIN bookings b ON s.booking_id = b.id
    JOIN users u ON b.user_id = u.id
    JOIN lockers l ON s.locker_id = l.id
    WHERE s.id=?
  `;

  db.query(q, [session_id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ message: "Session not found" });

    const ss = rows[0];
    const extraCost = Number(ss.price_per_hour * slot_ids.length).toFixed(2);

    const merchant_id = process.env.PAYHERE_MERCHANT_ID;
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
    const currency = "LKR";

    const order_id = `EXT-${session_id}-${Date.now()}`;
    const hashedSecret = crypto.createHash("md5").update(merchant_secret).digest("hex").toUpperCase();
    const hash = crypto.createHash("md5")
      .update(merchant_id + order_id + extraCost + currency + hashedSecret)
      .digest("hex")
      .toUpperCase();

    return res.json({
      merchant_id,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: `${process.env.API_URL}/api/sessions/extension/confirm`,
      order_id,
      items: `Locker Extension`,
      amount: extraCost,
      currency,
      first_name: ss.name,
      email: ss.email,
      custom_1: session_id,
      custom_2: slot_ids.join(","),
      hash
    });
  });
};

/* ------------------------------------------------------
   2) CONFIRM EXTENSION PAYMENT (PAYHERE → BACKEND)
------------------------------------------------------ */
export const confirmExtensionPayment = (req, res) => {
  const { session_id, slot_ids, payment_status } = req.body;

  if (!session_id || !slot_ids) return res.status(400).json({ message: "Missing data" });
  if (payment_status !== "Completed") return res.status(400).json({ message: "Payment not completed" });

  const slotList = slot_ids.split(",");

  // Insert booking_items
  const sql1 = `
    INSERT INTO booking_items (booking_id, locker_id, slot_id, price)
    SELECT s.booking_id, s.locker_id, ?, l.price_per_hour
    FROM sessions s
    JOIN lockers l ON s.locker_id = l.id
    WHERE s.id = ?
  `;

  let done = 0;
  slotList.forEach(slot_id => {
    db.query(sql1, [slot_id, session_id], () => {
      done++;
      if (done === slotList.length) finish();
    });
  });

  function finish() {
    // Extend session end_time
    const sql2 = `
      UPDATE sessions 
      SET end_time = ADDTIME(end_time, SEC_TO_TIME(3600 * ?)),
          grace_until = DATE_ADD(end_time, INTERVAL 10 MINUTE)
      WHERE id = ?
    `;

    db.query(sql2, [slotList.length, session_id]);

    // Increase booking total
    const sql3 = `
      UPDATE bookings b 
      JOIN sessions s ON s.booking_id = b.id
      JOIN lockers l ON s.locker_id = l.id
      SET b.total_amount = b.total_amount + (l.price_per_hour * ?)
      WHERE s.id = ?
    `;

    db.query(sql3, [slotList.length, session_id]);

    return res.json({ message: "Extension Payment Confirmed ✅" });
  }
};
