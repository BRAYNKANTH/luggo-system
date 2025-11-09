import db from "../config/db.js";

function addMinutes(timeString, minutes) {
  const [h, m] = timeString.split(":").map(Number);
  const date = new Date(0, 0, 0, h, m);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toTimeString().slice(0, 5);
}

export const seedSlots = () => {
  let current = "06:00"; // Start of first slot
  const SLOT_DURATION = 60; // minutes
  const BREAK = 10; // minutes
  let slots = [];

  for (let i = 0; i < 24; i++) {
    const start = current;
    const end = addMinutes(start, SLOT_DURATION);

    slots.push([`${start} - ${end}`, start, end]);

    // Move to next slot start time
    current = addMinutes(end, BREAK);
  }

  db.query("INSERT INTO slots (slot_label, start_time, end_time) VALUES ?", [slots], (err) => {
    if (err) console.log("Slot seed error:", err);
    else console.log("✅ Slots seeded successfully!");
    process.exit();
  });
};

seedSlots();
