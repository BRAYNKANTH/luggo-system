import db from "../config/db.js";

export const getUserDashboard = (req, res) => {
  const { userId } = req.params;

  const dashboard = {};

  // Get active bookings
  db.query(
    "SELECT * FROM bookings WHERE user_id = ? AND status='confirmed'",
    [userId],
    (err, bookings) => {
      if (err) return res.status(500).json({ message: "Database error" });
      dashboard.bookings = bookings;

      // Get payments
      db.query(
        "SELECT * FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = ?)",
        [userId],
        (err, payments) => {
          if (err) return res.status(500).json({ message: "Database error" });
          dashboard.payments = payments;

          // Get sessions
          db.query(
            "SELECT * FROM sessions WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = ?)",
            [userId],
            (err, sessions) => {
              if (err) return res.status(500).json({ message: "Database error" });
              dashboard.sessions = sessions;
              res.status(200).json({ dashboard });
            }
          );
        }
      );
    }
  );
};
