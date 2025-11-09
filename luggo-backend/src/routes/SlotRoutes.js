import express from "express";
import { getSlots } from "../controllers/SlotController.js";
import { getNextExtendableSlots } from "../controllers/SlotController.js";
const router = express.Router();

router.get("/", getSlots);
router.get("/next", getNextExtendableSlots);

export default router;
