import express from "express";
import { submitSupportQuery, getUserSupportQueries } from "../controllers/SupportController.js";
const router = express.Router();

router.post("/submit", submitSupportQuery);
router.get("/user/:userId", getUserSupportQueries);
export default router;
