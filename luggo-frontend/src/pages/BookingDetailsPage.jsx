import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { toast } from "sonner";
import { Calendar, Clock, ReceiptText, Timer, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL || "https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api";

export default function BookingDetails() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/bookings/details/${bookingId}`)
      .then((res) => {
        setBooking(res.data.booking);
        setItems(res.data.items);
      })
      .catch(() => toast.error("Failed to load booking details"));
  }, [bookingId]); // ✅ No warning now
  if (!booking) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

  const downloadReceipt = () => {
    window.open(`${API_URL}/payments/receipt/pdf/${bookingId}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-24">
        
        <Link to="/my-bookings" className="text-blue-600 flex items-center gap-1 mb-4">
          <ArrowLeft size={18}/> Back
        </Link>

        <h1 className="text-2xl font-bold text-blue-700">Booking Details</h1>

        {/* Booking Summary */}
        <div className="bg-white p-5 rounded-xl shadow mt-4 border">
          <p className="text-lg font-semibold">{booking.hub_name}</p>
          <p className="text-sm text-gray-600">{booking.city}</p>

          <p className="mt-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            {booking.date}
          </p>

          <p>
            <Timer className="inline w-4 h-4 mr-1" />
            Mode: {booking.mode.toUpperCase()}
          </p>

          <p className="font-bold text-blue-700 mt-3 text-lg">
            Total Paid: LKR {booking.total_amount}
          </p>
        </div>

        {/* Lockers + Slots */}
        <h2 className="mt-6 text-lg font-semibold text-gray-700">Reserved Lockers</h2>

        <div className="mt-3 space-y-3">
          {items.map((it, i) => (
            <div key={i} className="bg-white p-4 shadow rounded-lg border">
              <p className="font-semibold text-blue-700">
                Locker #{it.locker_number} ({it.size})
              </p>

              {booking.mode === "hourly" ? (
                <p className="text-sm text-gray-700 mt-1">
                  <Clock className="inline w-4 h-4 mr-1" /> {it.start_time} → {it.end_time}
                </p>
              ) : (
                <p className="text-sm text-gray-700 mt-1">
                  Full Day Access
                </p>
              )}

              <p className="text-sm text-gray-500 mt-1">Price: LKR {it.price}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={downloadReceipt}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg shadow hover:bg-indigo-700 flex justify-center gap-2"
          >
            <ReceiptText size={18}/> Download Receipt
          </button>

          
        </div>

      </div>
    </div>
  );
}
