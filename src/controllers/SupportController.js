import db from "../config/db.js";

// ✅ Submit support query
export const submitSupportQuery = (req, res) => {
  const { user_id, subject, message } = req.body;
  if (!user_id || !subject || !message)
    return res.status(400).json({ message: "All fields required" });

  db.query(
    "INSERT INTO support (user_id, subject, message) VALUES (?, ?, ?)",
    [user_id, subject, message],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(201).json({ message: "Query submitted successfully" });
    }
  );
};

// ✅ View support queries of a user
export const getUserSupportQueries = (req, res) => {
  const { userId } = req.params;
  db.query(
    "SELECT * FROM support WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json({ support_queries: results });
    }
  );
};
