import { useState } from "react";
import { forgotPassword } from "../../api/authApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, SendHorizontal } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [emailOrPhone, setValue] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ emailOrPhone });
      toast.success(res.data.message);
      setValue("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending reset request");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6 animate-fadeIn"
      >
        <h1 className="text-2xl font-bold text-center text-blue-700">
          Forgot Password?
        </h1>

        <p className="text-center text-gray-600 text-sm -mt-2">
          Enter your <strong>email</strong> or <strong>phone number</strong> to
          receive reset instructions.
        </p>

        {/* Input Field */}
        <div className="relative">
          {emailOrPhone.includes("@") ? (
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          ) : (
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          )}
          <input
            type="text"
            placeholder="Email or Phone"
            className="input-field"
            value={emailOrPhone}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-lg flex justify-center items-center gap-2"
        >
          <SendHorizontal size={18} /> Send Reset Instructions
        </button>

        {/* Back to login */}
        <p
          className="text-center text-sm text-blue-600 hover:underline cursor-pointer"
          onClick={() => navigate("/login")}
        >
          Back to login
        </p>
      </form>
    </div>
  );
}
