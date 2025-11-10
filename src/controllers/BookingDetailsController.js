import db from "../config/db.js";

export const getBookingDetails = (req, res) => {
  const { bookingId } = req.params;

  const main = `
    SELECT b.*, h.name AS hub_name, h.city 
    FROM bookings b
    JOIN hubs h ON h.id = b.hub_id
    WHERE b.id=?
  `;

  const items = `
    SELECT bi.*, l.locker_number, l.size, s.start_time, s.end_time
    FROM booking_items bi
    JOIN lockers l ON bi.locker_id=l.id
    LEFT JOIN slots s ON bi.slot_id=s.id
    WHERE bi.booking_id=?
    ORDER BY l.locker_number ASC
  `;

  db.query(main, [bookingId], (err, bookingRows) => {
    if (err || !bookingRows.length) return res.status(404).json({ message: "Not found" });

    db.query(items, [bookingId], (err2, itemRows) => {
      if (err2) return res.status(500).json({ message: "DB Error" });

      res.json({ booking: bookingRows[0], items: itemRows });
    });
  });
};
