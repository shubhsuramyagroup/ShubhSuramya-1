import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import logo from "../../../public/logo.png";
import logo1 from "../../../public/logo1.png";

/* ─── Firebase Config ─────────────────────────────────────────────────────── */
const FB = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

/* ─── Firestore REST helpers ─────────────────────────────────────────────── */
const FS = () => `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;
async function fsList(token, col) {
  const r = await fetch(`${FS()}/${col}?pageSize=200`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) { if (r.status === 401) throw new Error("AUTH_EXPIRED"); return []; }
  const d = await r.json(); return d.documents || [];
}
async function fsSet(token, path, data) {
  const r = await fetch(`${FS()}/${path}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: objToFields(data) }) });
  if (!r.ok) throw new Error(await r.text()); return r.json();
}
async function fsCreate(token, col, data) {
  const r = await fetch(`${FS()}/${col}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: objToFields(data) }) });
  if (!r.ok) throw new Error(await r.text()); return r.json();
}
async function fsDelete(token, path) { await fetch(`${FS()}/${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); }
function objToFields(data) {
  const f = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "number") f[k] = { doubleValue: v };
    else if (typeof v === "boolean") f[k] = { booleanValue: v };
    else f[k] = { stringValue: String(v ?? "") };
  }
  return f;
}
function docToObj(doc) {
  if (!doc?.fields) return null;
  const obj = { id: doc.name?.split("/").pop() };
  for (const [k, v] of Object.entries(doc.fields)) obj[k] = v.stringValue ?? v.doubleValue ?? v.booleanValue ?? "";
  return obj;
}

/* ─── Activity Log ───────────────────────────────────────────────────────── */
async function logActivity(token, type, description, details = {}) {
  try {
    await fsCreate(token, "activity_log", { type, description, companyName: details.companyName || "", vendorName: details.vendorName || "", amount: details.amount || 0, createdAt: new Date().toISOString() });
  } catch (e) {}
}

/* ─── Auth ───────────────────────────────────────────────────────────────── */
const AUTH_KEY = "shubh_admin_session";
async function signIn(email, password) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB.apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Login failed");
  return { token: d.idToken, uid: d.localId, email: d.email, expiresAt: Date.now() + Number(d.expiresIn || 3600) * 1000 };
}
function saveSession(u) { try { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); } catch (e) {} }
function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY); if (!raw) return null;
    const p = JSON.parse(raw); if (!p?.token) return null;
    if (p.expiresAt && Date.now() > p.expiresAt - 60_000) { localStorage.removeItem(AUTH_KEY); return null; }
    return p;
  } catch (e) { localStorage.removeItem(AUTH_KEY); return null; }
}
function clearSession() { localStorage.removeItem(AUTH_KEY); }

/* ─── Razorpay ───────────────────────────────────────────────────────────── */
function openRazorpayCheckout({ amount, vendorName, description, onSuccess, onFailure }) {
  if (!RAZORPAY_KEY_ID) { alert("Razorpay Key ID missing in .env"); return; }
  if (!window.Razorpay) { alert("Razorpay SDK not loaded."); return; }
  const rzp = new window.Razorpay({ key: RAZORPAY_KEY_ID, amount: Math.round(amount * 100), currency: "INR", name: "Shubh Infracon", description: `Payment to ${vendorName} – ${description || "Vendor payment"}`, handler: (res) => onSuccess(res.razorpay_payment_id), prefill: { name: vendorName }, theme: { color: "#E34A2F" }, modal: { ondismiss: () => onFailure("Payment cancelled") } });
  rzp.on("payment.failed", (resp) => onFailure(resp.error.description));
  rzp.open();
}

/* ─── Design Tokens ──────────────────────────────────────────────────────── */
const T = {
  navy: "#1E2A5A", coral: "#E34A2F", cream: "#FDFAF6", cream2: "#F5F0E8",
  gold: "#f5a623", white: "#ffffff", muted: "#6B7194", hint: "#9CA3B8",
  border: "rgba(30,42,90,0.08)", border2: "rgba(30,42,90,0.14)",
  success: "#1D9E75", danger: "#E34A2F", amber: "#EF9F27", blue: "#378ADD",
  purple: "#8B5CF6", teal: "#0D9488",
  bg: "#F7F5F2",
};
const CHART_COLORS = [T.coral, T.blue, T.success, T.amber, T.purple, T.teal, T.navy, T.gold];

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
function getMonthKey(d) { if (!d) return ""; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`; }
function formatMonthLabel(key) { if (!key) return ""; const [y, m] = key.split("-"); return `${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[parseInt(m, 10) - 1]} ${y}`; }
function isToday(d) { return d === today(); }
function isThisMonth(d) { return d && getMonthKey(d) === getMonthKey(today()); }

/* ─── Global Styles ──────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 14px; }
  body { font-family: 'DM Sans', sans-serif; background: ${T.bg}; color: ${T.navy}; }
  input:focus, select:focus, textarea:focus { outline: none; }
  button:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(30,42,90,0.15); border-radius: 99px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
  @media (max-width: 768px) { .desktop-nav { display: none !important; } .hamburger { display: flex !important; } }
  @media (max-width: 540px) { .user-pill { display: none !important; } }
  @media (max-width: 620px) { .pay-table { display: none !important; } .pay-mobile { display: flex !important; } }
`;

/* ─── Style Helpers ──────────────────────────────────────────────────────── */
const inp = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", borderRadius: 8,
  border: `1.5px solid ${T.border2}`,
  background: "#fff", color: T.navy,
  fontSize: 13.5, fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
  appearance: "none",
};
const focusOn = (e) => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = `0 0 0 3px rgba(227,74,47,0.10)`; };
const focusOff = (e) => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; };

const card = {
  background: "#fff", borderRadius: 12,
  border: `1px solid ${T.border}`,
  boxShadow: "0 1px 4px rgba(30,42,90,0.05)",
};

function btn(variant = "default", extra = {}) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    padding: "9px 18px", borderRadius: 8,
    border: "none", transition: "all 0.18s",
    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1px",
    whiteSpace: "nowrap",
  };
  const variants = {
    primary: { background: T.coral, color: "#fff", boxShadow: "0 2px 8px rgba(227,74,47,0.25)" },
    navy: { background: T.navy, color: "#fff", boxShadow: "0 2px 8px rgba(30,42,90,0.22)" },
    success: { background: T.success, color: "#fff", boxShadow: "0 2px 8px rgba(29,158,117,0.22)" },
    danger: { background: "#fff", color: T.coral, border: `1.5px solid rgba(227,74,47,0.30)`, boxShadow: "none" },
    razorpay: { background: "#3395FF", color: "#fff", boxShadow: "0 2px 8px rgba(51,149,255,0.28)" },
    outline: { background: "#fff", color: T.navy, border: `1.5px solid ${T.border2}`, boxShadow: "none" },
    ghost: { background: "transparent", color: T.muted, border: "none", boxShadow: "none" },
    default: { background: "#fff", color: T.navy, border: `1.5px solid ${T.border2}`, boxShadow: "none" },
  };
  return { ...base, ...(variants[variant] || variants.default), ...extra };
}

