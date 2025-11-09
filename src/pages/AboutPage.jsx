import Navbar from "../components/Navbar";

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 md:px-20 max-w-5xl mx-auto text-center animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-4">
          About Luggo
        </h1>

        <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
          Luggo is redefining how people store and access their belongings while traveling.
          Whether you're exploring a new city, waiting for a flight, or simply need a secure place to keep your bags,
          Luggo provides **smart lockers** that are simple, safe, and always accessible.
        </p>

        <img
          src="https://cdn-icons-png.flaticon.com/512/891/891462.png"
          alt="Smart lockers"
          className="w-56 md:w-72 mx-auto mt-10 drop-shadow-md"
        />
      </section>

      {/* Mission Section */}
      <section className="bg-white py-16 px-6 md:px-20 border-t">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
            We aim to make **travel stress-free** by offering a trusted storage network
            that gives people the freedom to move — without carrying everything.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-10">
            What Makes Luggo Different?
          </h2>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                icon: "🔒",
                title: "Secure & Trusted",
                desc: "IoT-controlled lockers with encrypted access — only you can open your locker.",
              },
              {
                icon: "⚡",
                title: "Instant Access",
                desc: "Book anytime and unlock with OTP, QR, or passcode — no staff needed.",
              },
              {
                icon: "📍",
                title: "Convenient Locations",
                desc: "Available in airports, bus stations, and popular tourist areas across Sri Lanka.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white border rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition"
              >
                <div className="text-5xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-20 pb-20 text-center">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Ready to Experience Luggo?
        </h3>
        <a
          href="/hubs"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 transition"
        >
          Find Nearby Hubs
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-6 mt-auto">
        <p>© {new Date().getFullYear()} Luggo — Smart Locker System</p>
      </footer>
    </div>
  );
}
