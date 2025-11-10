// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import db from "./config/db.js";
import lockerRoutes from "./routes/lockerRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";




import authRoutes from "./routes/authRoutes.js";
import hubRoutes from "./routes/hubRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());


app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://www.luggo.xyz https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;"
  );
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hubs", hubRoutes);
app.use("/api/lockers", lockerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes)
app.use("/api/sessions", sessionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);
// Root
app.get("/", (req, res) => {
  res.send("🚀 Luggo Backend API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
