// src/pages/BookingReviewPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { useMemo, useState } from "react";

const user_id = localStorage.getItem("user_id") || 14; // temporary fallback

export default function BookingReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state || !state.cart?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No booking found. Go back and choose lockers.
      </div>
    );
  }

  const { hub_id, date, mode, cart } = state;

  const totals = useMemo(() => {
    let total = 0;
    const rows = cart.map((item) => {
      let amount = 0;

      if (item.type === "hourly") {
        amount = Number(item.locker.price_per_hour || 0) * (item.slot_ids?.length || 0);
      } else {
        amount = Number(item.locker.day_price || 0);
      }

      total += amount;
      return { item, amount };
    });

    return { rows, total };
  }, [cart]);

  const [loading, setLoading] = useState(false);

  const confirmAndPay = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/bookings/create-group", {
        user_id,
        hub_id,
        date,
        mode,
        cart
      });

      const { booking_id } = res.data;
      navigate(`/payment/${booking_id}?amount=${totals.total.toFixed(2)}`);
    } catch (err) {
      console.log(err);
      toast.error("Failed to create booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-xl border border-blue-100 shadow-xl rounded-3xl p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft size={18} />
          
          </button>

          <h1 className="text-3xl font-semibold text-gray-900">
            Review & Confirm
          </h1>
        </div>

        {/* Date + Mode */}
        <div className="flex items-center gap-6 text-gray-700 mb-8 border rounded-xl px-4 py-3 bg-white/60 shadow-sm">
          <span className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={18} /> {date}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="text-blue-600" size={18} /> {mode === "hourly" ? "Hourly Booking" : "Full Day"}
          </span>
        </div>

        {/* Selected Items */}
        <div className="space-y-4 mb-10">
          {totals.rows.map(({ item, amount }, idx) => (
            <div
              key={idx}
              className="border border-blue-100 bg-white/70 shadow-sm rounded-xl p-4 hover:shadow-md transition flex justify-between items-center"
            >
              <div>
                <div className="text-lg font-semibold text-blue-700">
                  {item.locker.locker_number} • {item.locker.size} • {item.type === "hourly" ? "Hourly" : "Full Day"}
                </div>

                {item.type === "hourly" ? (
                  <p className="text-sm text-gray-600 mt-1">
                    Slots: {item.slot_ids.join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">Full Day Usage</p>
                )}
              </div>

              <div className="text-blue-700 font-semibold text-lg">
                LKR {amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Total & Pay */}
        <div className="border-t pt-6 text-right">
          <div className="text-xl font-bold text-gray-900">Total: LKR {totals.total.toFixed(2)}</div>

          <button
            onClick={confirmAndPay}
            disabled={loading}
            className="mt-5 bg-blue-600 text-white px-8 py-3 rounded-xl text-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Processing..." : "Confirm & Proceed to Payment →"}
          </button>
        </div>

      </div>
    </div>
  );
}
