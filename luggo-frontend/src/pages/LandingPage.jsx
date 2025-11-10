import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const isLoggedIn = !!localStorage.getItem("token"); // Check login state

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="pt-24 md:pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">

          {/* Text */}
          <div className="flex-1 text-center md:text-left space-y-5">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Travel Light. Explore Free.
              <span className="text-blue-600"> Luggo Keeps it Safe.</span>
            </h1>

            <p className="text-gray-600 text-lg">
              Drop your bags in secure smart lockers and discover Sri Lanka without limits.
              24/7 access. Instant pick-up. Total freedom.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">

              {/* ✅ LOGIN STATE BUTTON LOGIC */}
              {isLoggedIn ? (
                <Link
                  to="/my-bookings"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow hover:shadow-md hover:bg-blue-700 transition"
                >
                  View My Bookings
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow hover:shadow-md hover:bg-blue-700 transition"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
                  >
                    Create Account
                  </Link>
                </>
              )}

              {/* Always visible */}
              <Link
                to="/hubs"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                View Locker Locations
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 flex justify-center">
            <img
              src="https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/uploads/luggo.png"
              alt="Luggo Smart Lockers"
              className="max-w-md w-full animate-fade-in"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center px-6">

          <h2 className="text-3xl font-bold text-gray-800 mb-12">
            Why Travelers Love Luggo
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
            {[
              {
                icon: "🔐",
                title: "High Security",
                desc: "IoT smart locks + One-Time passcodes. Your items stay protected.",
              },
              {
                icon: "⚡",
                title: "Instant Access",
                desc: "Book online, walk to a hub, unlock instantly. No waiting.",
              },
              {
                icon: "🧭",
                title: "Travel Anywhere",
                desc: "Hubs in airports, stations, cities & tourist hotspots.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition cursor-pointer"
              >
                <div className="text-5xl mb-3">{f.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800">{f.title}</h3>
                <p className="text-gray-600 mt-2">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-6 text-center mt-auto">
        <p className="text-gray-300">
          © {new Date().getFullYear()} <span className="font-semibold">Luggo</span> — Travel Free, Always.
        </p>
      </footer>
    </div>
  );
}
