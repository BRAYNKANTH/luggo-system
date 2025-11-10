import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import PaymentExtensionPage from "./pages/PaymentExtensionPage";


import LandingPage from "./pages/LandingPage";
import RegisterForm from "./components/auth/RegisterForm";
import LoginForm from "./components/auth/LoginForm";
import VerifyEmailPage from "./components/auth/VerifyEmailPage";
import VerifyPhone from "./components/auth/VerifyPhone";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import AboutPage from "./pages/AboutPage";
import HubsPage from "./pages/HubsPage";

import HubDetails from "./pages/HubDetails";
import AvailabilityPage from "./pages/AvailabilityPage";
import BookingReviewPage from "./pages/BookingReviewPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccessPage";
import PaymentCancel from "./pages/PaymentCancelPage";
import MyBookings from "./pages/MyBookings";
import AccessLockerPage from "./pages/AccessLockerPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";




export default function App() {
  return (
   <Router>
  <Routes>

    {/* ✅ Always public auth routes */}
    <Route path="/login" element={<LoginForm />} />
    <Route path="/register" element={<RegisterForm />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/verify-phone" element={<VerifyPhone />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    

    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/my-bookings" element={<MyBookings />} />
    <Route path="/access/:sessionId" element={<AccessLockerPage />} />



    {/* ✅ Public visitor pages */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/hubs" element={<HubsPage />} />
    <Route path="/hub/:id" element={<HubDetails />} />
    <Route path="/payment-extension" element={<PaymentExtensionPage />} />


    {/* 🔐 Protected pages */}
    <Route path="/hub/:id/availability" element={
      <ProtectedRoute><AvailabilityPage /></ProtectedRoute>
    } />

    <Route path="/booking-review" element={
      <ProtectedRoute><BookingReviewPage /></ProtectedRoute>
    } />
<Route path="/booking-details/:bookingId" element={<BookingDetailsPage />} />
    <Route path="/payment/:booking_id" element={
      <ProtectedRoute><PaymentPage /></ProtectedRoute>
    } />

    <Route path="/payment" element={
      <ProtectedRoute><PaymentPage /></ProtectedRoute>
    } />

    {/* ✅ Payment status pages can be public */}
    <Route path="/payment-success" element={<PaymentSuccess />} />
    <Route path="/payment-cancel" element={<PaymentCancel />} />
    <Route path="/access/:sessionId" element={<AccessLockerPage />} />


  </Routes>
</Router>

  );
}
