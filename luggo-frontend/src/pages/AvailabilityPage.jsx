import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Box, CheckCircle, Clock, Filter, Plus, Trash2, ShoppingCart } from "lucide-react";

function normalizeDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

export default function AvailabilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState("hourly");
  const [slots, setSlots] = useState([]);
  const [lockers, setLockers] = useState([]);

  const [filters, setFilters] = useState({ date: "", slot_id: "", size: "small" });
  const [cart, setCart] = useState([]);

  const slotIndex = useMemo(() => {
    const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const idx = new Map();
    sorted.forEach((s, i) => idx.set(Number(s.id), i));
    return idx;
  }, [slots]);

  const selectedByLocker = useMemo(() => {
    const map = new Map();
    cart.forEach((item) => {
      if (item.type !== "hourly") return;
      const lockerId = Number(item.locker.id);
      if (!map.has(lockerId)) map.set(lockerId, new Set());
      const set = map.get(lockerId);
      item.slot_ids.forEach(sid => set.add(Number(sid)));
    });
    return map;
  }, [cart]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/slots");
        const list = res.data.slots || [];
        setSlots(list);

        const today = normalizeDate(new Date());
        const now = new Date();
        const current = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes()
          .toString()
          .padStart(2, "0")}:00`;
        const curr = list.find(sl => sl.start_time <= current && current < sl.end_time);

        setFilters(f => ({ ...f, date: today, slot_id: curr ? String(curr.id) : "" }));
      } catch {
        toast.error("Failed to load slots");
      }
    })();
  }, []);

  useEffect(() => {
    if (!filters.date) return;
    if (mode === "hourly" && !filters.slot_id) return;
    loadAvailability();
  }, [mode, filters, id]);

  async function loadAvailability() {
    try {
      const endpoint =
        mode === "hourly"
          ? "https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/bookings/available-by-slot"
          : "https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/bookings/available-by-day";

      const params =
        mode === "hourly"
          ? { hub_id: id, slot_id: filters.slot_id, date: normalizeDate(filters.date) }
          : { hub_id: id, date: normalizeDate(filters.date) };

      const res = await axios.get(endpoint, { params });
      const arr = res.data.available_lockers || [];
      setLockers(filters.size ? arr.filter(l => l.size === filters.size) : arr);
    } catch {
      toast.error("Could not fetch availability");
    }
  }

  function addHourly(locker, slotIds) {
    if (!slotIds?.length) return toast.error("Pick at least one slot");

    const sorted = [...slotIds].sort((a, b) => slotIndex.get(a) - slotIndex.get(b));
    for (let i = 1; i < sorted.length; i++) {
      if (slotIndex.get(sorted[i]) !== slotIndex.get(sorted[i - 1]) + 1) {
        return toast.error("Slots must be continuous");
      }
    }

    setCart(prev => [...prev, { type: "hourly", locker, slot_ids: sorted }]);
  }

  function addDay(locker) {
    setCart(prev => [...prev, { type: "day", locker }]);
  }

  function remove(idx) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  const summary = useMemo(() => {
    let total = 0;
    const rows = cart.map(ci => ({
      ...ci,
      amount:
        ci.type === "hourly"
          ? ci.slot_ids.length * Number(ci.locker.price_per_hour)
          : Number(ci.locker.day_price ?? 0)
    }));
    rows.forEach(r => (total += r.amount));
    return { rows, total };
  }, [cart]);

  function proceed() {
    navigate("/booking-review", {
      state: { hub_id: id, date: filters.date, mode, cart }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/40 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white/60 backdrop-blur-lg border border-blue-100 rounded-3xl shadow-xl p-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Select Your Locker
        </h1>

        {/* Mode Tabs */}
        <div className="flex justify-center gap-3 mb-6">
          {["hourly", "day"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                mode === m ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-700"
              }`}
            >
              {m === "hourly" ? "Hourly Booking" : "Full Day"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 bg-white p-4 rounded-xl shadow-sm border mb-8">
          <Filter className="text-gray-500" />
          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters({ ...filters, date: normalizeDate(e.target.value) })}
            className="border p-2 rounded-md"
          />
          {mode === "hourly" && (
            <select
              value={filters.slot_id}
              onChange={e => setFilters({ ...filters, slot_id: e.target.value })}
              className="border p-2 rounded-md"
            >
              <option value="">Select Slot</option>
              {slots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.slot_label}
                </option>
              ))}
            </select>
          )}
          <select
            value={filters.size}
            onChange={e => setFilters({ ...filters, size: e.target.value })}
            className="border p-2 rounded-md"
          >
            <option value="">All Sizes</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        {/* Lockers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lockers.map(l => (
            <LockerCard
              key={l.id}
              mode={mode}
              locker={l}
              slots={slots}
              selectedSet={selectedByLocker.get(Number(l.id)) || new Set()}
              slotIndex={slotIndex}
              onAddHourly={slotIds => addHourly(l, slotIds)}
              onAddDay={() => addDay(l)}
            />
          ))}
        </div>

        {/* Cart */}
        {summary.rows.length > 0 && (
          <div className="mt-10 bg-white p-5 rounded-2xl border shadow-sm">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <ShoppingCart /> Your Selection
            </h2>

            <div className="space-y-3">
              {summary.rows.map((ci, idx) => (
                <div key={idx} className="flex justify-between items-center border rounded p-3 bg-gray-50">
                  <div>
                    <div className="font-medium">{ci.locker.locker_number} • {ci.locker.size}</div>
                    {ci.type === "hourly" && (
                      <div className="text-sm text-gray-600">
                        Slots: {ci.slot_ids.join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-blue-600 font-semibold">LKR {ci.amount}</div>
                    <button onClick={() => remove(idx)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="text-right text-xl font-bold text-blue-700 pt-3 border-t">
                Total: LKR {summary.total}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={proceed}
                  className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-md"
                >
                  Proceed to Booking →
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function LockerCard({ mode, locker, slots, selectedSet, slotIndex, onAddHourly, onAddDay }) {
  const [picked, setPicked] = useState([]);

  function toggle(id) {
    id = Number(id);
    if (selectedSet.has(id)) return;
    setPicked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function confirmHourly() {
    if (!picked.length) return toast.error("Pick at least one slot");
    onAddHourly(picked);
    setPicked([]);
  }

  return (
    <div className="border border-blue-100 bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between mb-2">
        <div className="font-semibold flex items-center gap-2">
          <Box className="text-blue-600" /> {locker.locker_number} • {locker.size}
        </div>
        {locker.live_status === "available"
          ? <CheckCircle className="text-green-600" />
          : <Clock className="text-orange-500" />}
      </div>

      {mode === "hourly" ? (
        <>
          <div className="text-sm text-blue-700 font-medium mb-2">
            {locker.price_per_hour} LKR/hr
          </div>

          {/* Slot Buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            {slots.map(s => {
              const active = selectedSet.has(s.id) || picked.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  disabled={selectedSet.has(s.id)}
                  className={`px-2 py-1 rounded border transition ${
                    active ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
                  } ${selectedSet.has(s.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {s.slot_label}
                </button>
              );
            })}
          </div>

          <button
            onClick={confirmHourly}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add
          </button>
        </>
      ) : (
        <>
          <div className="text-sm text-blue-700 font-medium mb-2">
            Day Price: {locker.day_price ?? "—"} LKR
          </div>

          <button
            onClick={onAddDay}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Full Day
          </button>
        </>
      )}
    </div>
  );
}
