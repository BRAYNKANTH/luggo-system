import express from "express";
import {
  getLockersByHub,
  getAvailableLockers,
  getLockerById,
  updateLockerStatus,
  getLockerPricesByHub,
  toggleLocker,
  bookLocker,
  getLiveAvailability,
} from "../controllers/LockerController.js";

const router = express.Router();

router.get("/hub/:hubId", getLockersByHub);
router.get("/available", getAvailableLockers);
router.get("/:id", getLockerById);
router.put("/:id/status", updateLockerStatus);
router.get("/prices/:hubId", getLockerPricesByHub);
router.put("/:id/toggle", toggleLocker);
router.post("/book", bookLocker);
router.get("/live", getLiveAvailability);

export default router;
