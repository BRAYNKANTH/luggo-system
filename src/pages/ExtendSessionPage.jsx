import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { ArrowLeft, Clock, DollarSign, Plus } from "lucide-react";

export default function ExtendSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [nextSlots, setNextSlots] = useState([]);
  const [selectedCount, setSelectedCount] = useState(1);
  const [calculated, setCalculated] = useState({ hours: 0, cost: 0, newEndTime: "" });

  const fetchSession = async () => {
    try {
      const res = await axios.get(`https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/sessions/${sessionId}`);
      setSession(res.data.session);
    } catch {
      toast.error("Failed to load session");
      navigate("/my-bookings");
    }
  };

  const fetchNextSlots = async () => {
    try {
      const res = await axios.get(
        `https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/slots/next-available?locker_id=${session.locker_id}&date=${session.date}&after_time=${session.end_time}`
      );
      setNextSlots(res.data.slots || []);
    } catch {
      toast.error("Failed to load next slots");
    }
  };

  useEffect(() => {
    if (session) fetchNextSlots();
  }, [session]);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (!nextSlots.length || !session) return;

    const selectedSlots = nextSlots.slice(0, selectedCount);

    const totalMinutes = selectedSlots.reduce((t, s) => t + s.duration_minutes, 0);
    const hours = totalMinutes / 60;
    const cost = hours * session.price_per_hour;
    const newEndTime = selectedSlots[selectedSlots.length - 1].end_time;

    setCalculated({ hours, cost, newEndTime });
  }, [selectedCount, nextSlots, session]);

  const handleExtend = async (method) => {
    try {
      await axios.post("https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/sessions/extend", {
        session_id: sessionId,
        slot_ids: nextSlots.slice(0, selectedCount).map((s) => s.id),
        payment_method: method
      });

      toast.success(method === "online" ? "Redirecting to Payment..." : "Extension added. Pay at hub.");
      navigate("/my-bookings");
    } catch {
      toast.error("Failed to extend session");
    }
  };

  if (!session)
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        Loading session...
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-24">
        <button className="flex items-center gap-2 text-blue-600 mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft size={20}/> Back
        </button>

        <div className="bg-white p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold text-blue-700 mb-1">
            Extend Locker #{session.locker_number}
          </h1>
          <p className="text-gray-600 mb-4">{session.hub_name}</p>

          <div className="p-4 bg-gray-100 rounded-lg text-gray-700 mb-6">
            <Clock className="inline mr-2"/> Current End Time: <b>{session.end_time.substring(11,16)}</b>
          </div>

          <label className="block font-medium mb-2">Select Additional Slots</label>
          <select
            className="border px-3 py-2 rounded w-full mb-6"
            value={selectedCount}
            onChange={(e) => setSelectedCount(Number(e.target.value))}
          >
            {nextSlots.slice(0,5).map((_, i) => (
              <option key={i} value={i+1}>
                + {i+1} slot(s)
              </option>
            ))}
          </select>

          <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Additional Hours: <b>{calculated.hours.toFixed(2)}</b>
            </p>
            <p className="text-blue-800 text-sm">
              Extra Cost: <b>LKR {calculated.cost.toFixed(2)}</b>
            </p>
            <p className="text-blue-800 text-sm">
              New Session End Time: <b>{calculated.newEndTime.substring(11,16)}</b>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleExtend("online")}
              className="bg-blue-600 text-white py-3 rounded-lg flex justify-center gap-2 hover:bg-blue-700"
            >
              <DollarSign/> Pay Online
            </button>

            <button
              onClick={() => handleExtend("cash")}
              className="bg-yellow-500 text-white py-3 rounded-lg flex justify-center gap-2 hover:bg-yellow-600"
            >
              <Plus/> Pay at Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
