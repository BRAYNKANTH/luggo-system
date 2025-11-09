import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/verify-email?token=${token}`);
        toast.success(res.data.message);
        setStatus("success");
      } catch (err) {
        toast.error(err.response?.data?.message || "Verification failed");
        setStatus("error");
      }
    };

    if (token) verifyEmail();
  }, [token, API_URL]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center animate-fadeIn">

        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg text-gray-600">Verifying your email...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Your account is now activated. You can log in and start using Luggo.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg w-full transition"
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-4">
              The verification link is invalid or expired.
            </p>
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg w-full transition"
            >
              Register Again
            </button>
          </>
        )}

      </div>
    </div>
  );
}
