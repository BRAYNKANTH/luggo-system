import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, CreditCard } from "lucide-react";

export default function PaymentPage() {
  const { booking_id } = useParams();
  const navigate = useNavigate();

  const [amount, setAmount] = useState(null);
  const [customer, setCustomer] = useState({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAmount() {
      try {
        const res = await axios.get(`https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/bookings/${booking_id}`);
        setAmount(res.data.booking.total_amount);
      } catch {
        toast.error("Could not load booking details.");
      }
    }
    fetchAmount();
  }, [booking_id]);

  async function handlePay() {
    try {
      setLoading(true);

      const { data } = await axios.post(
        "https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/payments/payhere-session",
        { booking_id }
      );

      const fields = {
        merchant_id: data.merchant_id,
        return_url: data.return_url,
        cancel_url: data.cancel_url,
        notify_url: data.notify_url,
        order_id: data.order_id,
        items: data.items ?? "Luggo Locker Rental",
        amount: Number(data.amount).toFixed(2),
        currency: data.currency,
        hash: data.hash,
        first_name: customer.name.split(" ")[0] || customer.name,
        last_name: customer.name.split(" ")[1] || "User",
        email: customer.email,
        phone: localStorage.getItem("phone") ?? "0771234567",
        address: "No. 10, Main Street",
        city: "Colombo",
        country: "Sri Lanka",
      };

      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://sandbox.payhere.lk/pay/checkout";
      Object.keys(fields).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch {
      toast.error("Payment initialization failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/70 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl border border-blue-100 shadow-xl rounded-3xl p-8">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Secure Payment
        </h1>
        <p className="text-gray-600 mb-8">
          Complete your booking in a few seconds.
        </p>

        {/* Summary Box */}
        <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-5 mb-8">
          <p className="text-gray-700 mb-2">
            <strong>Booking ID:</strong> #{booking_id}
          </p>
          <p className="text-gray-700 text-xl font-semibold">
            Payable Amount: <span className="text-blue-700">LKR {amount ?? "..."}</span>
          </p>
        </div>

        {/* Customer Details */}
        <h2 className="text-lg font-medium text-gray-800 mb-3">Your Details</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Full Name"
            value={customer.name}
            className="border rounded-lg px-4 py-2 shadow-sm"
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={customer.email}
            className="border rounded-lg px-4 py-2 shadow-sm"
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
          />
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={loading || amount === null}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60"
        >
          <CreditCard size={20} />
          {loading ? "Redirecting to PayHere..." : "Pay Securely"}
        </button>

        {/* Trust Note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          🔐 Payments are processed securely via PayHere.
        </p>
      </div>
    </div>
  );
}
