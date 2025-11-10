import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, CheckCircle, XCircle, Unlock } from "lucide-react";

// ✅ Base API URL (never re-creates)
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api";

/* ---------------------------
   Helpers: formatting (LK)
----------------------------*/

// Parse MySQL DATETIME "YYYY-MM-DD HH:mm:ss" (already local) → Date
const parseLocalDateTime = (s) => new Date(s.replace(" ", "T"));

// Format pure date (b.date might be "YYYY-MM-DD" or ISO)
// Always show as YYYY-MM-DD for consistency
const formatDateLK = (value) => {
  try {
    // If it already looks like "YYYY-MM-DD", return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const d = new Date(value);
    // en-CA → 2025-11-10 (ISO-like)
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  } catch {
    return String(value);
  }
};

// Format Date → "10 Nov 2025, 6:30 PM"
const formatPrettyDateTimeLK = (date) =>
  new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

// Extract HH:mm from Date (Colombo)
const formatHM_LK = (date) =>
  new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // use 18:30 style for your UI
  }).format(date);

// Countdown text
const getCountdownText = (endTimeStr) => {
  const endLocal = parseLocalDateTime(endTimeStr); // already local time
  const now = new Date();
  const remainingMs = endLocal.getTime() - now.getTime();

  if (remainingMs <= 0) return "Session Ended";

  const hrs = Math.floor(remainingMs / 3600000);
  const mins = Math.floor((remainingMs % 3600000) / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  return `${hrs}h ${mins}m ${secs}s left`;
};

// Individual live countdown (1s tick)
const CountdownTimer = ({ endTime }) => {
  const [text, setText] = useState(() => getCountdownText(endTime));
  useEffect(() => {
    const t = setInterval(() => setText(getCountdownText(endTime)), 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return (
    <p className="mt-3 text-sm font-medium text-purple-700 bg-purple-100 px-3 py-1 inline-block rounded-full">
      ⏳ {text}
    </p>
  );
};

export default function MyBookings() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [tab, setTab] = useState("confirmed");
  const [bookings, setBookings] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load bookings + sessions
  useEffect(() => {
    if (!userId) {
      toast.error("Please log in first.");
      navigate("/login?redirect=/my-bookings");
      return;
    }

    const load = async () => {
      try {
        const [resBookings, resSessions] = await Promise.all([
          axios.get(`${API_URL}/bookings/user/${userId}`),
          axios.get(`${API_URL}/sessions/active/${userId}`),
        ]);

        setBookings(resBookings?.data?.bookings ?? []);
        setActiveSessions(resSessions?.data?.sessions ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Error loading bookings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, navigate]);

  // Auto-refresh sessions (every 30s)
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(async () => {
      try {
        const resSessions = await axios.get(`${API_URL}/sessions/active/${userId}`);
        setActiveSessions(resSessions?.data?.sessions ?? []);
      } catch (err) {
        console.error(err);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [userId]);

  // Derived lists
  const { confirmedBookings, completedBookings } = useMemo(() => {
    const activeBookingIds = new Set(activeSessions.map((s) => s.booking_id));
    return {
      confirmedBookings: bookings.filter(
        (b) => b.status === "confirmed" && !activeBookingIds.has(b.id)
      ),
      completedBookings: bookings.filter((b) => b.status !== "confirmed"),
    };
  }, [bookings, activeSessions]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-24">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          My Bookings
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-7">
          {[
            { key: "confirmed", label: "Confirmed Bookings" },
            { key: "active", label: "Active Locker Sessions" },
            { key: "completed", label: "Completed / Cancelled" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ACTIVE SESSIONS */}
        {tab === "active" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSessions.length === 0 ? (
              <p className="text-center text-gray-600 col-span-2">
                No active locker sessions.
              </p>
            ) : (
              activeSessions.map((s) => {
                const start = parseLocalDateTime(s.start_time);
                const end = parseLocalDateTime(s.end_time);

                return (
                  <div
                    key={s.session_id}
                    className="bg-white border rounded-xl shadow p-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse" />

                    <h2 className="text-lg font-semibold text-blue-700">
                      Locker #{s.locker_number}
                    </h2>
                    <p className="text-gray-600 text-sm">{s.hub_name} — {s.city}</p>

                    <p className="text-sm mt-2 flex items-center gap-2">
                      <Calendar size={16} />{" "}
                      {formatPrettyDateTimeLK(start).replace(",", "")}
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <Clock size={16} /> {formatHM_LK(start)} → {formatHM_LK(end)}
                    </p>

                    <CountdownTimer endTime={s.end_time} />

                    <button
                      onClick={() => navigate(`/access/${s.session_id}`)}
                      className="mt-4 w-full py-2 rounded-lg flex justify-center items-center gap-2 text-white font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-300/50 animate-[pulse_1.6s_infinite]"
                    >
                      <Unlock size={18} /> Access Locker
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CONFIRMED BOOKINGS */}
        {tab === "confirmed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {confirmedBookings.length === 0 ? (
              <p className="text-center text-gray-500 col-span-2">
                No confirmed bookings.
              </p>
            ) : (
              confirmedBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/booking-details/${b.id}`)}
                  className="bg-white border rounded-xl shadow p-5 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-blue-700">
                      {b.hub_name}
                    </h2>
                    <CheckCircle className="text-green-600" />
                  </div>

                  <p className="text-sm text-gray-600">{b.city}</p>
                  <p className="text-sm mt-2 flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDateLK(b.date)}
                  </p>
                  <p className="text-blue-700 font-semibold mt-2">
                    Total: LKR {b.total_amount}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* COMPLETED / CANCELLED */}
        {tab === "completed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedBookings.length === 0 ? (
              <p className="text-center text-gray-500 col-span-2">
                No completed / cancelled bookings.
              </p>
            ) : (
              completedBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border rounded-xl shadow p-5 opacity-70 cursor-default"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-700">
                      {b.hub_name}
                    </h2>
                    <XCircle className="text-gray-400" />
                  </div>

                  <p className="text-sm text-gray-600">{b.city}</p>
                  <p className="text-sm mt-2 flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDateLK(b.date)}
                  </p>
                  <p className="text-gray-700 font-semibold mt-2">
                    Total: LKR {b.total_amount}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
