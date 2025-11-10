import express from "express";
import {
  sendBookingConfirmation,
} from "../controllers/NotificationController.js";

const router = express.Router();

// ✅ Send email after booking confirmation
router.post("/booking-confirmation", sendBookingConfirmation);

// (Optional) more notification endpoints can go here later
// router.post("/session-expiry", sendSessionExpiryAlert);
// router.post("/payment-receipt", sendPaymentReceipt);

export default router;
