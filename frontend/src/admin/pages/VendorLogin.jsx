import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/authService";
import logo from "../../../public/logo.png";

export default function VendorLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  console.log("Vendor Login Loaded");

  const session = localStorage.getItem(
    "shubh_admin_session"
  );

  console.log("Stored Session:", session);

  if (!session) return;

  try {
    const parsed = JSON.parse(session);

    if (
      parsed?.token &&
      parsed?.expiresAt &&
      Date.now() < parsed.expiresAt
    ) {
      console.log("Valid Session Found");
      navigate("/vendor/dashboard", {
        replace: true,
      });
    } else {
      console.log("Session Expired");
      localStorage.removeItem(
        "shubh_admin_session"
      );
    }
  } catch (err) {
    console.error(err);

    localStorage.removeItem(
      "shubh_admin_session"
    );
  }
}, [navigate]);

  const handleLogin = async () => {
  if (!email || !password) {
    setError(
      "Please enter your email and password."
    );
    return;
  }

  setError("");
  setLoading(true);

  try {
    console.log("========== LOGIN ==========");
    console.log("Email:", email);

    const userCredential =
      await loginAdmin(email, password);

    console.log(
      "Login Success:",
      userCredential
    );

    const user = userCredential.user;

    if (!user) {
      throw new Error("User not found");
    }

    const token =
      await user.getIdToken(true);

    console.log("Firebase Token:", token);

    const session = {
      uid: user.uid,
      email: user.email,
      token,
      expiresAt:
        Date.now() + 3600 * 1000,
    };

    console.log(
      "Session Object:",
      session
    );

    localStorage.setItem(
      "shubh_admin_session",
      JSON.stringify(session)
    );

    console.log(
      "Saved Session:",
      JSON.parse(
        localStorage.getItem(
          "shubh_admin_session"
        )
      )
    );

    navigate("/vendor/dashboard", {
      replace: true,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    setError(
      err.message
        .replace(
          "INVALID_LOGIN_CREDENTIALS",
          "Invalid email or password."
        )
        .replace(
          "TOO_MANY_ATTEMPTS_TRY_LATER",
          "Too many attempts. Try later."
        )
    );
  } finally {
    setLoading(false);
  }
};

  return (
    // KEEP YOUR EXISTING JSX EXACTLY SAME
    // ONLY replace the useEffect and handleLogin above
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] p-4">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 rounded-[28px] overflow-hidden border border-[#E8E5DF] bg-white shadow-[0_32px_80px_rgba(10,14,30,0.18)]">
    
            {/* Left Side */}
            <div className="hidden lg:flex flex-col justify-end relative overflow-hidden p-12 bg-gradient-to-br from-[#1F2A44] via-[#162048] to-[#0e1530]">
                      {/* Decorative blobs */}
                      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#E34A2F]/10 pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#F5A623]/8 pointer-events-none" />
            
                      <div className="flex flex-col gap-6 z-10">
                        {/* Logo + Brand */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <img src={logo} alt="logo" className="w-10 h-10 object-contain flex-shrink-0" />
                            <h1 className="m-0 text-[30px] font-extrabold text-white tracking-tight leading-none">
                              Shubh <span className="text-[#E34A2F]">Suramya</span>
                            </h1>
                          </div>
                          <p className="m-0 text-[14px] text-white/50 leading-relaxed max-w-[280px]">
                            Vendor & payment management portal for authorised administrators.
                          </p>
                        </div>
            
                        {/* Feature list */}
                        <div className="flex flex-col gap-3.5">
                          {[
                            ["🏢", "Manage Companies & Vendors"],
                            ["📋", "Track Bills & Invoices"],
                            ["💳", "Record Payments via Razorpay"],
                            ["🏠", "Flat Sales & Customer Receipts"],
                          ].map(([icon, text]) => (
                            <div key={text} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-[9px] bg-white/7 border border-white/10 flex items-center justify-center text-sm flex-shrink-0">
                                {icon}
                              </div>
                              <span className="text-[12.5px] text-white/65">{text}</span>
                            </div>
                          ))}
                        </div>
            
                        <p className="m-0 text-[11px] text-white/25">Shubh Sauramya · Sanand, Gujarat</p>
                      </div>
                    </div>
    
            {/* Right Side */}
            <div className="bg-white px-6 py-10 sm:px-8 md:px-10 lg:px-12 flex flex-col justify-center min-h-[520px]">
    
              <div className="flex items-center gap-3 mb-8 lg:hidden">
                <img
                  src={logo}
                  alt="logo"
                  className="w-10 h-10"
                />
                <h1 className="text-2xl font-extrabold text-[#1F2A44]">
                  Shubh <span className="text-[#E34A2F]">Sauramya</span>
                </h1>
              </div>
    
              <h2 className="text-3xl font-bold text-[#1F2A44]">
                Welcome Back
              </h2>
    
              <p className="text-gray-500 mt-2 mb-8">
                Sign in to your vendors account
              </p>
    
              <div className="space-y-5">
    
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email Address
                  </label>
    
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300"
                    placeholder="sales@gmail.com"
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Password
                  </label>
    
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300"
                      placeholder="••••••••"
                    />
    
                    <button
                      type="button"
                      onClick={() =>
                        setShowPwd(!showPwd)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                    >
                      {showPwd ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
    
                {error && (
                  <p className="text-red-500 text-sm">
                    {error}
                  </p>
                )}
    
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-[#E34A2F] text-white py-3 rounded-xl font-semibold hover:bg-[#C93F26]"
                >
                  {loading
                    ? "Signing In..."
                    : "Sign In →"}
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}