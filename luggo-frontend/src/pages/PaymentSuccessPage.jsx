import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
   const [params] = useSearchParams();
  const order_id = params.get("order_id");

  useEffect(() => {
    if (!order_id ) return;
 
    const booking_id = order_id.split("-")[0]; // extract real id

    axios.post(`https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/payments/confirm-payment/${booking_id}`)
      .then(() => toast.success("Payment verified & sessions created ✅"))
      .catch(() => toast.error("Failed to confirm payment"));
  }, [order_id, status_code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <CheckCircle size={64} className="text-green-600 mx-auto" />

        <h1 className="text-2xl font-bold text-green-700 mt-4">Payment Successful!</h1>

        <p className="text-gray-600 mt-2">
          Your booking has been confirmed. You can now access your locker.
        </p>

        <Link 
          to="/my-bookings"
          className="mt-6 inline-block bg-blue-700 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-800 transition"
        >
          View My Bookings
        </Link>
      </div>
    </div>
  );
}
