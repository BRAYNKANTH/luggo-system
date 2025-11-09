import { useState } from "react";
import { loginUser } from "../../api/authApi";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Phone, Lock, LogIn } from "lucide-react";

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ emailOrPhone: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);

      // ✅ Store session
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user.id);
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("email", res.data.user.email || "");
      localStorage.setItem("phone", res.data.user.phone || "");

      toast.success("Login successful!");

      // ✅ Safe redirect memory logic
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get("redirect");

      if (redirectTo && redirectTo.startsWith("/")) {
        navigate(redirectTo);
      } else {
        navigate("/");
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 px-5">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-blue-700">
          Login to Luggo
        </h1>

        {/* Email or Phone */}
        <div className="relative">
          {form.emailOrPhone.includes("@") ? (
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          ) : (
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          )}
          <input
            type="text"
            placeholder="Email or Phone"
            className="input-field"
            value={form.emailOrPhone}
            onChange={(e) =>
              setForm({ ...form, emailOrPhone: e.target.value })
            }
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 cursor-pointer"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {/* Forgot Password */}
        <p
          onClick={() => navigate("/forgot-password")}
          className="text-right text-sm text-blue-600 cursor-pointer hover:underline"
        >
          Forgot Password?
        </p>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <LogIn size={18} /> Login
        </button>

        {/* Switch to Signup */}
        <p className="text-center text-gray-600 text-sm">
          New to Luggo?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Create account
          </span>
        </p>
      </form>
    </div>
  );
}
