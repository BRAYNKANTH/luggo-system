import nodemailer from "nodemailer";
import db from "../config/db.js";

export const sendBookingConfirmation = (req, res) => {
  const { booking_id } = req.body;

  db.query(
    `SELECT u.email, u.name, b.start_time, b.end_time, h.name AS hub_name 
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN lockers l ON b.locker_id = l.id
     JOIN hubs h ON l.hub_id = h.id
     WHERE b.id = ?`,
    [booking_id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ message: "Booking not found" });

      const data = results[0];
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      });

      transporter.sendMail({
        from: "luggo@demo.lk",
        to: data.email,
        subject: "Luggo Booking Confirmed",
        text: `Hello ${data.name},\nYour booking at ${data.hub_name} is confirmed.\nDuration: ${data.start_time} → ${data.end_time}\n\nThank you for choosing Luggo.`,
      });

      res.status(200).json({ message: "Confirmation email sent" });
    }
  );
};
