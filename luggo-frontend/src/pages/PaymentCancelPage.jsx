// src/pages/PaymentCancel.jsx
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-red-50/50 px-6 animate-fadeIn">
      <div className="bg-white/80 backdrop-blur-xl border border-red-100 p-10 rounded-3xl shadow-xl max-w-md text-center animate-slideUp">

        <div className="flex justify-center mb-4">
          <XCircle size={70} className="text-red-500 drop-shadow-md" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 leading-relaxed">
          Your transaction was not completed.  
          Don’t worry — your lockers are still reserved for a short time.
        </p>

        <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg py-3 mt-5 text-sm">
          You can retry the payment anytime.
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/my-bookings"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-md transition"
          >
            Retry Payment
          </Link>

          <Link
            to="/"
            className="text-red-700 hover:text-red-900 text-sm font-medium"
          >
            Return to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
