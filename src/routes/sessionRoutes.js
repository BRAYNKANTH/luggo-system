import express from "express";
import { unlockLocker, lockLocker, releaseLocker, calculateExtensionCost ,
    getExtendableSlots,getSessionById
} from "../controllers/sessionController.js";
import { getActiveSessions } from "../controllers/sessionController.js";


import { createExtensionPaymentSession, confirmExtensionPayment } from "../controllers/PaymentController.js";
const router = express.Router();

router.put("/unlock/:sessionId", unlockLocker);
router.put("/lock/:sessionId", lockLocker);
router.put("/release/:sessionId", releaseLocker);
router.get("/active/:userId", getActiveSessions);
router.get("/extendable/:session_id", getExtendableSlots);
router.post("/extension/calculate", calculateExtensionCost);
router.get("/:sessionId", getSessionById);
router.post("/extension/payhere-session", createExtensionPaymentSession);
router.post("/extension/confirm", confirmExtensionPayment);
export default router;