/* ─── Badge ──────────────────────────────────────────────────────────────── */
function Badge({ children, color = "navy" }) {
  const map = {
    navy: { bg: "rgba(30,42,90,0.07)", text: T.navy },
    coral: { bg: "rgba(227,74,47,0.08)", text: T.coral },
    green: { bg: "rgba(29,158,117,0.08)", text: T.success },
    red: { bg: "rgba(227,74,47,0.08)", text: T.coral },
    amber: { bg: "rgba(239,159,39,0.10)", text: "#9a620a" },
    blue: { bg: "rgba(55,138,221,0.08)", text: T.blue },
    purple: { bg: "rgba(139,92,246,0.08)", text: T.purple },
  };
  const t = map[color] || map.navy;
  return (
    <span style={{ background: t.bg, color: t.text, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </span>
  );
}

/* ─── ProgressBar ────────────────────────────────────────────────────────── */
function ProgressBar({ pct, color }) {
  const c = color || (pct >= 100 ? T.success : T.coral);
  return (
    <div style={{ height: 3, background: "rgba(30,42,90,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct || 0)}%`, background: c, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}

const makeBtn = (variant = "default", extra = {}) => ({
  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
  fontSize: 13, fontWeight: 600, letterSpacing: "0.3px", padding: "9px 18px", borderRadius: 50,
  border: variant === "outline" ? `1.5px solid ${T.navy}` : "none",
  background: variant === "primary" ? `linear-gradient(135deg,${T.coral},#f5743a)` : variant === "navy" ? `linear-gradient(135deg,${T.navy},#2d3d7a)` : variant === "razorpay" ? "linear-gradient(135deg,#3395FF,#1a7de8)" : variant === "danger" ? `linear-gradient(135deg,${T.danger},#c73b22)` : variant === "success" ? `linear-gradient(135deg,${T.success},#25c492)` : variant === "ghost" ? "transparent" : "rgba(30,42,90,0.06)",
  color: ["primary","navy","razorpay","danger","success"].includes(variant) ? "#fff" : T.navy,
  boxShadow: variant === "primary" ? "0 3px 12px rgba(227,74,47,0.30)" : variant === "navy" ? "0 3px 12px rgba(30,42,90,0.30)" : variant === "razorpay" ? "0 3px 12px rgba(51,149,255,0.30)" : "none",
  transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif", ...extra,
});

/* ─── Spinner ────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: 14 }}>
      <div style={{ width: 32, height: 32, border: `2.5px solid rgba(30,42,90,0.08)`, borderTopColor: T.coral, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ color: T.hint, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ ...card, padding: 18, animation: "pulse 1.4s ease-in-out infinite" }}>
      <div style={{ height: 11, background: "rgba(30,42,90,0.06)", borderRadius: 6, marginBottom: 12, width: "55%" }} />
      <div style={{ height: 22, background: "rgba(30,42,90,0.04)", borderRadius: 6, width: "38%" }} />
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "3rem 2rem" }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <p style={{ color: T.hint, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{text}</p>
    </div>
  );
}

/* ─── Field ──────────────────────────────────────────────────────────────── */
function Field({ label, children, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1px" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: T.hint, fontFamily: "'DM Sans', sans-serif" }}>{hint}</p>}
    </div>
  );
}

/* ─── Divider ────────────────────────────────────────────────────────────── */
function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {label && <span style={{ fontSize: 11, color: T.hint, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children, width = 540 }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(10,14,30,0.18)", border: `1px solid ${T.border}`, animation: "modalIn 0.25s cubic-bezier(.22,1,.36,1) both", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12, color: T.hint, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(30,42,90,0.05)", border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(227,74,47,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(30,42,90,0.05)"}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={T.navy} strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: "20px 22px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── SectionHeader ──────────────────────────────────────────────────────── */
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
      {action}
    </div>
  );
}

/* ─── Delete Confirm Modal ───────────────────────────────────────────────── */
function DeleteConfirmModal({ type, name, invoiceNo, onConfirm, onCancel, loading }) {
  const [input, setInput] = useState("");
  const matchValue = type === "bill" ? (invoiceNo || name) : name;
  const matches = input === matchValue;
  const [mismatch, setMismatch] = useState(false);
  const typeLabel = type === "company" ? "Company" : type === "vendor" ? "Vendor" : "Bill";
  const cascadeMsg = type === "company" ? "All vendors and bills under this company will be permanently deleted." : type === "vendor" ? "All bills under this vendor will be permanently deleted." : "This bill will be permanently deleted.";

  function handleDelete() {
    if (!matches) { setMismatch(true); setTimeout(() => setMismatch(false), 2500); return; }
    onConfirm();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(10,14,30,0.20)", border: `1px solid ${T.border}`, animation: "modalIn 0.25s cubic-bezier(.22,1,.36,1) both", overflow: "hidden" }}>
        <div style={{ height: 3, background: T.coral }} />
        <div style={{ padding: "22px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(227,74,47,0.07)", border: `1px solid rgba(227,74,47,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke={T.coral} strokeWidth="2" strokeLinecap="round" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>Delete {typeLabel}</h3>
              <p style={{ fontSize: 12.5, color: T.hint, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{cascadeMsg}</p>
            </div>
          </div>

          <div style={{ background: "rgba(227,74,47,0.04)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, border: `1px solid rgba(227,74,47,0.12)` }}>
            <p style={{ fontSize: 11, color: T.hint, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>{type === "bill" ? "Invoice" : `${typeLabel} name`}</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: T.coral, fontFamily: "'DM Mono', monospace" }}>{matchValue}</p>
          </div>

          <Field label={`Type "${matchValue}" to confirm deletion`}>
            <input
              style={{ ...inp, borderColor: mismatch ? T.coral : T.border2, boxShadow: mismatch ? `0 0 0 3px rgba(227,74,47,0.10)` : "none" }}
              value={input}
              onChange={(e) => { setInput(e.target.value); setMismatch(false); }}
              placeholder="Type to confirm…"
              onFocus={focusOn} onBlur={focusOff}
              onKeyDown={(e) => e.key === "Enter" && handleDelete()}
              autoFocus
            />
          </Field>
          {mismatch && <p style={{ fontSize: 12, color: T.coral, fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>Text doesn't match. Try again.</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
            <button style={btn("default")} onClick={onCancel} disabled={loading}>Cancel</button>
            <button style={btn("primary", { opacity: matches ? 1 : 0.4 })} onClick={handleDelete} disabled={loading || !matches}>
              {loading ? "Deleting…" : `Delete ${typeLabel}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FormActions ────────────────────────────────────────────────────────── */
function FormActions({ onClose, saving, saveLabel = "Save" }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
      <button style={btn("default")} onClick={onClose}>Cancel</button>
      <button style={btn("primary")} disabled={saving}>{saving ? "Saving…" : saveLabel}</button>
    </div>
  );
}

/* ─── InfoBanner ─────────────────────────────────────────────────────────── */
function InfoBanner({ name, sub, right }) {
  return (
    <div style={{ background: T.navy, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>{name}</p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.50)", fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ─── Company Form ───────────────────────────────────────────────────────── */
function CompanyForm({ initial, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { name: "", gstin: "", pan: "", stateCode: "24", msmeNo: "", address: "", phone: "", email: "", totalBudget: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Company Name *">
        <input style={inp} type="text" value={f.name} onChange={set("name")} onFocus={focusOn} onBlur={focusOff} placeholder="Enter company name" autoFocus />
      </Field>
      <Divider label="Registration Details" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {[["GSTIN", "gstin", "text"], ["PAN", "pan", "text"], ["State Code", "stateCode", "text"], ["MSME No.", "msmeNo", "text"]].map(([l, k]) => (
          <Field key={k} label={l}><input style={inp} type="text" value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder={`Enter ${l}`} /></Field>
        ))}
      </div>
      <Divider label="Contact & Budget" />
      <Field label="Address">
        <input style={inp} type="text" value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} placeholder="Enter address" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {[["Phone", "phone", "tel"], ["Email", "email", "email"], ["Total Budget (₹)", "totalBudget", "number"]].map(([l, k, t]) => (
          <Field key={k} label={l}><input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder={`Enter ${l}`} /></Field>
        ))}
      </div>
      <FormActions onClose={onClose} saving={saving} saveLabel={initial ? "Update Company" : "Add Company"} onClick={() => onSave(f)} />
      {/* Wrap button click */}
      <style>{`.form-save-btn { display:none; }`}</style>
    </div>
  );
}

/* Note: Wrapping FormActions to pass onSave */
function CompanyFormWrapped({ initial, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { name: "", gstin: "", pan: "", stateCode: "24", msmeNo: "", address: "", phone: "", email: "", totalBudget: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Company Name *">
        <input style={inp} type="text" value={f.name} onChange={set("name")} onFocus={focusOn} onBlur={focusOff} placeholder="Enter company name" autoFocus />
      </Field>
      <Divider label="Registration Details" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {[["GSTIN", "gstin"], ["PAN", "pan"], ["State Code", "stateCode"], ["MSME No.", "msmeNo"]].map(([l, k]) => (
          <Field key={k} label={l}><input style={inp} type="text" value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder={`Enter ${l}`} /></Field>
        ))}
      </div>
      <Divider label="Contact & Budget" />
      <Field label="Address">
        <input style={inp} type="text" value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} placeholder="Full address" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {[["Phone", "phone", "tel"], ["Email", "email", "email"], ["Total Budget (₹)", "totalBudget", "number"]].map(([l, k, t]) => (
          <Field key={k} label={l}><input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder={`Enter ${l}`} /></Field>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={() => onSave(f)} disabled={saving}>{saving ? "Saving…" : initial ? "Update Company" : "Add Company"}</button>
      </div>
    </div>
  );
}

/* ─── Vendor Form ────────────────────────────────────────────────────────── */
function VendorFormWrapped({ initial, companies, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { name: "", companyId: companies[0]?.id || "", gstin: "", pan: "", phone: "", email: "", address: "", description: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Company *">
        <select style={inp} value={f.companyId} onChange={set("companyId")} onFocus={focusOn} onBlur={focusOff}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Vendor Name *">
        <input style={inp} type="text" value={f.name} onChange={set("name")} onFocus={focusOn} onBlur={focusOff} placeholder="Enter vendor name" autoFocus />
      </Field>
      <Divider label="Registration & Contact" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {[["GSTIN", "gstin", "text"], ["PAN", "pan", "text"], ["Phone", "phone", "tel"], ["Email", "email", "email"]].map(([l, k, t]) => (
          <Field key={k} label={l}><input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder={`Enter ${l}`} /></Field>
        ))}
      </div>
      <Field label="Address">
        <input style={inp} type="text" value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} placeholder="Full address" />
      </Field>
      <Field label="Work Description">
        <input style={inp} type="text" value={f.description} onChange={set("description")} onFocus={focusOn} onBlur={focusOff} placeholder="Describe the work or services" />
      </Field>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={() => onSave(f)} disabled={saving}>{saving ? "Saving…" : initial ? "Update Vendor" : "Add Vendor"}</button>
      </div>
    </div>
  );
}

/* ─── Bill Form ──────────────────────────────────────────────────────────── */
function BillFormWrapped({ initial, vendor, companies, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { hsnCode: "", invoiceNo: "", invoiceDate: today(), totalBill: "", cgst: "", sgst: "", tds: "", description: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const subTotal = Number(f.totalBill || 0), cgstAmt = Number(f.cgst || 0), sgstAmt = Number(f.sgst || 0);
  const billWithGST = subTotal + cgstAmt + sgstAmt, tdsAmt = Number(f.tds || 0), netAmount = billWithGST - tdsAmt;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InfoBanner
        name={vendor.name}
        sub={companies.find(c => c.id === vendor.companyId)?.name || ""}
        right={<Badge color="coral">{initial ? "Edit Bill" : "New Bill"}</Badge>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        {[["Description", "description", "text"], ["HSN Code", "hsnCode", "text"], ["Invoice No.", "invoiceNo", "text"], ["Invoice Date", "invoiceDate", "date"]].map(([l, k, t]) => (
          <Field key={k} label={l}><input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} /></Field>
        ))}
      </div>
      <Divider label="Bill Breakdown" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
        {[["Sub Total (₹)", "totalBill"], ["CGST (₹)", "cgst"], ["SGST (₹)", "sgst"], ["TDS (₹)", "tds"]].map(([l, k]) => (
          <Field key={k} label={l}><input style={inp} type="number" value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder="0.00" /></Field>
        ))}
      </div>
      {/* Net summary */}
      <div style={{ background: T.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 12.5, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 2 }}>
          <p>GST Total: <strong style={{ color: T.navy }}>{fmtINR(billWithGST)}</strong></p>
          <p>TDS Deduction: <strong style={{ color: T.coral }}>−{fmtINR(tdsAmt)}</strong></p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: T.hint, fontFamily: "'DM Sans', sans-serif" }}>Net Payable</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: T.coral, fontFamily: "'DM Sans', sans-serif" }}>{fmtINR(netAmount)}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={() => onSave({ ...f, billWithGST, netAmount })} disabled={saving}>{saving ? "Saving…" : initial ? "Update Bill" : "Add Bill"}</button>
      </div>
    </div>
  );
}

/* ─── Payment Form ───────────────────────────────────────────────────────── */
function PaymentFormWrapped({ bill, vendor, onSave, onClose, saving }) {
  const due = Number(bill.netAmount || 0) - Number(bill.amountPaid || 0);
  const [f, setF] = useState({ date: today(), particulars: "", chequeNo: "", amountPaid: String(due > 0 ? due.toFixed(2) : ""), paymentMode: "Razorpay X" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const isRazorpay = f.paymentMode === "Razorpay X";
  const pct = Number(bill.netAmount) > 0 ? (Number(bill.amountPaid) / Number(bill.netAmount)) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Bill summary */}
      <div style={{ background: T.navy, borderRadius: 10, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>{vendor.name}</p>
            {bill.invoiceNo && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Invoice #{bill.invoiceNo} · {bill.invoiceDate}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif" }}>Outstanding</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#ff8a75", fontFamily: "'DM Sans', sans-serif" }}>{fmtINR(due)}</p>
          </div>
        </div>
        <ProgressBar pct={pct} color="rgba(255,255,255,0.35)" />
        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 5, fontFamily: "'DM Sans', sans-serif" }}>{pct.toFixed(1)}% settled</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        <Field label="Payment Date"><input style={inp} type="date" value={f.date} onChange={set("date")} onFocus={focusOn} onBlur={focusOff} /></Field>
        <Field label="Amount (₹) *"><input style={inp} type="number" value={f.amountPaid} onChange={set("amountPaid")} onFocus={focusOn} onBlur={focusOff} placeholder="0.00" /></Field>
        <Field label="Particulars"><input style={inp} type="text" value={f.particulars} onChange={set("particulars")} placeholder="Reference / note" onFocus={focusOn} onBlur={focusOff} /></Field>
        <Field label="Cheque / UTR No."><input style={inp} type="text" value={f.chequeNo} onChange={set("chequeNo")} placeholder="Optional" onFocus={focusOn} onBlur={focusOff} /></Field>
      </div>

      <Field label="Payment Mode">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {["Cash", "Cheque", "NEFT", "RTGS", "UPI", "Razorpay X"].map((m) => {
            const active = f.paymentMode === m;
            return (
              <button key={m} onClick={() => setF((p) => ({ ...p, paymentMode: m }))} style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", border: active ? "none" : `1.5px solid ${T.border2}`, background: active ? (m === "Razorpay X" ? "#3395FF" : T.coral) : "#fff", color: active ? "#fff" : T.muted }}>
                {m}
              </button>
            );
          })}
        </div>
      </Field>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        {isRazorpay
          ? <button style={btn("razorpay")} onClick={() => onSave(f, true)} disabled={saving || !f.amountPaid}>{saving ? "Processing…" : `Pay ${fmtINR(f.amountPaid)}`}</button>
          : <button style={btn("primary")} onClick={() => onSave(f, false)} disabled={saving || !f.amountPaid}>{saving ? "Recording…" : "Record Payment"}</button>
        }
      </div>
    </div>
  );
}

/* ─── Payment Success ────────────────────────────────────────────────────── */
function PaymentSuccess({ amount, vendor, paymentId, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.50)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 360, width: "100%", padding: "2rem 2rem 2rem", textAlign: "center", boxShadow: "0 20px 60px rgba(10,14,30,0.20)", animation: "modalIn 0.3s cubic-bezier(.34,1.4,.64,1) both", border: `1px solid ${T.border}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: T.success }} />
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `rgba(29,158,117,0.09)`, border: `2px solid rgba(29,158,117,0.20)`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none"><path d="M6 15l7 7 11-13" stroke={T.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>Payment Recorded</h2>
        <p style={{ color: T.muted, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: 20 }}>{fmtINR(amount)} recorded for <strong style={{ color: T.navy }}>{vendor}</strong></p>
        {paymentId && (
          <div style={{ background: T.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 18, border: `1px solid ${T.border}`, textAlign: "left" }}>
            <p style={{ fontSize: 11, color: T.hint, fontFamily: "'DM Sans', sans-serif" }}>Razorpay ID</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{paymentId}</p>
          </div>
        )}
        <button style={{ ...btn("success"), width: "100%", justifyContent: "center", padding: "11px 20px" }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* ─── Session Expired ────────────────────────────────────────────────────── */
function SessionExpiredBanner({ onLogin }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.60)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 360, width: "100%", padding: "2rem", textAlign: "center", boxShadow: "0 20px 60px rgba(10,14,30,0.22)", border: `1px solid ${T.border}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: T.coral }} />
        <div style={{ fontSize: 36, marginBottom: 14 }}>⏱</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Session Expired</h2>
        <p style={{ color: T.hint, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: 22 }}>Please sign in again to continue.</p>
        <button style={{ ...btn("primary"), width: "100%", justifyContent: "center", padding: "11px 20px" }} onClick={onLogin}>Sign In Again</button>
      </div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar({ user, tab, setTab, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "⊞" },
    { key: "companies", label: "Companies", icon: "🏢" },
    { key: "vendors", label: "Vendors", icon: "👥" },
    { key: "payments", label: "Payments", icon: "💳" },
  ];

  return (
    <header style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 500 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center justify-center flex-shrink-0">
                        <img
                          src={logo}
                          alt="logo"
                          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
                        />
                      </div>
          
                      <div className="flex items-center justify-center flex-shrink-0">
                        <img
                          src={logo1}
                          alt="logo text"
                          className="h-8 w-12 sm:h-10 sm:w-14 md:h-11 md:w-16 lg:h-12 lg:w-20 object-contain"
                        />
                      </div>
                    </div>

          {/* Desktop Nav */}
          <nav style={{ display: "flex", gap: 1 }} className="desktop-nav">
            {navItems.map((n) => (
              <button key={n.key} onClick={() => setTab(n.key)} style={{ background: tab === n.key ? T.bg : "transparent", border: "none", borderRadius: 8, padding: "7px 14px", color: tab === n.key ? T.navy : T.muted, fontWeight: tab === n.key ? 600 : 500, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="user-pill" style={{ display: "flex", alignItems: "center", gap: 7, background: T.bg, borderRadius: 8, padding: "5px 10px 5px 7px", border: `1px solid ${T.border}` }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <span style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
            </div>
            <button onClick={onLogout} title="Logout" style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(227,74,47,0.06)", border: `1px solid rgba(227,74,47,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(227,74,47,0.12)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(227,74,47,0.06)"}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={() => setMobileOpen(o => !o)} className="hamburger" style={{ width: 32, height: 32, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={T.navy} strokeWidth="2" width="14" height="14">{mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>}</svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 0 14px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((n) => (
              <button key={n.key} onClick={() => { setTab(n.key); setMobileOpen(false); }} style={{ background: tab === n.key ? T.bg : "transparent", border: "none", borderRadius: 8, padding: "10px 12px", color: tab === n.key ? T.navy : T.muted, fontWeight: tab === n.key ? 600 : 500, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 9, width: "100%" }}>
                <span>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── StatCard ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, accent, delay = 0, sub }) {
  return (
    <div style={{ ...card, padding: "16px 18px", animation: `fadeUp 0.4s ease ${delay}ms both`, borderTop: `2.5px solid ${accent || T.border2}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <p style={{ fontSize: 11, color: T.hint, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: 20, fontWeight: 700, color: accent || T.navy, fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: T.hint, fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

/* ─── ChartTooltip ───────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.navy, borderRadius: 10, padding: "9px 14px", boxShadow: "0 8px 24px rgba(10,14,30,0.22)", border: `1px solid rgba(255,255,255,0.07)` }}>
      {label && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", fontFamily: "'DM Sans', sans-serif", marginBottom: 5 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ color: p.color || T.coral }}>{p.name}: </span>₹{Number(p.value || 0).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

/* ─── ChartCard ──────────────────────────────────────────────────────────── */
function ChartCard({ title, accent, children }) {
  return (
    <div style={{ ...card, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent || T.coral }} />
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Activity Icon ──────────────────────────────────────────────────────── */
function ActivityIcon({ type }) {
  const map = { company_added: "🏢", vendor_added: "👥", bill_added: "📋", payment_made: "💳", bill_deleted: "🗑️", vendor_deleted: "🗑️", company_deleted: "🗑️" };
  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
      {map[type] || "📌"}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PAGE — Modern split-card design
═══════════════════════════════════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const u = await signIn(email, password);
      onLogin(u);
    } catch (e) {
      setError(
        e.message
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *,*::before,*::after{
          box-sizing:border-box;
        }

        @keyframes spin{
          to{transform:rotate(360deg)}
        }

        @keyframes fadeUp{
          from{
            opacity:0;
            transform:translateY(24px)
          }
          to{
            opacity:1;
            transform:translateY(0)
          }
        }

        input:focus{
          outline:none;
        }

        button:disabled{
          opacity:.55;
          cursor:not-allowed;
        }

        /* Small + Medium screens */
        @media(max-width:1024px){

          .login-grid{
            grid-template-columns:1fr !important;
            max-width:520px !important;
          }

          .login-left{
            display:none !important;
          }

        }

        @media(max-width:640px){

          .login-grid{
            width:100% !important;
          }

        }

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
        {/* Left panel */}
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
  {/* Decorative circles */}
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

  {/* Bottom content */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 24,
      zIndex: 2,
    }}
  >
    {/* Logo + Title */}
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center flex-shrink-0">
          <img
            src={logo}
            alt="logo"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
          />
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.6px",
          }}
        >
          Shubh{" "}
          <span style={{ color: "#E34A2F" }}>
            Sauramya
          </span>
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

    {/* Features */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {[
        ["🏢", "Manage Companies & Vendors"],
        ["📋", "Track Bills & Invoices"],
        ["💳", "Record Payments via Razorpay"],
      ].map(([icon, text]) => (
        <div
          key={text}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
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

          <span
            style={{
              fontSize: 12.5,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {text}
          </span>
        </div>
      ))}
    </div>

    {/* Footer */}
    <p
      style={{
        margin: 0,
        fontSize: 11,
        color: "rgba(255,255,255,0.25)",
      }}
    >
      Shubh Sauramya · Sanand, Gujarat
    </p>
  </div>
</div>

        {/* Right form */}
        <div
          style={{
            background: "#fff",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              marginBottom: 6,
              color: T.navy,
            }}
          >
            Welcome back
          </h2>

          <p
            style={{
              color: T.muted,
              marginBottom: 30,
            }}
          >
            Sign in to your admin account
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <Field label="Email Address">
              <input
                style={inp}
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="admin@shubhinfra.com"
              />
            </Field>

            <Field label="Password">
              <input
                style={inp}
                type={show ? "text":"password"}
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <div
                style={{
                  color:T.coral,
                  fontSize:13,
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...makeBtn("primary",{
                  width:"100%",
                  justifyContent:"center"
                })
              }}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD TAB
═══════════════════════════════════════════════════════════════════════════ */
function DashboardTab({ companies, vendors, bills, payments, activityLog, setTab, loading }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const sum = (arr, key) => arr.reduce((s, v) => s + Number(v[key] || 0), 0);

  const filteredPayments = useMemo(() => payments.filter(p => {
    if (dateFrom && p.date < dateFrom) return false;
    if (dateTo && p.date > dateTo) return false;
    if (search) { const q = search.toLowerCase(); return (p.vendorName || "").toLowerCase().includes(q) || (p.particulars || "").toLowerCase().includes(q); }
    return true;
  }), [payments, dateFrom, dateTo, search]);

  const totalNet = sum(bills, "netAmount"), totalPaid = sum(bills, "amountPaid"), totalDue = totalNet - totalPaid;
  const paidBillCnt = bills.filter(b => Number(b.netAmount) > 0 && Number(b.amountPaid) >= Number(b.netAmount) - 0.01).length;
  const pendBillCnt = bills.length - paidBillCnt;
  const todayRev = filteredPayments.filter(p => isToday(p.date)).reduce((s, p) => s + Number(p.amountPaid || 0), 0);
  const monthRev = filteredPayments.filter(p => isThisMonth(p.date)).reduce((s, p) => s + Number(p.amountPaid || 0), 0);

  const companyBarData = useMemo(() => companies.map(c => {
    const vids = vendors.filter(v => v.companyId === c.id).map(v => v.id);
    const cb = bills.filter(b => vids.includes(b.vendorId));
    return { name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name, total: sum(cb, "netAmount"), paid: sum(cb, "amountPaid") };
  }).sort((a, b) => b.total - a.total), [companies, vendors, bills]);

  const paidVsPendingData = [{ name: "Paid", value: totalPaid }, { name: "Pending", value: totalDue > 0 ? totalDue : 0 }];

  const monthlyData = useMemo(() => {
    const map = {};
    filteredPayments.forEach(p => { const k = getMonthKey(p.date); if (!k) return; map[k] = (map[k] || 0) + Number(p.amountPaid || 0); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, v]) => ({ month: formatMonthLabel(k), revenue: v }));
  }, [filteredPayments]);

  const top5Companies = [...companyBarData].slice(0, 5);
  const top5Vendors = useMemo(() => vendors.map(v => {
    const vb = bills.filter(b => b.vendorId === v.id);
    const comp = companies.find(c => c.id === v.companyId);
    return { name: v.name, company: comp?.name || "—", total: sum(vb, "netAmount"), paid: sum(vb, "amountPaid") };
  }).sort((a, b) => b.total - a.total).slice(0, 5), [vendors, bills, companies]);

  const billAmounts = bills.map(b => Number(b.netAmount || 0)).filter(v => v > 0);
  const maxBill = billAmounts.length ? Math.max(...billAmounts) : 0;
  const minBill = billAmounts.length ? Math.min(...billAmounts) : 0;
  const recentActivity = [...activityLog].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 8);
  const recentPayments = [...filteredPayments].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);

  if (loading) return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filter bar */}
      <div style={{ ...card, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.hint, flexShrink: 0 }}>Filter payments</span>
          <input style={{ ...inp, width: "auto", flex: "1 1 130px" }} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
          <span style={{ color: T.hint, fontSize: 12 }}>to</span>
          <input style={{ ...inp, width: "auto", flex: "1 1 130px" }} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
          <input style={{ ...inp, flex: "2 1 180px" }} placeholder="Search by vendor or particulars…" value={search} onChange={e => setSearch(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
          {(dateFrom || dateTo || search) && <button style={btn("ghost", { padding: "8px 12px", color: T.coral, fontSize: 12 })} onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); }}>Clear ×</button>}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <StatCard label="Companies"       value={companies.length}  icon="🏢" delay={0} />
        <StatCard label="Vendors"         value={vendors.length}    icon="👥" delay={40} />
        <StatCard label="Total Bills"     value={bills.length}      icon="📋" delay={80} />
        <StatCard label="Paid Bills"      value={paidBillCnt}       icon="✅" accent={T.success} delay={120} />
        <StatCard label="Pending Bills"   value={pendBillCnt}       icon="⏳" accent={T.amber} delay={160} />
        <StatCard label="Net Payable"     value={fmtINR(totalNet)}  icon="💼" accent={T.navy} delay={200} />
        <StatCard label="Amount Paid"     value={fmtINR(totalPaid)} icon="💚" accent={T.success} delay={240} />
        <StatCard label="Outstanding"     value={fmtINR(totalDue)}  accent={totalDue > 0 ? T.coral : T.success} icon={totalDue > 0 ? "⚠️" : "🎉"} delay={280} />
        <StatCard label="Today's Revenue" value={fmtINR(todayRev)}  icon="📅" accent={T.blue} delay={320} />
        <StatCard label="This Month"      value={fmtINR(monthRev)}  icon="📆" accent={T.purple} delay={360} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
        <ChartCard title="Company-wise Bills" accent={T.coral}>
          {companyBarData.length === 0 ? <Empty icon="📊" text="No data yet." /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={companyBarData} barSize={16} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,42,90,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.hint, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: T.hint }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(30,42,90,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
                <Bar dataKey="total" name="Total" fill={T.coral} radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Paid" fill={T.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Paid vs Pending" accent={T.success}>
          {totalNet <= 0 ? <Empty icon="🥧" text="No billing data yet." /> : (
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <ResponsiveContainer width="55%" height={180} style={{ minWidth: 130 }}>
                <PieChart>
                  <Pie data={paidVsPendingData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={4} dataKey="value">
                    <Cell fill={T.success} /><Cell fill={T.coral} />
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {paidVsPendingData.map((d, i) => (
                  <div key={d.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? T.success : T.coral }} />
                      <span style={{ fontSize: 12, color: T.hint, fontFamily: "'DM Sans', sans-serif" }}>{d.name}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? T.success : T.coral, fontFamily: "'DM Sans', sans-serif", marginLeft: 14, marginTop: 2 }}>{fmtINR(d.value)}</p>
                    <p style={{ fontSize: 10.5, color: T.hint, marginLeft: 14 }}>{totalNet > 0 ? ((d.value / totalNet) * 100).toFixed(1) : 0}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Monthly area chart */}
      {monthlyData.length > 1 && (
        <ChartCard title="Monthly Payments" accent={T.blue}>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={monthlyData}>
              <defs><linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue} stopOpacity={0.12} /><stop offset="95%" stopColor={T.blue} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,42,90,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.hint }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.hint }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={T.blue} strokeWidth={2} fill="url(#payGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Top companies + vendors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>Top Companies</h3>
            <button style={btn("default", { fontSize: 11.5, padding: "5px 12px" })} onClick={() => setTab("companies")}>View all →</button>
          </div>
          {top5Companies.length === 0 ? <p style={{ color: T.hint, fontSize: 12, textAlign: "center", padding: "1rem 0" }}>No data.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {top5Companies.map((c, i) => {
                const pct = c.total > 0 ? (c.paid / c.total) * 100 : 0;
                return (
                  <div key={c.name} style={{ padding: "11px 13px", borderRadius: 9, background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${CHART_COLORS[i]}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: CHART_COLORS[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>{fmtINR(c.total)}</span>
                    </div>
                    <ProgressBar pct={pct} color={CHART_COLORS[i]} />
                    <p style={{ fontSize: 10.5, color: T.hint, marginTop: 4 }}>{pct.toFixed(1)}% settled</p>
                  </div>
                );
              })}
            </div>
          )}
          {billAmounts.length > 0 && (
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["Highest Bill", maxBill, T.coral], ["Lowest Bill", minBill, T.success]].map(([l, v, c]) => (
                <div key={l} style={{ background: T.bg, borderRadius: 9, padding: "10px 12px", textAlign: "center", border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 10.5, color: T.hint }}>{l}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: c, marginTop: 3 }}>{fmtINR(v)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>Top Vendors</h3>
            <button style={btn("default", { fontSize: 11.5, padding: "5px 12px" })} onClick={() => setTab("vendors")}>View all →</button>
          </div>
          {top5Vendors.length === 0 ? <p style={{ color: T.hint, fontSize: 12, textAlign: "center", padding: "1rem 0" }}>No data.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {top5Vendors.map((v, i) => {
                const due = v.total - v.paid;
                return (
                  <div key={v.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderRadius: 9, background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${CHART_COLORS[i]}`, gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</p>
                      <p style={{ fontSize: 11, color: T.hint, marginTop: 2 }}>{v.company}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: T.navy }}>{fmtINR(v.total)}</p>
                      <p style={{ fontSize: 11, color: due > 0 ? T.coral : T.success, marginTop: 2 }}>{due > 0 ? `${fmtINR(due)} due` : "✓ Settled"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity + payments */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={{ ...card, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>Recent Activity</h3>
          {recentActivity.length === 0 ? <p style={{ color: T.hint, fontSize: 12, textAlign: "center", padding: "1.5rem 0" }}>No activity yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentActivity.map((a, i) => {
                const dt = a.createdAt ? new Date(a.createdAt) : null;
                const dtStr = dt ? dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < recentActivity.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <ActivityIcon type={a.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: T.navy }}>{a.description}</p>
                      <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                        {a.companyName && <span style={{ fontSize: 11, color: T.hint }}>{a.companyName}</span>}
                        {a.vendorName && <span style={{ fontSize: 11, color: T.hint }}>· {a.vendorName}</span>}
                        {Number(a.amount) > 0 && <span style={{ fontSize: 11, color: T.success, fontWeight: 600 }}>· {fmtINR(a.amount)}</span>}
                      </div>
                      <p style={{ fontSize: 10.5, color: T.hint, marginTop: 2 }}>{dtStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>Recent Payments</h3>
            <button style={btn("default", { fontSize: 11.5, padding: "5px 12px" })} onClick={() => setTab("payments")}>View all →</button>
          </div>
          {recentPayments.length === 0 ? <p style={{ color: T.hint, fontSize: 12, textAlign: "center", padding: "1.5rem 0" }}>No payments yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentPayments.map((p, i) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < recentPayments.length - 1 ? `1px solid ${T.border}` : "none", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "rgba(29,158,117,0.07)", border: `1px solid rgba(29,158,117,0.14)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke={T.success} strokeWidth="1.8" /><path d="M2 10h20" stroke={T.success} strokeWidth="1.8" /></svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.vendorName}</p>
                      <p style={{ fontSize: 11, color: T.hint, marginTop: 2 }}>{p.date}{p.particulars ? ` · ${p.particulars}` : ""}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <Badge color={p.paymentMode === "Razorpay X" ? "blue" : "green"}>{p.paymentMode}</Badge>
                    <span style={{ fontWeight: 700, color: T.success, fontSize: 13.5 }}>{fmtINR(p.amountPaid)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENTS TAB
═══════════════════════════════════════════════════════════════════════════ */
function PaymentsTab({ payments, companies }) {
  const [filterCo, setFilterCo] = useState("");
  const [search, setSearch] = useState("");
  const sum = (arr, k) => arr.reduce((s, v) => s + Number(v[k] || 0), 0);

  const filtered = useMemo(() => [...payments]
    .filter(p => !filterCo || p.companyId === filterCo)
    .filter(p => !search || (p.vendorName || "").toLowerCase().includes(search.toLowerCase()) || (p.particulars || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")), [payments, filterCo, search]);

  return (
    <div>
      <SectionHeader title="Payment History" />

      {/* Summary + filters */}
      <div style={{ ...card, padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Transactions</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginTop: 3 }}>{filtered.length}</p>
            </div>
            <div style={{ width: 1, background: T.border }} />
            <div>
              <p style={{ fontSize: 11, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Paid</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: T.success, marginTop: 3 }}>{fmtINR(sum(filtered, "amountPaid"))}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input style={{ ...inp, width: "auto", minWidth: 170 }} placeholder="Search vendor…" value={search} onChange={e => setSearch(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            <select style={{ ...inp, width: "auto", minWidth: 160 }} value={filterCo} onChange={(e) => setFilterCo(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.4 }}>🧾</div>
            <p style={{ color: T.hint, fontSize: 13 }}>No payments recorded yet.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }} className="pay-table">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    {["Date", "Vendor", "Particulars", "Cheque / UTR", "Mode", "Amount"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 16px", color: T.hint, fontWeight: 600, fontSize: 11, letterSpacing: "0.3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = T.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "13px 16px", color: T.hint, whiteSpace: "nowrap", fontSize: 12.5, fontFamily: "'DM Mono', monospace" }}>{p.date}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.navy, border: `1px solid ${T.border}`, flexShrink: 0 }}>
                            {(p.vendorName || "?")[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: T.navy }}>{p.vendorName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", color: T.hint, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.particulars || "—"}</td>
                      <td style={{ padding: "13px 16px", color: T.hint, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{p.chequeNo || "—"}</td>
                      <td style={{ padding: "13px 16px" }}><Badge color={p.paymentMode === "Razorpay X" ? "blue" : "green"}>{p.paymentMode}</Badge></td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}><span style={{ fontWeight: 700, color: T.success, fontSize: 14 }}>{fmtINR(p.amountPaid)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pay-mobile" style={{ display: "none", flexDirection: "column" }}>
              {filtered.map((p, i) => (
                <div key={p.id} style={{ padding: "13px 15px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.vendorName}</p>
                      <p style={{ fontSize: 11.5, color: T.hint, marginTop: 2 }}>{p.date}{p.particulars ? ` · ${p.particulars}` : ""}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: T.success }}>{fmtINR(p.amountPaid)}</p>
                      <div style={{ marginTop: 4 }}><Badge color={p.paymentMode === "Razorpay X" ? "blue" : "green"}>{p.paymentMode}</Badge></div>
                    </div>
                  </div>
                  {p.chequeNo && <p style={{ fontSize: 11, color: T.hint, fontFamily: "'DM Mono', monospace", marginTop: 7 }}>UTR: {p.chequeNo}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPANIES TAB
═══════════════════════════════════════════════════════════════════════════ */
function CompaniesTab({ companies, vendors, bills, onAdd, onEdit, onDelete }) {
  const cVendors = (cid) => vendors.filter(v => v.companyId === cid);
  const cBills = (cid) => { const vids = cVendors(cid).map(v => v.id); return bills.filter(b => vids.includes(b.vendorId)); };
  const sum = (arr, k) => arr.reduce((s, v) => s + Number(v[k] || 0), 0);

  return (
    <div>
      <SectionHeader title="Companies" action={<button style={btn("primary")} onClick={onAdd}>+ Add Company</button>} />
      {companies.length === 0 && <Empty icon="🏢" text="No companies yet. Add your first one." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 14 }}>
        {companies.map((c, i) => {
          const cb = cBills(c.id), net = sum(cb, "netAmount"), paid = sum(cb, "amountPaid"), due = net - paid, pct = net > 0 ? (paid / net) * 100 : 0;
          return (
            <div key={c.id} style={{ ...card, padding: 0, overflow: "hidden", animation: `fadeUp 0.4s ease ${i * 60}ms both`, display: "flex", flexDirection: "column" }}>
              <div style={{ height: 3, background: pct >= 100 ? T.success : T.coral }} />
              <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" strokeWidth="1.8" /><path d="M3 9h18M9 21V9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14.5, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                      <p style={{ fontSize: 11.5, color: T.hint, marginTop: 2 }}>{cVendors(c.id).length} vendors · {cb.length} bills</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => onEdit(c)} style={{ width: 28, height: 28, borderRadius: 7, background: T.bg, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#e8e5e0"} onMouseLeave={e => e.currentTarget.style.background = T.bg}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={T.navy} strokeWidth="2" strokeLinecap="round" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={T.navy} strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                    <button onClick={() => onDelete(c)} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(227,74,47,0.06)", border: `1px solid rgba(227,74,47,0.16)`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(227,74,47,0.12)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(227,74,47,0.06)"}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke={T.coral} strokeWidth="2" strokeLinecap="round" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>

                {(c.gstin || c.address) && (
                  <div style={{ marginBottom: 12 }}>
                    {c.gstin && <p style={{ fontSize: 11.5, color: T.hint, marginBottom: 3 }}>GSTIN: <strong style={{ color: T.navy }}>{c.gstin}</strong></p>}
                    {c.address && <p style={{ fontSize: 11.5, color: T.hint }}>📍 {c.address}</p>}
                  </div>
                )}

                {/* Amounts grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 14 }}>
                  {[["Payable", fmtINR(net), null], ["Paid", fmtINR(paid), T.success], ["Due", fmtINR(due), due > 0 ? T.coral : T.success]].map(([l, v, col]) => (
                    <div key={l} style={{ background: T.bg, borderRadius: 8, padding: "8px 10px", textAlign: "center", border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: 9.5, color: T.hint, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.4px" }}>{l}</p>
                      <p style={{ fontSize: 11.5, fontWeight: 700, color: col || T.navy, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</p>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <p style={{ fontSize: 10.5, color: T.hint }}>{pct.toFixed(0)}% settled</p>
                    <p style={{ fontSize: 10.5, color: pct >= 100 ? T.success : T.hint }}>{pct >= 100 ? "✓ Fully paid" : `${(100 - pct).toFixed(0)}% remaining`}</p>
                  </div>
                  <ProgressBar pct={pct} color={pct >= 100 ? T.success : T.coral} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VENDORS TAB
═══════════════════════════════════════════════════════════════════════════ */
function VendorsTab({ vendors, companies, bills, onAdd, onEdit, onDelete, onAddBill, onEditBill, onDeleteBill, onPay }) {
  const [filterCo, setFilterCo] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const filtered = vendors.filter(v => !filterCo || v.companyId === filterCo).filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Vendors" action={<button style={btn("primary")} onClick={onAdd} disabled={companies.length === 0}>+ Add Vendor</button>} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input style={{ ...inp, flex: "1 1 200px", maxWidth: 280 }} placeholder="Search vendors…" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
        <select style={{ ...inp, width: "auto", minWidth: 160 }} value={filterCo} onChange={(e) => setFilterCo(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || filterCo) && filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: 12, color: T.hint, fontWeight: 600, background: "#fff", borderRadius: 8, border: `1px solid ${T.border}` }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {filtered.length === 0 && <Empty icon="👥" text={search ? "No vendors match your search." : "No vendors yet."} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((v, i) => {
          const comp = companies.find(c => c.id === v.companyId);
          const vBills = bills.filter(b => b.vendorId === v.id);
          const vNet = vBills.reduce((s, b) => s + Number(b.netAmount || 0), 0);
          const vPaid = vBills.reduce((s, b) => s + Number(b.amountPaid || 0), 0);
          const vDue = vNet - vPaid, pct = vNet > 0 ? (vPaid / vNet) * 100 : 0;
          const status = vDue <= 0 && vNet > 0 ? "paid" : vPaid > 0 ? "partial" : "unpaid";
          const sColor = { paid: T.success, partial: T.amber, unpaid: T.coral }[status];
          const sBadge = { paid: "green", partial: "amber", unpaid: "red" }[status];
          const isOpen = expanded[v.id];

          return (
            <div key={v.id} style={{ ...card, padding: 0, overflow: "hidden", borderLeft: `3px solid ${sColor}`, animation: `fadeUp 0.4s ease ${i * 45}ms both` }}>
              <div style={{ padding: "15px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
                      <p style={{ fontWeight: 700, fontSize: 14.5, color: T.navy }}>{v.name}</p>
                      {comp && <Badge color="navy">{comp.name}</Badge>}
                      <Badge color={sBadge}>{status === "paid" ? "Settled" : status === "partial" ? "Partial" : "Unpaid"}</Badge>
                    </div>
                    {v.description && <p style={{ fontSize: 12.5, color: T.hint, marginBottom: 10 }}>{v.description}</p>}
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 10 }}>
                      {[["Net", fmtINR(vNet), null], ["Paid", fmtINR(vPaid), T.success], ["Due", fmtINR(vDue), vDue > 0 ? T.coral : T.success], ["Bills", vBills.length, null]].map(([l, val, col]) => (
                        <div key={l}>
                          <p style={{ fontSize: 10, color: T.hint, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.4px" }}>{l}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: col || T.navy, marginTop: 2 }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    <ProgressBar pct={pct} color={sColor} />
                    <p style={{ fontSize: 10.5, color: T.hint, marginTop: 3 }}>{pct.toFixed(1)}% settled</p>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button style={btn("default", { fontSize: 11.5, padding: "6px 11px" })} onClick={() => toggle(v.id)}>{isOpen ? "▲ Hide" : "▼ Bills"}</button>
                    <button style={btn("primary", { fontSize: 11.5, padding: "6px 11px" })} onClick={() => onAddBill(v)}>+ Bill</button>
                    <button style={btn("outline", { fontSize: 11.5, padding: "6px 11px" })} onClick={() => onEdit(v)}>Edit</button>
                    <button style={btn("danger", { fontSize: 11.5, padding: "6px 10px" })} onClick={() => onDelete(v)}>Delete</button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${T.border}`, background: T.bg, padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>Bills ({vBills.length})</p>
                  {vBills.length === 0 ? (
                    <p style={{ color: T.hint, fontSize: 12.5 }}>No bills yet. Click "+ Bill" to add one.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {vBills.map((b) => {
                        const bDue = Number(b.netAmount || 0) - Number(b.amountPaid || 0);
                        const bPct = Number(b.netAmount) > 0 ? (Number(b.amountPaid) / Number(b.netAmount)) * 100 : 0;
                        const bStat = bDue <= 0 && Number(b.netAmount) > 0 ? "paid" : Number(b.amountPaid) > 0 ? "partial" : "unpaid";
                        const bCol = { paid: T.success, partial: T.amber, unpaid: T.coral }[bStat];
                        return (
                          <div key={b.id} style={{ background: "#fff", borderRadius: 9, border: `1px solid ${T.border}`, padding: "12px 14px", borderLeft: `3px solid ${bCol}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
                                  {b.invoiceNo && <span style={{ fontSize: 12.5, fontWeight: 700, color: T.navy, fontFamily: "'DM Mono', monospace" }}>#{b.invoiceNo}</span>}
                                  {b.invoiceDate && <span style={{ fontSize: 11.5, color: T.hint }}>{b.invoiceDate}</span>}
                                  <Badge color={bStat === "paid" ? "green" : bStat === "partial" ? "amber" : "red"}>{bStat === "paid" ? "Paid" : bStat === "partial" ? "Partial" : "Unpaid"}</Badge>
                                </div>
                                {b.description && <p style={{ fontSize: 12, color: T.hint, marginBottom: 8 }}>{b.description}</p>}
                                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
                                  {[["Sub Total", b.totalBill], ["CGST", b.cgst], ["SGST", b.sgst], ["TDS", b.tds], ["Net", b.netAmount, T.navy], ["Paid", b.amountPaid, T.success], ["Due", bDue, bDue > 0 ? T.coral : T.success]].map(([l, val, col]) => (
                                    <div key={l}>
                                      <p style={{ fontSize: 9.5, color: T.hint, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.3px" }}>{l}</p>
                                      <p style={{ fontSize: 12, fontWeight: 600, color: col || T.muted, marginTop: 2 }}>{fmtINR(val)}</p>
                                    </div>
                                  ))}
                                </div>
                                <ProgressBar pct={bPct} color={bCol} />
                              </div>
                              <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {bDue > 0 && <button style={btn("primary", { fontSize: 11, padding: "5px 10px" })} onClick={() => onPay(b, v)}>Pay</button>}
                                <button style={btn("outline", { fontSize: 11, padding: "5px 10px" })} onClick={() => onEditBill(b, v)}>Edit</button>
                                <button style={btn("danger", { fontSize: 11, padding: "5px 10px" })} onClick={() => onDeleteBill(b, v)}>Delete</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [companies, setCompanies] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [successPayment, setSuccessPayment] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!document.getElementById("razorpay-sdk")) {
      const sc = document.createElement("script");
      sc.id = "razorpay-sdk"; sc.src = "https://checkout.razorpay.com/v1/checkout.js"; sc.async = true;
      document.head.appendChild(sc);
    }
    const tabParam = searchParams.get("tab");
    if (tabParam && ["dashboard", "companies", "vendors", "payments"].includes(tabParam)) setTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    const session = loadSession();
    if (session) { setUser({ email: session.email, uid: session.uid }); setToken(session.token); }
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };
  const handleAuthError = useCallback(() => { clearSession(); setToken(null); setUser(null); setCompanies([]); setVendors([]); setBills([]); setPayments([]); setSessionExpired(true); }, []);

  const loadAll = useCallback(async (tok) => {
    setLoading(true);
    try {
      const [cD, vD, bD, pD, aD] = await Promise.all([fsList(tok, "companies"), fsList(tok, "vendors"), fsList(tok, "bills"), fsList(tok, "payments"), fsList(tok, "activity_log")]);
      setCompanies(cD.map(docToObj).filter(Boolean)); setVendors(vD.map(docToObj).filter(Boolean));
      setBills(bD.map(docToObj).filter(Boolean)); setPayments(pD.map(docToObj).filter(Boolean));
      setActivityLog(aD.map(docToObj).filter(Boolean));
    } catch (e) { if (e.message === "AUTH_EXPIRED") handleAuthError(); else showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, [handleAuthError]);

  useEffect(() => { if (token) loadAll(token); }, [token, loadAll]);

  function handleLogin(u) { saveSession(u); setUser({ email: u.email, uid: u.uid }); setToken(u.token); setSessionExpired(false); setTab("dashboard"); }
  function handleLogout() { clearSession(); setUser(null); setToken(null); setCompanies([]); setVendors([]); setBills([]); setPayments([]); setSessionExpired(false); navigate("/"); }

  async function saveCompany(form, existing) {
    setSaving(true);
    try {
      if (existing) { await fsSet(token, `companies/${existing.id}`, form); await logActivity(token, "company_added", `Company "${form.name}" updated`, { companyName: form.name }); }
      else { await fsCreate(token, "companies", { ...form, createdAt: new Date().toISOString() }); await logActivity(token, "company_added", `New company "${form.name}" added`, { companyName: form.name }); }
      showToast(existing ? "Company updated" : "Company added"); await loadAll(token); setModal(null);
    } catch (e) { e.message?.includes("401") ? handleAuthError() : showToast(e.message, "error"); }
    finally { setSaving(false); }
  }

  function triggerDeleteCompany(company) { setDeleteModal({ type: "company", item: company }); }
  function triggerDeleteVendor(vendor) { setDeleteModal({ type: "vendor", item: vendor }); }
  function triggerDeleteBill(bill, vendor) { setDeleteModal({ type: "bill", item: bill, vendor }); }

  async function confirmDeleteCompany(company) {
    setDeleting(true);
    try {
      const cvids = vendors.filter(v => v.companyId === company.id).map(v => v.id);
      const billsToDelete = bills.filter(b => cvids.includes(b.vendorId));
      await Promise.all(billsToDelete.map(b => fsDelete(token, `bills/${b.id}`)));
      const vendorsToDelete = vendors.filter(v => v.companyId === company.id);
      await Promise.all(vendorsToDelete.map(v => fsDelete(token, `vendors/${v.id}`)));
      await fsDelete(token, `companies/${company.id}`);
      await logActivity(token, "company_deleted", `Company "${company.name}" deleted (${vendorsToDelete.length} vendors, ${billsToDelete.length} bills)`, { companyName: company.name });
      await loadAll(token); showToast("Company and all related data deleted"); setDeleteModal(null);
    } catch (e) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(false); }
  }
  async function confirmDeleteVendor(vendor) {
    setDeleting(true);
    try {
      const vendorBills = bills.filter(b => b.vendorId === vendor.id);
      await Promise.all(vendorBills.map(b => fsDelete(token, `bills/${b.id}`)));
      await fsDelete(token, `vendors/${vendor.id}`);
      await logActivity(token, "vendor_deleted", `Vendor "${vendor.name}" deleted (${vendorBills.length} bills)`, { vendorName: vendor.name });
      await loadAll(token); showToast("Vendor and all bills deleted"); setDeleteModal(null);
    } catch (e) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(false); }
  }
  async function confirmDeleteBill(bill, vendor) {
    setDeleting(true);
    try {
      await fsDelete(token, `bills/${bill.id}`);
      await logActivity(token, "bill_deleted", `Bill #${bill.invoiceNo || bill.id} deleted for ${vendor?.name || bill.vendorName}`, { vendorName: vendor?.name || bill.vendorName, amount: bill.netAmount });
      await loadAll(token); showToast("Bill deleted"); setDeleteModal(null);
    } catch (e) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(false); }
  }
  function handleDeleteConfirm() {
    if (!deleteModal) return;
    const { type, item, vendor } = deleteModal;
    if (type === "company") confirmDeleteCompany(item);
    else if (type === "vendor") confirmDeleteVendor(item);
    else if (type === "bill") confirmDeleteBill(item, vendor);
  }

  async function saveVendor(form, existing) {
    setSaving(true);
    try {
      if (existing) { await fsSet(token, `vendors/${existing.id}`, form); await logActivity(token, "vendor_added", `Vendor "${form.name}" updated`, { vendorName: form.name }); }
      else { await fsCreate(token, "vendors", { ...form, createdAt: new Date().toISOString() }); const comp = companies.find(c => c.id === form.companyId); await logActivity(token, "vendor_added", `New vendor "${form.name}" added`, { vendorName: form.name, companyName: comp?.name || "" }); }
      showToast(existing ? "Vendor updated" : "Vendor added"); await loadAll(token); setModal(null);
    } catch (e) { e.message?.includes("401") ? handleAuthError() : showToast(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function saveBill(form, vendor, existing) {
    setSaving(true);
    try {
      const data = { ...form, vendorId: vendor.id, vendorName: vendor.name, companyId: vendor.companyId, amountPaid: existing?.amountPaid ?? 0, createdAt: existing?.createdAt || new Date().toISOString() };
      if (existing) { await fsSet(token, `bills/${existing.id}`, data); await logActivity(token, "bill_added", `Bill #${form.invoiceNo || existing.id} updated for ${vendor.name}`, { vendorName: vendor.name, amount: form.netAmount }); }
      else { await fsCreate(token, "bills", data); const comp = companies.find(c => c.id === vendor.companyId); await logActivity(token, "bill_added", `New bill #${form.invoiceNo || "—"} added for ${vendor.name}`, { vendorName: vendor.name, companyName: comp?.name || "", amount: form.netAmount }); }
      showToast(existing ? "Bill updated" : "Bill added"); await loadAll(token); setModal(null);
    } catch (e) { e.message?.includes("401") ? handleAuthError() : showToast(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function recordPayment(bill, vendor, form, useRazorpay) {
    const amount = Number(form.amountPaid || 0), due = Number(bill.netAmount || 0) - Number(bill.amountPaid || 0);
    if (!amount || amount <= 0) { showToast("Enter a valid amount", "error"); return; }
    if (amount > due + 0.01) { showToast("Amount exceeds outstanding balance", "error"); return; }
    if (useRazorpay) {
      setSaving(true);
      openRazorpayCheckout({
        amount, vendorName: vendor.name, description: form.particulars || bill.description,
        onSuccess: async (paymentId) => { try { await commitPayment(bill, vendor, { ...form, chequeNo: paymentId }, amount, paymentId); } catch (e) { showToast(e.message, "error"); } finally { setSaving(false); } },
        onFailure: (msg) => { showToast(`Razorpay: ${msg}`, "error"); setSaving(false); },
      });
    } else { setSaving(true); try { await commitPayment(bill, vendor, form, amount, null); } catch (e) { showToast(e.message, "error"); } finally { setSaving(false); } }
  }

  async function commitPayment(bill, vendor, form, amount, razorpayId) {
    const newPaid = Number(bill.amountPaid || 0) + amount;
    const comp = companies.find(c => c.id === vendor.companyId);
    await fsCreate(token, "payments", { billId: bill.id, vendorId: vendor.id, vendorName: vendor.name, companyId: vendor.companyId, date: form.date, particulars: form.particulars || "", chequeNo: form.chequeNo || razorpayId || "", amountPaid: amount, paymentMode: form.paymentMode, razorpayId: razorpayId || "", createdAt: new Date().toISOString() });
    await fsSet(token, `bills/${bill.id}`, { ...bill, amountPaid: newPaid });
    await logActivity(token, "payment_made", `Payment of ${fmtINR(amount)} to ${vendor.name} via ${form.paymentMode}`, { vendorName: vendor.name, companyName: comp?.name || "", amount });
    await loadAll(token); setModal(null); setSuccessPayment({ amount, vendor: vendor.name, paymentId: razorpayId });
  }

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {sessionExpired && <SessionExpiredBanner onLogin={() => setSessionExpired(false)} />}
      <Navbar user={user} tab={tab} setTab={setTab} onLogout={handleLogout} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 60px" }}>
        {loading ? <Spinner /> : (
          <>
            {tab === "dashboard" && <DashboardTab companies={companies} vendors={vendors} bills={bills} payments={payments} activityLog={activityLog} setTab={setTab} loading={loading} />}
            {tab === "companies" && <CompaniesTab companies={companies} vendors={vendors} bills={bills} onAdd={() => setModal({ type: "addCompany" })} onEdit={(c) => setModal({ type: "editCompany", data: c })} onDelete={triggerDeleteCompany} />}
            {tab === "vendors" && <VendorsTab vendors={vendors} companies={companies} bills={bills} onAdd={() => setModal({ type: "addVendor" })} onEdit={(v) => setModal({ type: "editVendor", data: v })} onDelete={triggerDeleteVendor} onAddBill={(v) => setModal({ type: "addBill", vendor: v })} onEditBill={(b, v) => setModal({ type: "editBill", data: b, vendor: v })} onDeleteBill={triggerDeleteBill} onPay={(b, v) => setModal({ type: "payment", bill: b, vendor: v })} />}
            {tab === "payments" && <PaymentsTab payments={payments} companies={companies} />}
          </>
        )}
      </main>

      {/* Delete modal */}
      {deleteModal && (
        <DeleteConfirmModal
          type={deleteModal.type}
          name={deleteModal.type === "bill" ? (deleteModal.item.description || deleteModal.item.vendorName || "Bill") : deleteModal.item.name}
          invoiceNo={deleteModal.type === "bill" ? (deleteModal.item.invoiceNo || deleteModal.item.id) : undefined}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}

      {/* Modals */}
      {modal?.type === "addCompany" && <Modal title="Add Company" onClose={() => setModal(null)} width={580}><CompanyFormWrapped onSave={(f) => saveCompany(f, null)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "editCompany" && <Modal title="Edit Company" subtitle={modal.data.name} onClose={() => setModal(null)} width={580}><CompanyFormWrapped initial={modal.data} onSave={(f) => saveCompany(f, modal.data)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "addVendor" && <Modal title="Add Vendor" onClose={() => setModal(null)} width={540}><VendorFormWrapped companies={companies} onSave={(f) => saveVendor(f, null)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "editVendor" && <Modal title="Edit Vendor" subtitle={modal.data.name} onClose={() => setModal(null)} width={540}><VendorFormWrapped initial={modal.data} companies={companies} onSave={(f) => saveVendor(f, modal.data)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "addBill" && <Modal title="Add Bill" subtitle={`for ${modal.vendor.name}`} onClose={() => setModal(null)} width={600}><BillFormWrapped vendor={modal.vendor} companies={companies} onSave={(f) => saveBill(f, modal.vendor, null)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "editBill" && <Modal title="Edit Bill" subtitle={`${modal.vendor.name} · #${modal.data.invoiceNo || "—"}`} onClose={() => setModal(null)} width={600}><BillFormWrapped initial={modal.data} vendor={modal.vendor} companies={companies} onSave={(f) => saveBill(f, modal.vendor, modal.data)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "payment" && <Modal title="Record Payment" subtitle={`${modal.vendor.name} · Invoice #${modal.bill.invoiceNo || "—"}`} onClose={() => setModal(null)} width={500}><PaymentFormWrapped bill={modal.bill} vendor={modal.vendor} onSave={(f, useRzp) => recordPayment(modal.bill, modal.vendor, f, useRzp)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {successPayment && <PaymentSuccess amount={successPayment.amount} vendor={successPayment.vendor} paymentId={successPayment.paymentId} onClose={() => setSuccessPayment(null)} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? T.coral : T.success, color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, zIndex: 3000, display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 16px rgba(0,0,0,0.18)`, animation: "toastIn 0.25s ease both", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>{toast.msg}
        </div>
      )}
    </div>
  );
}