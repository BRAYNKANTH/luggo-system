import db from "../config/db.js";

// ✅ Get All Hubs
export const getAllHubs = (req, res) => {
  const sql = "SELECT * FROM hubs ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error fetching hubs" });
    }
    res.status(200).json({ hubs: results });
  });
};

// ✅ Get Hub by ID
export const getHubById = (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM hubs WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ message: "Hub not found" });
    res.status(200).json({ hub: results[0] });
  });
};

// ✅ Search hubs by name or city
export const searchHubs = (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Search query required" });

  const sql =
    "SELECT * FROM hubs WHERE name LIKE ? OR city LIKE ? OR address LIKE ?";
  const likeQuery = `%${query}%`;
  db.query(sql, [likeQuery, likeQuery, likeQuery], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.status(200).json({ results });
  });
};

// ✅ Get nearest hubs based on user location (Haversine formula)
export const getNearbyHubs = (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng)
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required" });

  // Distance in kilometers using Haversine formula
  const sql = `
    SELECT id, name, city, address, image_url,latitude, longitude,
      (6371 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )) AS distance
    FROM hubs
    HAVING distance < 100
    ORDER BY distance ASC;
  `;

  db.query(sql, [lat, lng, lat], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error finding nearby hubs" });
    }

    res.status(200).json({
      message: "Nearby hubs fetched successfully",
      hubs: results,
    });
  });
};
