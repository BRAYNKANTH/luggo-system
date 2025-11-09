import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Building2, MapPin, Navigation, Box, ArrowLeft } from "lucide-react";

export default function HubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hub, setHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    const fetchHub = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/hubs/${id}`);
        setHub(res.data.hub);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const d = calculateDistance(
              pos.coords.latitude,
              pos.coords.longitude,
              res.data.hub.latitude,
              res.data.hub.longitude
            );
            setDistance(d.toFixed(2));
          });
        }
      } catch (err) {
          console.error(err)
        toast.error("Failed to fetch hub details");
      } finally {
        setLoading(false);
      }
    };
    fetchHub();
  }, [id]);

  if (loading) return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  if (!hub) return <div className="text-center mt-10 text-red-500">Hub not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Back Button */}
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={18} /> Back to Hubs
          </button>
        </div>

        {/* Image */}
        <img
          src={`http://localhost:5000${hub.image_url}`}
          alt={hub.name}
          className="w-full h-64 object-cover"
        />

        {/* Hub Info */}
        <div className="p-8 space-y-5">

          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-blue-600" size={28} />
            {hub.name}
          </h1>

          <p className="text-gray-600 text-lg flex items-center gap-2">
            <MapPin className="text-blue-500" size={18} />
            {hub.address}, {hub.city}
          </p>

          {distance && (
            <p class="text-blue-600 font-medium flex items-center gap-2">
              <Navigation size={18} />
              {distance} km away
            </p>
          )}

          {/* ✅ Pricing Section */}
          {/* ✅ New Beautiful Pricing Section */}
<div className="mt-6">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">Locker Pricing</h3>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

    {/* Small Locker */}
    <div className="border rounded-xl p-5 bg-white shadow hover:shadow-md transition transform hover:-translate-y-1">
      <h4 className="text-lg font-semibold text-blue-600 text-center">Small</h4>
      <p className="text-gray-600 text-center text-sm mt-1">Personal bags / handbags</p>

      <div className="mt-4 space-y-2 text-center">
        <p className="text-gray-700 text-sm">Hourly</p>
        <p className="text-2xl font-bold text-blue-700">Rs. 50</p>

        <p className="text-gray-700 text-sm pt-2">Daily</p>
        <p className="text-2xl font-bold text-green-700">Rs. 450</p>
      </div>
    </div>

    {/* Medium Locker */}
    <div className="border rounded-xl p-5 bg-white shadow hover:shadow-md transition transform hover:-translate-y-1">
      <h4 className="text-lg font-semibold text-blue-600 text-center">Medium</h4>
      <p className="text-gray-600 text-center text-sm mt-1">Laptop bag / shopping bags</p>

      <div className="mt-4 space-y-2 text-center">
        <p className="text-gray-700 text-sm">Hourly</p>
        <p className="text-2xl font-bold text-blue-700">Rs. 80</p>

        <p className="text-gray-700 text-sm pt-2">Daily</p>
        <p className="text-2xl font-bold text-green-700">Rs. 700</p>
      </div>
    </div>

    {/* Large Locker */}
    <div className="border rounded-xl p-5 bg-white shadow hover:shadow-md transition transform hover:-translate-y-1">
      <h4 className="text-lg font-semibold text-blue-600 text-center">Large</h4>
      <p className="text-gray-600 text-center text-sm mt-1">Travel luggage / suitcases</p>

      <div className="mt-4 space-y-2 text-center">
        <p className="text-gray-700 text-sm">Hourly</p>
        <p className="text-2xl font-bold text-blue-700">Rs. 120</p>

        <p className="text-gray-700 text-sm pt-2">Daily</p>
        <p className="text-2xl font-bold text-green-700">Rs. 900</p>
      </div>
    </div>

  </div>
</div>


          {/* View Availability */}
          <button
            onClick={() => navigate(`/hub/${hub.id}/availability`)}
            className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg transition w-fit mt-4 shadow-sm"
          >
            <Box size={18} />
            Book now
          </button>
        </div>

        {/* Map */}
        <div className="bg-gray-100 p-6 border-t">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Location Map</h3>
          <iframe
            title="hub-map"
            width="100%"
            height="260"
            loading="lazy"
            style={{ borderRadius: "12px" }}
            src={`https://www.google.com/maps?q=${hub.latitude},${hub.longitude}&z=15&output=embed`}
          ></iframe>
        </div>

      </div>
    </div>
  );
}
