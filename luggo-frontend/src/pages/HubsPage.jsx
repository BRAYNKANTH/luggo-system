import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { MapPin, Navigation, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function HubsPage() {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Your browser does not support location access.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get(
            `https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net/api/hubs/nearby?lat=${latitude}&lng=${longitude}`
          );
          setHubs(res.data.hubs || []);
        } catch {
          toast.error("Could not load hubs");
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Location permission denied.");
        setLoading(false);
      }
    );
  }, []);

  const filteredHubs = hubs.filter((hub) =>
    hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Fetching nearby hubs...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/40 py-16 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
          Luggo Hubs
        </h1>

        {/* Search Bar */}
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Search hubs by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-blue-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* No hubs */}
        {filteredHubs.length === 0 && (
          <p className="text-center text-gray-600">
            No matching hubs found.
          </p>
        )}

        {/* Hub Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHubs.map((hub) => (
            <div
              key={hub.id}
              className="group bg-white/60 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm hover:shadow-blue-200 hover:-translate-y-1 transition transform"
            >
              <img
                src={`https://luggo-backend-cpavgbcdhjexexh7.southeastasia-01.azurewebsites.net${hub.image_url}`}
                alt={hub.name}
                className="w-full h-48 object-cover rounded-t-2xl group-hover:brightness-105 transition"
              />

              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600" />
                  {hub.name}
                </h2>

                <p className="text-gray-600 text-sm mt-1">{hub.address}</p>
                <p className="text-gray-500 text-sm">{hub.city}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-blue-600 text-sm">
                    <Navigation size={16} />
                    {hub.distance ? hub.distance.toFixed(2) + " km" : ""}
                  </span>

                  <Link
                    to={`/hub/${hub.id}`}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    View Hub
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
