import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const name = localStorage.getItem("name");

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/");
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "Hubs", path: "/hubs" },
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center h-16">

        <Link to="/" className="text-2xl font-bold text-blue-600">
          Luggo<span className="text-gray-800">.</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${
                location.pathname === link.path
                  ? "text-blue-600 font-semibold"
                  : "text-gray-700"
              } hover:text-blue-600 transition`}
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <div className="flex items-center space-x-4 ml-6">
              <span className="text-gray-600">
                Welcome, {name?.split(" ")[0]} 👋
              </span>

              <Link
                to="/my-bookings"
                className="border border-blue-600 text-blue-600 px-4 py-1 rounded-md hover:bg-blue-600 hover:text-white transition"
              >
                View Bookings
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-x-3 ml-6">
              <Link
                to="/login"
                className="border border-blue-600 text-blue-600 px-4 py-1 rounded-md hover:bg-blue-600 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-gray-700 text-2xl">
          ☰
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-white shadow-lg flex flex-col items-center space-y-3 py-4">
          
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {link.label}
            </Link>
          ))}

          <hr className="w-3/4 border-gray-200" />

          {isLoggedIn ? (
            <>
              <span className="text-gray-600">
                Welcome, {name?.split(" ")[0]} 👋
              </span>

              <Link
                to="/my-bookings"
                onClick={() => setOpen(false)}
                className="text-blue-600 font-medium"
              >
                View Bookings
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="text-red-600 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="text-blue-600 font-medium"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
