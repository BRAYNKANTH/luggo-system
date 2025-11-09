import { useState } from "react";
import { verifyPhone } from "../../api/authApi";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifyPhone() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Correct: get the phone number
  const phone = location.state?.phone;
  const [otp, setOtp] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await verifyPhone({ phone, otp }); // ✅ correct payload
      toast.success(res.data.message);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleVerify}
        className="bg-white p-8 rounded-2xl shadow-md w-[350px] space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Verify Phone</h2>
        <p className="text-sm text-gray-500 text-center">
          Enter the 6-digit OTP sent to {phone}
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="border p-2 w-full text-center tracking-widest text-lg rounded-md"
        />

        <button className="bg-blue-600 text-white w-full py-2 rounded-md hover:bg-blue-700">
          Verify
        </button>
      </form>
    </div>
  );
}
