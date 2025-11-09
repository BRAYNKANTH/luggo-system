import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

export default function PaymentExtensionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const state = location.state || {};

  const session_id = state.session_id;
  const locker_id = state.locker_id;
  const slot_ids = state.slot_ids;

  const [session, setSession] = useState(null);
  const [cost, setCost] = useState(null);

  useEffect(() => {
    if (!session_id || !slot_ids || !locker_id) {
      toast.error("Extension details missing");
      return navigate("/my-bookings");
    }

    async function load() {
      try {
        const res1 = await axios.get(`${API_URL}/sessions/${session_id}`);
        setSession(res1.data.session);

        const res2 = await axios.post(`${API_URL}/sessions/extension/calculate`, {
          locker_id,
          new_slot_ids: slot_ids
        });

        setCost(res2.data.extra_cost);
      } catch (err) {
        toast.error("Failed to load extension info");
        navigate("/my-bookings");
      }
    }

    load();
  }, []);

  const payNow = async () => {
  try {
    const res = await axios.post(`${API_URL}/sessions/extension/payhere-session`, {
      session_id,
      slot_ids
    });

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://sandbox.payhere.lk/pay/checkout";

    Object.entries(res.data).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

  } catch {
    toast.error("Payment failed");
  }
};

  if (!session || cost === null) {
    return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto pt-24 px-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Extend Session</h1>

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-lg mb-2">Locker #{session.locker_number}</p>
          <p className="text-gray-600 mb-6">{session.hub_name}</p>

          <p className="text-xl font-semibold mb-4">
            Extra Cost: <span className="text-green-600">LKR {cost}</span>
          </p>

          <button
            onClick={payNow}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
          >
            Confirm & Pay
          </button>

          <button
            className="w-full bg-gray-300 text-black py-3 rounded-lg mt-3 hover:bg-gray-400"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
