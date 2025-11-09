import express from "express";
import { getUserDashboard } from "../controllers/DashboardController.js";
const router = express.Router();

router.get("/user/:userId", getUserDashboard);
export default router;
