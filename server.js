import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import db from "./src/config/db.js";

import lockerRoutes from "./src/routes/lockerRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import supportRoutes from "./src/routes/supportRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import slotRoutes from "./src/routes/SlotRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import hubRoutes from "./src/routes/hubRoutes.js";

// Cron Jobs
import "./src/jobs/AutoCancelPendingBookings.js";
import "./src/jobs/sessionStatusCron.js";
import "./src/cron/sessionLifecycle.js";

dotenv.config();
const app = express();

// Static uploads
app.use("/uploads", express.static("uploads"));

// Parsers
app.use(bodyParser.json());
app.use(express.json());

// ✅ Correct and secure CORS configuration (only one)
app.use(
  cors({
    origin: [
      "https://luggo-system-5q9fkhv2v-braynkanth-thaspan-antonys-projects.vercel.app",
      "https://www.luggo.xyz",
      "http://localhost:5173", // local dev
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Handle preflight requests explicitly
app.options("*", cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hubs", hubRoutes);
app.use("/api/lockers", lockerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/slots", slotRoutes);

// Root
app.get("/", (req, res) => {
  res.send("🚀 Luggo Backend API running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
