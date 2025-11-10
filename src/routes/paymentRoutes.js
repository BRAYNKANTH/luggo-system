import express from "express";
import {
  createPayhereSession,
  getPaymentByBooking,
  generatePDFReceipt,
  confirmPayment,

} from "../controllers/PaymentController.js";

const router = express.Router();

// FRONTEND → BACKEND → PAYHERE
router.post("/payhere-session", createPayhereSession);



// EXTRA (optional)
router.get("/booking/:bookingId", getPaymentByBooking);
router.get("/receipt/pdf/:bookingId", generatePDFReceipt);
router.post("/confirm-payment/:booking_id", confirmPayment);



export default router;
