import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { sendSMS } from "textlk-node";
import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==================== Gmail Transporter ====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

// ============================================================
// 1️⃣ REGISTER USER (store temporarily until verified)
// ============================================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, signup_method } = req.body;
    if (!signup_method)
      return res.status(400).json({ message: "Signup method required." });

    if (signup_method === "google")
      return res
        .status(400)
        .json({ message: "Use /google-login endpoint for Google signups." });

    if (signup_method === "email" && (!email || !password))
      return res.status(400).json({ message: "Email and password required." });
    if (signup_method === "phone" && (!phone || !password))
      return res.status(400).json({ message: "Phone and password required." });

    const hashed = await bcrypt.hash(password, 10);

    // Check if already exists in users or pending
    db.query(
      "SELECT * FROM users WHERE email = ? OR phone = ?",
      [email || null, phone || null],
      (err, existingUsers) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (existingUsers.length > 0)
          return res.status(400).json({ message: "User already exists." });

        db.query(
          "SELECT * FROM pending_registrations WHERE email = ? OR phone = ?",
          [email || null, phone || null],
          (err, pending) => {
            if (err) return res.status(500).json({ message: "DB error" });
            if (pending.length > 0)
              return res
                .status(400)
                .json({ message: "Pending verification already exists." });

            // Proceed with registration
            if (signup_method === "email") {
              const token = jwt.sign({ email }, process.env.JWT_SECRET, {
                expiresIn: "1d",
              });
              const link = `${
                process.env.FRONTEND_URL || "https://luggo-system-5q9fkhv2v-braynkanth-thaspan-antonys-projects.vercel.app"
              }/verify-email?token=${token}`;

              const htmlBody = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Welcome to Luggo, ${name}!</h2>
                  <p>Please verify your email to activate your account:</p>
                  <a href="${link}" style="background-color:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">Verify My Email</a>
                  <p style="margin-top:15px;">Or copy this link:</p>
                  <p style="color:#2563eb;">${link}</p>
                </div>`;

              transporter.sendMail({
                from: "luggo@demo.lk",
                to: email,
                subject: "Verify your Luggo account",
                html: htmlBody,
              });

              db.query(
                "INSERT INTO pending_registrations (name, email, password_hash, signup_method, verification_token, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
                [
                  name,
                  email,
                  hashed,
                  "email",
                  token,
                  new Date(Date.now() + 24 * 60 * 60 * 1000),
                ]
              );

              return res.status(200).json({
                message:
                  "Verification email sent. Please check your inbox to activate your account.",
              });
            }

            if (signup_method === "phone") {
              const otp = Math.floor(100000 + Math.random() * 900000).toString();
              const expires = new Date(Date.now() + 5 * 60 * 1000);

              sendSMS({
                phoneNumber: `94${phone.replace(/^0/, "")}`,
                message: `Your Luggo OTP is ${otp}`,
              });

              db.query(
                "INSERT INTO pending_registrations (name, phone, password_hash, signup_method, otp, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
                [name, phone, hashed, "phone", otp, expires]
              );

              return res.status(200).json({
                message: "OTP sent to your phone for verification.",
              });
            }
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 2️⃣ VERIFY EMAIL (move from pending → users)
// ============================================================
export const verifyEmail = (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    db.query(
      "SELECT * FROM pending_registrations WHERE email = ? AND verification_token = ?",
      [email, token],
      (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (results.length === 0)
          return res
            .status(400)
            .json({ message: "Invalid or expired verification token." });

        const p = results[0];
        db.query(
          "INSERT INTO users (name, email, password_hash, signup_method, is_email_verified) VALUES (?, ?, ?, 'email', true)",
          [p.name, p.email, p.password_hash],
          (err) => {
            if (err)
              return res.status(500).json({ message: "User creation failed." });

            db.query("DELETE FROM pending_registrations WHERE id = ?", [p.id]);
            res
              .status(200)
              .json({ message: "Email verified successfully. You can now log in." });
          }
        );
      }
    );
  } catch {
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

// ============================================================
// 3️⃣ VERIFY PHONE OTP (move from pending → users)
// ============================================================
export const verifyPhone = (req, res) => {
  const { phone, otp } = req.body;

  db.query(
    "SELECT * FROM pending_registrations WHERE phone = ? AND otp = ?",
    [phone, otp],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (results.length === 0)
        return res.status(400).json({ message: "Invalid OTP or expired." });

      const p = results[0];
      if (new Date() > new Date(p.expires_at))
        return res.status(400).json({ message: "OTP expired." });

      db.query(
        "INSERT INTO users (name, phone, password_hash, signup_method, is_phone_verified) VALUES (?, ?, ?, 'phone', true)",
        [p.name, p.phone, p.password_hash],
        (err) => {
          if (err)
            return res.status(500).json({ message: "User creation failed." });
          db.query("DELETE FROM pending_registrations WHERE id = ?", [p.id]);
          res
            .status(200)
            .json({ message: "Phone verified successfully. You can now log in." });
        }
      );
    }
  );
};

// ============================================================
// 4️⃣ LOGIN (email or phone)
// ============================================================
export const loginUser = (req, res) => {
  const { emailOrPhone, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE email = ? OR phone = ?",
    [emailOrPhone, emailOrPhone],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (results.length === 0)
        return res.status(404).json({ message: "User not found." });

      const user = results[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match)
        return res.status(401).json({ message: "Incorrect password." });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.status(200).json({
        message: "Login successful.",
        token,
        user,
      });
    }
  );
};

// ============================================================
// 5️⃣ GOOGLE LOGIN (direct, auto verified)
// ============================================================
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID
    ).verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: google_id, name, email } = payload;

    db.query(
      "SELECT * FROM users WHERE google_id = ? OR email = ?",
      [google_id, email],
      (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });

        if (results.length > 0) {
          const user = results[0];
          const jwtToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
          );
          return res.status(200).json({
            message: "Login successful",
            token: jwtToken,
            user,
          });
        }

        db.query(
          "INSERT INTO users (name, email, google_id, signup_method, is_email_verified) VALUES (?, ?, ?, 'google', true)",
          [name, email, google_id],
          (err, result) => {
            if (err) return res.status(500).json({ message: "DB error" });
            const jwtToken = jwt.sign(
              { id: result.insertId, email },
              process.env.JWT_SECRET,
              { expiresIn: "2h" }
            );
            res.status(201).json({
              message: "Account created via Google",
              token: jwtToken,
              user: { id: result.insertId, name, email, signup_method: "google" },
            });
          }
        );
      }
    );
  } catch {
    res.status(400).json({ message: "Invalid Google token" });
  }
};

// ============================================================
// 6️⃣ FORGOT + RESET PASSWORD (reuse your existing logic)
// ============================================================
export const forgotPassword = (req, res) => {
  const { emailOrPhone } = req.body;
  db.query(
    "SELECT * FROM users WHERE email = ? OR phone = ?",
    [emailOrPhone, emailOrPhone],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (results.length === 0)
        return res.status(404).json({ message: "User not found." });

      const user = results[0];
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      if (user.signup_method === "email") {
        const link = `${
          process.env.FRONTEND_URL || "https://luggo-system-5q9fkhv2v-braynkanth-thaspan-antonys-projects.vercel.app/"
        }/reset-password?token=${token}`;
        transporter.sendMail({
          from: "luggo@demo.lk",
          to: user.email,
          subject: "Luggo Password Reset",
          text: `Click to reset password: ${link}`,
        });
      } else if (user.signup_method === "phone") {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        sendSMS({
          phoneNumber: `94${user.phone.replace(/^0/, "")}`,
          message: `Your Luggo password reset code is ${otp}`,
        });
        db.query(
          "UPDATE users SET phone_otp = ?, otp_expires_at = NOW() + INTERVAL 5 MINUTE WHERE id = ?",
          [otp, user.id]
        );
      }

      db.query("UPDATE users SET reset_token = ? WHERE id = ?", [token, user.id]);
      res.status(200).json({
        message: "Reset instructions sent via " + user.signup_method,
      });
    }
  );
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(newPassword, 10);
    db.query(
      "UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?",
      [hashed, decoded.id],
      (err) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.status(200).json({ message: "Password reset successful" });
      }
    );
  } catch {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
