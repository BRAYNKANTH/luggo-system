import { useState } from "react";
import { registerUser } from "../../api/authApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Lock, User } from "lucide-react";

export default function RegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    signup_method: "email", // ✅ Default is email signup
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      toast.success(res.data.message);

      // ✅ Correct Redirects
      if (form.signup_method === "phone") {
        // Phone signup → Go to phone verification page
        navigate("/verify-phone", { state: { phone: form.phone } });
      } else {
        // Email signup → Show verify email page
        navigate("/verify-email");
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 space-y-5"
      >
        <h1 className="text-2xl font-bold text-center text-blue-700">
          Create Your Luggo Account
        </h1>

        {/* Toggle Signup Method */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {["email", "phone"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setForm({ ...form, signup_method: m })}
              className={`w-1/2 py-2 rounded-lg font-medium transition ${
                form.signup_method === m
                  ? "bg-blue-600 text-white"
                  : "text-gray-600"
              }`}
            >
              {m === "email" ? "Email Signup" : "Phone Signup"}
            </button>
          ))}
        </div>

        {/* Name */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Full Name"
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        {/* Email or Phone */}
        {form.signup_method === "email" ? (
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        ) : (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone (e.g., 0771234567)"
              className="input-field"
              pattern="[0-9]{10}"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
        )}

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-lg"
        >
          Create Account
        </button>

        <p className="text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
}
