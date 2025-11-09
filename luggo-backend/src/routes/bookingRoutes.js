import express from "express";
import {
  getUserBookings,
  getBookingById,
  cancelBooking,
  createGroupBooking ,
  extendBooking,
  getActiveBookings,
  getBookingHistory,
  getAvailableLockersByDay,
  checkAvailabilityBeforeBooking,
  getAvailableLockersBySlot,
  extendHourlyBooking
} from "../controllers/BookingController.js";

import { getBookingDetails } from "../controllers/BookingDetailsController.js";
const router = express.Router();

/* ======================================================
   BOOKING ROUTES (SLOT BASED SYSTEM)
====================================================== */

// Create booking

router.post("/create-group", createGroupBooking);
// Lists
router.get("/user/:userId", getUserBookings);
router.get("/active/:userId", getActiveBookings);
router.get("/history/:userId", getBookingHistory);
router.post("/extend-hourly/:session_id", extendHourlyBooking);

// Availability

router.get("/available-by-day", getAvailableLockersByDay);
router.post("/check", checkAvailabilityBeforeBooking);

// ✅ Get lockers available for a slot in a hub
router.get("/available-by-slot", getAvailableLockersBySlot);
router.get("/details/:bookingId", getBookingDetails);
// Extend booking
router.put("/:id/extend", extendBooking);

// Cancel booking
router.put("/:id/cancel", cancelBooking);

// ✅ Move this to last because it’s dynamic and captures everything!!
router.get("/:id", getBookingById);

export default router;
