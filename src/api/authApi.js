import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/auth", // e.g. https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/auth
});

// Register (email or phone)
export const registerUser = (data) => API.post("/register", data);

// Login (email or phone)
export const loginUser = (data) => API.post("/login", data);

// Verify Phone OTP
export const verifyPhone = (data) => API.post("/verify-phone", data);

// Forgot Password (email or phone handled automatically)
export const forgotPassword = (data) => API.post("/forgot-password", data);

// Reset Password
export const resetPassword = (data) => API.post("/reset-password", data);

// Email verification is handled via GET directly in VerifyEmailPage.jsx
