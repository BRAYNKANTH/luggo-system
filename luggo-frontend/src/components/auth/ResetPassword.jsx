import { useState } from "react";
import { resetPassword } from "../../api/authApi";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [newPassword, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await resetPassword({ token, newPassword });
      toast.success(res.data.message);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 px-5">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md animate-fadeIn text-center">

        {!done ? (
          <>
            <h1 className="text-2xl font-bold text-blue-700 mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Enter your new secure password
            </p>

            <form onSubmit={handleReset} className="space-y-5 text-left">

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={show ? "text" : "password"}
                  placeholder="New Password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 cursor-pointer"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-lg"
              >
                Reset Password
              </button>
            </form>
          </>
        ) : (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Password Reset Successful
            </h2>
            <p className="text-gray-600">
              Redirecting you to login...
            </p>
          </>
        )}

      </div>
    </div>
  );
}
