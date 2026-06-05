import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../public/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/* ─── Firebase Config ─────────────────────────────────────────────────────── */
const FB = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
};



/* ─── Auth ───────────────────────────────────────────────────────────────── */
async function signIn(email, password) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Login failed");
  return {
    token: d.idToken,
    uid: d.localId,
    email: d.email,
    expiresAt: Date.now() + Number(d.expiresIn || 3600) * 1000,
  };
}

function SessionExpiredBanner({ onLogin }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.60)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 360, width: "100%", padding: "2rem", textAlign: "center", boxShadow: "0 20px 60px rgba(10,14,30,0.22)", border: `1px solid ${T.border}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: T.coral }} />
        <div style={{ fontSize: 36, marginBottom: 14 }}>⏱</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Session Expired</h2>
        <p style={{ color: T.hint, fontSize: 13.5, lineHeight: 1.6, marginBottom: 22 }}>Please sign in again to continue.</p>
        <button style={{ ...btn("primary"), width: "100%", justifyContent: "center", padding: "11px 20px" }} onClick={onLogin}>Sign In Again</button>
      </div>
    </div>
  );
}

/* ─── Design Tokens ──────────────────────────────────────────────────────── */
const T = {
  navy: "#1E2A5A",
  coral: "#E34A2F",
  cream: "#FDFAF6",
  border: "rgba(30,42,90,0.08)",
  border2: "rgba(30,42,90,0.14)",
  muted: "#6B7194",
  hint: "#9CA3B8",
  bg: "#F7F5F2",
};

const inp = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  borderRadius: 8,
  border: `1.5px solid ${T.border2}`,
  background: "#fff",
  color: T.navy,
  fontSize: 13.5,
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
  appearance: "none",
};

const focusOn = (e) => {
  e.target.style.borderColor = T.coral;
  e.target.style.boxShadow = `0 0 0 3px rgba(227,74,47,0.10)`;
};
const focusOff = (e) => {
  e.target.style.borderColor = T.border2;
  e.target.style.boxShadow = "none";
};

const makeBtn = (variant = "default", extra = {}) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.3px",
  padding: "9px 18px",
  borderRadius: 50,
  border:
    variant === "outline" ? `1.5px solid ${T.navy}` : "none",
  background:
    variant === "primary"
      ? `linear-gradient(135deg,${T.coral},#f5743a)`
      : variant === "navy"
      ? `linear-gradient(135deg,${T.navy},#2d3d7a)`
      : "rgba(30,42,90,0.06)",
  color: ["primary", "navy"].includes(variant) ? "#fff" : T.navy,
  boxShadow:
    variant === "primary"
      ? "0 3px 12px rgba(227,74,47,0.30)"
      : variant === "navy"
      ? "0 3px 12px rgba(30,42,90,0.30)"
      : "none",
  transition: "all 0.2s",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  ...extra,
});

/* ─── Field helper ───────────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.navy,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.1px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
  const session = localStorage.getItem("vendorSession");
  if (session) {
    navigate("/vendors");
  }
}, [navigate]);

  async function handleSubmit() {
  if (!email || !password) {
    setError("Please enter your email and password.");
    return;
  }

  setError("");
  setLoading(true);

  try {
    const u = await signIn(email, password);

    localStorage.setItem("shubh_admin_session", JSON.stringify(u));

    navigate("/vendor/dashboard");
  } catch (e) {
    setError(
      e.message
        .replace("INVALID_LOGIN_CREDENTIALS", "Invalid email or password.")
        .replace(
          "TOO_MANY_ATTEMPTS_TRY_LATER",
          "Too many attempts. Try later."
        )
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.cream,
        padding: "1.5rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        input:focus { outline: none; }
        button:disabled { opacity: .55; cursor: not-allowed; }
        @media (max-width: 1024px) {
          .login-grid { grid-template-columns: 1fr !important; max-width: 520px !important; }
          .login-left { display: none !important; }
        }
        @media (max-width: 640px) { .login-grid { width: 100% !important; } }
      `}</style>

      <div
        className="login-grid"
        style={{
          width: "100%",
          maxWidth: 960,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(10,14,30,0.18)",
          border: `1px solid ${T.border}`,
          animation: "fadeUp .5s ease .1s both",
          minHeight: 520,
        }}
      >
        {/* ── Left panel ── */}
        <div
          className="login-left"
          style={{
            background: `linear-gradient(145deg, ${T.navy} 0%, #162048 60%, #0e1530 100%)`,
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative blobs */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(227,74,47,0.10)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(245,166,35,0.08)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 24, zIndex: 2 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <img
                  src={logo}
                  alt="logo"
                  style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }}
                />
                <h1
                  style={{
                    margin: 0,
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.6px",
                  }}
                >
                  Shubh <span style={{ color: "#E34A2F" }}>Suramya</span>
                </h1>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.50)",
                  lineHeight: 1.7,
                  maxWidth: 280,
                }}
              >
                Vendor & payment management portal for authorised administrators.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["🏢", "Manage Companies & Vendors"],
                ["📋", "Track Bills & Invoices"],
                ["💳", "Record Payments via Razorpay"],
                ["🏠", "Flat Sales & Customer Receipts"],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>{text}</span>
                </div>
              ))}
            </div>

            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
              Shubh Suramya · Sanand, Gujarat
            </p>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div
          style={{
            background: "#fff",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
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
          <h2 style={{ marginBottom: 6, color: T.navy, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome back
          </h2>
          <p style={{ color: T.muted, marginBottom: 30, fontSize: 14 }}>
            Sign in to your vendor account
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Email Address">
              <input
                style={inp}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
                placeholder="admin@shubhinfra.com"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </Field>

            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inp, paddingRight: 42 }}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={focusOn}
                  onBlur={focusOff}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: T.hint,
                    fontSize: 13,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {show ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>

            {error && (
              <div
                style={{
                  color: T.coral,
                  fontSize: 13,
                  background: "rgba(227,74,47,0.06)",
                  border: `1px solid rgba(227,74,47,0.18)`,
                  borderRadius: 8,
                  padding: "9px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...makeBtn("primary", {
                  width: "100%",
                  justifyContent: "center",
                  padding: "12px 20px",
                  fontSize: 14,
                  marginTop: 4,
                }),
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Signing in...
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </div>

          <p
            style={{
              marginTop: 32,
              fontSize: 11.5,
              color: T.hint,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Authorised personnel only. Contact your administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
}