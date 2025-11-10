import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Lock, CreditCard } from "lucide-react";

export default function BookingConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [hub, setHub] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const { hubId, lockers, start_time, end_time } = state || {};

  // 🔒 Redirect if missing data
  useEffect(() => {
    if (!hubId || !lockers?.length || !start_time || !end_time) {
      toast.error("Incomplete booking data");
      navigate("/hubs");
    }
  }, [hubId, lockers, start_time, end_time, navigate]);

  // 📍 Fetch Hub Details
  useEffect(() => {
    const fetchHub = async () => {
      try {
        const res = await axios.get(`https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/hubs/${hubId}`);
        setHub(res.data.hub);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load hub details");
      }
    };
    if (hubId) fetchHub();
  }, [hubId]);

  // ⏱ Calculate duration
  useEffect(() => {
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      const hours = Math.ceil((end - start) / (1000 * 60 * 60));
      setTotalHours(hours > 0 ? hours : 0);
    }
  }, [start_time, end_time]);

  // 💰 Calculate total price
  useEffect(() => {
    const fetchLockerPrices = async () => {
      try {
        const res = await axios.get(`https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/lockers/hub/${hubId}`);
        const allLockers = res.data.lockers;
        const selected = allLockers.filter((l) => lockers.includes(l.locker_number));
        const total = selected.reduce(
          (sum, l) => sum + l.price_per_hour * totalHours,
          0
        );
        setTotalAmount(total);
      } catch (err) {
        console.error(err);
      }
    };
    if (hubId && lockers?.length && totalHours > 0) fetchLockerPrices();
  }, [hubId, lockers, totalHours]);

  // 🧾 Confirm & Pay
  const handleConfirm = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    if (totalHours <= 0) {
      toast.error("Invalid booking time");
      return;
    }

    try {
      setIsProcessing(true);

      const res = await axios.get(`https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/lockers/hub/${hubId}`);
      const allLockers = res.data.lockers;

      const bookingTasks = lockers.map(async (lockerNumber) => {
        const locker = allLockers.find((l) => l.locker_number === lockerNumber);
        if (!locker) return;

        // 1️⃣ Create Booking
        const bookingRes = await axios.post("https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/bookings", {
          user_id: user.id,
          locker_id: locker.id,
          start_time,
          end_time,
        });

        const bookingId = bookingRes.data.booking_id;
        const amount = locker.price_per_hour * totalHours;

        // 2️⃣ Process Payment
        await axios.post("https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/payments", {
          booking_id: bookingId,
          amount,
          payment_method: paymentMethod,
        });

        return { bookingId, lockerNumber, amount };
      });

      const completed = await Promise.all(bookingTasks);

      toast.success("✅ All bookings confirmed successfully!");
      navigate("/booking-success", { state: { completed, hub, totalAmount } });
    } catch (err) {
      console.error(err);
      toast.error("Booking or payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (datetime) =>
    new Date(datetime).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">
          Confirm Your Booking
        </h1>

        {hub && (
          <div className="mb-6 space-y-2 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-600" />
              <span>
                <strong>{hub.name}</strong> — {hub.city}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6 text-gray-600">
          <div className="flex items-center gap-2">
            <Lock className="text-blue-600" />
            <span>
              <strong>Lockers:</strong> {lockers?.join(", ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" />
            <span>
              <strong>Start:</strong> {formatDate(start_time)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" />
            <span>
              <strong>End:</strong> {formatDate(end_time)}
            </span>
          </div>
        </div>

        <div className="border-t pt-4 mt-4 text-gray-700 space-y-2">
          <p>
            <strong>Duration:</strong> {totalHours} hour(s)
          </p>
          <p>
            <strong>Total:</strong>{" "}
            <span className="text-blue-700 font-semibold">
              LKR {totalAmount.toFixed(2)}
            </span>
          </p>

          {/* 💳 Payment */}
          <div className="mt-3 flex items-center gap-3">
            <CreditCard className="text-blue-600" />
            <select
              className="border p-2 rounded-md"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash at Counter</option>
              <option value="card">Card Payment</option>
              <option value="demo">Demo/Test</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            className="bg-gray-200 px-5 py-2 rounded-md hover:bg-gray-300"
            onClick={() => navigate(-1)}
          >
            
          </button>
          <button
            disabled={isProcessing}
            className={`${
              isProcessing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white px-6 py-2 rounded-md`}
            onClick={handleConfirm}
          >
            {isProcessing ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
