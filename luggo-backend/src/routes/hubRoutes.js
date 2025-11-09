// src/routes/hubRoutes.js
import express from "express";
import {
  getAllHubs,
  getHubById,
  searchHubs,
  getNearbyHubs,
} from "../controllers/HubController.js";

const router = express.Router();

// ✅ Keep specific routes before dynamic ones (order matters)
router.get("/nearby", getNearbyHubs);     // e.g., /api/hubs/nearby?lat=...&lng=...
router.get("/search", searchHubs);        // e.g., /api/hubs/search?query=Colombo
router.get("/:id", getHubById);           // e.g., /api/hubs/1
router.get("/", getAllHubs);              // e.g., /api/hubs

export default router;
