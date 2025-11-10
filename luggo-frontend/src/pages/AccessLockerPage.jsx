import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Clock, Unlock, Lock, XCircle, PlusCircle } from "lucide-react";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api";
const PPI_URL = "https://luggo-backend-cpavgbcdhjexexh7.centralindia-01.azurewebsites.net/";

export default function AccessLockerPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [showExtendModal, setShowExtendModal] = useState(false);

  // ✅ Stable function — no more warnings
  const fetchSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/sessions/${sessionId}`);
      setSession(res.data.session);
    } catch {
      toast.error("Failed to load session");
      navigate("/my-bookings");
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    fetchSession(); // ✅ safe now
  }, [fetchSession]);


  // ⏱ Countdown Display
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(session.grace_until);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("⛔ Access Window Closed");
        clearInterval(interval);
        return;
      }

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s}s left`);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]); // ✅ safe

  // Locker Commands
  const handleAction = async (action) => {
    try {
      await axios.post(`${PPI_URL}/api/locker1/${action}`);
      toast.success(`Locker ${action}ed ✅`);
      fetchSession();
    } catch {
      toast.error(`Failed to ${action} locker`);
    }
  };

  const releaseLocker = async () => {
    try {
      await axios.put(`${API_URL}/sessions/release/${sessionId}`);
      toast.success("Locker Released ✅");
      navigate("/my-bookings");
    } catch (err) {
      console.error("Release error:", err);
      toast.error(err.response?.data?.message || "Failed to release locker");
    }
  };

  if (!session)
    return <div className="min-h-screen flex justify-center items-center">Loading session...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-24">
        <button className="flex items-center gap-2 text-blue-600 mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white shadow rounded-xl p-6">
          <h1 className="text-2xl font-bold text-blue-700 mb-2">Locker #{session.locker_number}</h1>
          <p className="text-gray-600 mb-4">{session.hub_name}</p>

          <div className="flex items-center gap-2 text-lg font-semibold text-purple-700 mb-6 bg-purple-100 px-3 py-1 rounded-full">
            <Clock /> {timeLeft}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex justify-center gap-2"
              onClick={() => handleAction("unlock")}
            >
              <Unlock /> Unlock
            </button>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex justify-center gap-2"
              onClick={() => handleAction("lock")}
            >
              <Lock /> Lock
            </button>

            <button
              className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg flex justify-center gap-2 col-span-2"
              onClick={releaseLocker}
            >
              <XCircle /> Release Locker
            </button>

            <button
              onClick={() => setShowExtendModal(true)}
              className="col-span-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg flex justify-center gap-2"
            >
              <PlusCircle /> Extend Session
            </button>
          </div>
        </div>
      </div>

      {showExtendModal && <ExtendModal session={session} onClose={() => setShowExtendModal(false)} />}
    </div>
  );
}

/* ----------------------------------------------------
   EXTEND MODAL
---------------------------------------------------- */
function ExtendModal({ session, onClose }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/sessions/extendable/${session.id}`)
      .then(res => setSlots(res.data.available_slots || []))
      .catch(() => toast.error("Unable to load extendable slots"));
  }, [session.id]); // ✅ correct

  const selectSlot = (slot) => {
    if (selected.length > 0) {
      const last = selected[selected.length - 1];
      if (slot.id !== last.id + 1) return toast.error("Must select continuous slots");
    }
    setSelected([...selected, slot]);
  };

  const continueExtension = () => {
    const slot_ids = selected.map(s => s.id);
    navigate("/payment-extension", {
      state: {
        session_id: session.id,
        locker_id: session.locker_id,
        slot_ids
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Extend Session</h2>
        <p className="text-gray-600 mb-3">Choose next available continuous slots:</p>

        <div className="max-h-52 overflow-y-auto space-y-2 mb-4">
          {slots.map(slot => (
            <button
              key={slot.id}
              className="w-full border p-2 rounded hover:bg-blue-50"
              onClick={() => selectSlot(slot)}
            >
              {slot.slot_label}: {slot.start_time} → {slot.end_time}
            </button>
          ))}
        </div>



        {selected.length > 0 && (
          <button
            onClick={continueExtension}
            className="w-full bg-green-600 text-white py-2 rounded-lg mb-2 hover:bg-green-700"
          >
            Continue to Payment ({selected.length} slots)
          </button>
        )}

        <button
          className="w-full bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
