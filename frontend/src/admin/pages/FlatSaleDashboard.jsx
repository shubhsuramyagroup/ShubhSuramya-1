import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../public/logo.png";
import logo1 from "../../../public/logo1.png";
import header from "../../../public/header.png";

/* ─── Firebase Config ─────────────────────────────────────────────────────── */
const FB = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* ─── Firestore REST helpers ─────────────────────────────────────────────── */
const FS = () =>
  `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;

async function fsList(token, col) {
  const r = await fetch(`${FS()}/${col}?pageSize=300`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    if (r.status === 401) throw new Error("AUTH_EXPIRED");
    return [];
  }
  const d = await r.json();
  return d.documents || [];
}
async function fsSet(token, path, data) {
  const r = await fetch(`${FS()}/${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: objToFields(data) }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function fsCreate(token, col, data) {
  const r = await fetch(`${FS()}/${col}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: objToFields(data) }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function fsDelete(token, path) {
  await fetch(`${FS()}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
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
  for (const [k, v] of Object.entries(doc.fields))
    obj[k] = v.stringValue ?? v.doubleValue ?? v.booleanValue ?? "";
  return obj;
}

/* ─── Auth Session ───────────────────────────────────────────────────────── */
const AUTH_KEY = "shubh_admin_session";
function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.token) return null;
    if (p.expiresAt && Date.now() > p.expiresAt - 60_000) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return p;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}
function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

/* ─── Activity Log ───────────────────────────────────────────────────────── */
async function logActivity(token, type, description, details = {}) {
  try {
    await fsCreate(token, "activity_log", {
      type,
      description,
      companyName: details.companyName || "",
      vendorName: details.vendorName || "",
      amount: details.amount || 0,
      createdAt: new Date().toISOString(),
    });
  } catch {}
}

/* ─── Payment ID helpers ─────────────────────────────────────────────────── */
function getNextPaymentId(allPayments) {
  const ids = allPayments
    .map((p) => Number(p.paymentId))
    .filter((n) => !isNaN(n) && n > 0);
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

function buildReceiptNumber(saleReceiptNo, paymentId) {
  return `${saleReceiptNo}-P${String(paymentId).padStart(2, "0")}`;
}

/* ─── Design Tokens ──────────────────────────────────────────────────────── */
const T = {
  navy: "#1E2A5A",
  coral: "#E34A2F",
  cream: "#FDFAF6",
  cream2: "#F5F0E8",
  gold: "#f5a623",
  white: "#ffffff",
  muted: "#6B7194",
  hint: "#9CA3B8",
  border: "rgba(30,42,90,0.08)",
  border2: "rgba(30,42,90,0.14)",
  success: "#1D9E75",
  danger: "#E34A2F",
  amber: "#EF9F27",
  blue: "#378ADD",
  purple: "#8B5CF6",
  teal: "#0D9488",
  bg: "#F7F5F2",
};

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
  @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
  @media (max-width: 768px) { .desktop-nav { display: none !important; } .hamburger { display: flex !important; } }
  @media (max-width: 540px) { .user-pill { display: none !important; } }
  @media (max-width: 700px) { .flat-table { display: none !important; } .flat-mobile { display: flex !important; } }
`;

/* ─── Style helpers ──────────────────────────────────────────────────────── */
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
const card = {
  background: "#fff",
  borderRadius: 12,
  border: `1px solid ${T.border}`,
  boxShadow: "0 1px 4px rgba(30,42,90,0.05)",
};

function btn(variant = "default", extra = {}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    transition: "all 0.18s",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.1px",
    whiteSpace: "nowrap",
  };
  const variants = {
    primary: { background: T.coral, color: "#fff", boxShadow: "0 2px 8px rgba(227,74,47,0.25)" },
    navy: { background: T.navy, color: "#fff", boxShadow: "0 2px 8px rgba(30,42,90,0.22)" },
    success: { background: T.success, color: "#fff", boxShadow: "0 2px 8px rgba(29,158,117,0.22)" },
    danger: { background: "#fff", color: T.coral, border: `1.5px solid rgba(227,74,47,0.30)` },
    outline: { background: "#fff", color: T.navy, border: `1.5px solid ${T.border2}` },
    ghost: { background: "transparent", color: T.muted, border: "none", boxShadow: "none" },
    default: { background: "#fff", color: T.navy, border: `1.5px solid ${T.border2}` },
    teal: { background: T.teal, color: "#fff", boxShadow: "0 2px 8px rgba(13,148,136,0.22)" },
    amber: { background: T.amber, color: "#fff", boxShadow: "0 2px 8px rgba(239,159,39,0.22)" },
    blue: { background: T.blue, color: "#fff", boxShadow: "0 2px 8px rgba(55,138,221,0.22)" },
  };
  return { ...base, ...(variants[variant] || variants.default), ...extra };
}

/* ─── Utility ────────────────────────────────────────────────────────────── */
const fmtINR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const today = () => new Date().toISOString().slice(0, 10);

function generateReceiptNo(existingSales) {
  const year = new Date().getFullYear();
  const prefix = `SSG-${year}-`;
  const nums = existingSales
    .map((s) => s.receiptNo)
    .filter((r) => r && r.startsWith(prefix))
    .map((r) => parseInt(r.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/* ─── Small UI Components ────────────────────────────────────────────────── */
function Badge({ children, color = "navy" }) {
  const map = {
    navy: { bg: "rgba(30,42,90,0.07)", text: T.navy },
    coral: { bg: "rgba(227,74,47,0.08)", text: T.coral },
    green: { bg: "rgba(29,158,117,0.08)", text: T.success },
    red: { bg: "rgba(227,74,47,0.08)", text: T.coral },
    amber: { bg: "rgba(239,159,39,0.10)", text: "#9a620a" },
    blue: { bg: "rgba(55,138,221,0.08)", text: T.blue },
    purple: { bg: "rgba(139,92,246,0.08)", text: T.purple },
    teal: { bg: "rgba(13,148,136,0.08)", text: T.teal },
  };
  const t = map[color] || map.navy;
  return (
    <span
      style={{
        background: t.bg,
        color: t.text,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 6,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {children}
    </span>
  );
}

function ProgressBar({ pct, color }) {
  const c = color || (pct >= 100 ? T.success : T.coral);
  return (
    <div style={{ height: 3, background: "rgba(30,42,90,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, pct || 0)}%`,
          background: c,
          borderRadius: 99,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: 14 }}>
      <div style={{ width: 32, height: 32, border: `2.5px solid rgba(30,42,90,0.08)`, borderTopColor: T.coral, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ color: T.hint, fontSize: 13 }}>Loading…</p>
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
      <p style={{ color: T.hint, fontSize: 13 }}>{text}</p>
    </div>
  );
}

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

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {label && (
        <span style={{ fontSize: 11, color: T.hint, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

function StatCard({ label, value, icon, accent, delay = 0, sub }) {
  return (
    <div style={{ ...card, padding: "16px 18px", animation: `fadeUp 0.4s ease ${delay}ms both`, borderTop: `2.5px solid ${accent || T.border2}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <p style={{ fontSize: 11, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: 20, fontWeight: 700, color: accent || T.navy }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: T.hint, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children, width = 540 }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(10,14,30,0.45)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "92vh",
          display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(10,14,30,0.18)",
          border: `1px solid ${T.border}`, animation: "modalIn 0.25s cubic-bezier(.22,1,.36,1) both", overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12, color: T.hint, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(30,42,90,0.05)", border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(227,74,47,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(30,42,90,0.05)")}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke={T.navy} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "20px 22px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ───────────────────────────────────────────────── */
function DeleteConfirmModal({ name, receiptNo, onConfirm, onCancel, loading }) {
  const [input, setInput] = useState("");
  const matchValue = receiptNo || name;
  const matches = input === matchValue;
  const [mismatch, setMismatch] = useState(false);

  function handleDelete() {
    if (!matches) {
      setMismatch(true);
      setTimeout(() => setMismatch(false), 2500);
      return;
    }
    onConfirm();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(10,14,30,0.20)", border: `1px solid ${T.border}`, animation: "modalIn 0.25s cubic-bezier(.22,1,.36,1) both", overflow: "hidden" }}>
        <div style={{ height: 3, background: T.coral }} />
        <div style={{ padding: "22px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(227,74,47,0.07)", border: `1px solid rgba(227,74,47,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke={T.coral} strokeWidth="2" strokeLinecap="round" />
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>Delete Sale Record</h3>
              <p style={{ fontSize: 12.5, color: T.hint, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                This flat sale record and all associated payments will be permanently deleted.
              </p>
            </div>
          </div>
          <div style={{ background: "rgba(227,74,47,0.04)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, border: `1px solid rgba(227,74,47,0.12)` }}>
            <p style={{ fontSize: 11, color: T.hint }}>Receipt No.</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: T.coral, fontFamily: "'DM Mono', monospace" }}>{matchValue}</p>
          </div>
          <Field label={`Type "${matchValue}" to confirm deletion`}>
            <input
              style={{ ...inp, borderColor: mismatch ? T.coral : T.border2, boxShadow: mismatch ? `0 0 0 3px rgba(227,74,47,0.10)` : "none" }}
              value={input}
              onChange={(e) => { setInput(e.target.value); setMismatch(false); }}
              placeholder="Type to confirm…"
              onFocus={focusOn}
              onBlur={focusOff}
              onKeyDown={(e) => e.key === "Enter" && handleDelete()}
              autoFocus
            />
          </Field>
          {mismatch && <p style={{ fontSize: 12, color: T.coral, marginTop: 8 }}>Text doesn't match. Try again.</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
            <button style={btn("default")} onClick={onCancel} disabled={loading}>Cancel</button>
            <button style={btn("primary", { opacity: matches ? 1 : 0.4 })} onClick={handleDelete} disabled={loading || !matches}>
              {loading ? "Deleting…" : "Delete Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Session Expired Banner ─────────────────────────────────────────────── */
function SessionExpiredBanner({ onRelogin }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.60)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 360, width: "100%", padding: "2rem", textAlign: "center", boxShadow: "0 20px 60px rgba(10,14,30,0.22)", border: `1px solid ${T.border}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: T.coral }} />
        <div style={{ fontSize: 36, marginBottom: 14 }}>⏱</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Session Expired</h2>
        <p style={{ color: T.hint, fontSize: 13.5, lineHeight: 1.6, marginBottom: 22 }}>Please sign in again to continue.</p>
        <button style={{ ...btn("primary"), width: "100%", justifyContent: "center", padding: "11px 20px" }} onClick={onRelogin}>
          Go to Login
        </button>
      </div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar({ user, onLogout, onBackToDashboard }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 500 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <img src={logo} alt="logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <img src={logo1} alt="logo text" style={{ height: 40, width: 60, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="user-pill" style={{ display: "flex", alignItems: "center", gap: 7, background: T.bg, borderRadius: 8, padding: "5px 10px 5px 7px", border: `1px solid ${T.border}` }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontSize: 12, color: T.muted, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(227,74,47,0.06)", border: `1px solid rgba(227,74,47,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(227,74,47,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(227,74,47,0.06)")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="hamburger"
              style={{ width: 32, height: 32, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={T.navy} strokeWidth="2" width="14" height="14">
                {mobileOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
                )}
              </svg>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ padding: "8px 12px", fontSize: 13, color: T.teal, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              🏠 Flat Sales & Customer Receipts
            </div>
            <button
              onClick={() => { onBackToDashboard(); setMobileOpen(false); }}
              style={{ background: "transparent", border: "none", borderRadius: 8, padding: "10px 12px", color: T.muted, fontWeight: 500, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 9, width: "100%", fontFamily: "'DM Sans', sans-serif" }}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── PDF Receipt Generator (Payment receipt — UNCHANGED) ───────────────────── */
async function generateSaleReceiptPDF(sale, payment) {
  if (!payment) { alert("Payment not found."); return; }

  const receiptNo =
    payment.receiptNumber ||
    (payment.paymentId
      ? buildReceiptNumber(sale.receiptNo, payment.paymentId)
      : `${sale.receiptNo}-P??`);

  // Build full customer name (first + second)
  const fullCustomerName = [sale.customerName, sale.customerSecondName].filter(Boolean).join(" & ");

  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, H = 297, HEADER_H = 58;
  doc.addImage(header, "PNG", 0, 0, W, HEADER_H);
  doc.setTextColor(18, 30, 90);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Receipt", W / 2, HEADER_H + 16, { align: "center" });
  doc.setDrawColor(18, 30, 90);
  doc.setLineWidth(0.4);
  doc.line(72, HEADER_H + 18.5, W - 72, HEADER_H + 18.5);
  let y = HEADER_H + 30;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text("Shubh Suramaya Group", 14, y);
  y += 7;
  const formattedDate = payment.paymentDate
    ? new Date(payment.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : sale.bookingDate
    ? new Date(sale.bookingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Date:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text(formattedDate, 25, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Receipt No.:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text(receiptNo, 36, y);
  y += 14;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    tableWidth: W - 28,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10, cellPadding: 5, lineColor: [210, 215, 230], lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 115, 150], cellWidth: 68, fillColor: [245, 247, 252] },
      1: { fontStyle: "normal", textColor: [18, 30, 90], fillColor: [255, 255, 255] },
    },
    body: [
      ["Received From:", fullCustomerName || "—"],
      ...(sale.customerSecondName ? [["2nd Applicant:", sale.customerSecondName]] : []),
      ["Customer Email:", sale.email || "—"],
      ["Customer Phone:", sale.mobile || "—"],
      ["Aadhaar Number:", sale.aadhaar || "—"],
      ["Amount Paid:", fmtINR(payment.amount || 0)],
      ["Total (incl. GST):", fmtINR((payment.amount || 0) + (payment.gstAmount || 0))],
      ["Payment Method:", payment.paymentMode || "—"],
      ["Shop/Flat:", `Flat ${sale.flatNo || "—"}, ${sale.wing || ""} Wing, Floor ${sale.floorNo || "—"}, ${sale.buildingName || ""} — ${sale.projectName || ""}`],
    ],
  });
  y = doc.lastAutoTable.finalY + 16;
  if (payment.transactionId || payment.bankName || payment.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 130, 155);
    if (payment.transactionId) { doc.text(`Transaction ID: ${payment.transactionId}`, 14, y); y += 5; }
    if (payment.bankName) { doc.text(`Bank: ${payment.bankName}`, 14, y); y += 5; }
    if (payment.notes) { doc.text(`Notes: ${payment.notes}`, 14, y); y += 5; }
    y += 6;
  }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text("Authorized By: Shubh Suramya Group", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Signature:", 14, y);
  doc.setDrawColor(18, 30, 90);
  doc.setLineWidth(0.4);
  doc.line(36, y, 95, y);
  y += 12;
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 100, 140);
  doc.text("Thank you for your payment!", 14, y);
  const footerY = H - 22;
  doc.setFillColor(22, 34, 94);
  doc.rect(0, footerY, W, 22, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 240);
  doc.text("Shubh Suramya Group  |  Shubh Suramya Corporate House opp suramaya dreams, Suramya Road, Near Eklingji Road, Sanand-382110", W / 2, footerY + 8, { align: "center" });
  doc.text("www.shubhsuramya.com  |  shubhsuramayagroup@gmail.com  |  +91 96872 58222", W / 2, footerY + 14, { align: "center" });
  doc.setTextColor(150, 165, 200);
  doc.setFontSize(8);
  doc.text("01", W - 14, footerY + 15, { align: "right" });
  doc.save(`Receipt_${receiptNo}.pdf`);
}

/* ─── Customer Sale (Booking) Receipt PDF ────────────────────────────────── */
async function generateCustomerSaleReceiptPDF(sale, company, payments) {
  if (!sale) { alert("Sale record not found."); return; }

  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, H = 297, HEADER_H = 58;
  const M = 14;
  const contentW = W - M * 2;
  const FOOTER_RESERVE = 28;

  const navy = [18, 30, 90];
  const gray = [60, 60, 60];
  const labelGray = [100, 115, 150];
  const lineGray = [210, 215, 230];

  const companyName = company?.name || company?.companyName || "Shubh Suramya Group";
  const companyAddress =
    company?.address ||
    company?.companyAddress ||
    "Shubh Suramya Corporate House opp suramaya dreams, Suramya Road, Near Eklingji Road, Sanand-382110";
  const companyPhone = company?.phone || company?.contactNumber || company?.mobile || "+91 96872 58222";
  const companyEmail = company?.email || company?.companyEmail || "shubhsuramayagroup@gmail.com";
  const companyWebsite = company?.website || company?.companyWebsite || "www.shubhsuramya.com";

  // Build full name string for display
  const fullCustomerName = [sale.customerName, sale.customerSecondName].filter(Boolean).join(" & ");

  const ensureSpace = (needed, top = 22) => {
    if (y + needed > H - FOOTER_RESERVE) {
      doc.addPage();
      y = top;
    }
  };

  /* Header band */
  doc.addImage(header, "PNG", 0, 0, W, HEADER_H);

  const projectTitle = (sale.projectName || sale.buildingName || companyName || "SALE RECEIPT").toString().toUpperCase();
  doc.setTextColor(...navy);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(projectTitle, W / 2, HEADER_H + 16, { align: "center" });

  doc.setDrawColor(...navy);
  doc.setLineWidth(0.4);
  doc.line(40, HEADER_H + 18.5, W - 40, HEADER_H + 18.5);

  let y = HEADER_H + 30;

  /* Meta */
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("Generated Date:", M, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), 46, y);
  y += 6.5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("Receipt No.:", M, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text(String(sale.receiptNo || "—"), 38, y);

  if (sale.bookingDate) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text("Booking Date:", 118, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text(new Date(sale.bookingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), 144, y);
  }
  y += 12;

  /* Block / Shop No. + PAN Card boxes */
  const boxH = 17;
  const gap = 6;
  const boxW = (contentW - gap) / 2;

  doc.setLineWidth(0.35);
  doc.setDrawColor(...navy);
  doc.rect(M, y, boxW, boxH);
  doc.rect(M + boxW + gap, y, boxW, boxH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...labelGray);
  doc.text("BLOCK OR SHOP NO", M + 4, y + 6);
  doc.text("PAN CARD", M + boxW + gap + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text(String(sale.flatNo || "—"), M + 4, y + 13);
  doc.text(String(sale.pan || "—"), M + boxW + gap + 4, y + 13);

  y += boxH + 9;

  /* ── CHANGED: 1st Name + 2nd Name on the same row ───────────────────── */
  const nameRowY = y;
  // Left half — 1ST NAME
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...labelGray);
  doc.text("1ST NAME:", M, nameRowY);
  doc.setTextColor(...navy);
  doc.text(sale.customerName || "—", M + 27, nameRowY);

  // Right half — 2ND NAME (only if present)
  if (sale.customerSecondName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...labelGray);
    doc.text("2ND NAME:", M + boxW + gap, nameRowY);
    doc.setTextColor(...navy);
    doc.text(sale.customerSecondName, M + boxW + gap + 27, nameRowY);
  }
  y += 8.5;

  /* ── CHANGED: Aadhaar number row ─────────────────────────────────────── */
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...labelGray);
  doc.text("AADHAAR:", M, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...navy);
  doc.text(sale.aadhaar || "—", M + 27, y);
  y += 8.5;

  /* Address */
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...labelGray);
  doc.text("ADDRESS:", M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...navy);
  const addrLines = doc.splitTextToSize(sale.address || "—", contentW);
  doc.text(addrLines, M, y);
  y += addrLines.length * 5.5 + 6;

  /* Sales Deed Value box */
  const totalPayments = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  doc.setLineWidth(0.35);
  doc.setDrawColor(...navy);
  doc.rect(M, y, 95, 13);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...labelGray);
  doc.text("SALES DEED VALUE", M + 4, y + 5.5);
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text(fmtINR(totalPayments), M + 4, y + 11);
  y += 13 + 10;

  /* Payment Table */
  const paymentRows =
    payments && payments.length > 0
      ? payments.map((p) => [
          p.paymentDate
            ? new Date(p.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "—",
          fmtINR(p.amount || 0),
          p.paymentMode || "—",
          p.transactionId || "—",
          p.bankName || "—",
        ])
      : [["—", "—", "—", "—", "—"]];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: FOOTER_RESERVE },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4, lineColor: lineGray, lineWidth: 0.3, textColor: navy, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center" },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { halign: "right", cellWidth: 34 },
      2: { cellWidth: 26 },
      3: { cellWidth: 46 },
      4: { cellWidth: "auto" },
    },
    head: [["Payment Date", "Amount (Rs.)", "Payment Mode", "Transaction ID / Cheque No.", "Bank Name"]],
    body: paymentRows,
  });
  y = doc.lastAutoTable.finalY + 10;

  /* Area Details Table */
  ensureSpace(34, 20);
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: FOOTER_RESERVE },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 5.5, lineColor: lineGray, lineWidth: 0.3, halign: "center", textColor: navy, minCellHeight: 12 },
    headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9.5, halign: "center" },
    head: [["CARPET", "VARANDAH + BALCONY", "OPEN MARGIN (PLOT)"]],
    body: [[
      sale.carpetArea || "",
      sale.verandahBalconyArea || "",
      sale.openMarginArea || "",
    ]],
  });
  y = doc.lastAutoTable.finalY + 10;

  /* Direction Table */
  ensureSpace(46, 20);
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: FOOTER_RESERVE },
    theme: "grid",
    tableWidth: 100,
    styles: { fontSize: 9.5, cellPadding: 4, lineColor: lineGray, lineWidth: 0.3, textColor: navy, minCellHeight: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38, fillColor: [245, 247, 252] },
      1: { cellWidth: 62 },
    },
    body: [
      ["EAST", ""],
      ["WEST", ""],
      ["NORTH", ""],
      ["SOUTH", ""],
    ],
  });
  y = doc.lastAutoTable.finalY + 14;

  /* Authorized By / Signature */
  ensureSpace(34, 24);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text(`Authorized By: ${companyName}`, M, y);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("Signature:", M, y);
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.4);
  doc.line(M + 22, y, M + 81, y);
  y += 12;

  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 100, 140);
  doc.text("Thank you for your payment!", M, y);

  /* Navy footer bar on EVERY page */
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = H - 22;
    doc.setFillColor(22, 34, 94);
    doc.rect(0, footerY, W, 22, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 210, 240);
    doc.text(`${companyName}  |  ${companyAddress}`, W / 2, footerY + 8, { align: "center" });
    doc.text(`${companyWebsite}  |  ${companyEmail}  |  ${companyPhone}`, W / 2, footerY + 14, { align: "center" });
    doc.setTextColor(150, 165, 200);
    doc.setFontSize(8);
    doc.text(String(i).padStart(2, "0"), W - 14, footerY + 15, { align: "right" });
  }

  const safeReceiptNo = (sale.receiptNo || "Sale").toString().replace(/[^a-z0-9-]+/gi, "_");
  doc.save(`Sale_Receipt_${safeReceiptNo}.pdf`);
}

/* ─── Excel Export ───────────────────────────────────────────────────────── */
const exportFlatSalesExcel = (sales) => {
  const excelData = sales.map((s) => ({
    "Receipt No": s.receiptNo || "",
    "Customer Name": s.customerName || "",
    "Customer Second Name": s.customerSecondName || "",
    Mobile: s.mobile || "",
    Email: s.email || "",
    PAN: s.pan || "",
    Aadhaar: s.aadhaar || "",
    Project: s.projectName || "",
    Building: s.buildingName || "",
    Wing: s.wing || "",
    Floor: s.floorNo || "",
    "Flat No": s.flatNo || "",
    "Flat Type": s.flatType || "",
    "Carpet Area": s.carpetArea || "",
    "Verandah + Balcony": s.verandahBalconyArea || "",
    "Open Margin (Plot)": s.openMarginArea || "",
    "Booking Date": s.bookingDate || "",
    "Agreement Date": s.agreementDate || "",
    "Possession Date": s.possessionDate || "",
    "Sales Executive": s.salesExecutive || "",
    "Paid Amount": Number(s.paidAmount || 0),
    Status: s.status || "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Flat Sales");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "Flat_Sales_Report.xlsx"
  );
};

/* ─── Flat Sale Form ─────────────────────────────────────────────────────── */
function FlatSaleForm({ initial, existingSales, onSave, onClose, saving }) {
  const blankForm = {
    receiptNo: generateReceiptNo(existingSales),
    customerName: "",
    customerSecondName: "",   // ← NEW
    mobile: "",
    email: "",
    address: "",
    pan: "",
    aadhaar: "",
    projectName: "",
    buildingName: "",
    wing: "",
    floorNo: "",
    flatNo: "",
    flatType: "",
    carpetArea: "",
    builtUpArea: "",
    verandahBalconyArea: "",
    openMarginArea: "",
    bookingDate: today(),
    agreementDate: "",
    possessionDate: "",
    salesExecutive: "",
    flatPrice: "",
    gstAmount: "",
    registrationAmount: "",
    stampDuty: "",
    otherCharges: "",
    totalAmount: 0,
    bookingAmount: "",
    paidAmount: "",
    remainingAmount: 0,
    paymentMode: "Cheque",
    transactionId: "",
    bankName: "",
    status: "Booked",
    notes: "",
  };

  const [f, setF] = useState(initial ? { ...blankForm, ...initial } : blankForm);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const total =
      Number(f.flatPrice || 0) +
      Number(f.gstAmount || 0) +
      Number(f.registrationAmount || 0) +
      Number(f.stampDuty || 0) +
      Number(f.otherCharges || 0);
    const remaining = total - Number(f.paidAmount || 0);
    setF((p) => ({ ...p, totalAmount: total, remainingAmount: remaining }));
  }, [f.flatPrice, f.gstAmount, f.registrationAmount, f.stampDuty, f.otherCharges, f.paidAmount]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: T.bg, borderRadius: 9, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 12, color: T.hint, fontWeight: 600 }}>Receipt Number</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.coral, fontFamily: "'DM Mono', monospace" }}>{f.receiptNo}</span>
      </div>

      <Divider label="Customer Information" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {/* ── CHANGED: 1st Name ── */}
        <Field label="Customer 1st Name">
          <input style={inp} value={f.customerName} onChange={set("customerName")} onFocus={focusOn} onBlur={focusOff} placeholder="Full first name" />
        </Field>
        {/* ── NEW: 2nd Name ── */}
        <Field label="Customer 2nd Name">
          <input style={inp} value={f.customerSecondName} onChange={set("customerSecondName")} onFocus={focusOn} onBlur={focusOff} placeholder="Second applicant name" />
        </Field>
        <Field label="Mobile Number">
          <input style={inp} type="tel" value={f.mobile} onChange={set("mobile")} onFocus={focusOn} onBlur={focusOff} placeholder="10-digit number" />
        </Field>
        <Field label="Email">
          <input style={inp} type="email" value={f.email} onChange={set("email")} onFocus={focusOn} onBlur={focusOff} placeholder="email@example.com" />
        </Field>
        <Field label="PAN Number">
          <input style={inp} value={f.pan} onChange={set("pan")} onFocus={focusOn} onBlur={focusOff} placeholder="ABCDE1234F" />
        </Field>
        <Field label="Aadhaar Number">
          <input style={inp} value={f.aadhaar} onChange={set("aadhaar")} onFocus={focusOn} onBlur={focusOff} placeholder="XXXX XXXX XXXX" />
        </Field>
      </div>
      <Field label="Address">
        <input style={inp} value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} placeholder="Full address" />
      </Field>

      <Divider label="Property Information" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <Field label="Project Name">
          <input style={inp} value={f.projectName} onChange={set("projectName")} onFocus={focusOn} onBlur={focusOff} placeholder="e.g. Shubh Suramya" />
        </Field>
        <Field label="Wing">
          <input style={inp} value={f.wing} onChange={set("wing")} onFocus={focusOn} onBlur={focusOff} placeholder="A / B / C" />
        </Field>
        <Field label="Floor Number">
          <input style={inp} value={f.floorNo} onChange={set("floorNo")} onFocus={focusOn} onBlur={focusOff} placeholder="e.g. 3" />
        </Field>
        <Field label="Flat Number">
          <input style={inp} value={f.flatNo} onChange={set("flatNo")} onFocus={focusOn} onBlur={focusOff} placeholder="e.g. 301" />
        </Field>
        <Field label="Flat Type">
          <input style={inp} value={f.flatType} onChange={set("flatType")} onFocus={focusOn} onBlur={focusOff} placeholder="2BHK / 3BHK" />
        </Field>
        <Field label="Carpet Area (sq.ft)">
          <input style={inp} type="number" value={f.carpetArea} onChange={set("carpetArea")} onFocus={focusOn} onBlur={focusOff} placeholder="0" />
        </Field>
        <Field label="Built-up Area (sq.ft)">
          <input style={inp} type="number" value={f.builtUpArea} onChange={set("builtUpArea")} onFocus={focusOn} onBlur={focusOff} placeholder="0" />
        </Field>
      </div>

      {/* Area Details (For Receipt) */}
      <Divider label="Area Details (For Receipt)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <Field label="Carpet">
          <input style={inp} type="number" value={f.carpetArea} onChange={set("carpetArea")} onFocus={focusOn} onBlur={focusOff} placeholder="0" />
        </Field>
        <Field label="Verandah + Balcony">
          <input style={inp} type="number" value={f.verandahBalconyArea} onChange={set("verandahBalconyArea")} onFocus={focusOn} onBlur={focusOff} placeholder="0" />
        </Field>
        <Field label="Open Margin (Plot)">
          <input style={inp} type="number" value={f.openMarginArea} onChange={set("openMarginArea")} onFocus={focusOn} onBlur={focusOff} placeholder="0" />
        </Field>
      </div>

      <Divider label="Sale Information" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <Field label="Booking Date">
          <input style={inp} type="date" value={f.bookingDate} onChange={set("bookingDate")} onFocus={focusOn} onBlur={focusOff} />
        </Field>
        <Field label="Agreement Date">
          <input style={inp} type="date" value={f.agreementDate} onChange={set("agreementDate")} onFocus={focusOn} onBlur={focusOff} />
        </Field>
        <Field label="Possession Date">
          <input style={inp} type="date" value={f.possessionDate} onChange={set("possessionDate")} onFocus={focusOn} onBlur={focusOff} />
        </Field>
        <Field label="Sales Executive">
          <input style={inp} value={f.salesExecutive} onChange={set("salesExecutive")} onFocus={focusOn} onBlur={focusOff} placeholder="Executive name" />
        </Field>
      </div>

      <Divider label="Status & Notes" />
      <Field label="Status">
        <div style={{ display: "flex", gap: 6 }}>
          {["Booked", "Sold", "Cancelled"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setF((p) => ({ ...p, status: s }))}
              style={{
                flex: 1, padding: "9px 6px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: f.status === s ? "none" : `1.5px solid ${T.border2}`,
                background: f.status === s ? (s === "Sold" ? T.success : s === "Cancelled" ? T.coral : T.blue) : "#fff",
                color: f.status === s ? "#fff" : T.muted,
                transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Notes">
        <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={f.notes} onChange={set("notes")} onFocus={focusOn} onBlur={focusOff} placeholder="Any additional notes…" />
      </Field>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={() => onSave(f)} disabled={saving}>
          {saving ? "Saving…" : initial ? "Update Sale" : "Add Sale"}
        </button>
      </div>
    </div>
  );
}

/* ─── Flat Payment Form ──────────────────────────────────────────────────── */
function FlatPaymentForm({ sale, onSave, onClose, saving }) {
  const [f, setF] = useState({
    paymentDate: today(),
    amount: "",
    paymentMode: "NEFT",
    transactionId: "",
    bankName: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (!f.paymentDate) errs.paymentDate = "Payment date is required.";
    if (!f.amount || isNaN(f.amount) || Number(f.amount) <= 0)
      errs.amount = "Enter a valid amount greater than 0.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave(f);
  }

  // Build display name showing both applicants if present
  const displayName = [sale.customerName, sale.customerSecondName].filter(Boolean).join(" & ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: T.navy, borderRadius: 10, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{displayName}</p>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              {sale.receiptNo} · Flat {sale.flatNo}, {sale.projectName}
            </p>
          </div>
        </div>
        <ProgressBar
          pct={Number(sale.totalAmount) > 0 ? (Number(sale.paidAmount) / Number(sale.totalAmount)) * 100 : 0}
          color="rgba(255,255,255,0.35)"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <Field label="Payment Date *">
          <input
            style={{ ...inp, borderColor: errors.paymentDate ? T.coral : T.border2 }}
            type="date"
            value={f.paymentDate}
            onChange={set("paymentDate")}
            onFocus={focusOn}
            onBlur={focusOff}
          />
          {errors.paymentDate && <p style={{ fontSize: 11.5, color: T.coral, marginTop: 2 }}>{errors.paymentDate}</p>}
        </Field>
        <Field label="Amount (₹) *">
          <input
            style={{ ...inp, borderColor: errors.amount ? T.coral : T.border2 }}
            type="number"
            value={f.amount}
            onChange={set("amount")}
            onFocus={focusOn}
            onBlur={focusOff}
            placeholder="0.00"
          />
          {errors.amount && <p style={{ fontSize: 11.5, color: T.coral, marginTop: 2 }}>{errors.amount}</p>}
        </Field>
        <Field label="Payment Mode">
          <select style={inp} value={f.paymentMode} onChange={set("paymentMode")} onFocus={focusOn} onBlur={focusOff}>
            {["Cash", "Cheque", "NEFT", "RTGS", "UPI", "DD", "Online Transfer"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Transaction ID / Cheque No.">
          <input style={inp} value={f.transactionId} onChange={set("transactionId")} onFocus={focusOn} onBlur={focusOff} placeholder="Optional" />
        </Field>
        <Field label="Bank Name">
          <input style={inp} value={f.bankName} onChange={set("bankName")} onFocus={focusOn} onBlur={focusOff} placeholder="Optional" />
        </Field>
      </div>
      <Field label="Notes">
        <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={f.notes} onChange={set("notes")} onFocus={focusOn} onBlur={focusOff} placeholder="Any notes…" />
      </Field>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={handleSave} disabled={saving}>
          {saving ? "Recording…" : "Record Payment"}
        </button>
      </div>
    </div>
  );
}

/* ─── Edit Payment Form ──────────────────────────────────────────────────── */
function EditPaymentForm({ payment, onSave, onClose, saving }) {
  const [f, setF] = useState({
    paymentDate: payment.paymentDate || today(),
    amount: String(payment.amount || ""),
    paymentMode: payment.paymentMode || "NEFT",
    transactionId: payment.transactionId || "",
    bankName: payment.bankName || "",
    notes: payment.notes || "",
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (!f.paymentDate) errs.paymentDate = "Payment date is required.";
    if (!f.amount || isNaN(f.amount) || Number(f.amount) <= 0)
      errs.amount = "Enter a valid amount greater than 0.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ ...f, amount: Number(f.amount) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <Field label="Payment Date *">
          <input
            style={{ ...inp, borderColor: errors.paymentDate ? T.coral : T.border2, boxShadow: errors.paymentDate ? `0 0 0 3px rgba(227,74,47,0.10)` : "none" }}
            type="date"
            value={f.paymentDate}
            onChange={set("paymentDate")}
            onFocus={focusOn}
            onBlur={focusOff}
          />
          {errors.paymentDate && <p style={{ fontSize: 11.5, color: T.coral, marginTop: 2 }}>{errors.paymentDate}</p>}
        </Field>
        <Field label="Amount (₹) *">
          <input
            style={{ ...inp, borderColor: errors.amount ? T.coral : T.border2, boxShadow: errors.amount ? `0 0 0 3px rgba(227,74,47,0.10)` : "none" }}
            type="number"
            value={f.amount}
            onChange={set("amount")}
            onFocus={focusOn}
            onBlur={focusOff}
            placeholder="0.00"
          />
          {errors.amount && <p style={{ fontSize: 11.5, color: T.coral, marginTop: 2 }}>{errors.amount}</p>}
        </Field>
        <Field label="Payment Mode">
          <select style={inp} value={f.paymentMode} onChange={set("paymentMode")} onFocus={focusOn} onBlur={focusOff}>
            {["Cash", "Cheque", "NEFT", "RTGS", "UPI", "DD", "Online Transfer"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Transaction ID / Cheque No.">
          <input style={inp} value={f.transactionId} onChange={set("transactionId")} onFocus={focusOn} onBlur={focusOff} placeholder="Optional" />
        </Field>
        <Field label="Bank Name">
          <input style={inp} value={f.bankName} onChange={set("bankName")} onFocus={focusOn} onBlur={focusOff} placeholder="Optional" />
        </Field>
      </div>
      <Field label="Notes">
        <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={f.notes} onChange={set("notes")} onFocus={focusOn} onBlur={focusOff} placeholder="Any notes…" />
      </Field>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ─── Sale Detail View ───────────────────────────────────────────────────── */
function SaleDetailView({ sale, salePayments, onClose, onAddPayment, onEditPayment, onDeletePayment, editPaymentSaving }) {
  const statusBadge = { Sold: "green", Booked: "blue", Cancelled: "red" };
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState(false);

  const [pmtFrom, setPmtFrom] = useState("");
  const [pmtTo, setPmtTo] = useState("");

  const DetailRow = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: T.hint, fontWeight: 500, minWidth: 70 }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.navy, textAlign: "right", flex: 1, wordBreak: "break-word", overflowWrap: "break-word" }}>
        {value || "—"}
      </span>
    </div>
  );

  const pct = Number(sale.totalAmount) > 0 ? (Number(sale.paidAmount) / Number(sale.totalAmount)) * 100 : 0;

  const sortedPayments = useMemo(() => {
    return [...salePayments].sort((a, b) => {
      const ia = Number(a.paymentId) || 0;
      const ib = Number(b.paymentId) || 0;
      return ia - ib;
    });
  }, [salePayments]);

  const filteredPayments = useMemo(() => {
    return sortedPayments.filter((p) => {
      if (pmtFrom && p.paymentDate && p.paymentDate < pmtFrom) return false;
      if (pmtTo && p.paymentDate && p.paymentDate > pmtTo) return false;
      return true;
    });
  }, [sortedPayments, pmtFrom, pmtTo]);

  const filteredTotal = filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

  function handleDeleteConfirm() {
    if (deleteInput !== deletingPayment.receiptLabel) {
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 2500);
      return;
    }
    onDeletePayment(deletingPayment);
    setDeletingPayment(null);
    setDeleteInput("");
  }

  const areaDetails = [
    { label: "Carpet", value: sale.carpetArea },
    { label: "Varandah + Balcony", value: sale.verandahBalconyArea },
    { label: "Open Margin (Plot)", value: sale.openMarginArea },
  ];

  // Full name for hero display
  const heroName = [sale.customerName, sale.customerSecondName].filter(Boolean).join(" & ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero */}
      <div style={{ background: T.navy, borderRadius: 10, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{heroName}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
              Flat {sale.flatNo} · {sale.wing} Wing · Floor {sale.floorNo} · {sale.buildingName}
            </p>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{sale.projectName}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Receipt No.</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.gold, fontFamily: "'DM Mono', monospace" }}>{sale.receiptNo}</p>
            <div style={{ marginTop: 6 }}>
              <Badge color={statusBadge[sale.status] || "navy"}>{sale.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {/* ── CHANGED: Customer card now includes 2nd Name + Aadhaar ── */}
        <div style={{ ...card, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>Customer</p>
          <DetailRow label="1st Name" value={sale.customerName} />
          <DetailRow label="2nd Name" value={sale.customerSecondName} />
          <DetailRow label="Mobile" value={sale.mobile} />
          <DetailRow label="Email" value={sale.email} />
          <DetailRow label="PAN" value={sale.pan} />
          <DetailRow label="Aadhaar" value={sale.aadhaar} />
          <DetailRow label="Address" value={sale.address} />
        </div>
        <div style={{ ...card, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>Property</p>
          <DetailRow label="Flat Type" value={sale.flatType} />
          <DetailRow label="Carpet Area" value={sale.carpetArea ? `${sale.carpetArea} sq.ft` : null} />
          <DetailRow label="Built-up" value={sale.builtUpArea ? `${sale.builtUpArea} sq.ft` : null} />
          <DetailRow label="Booking Date" value={sale.bookingDate ? new Date(sale.bookingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "-"} />
          <DetailRow label="Agreement" value={sale.agreementDate} />
          <DetailRow label="Possession" value={sale.possessionDate} />
          <DetailRow label="Sales Executive" value={sale.salesExecutive} />
        </div>

        <div style={{ ...card, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>Area Details</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {areaDetails.map((a) => (
              <div key={a.label} style={{ textAlign: "center", padding: "10px 6px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 9.5, color: T.hint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>{a.label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, marginTop: 4 }}>
                  {a.value !== undefined && a.value !== null && a.value !== "" ? a.value : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div style={{ ...card, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Payment History ({salePayments.length})
          </p>
          <button style={btn("primary", { fontSize: 11.5, padding: "6px 12px" })} onClick={onAddPayment}>
            + Add Payment
          </button>
        </div>

        <div style={{
          display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
          background: T.bg, borderRadius: 8, padding: "10px 12px",
          border: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.hint, whiteSpace: "nowrap" }}>Filter by date:</span>
          <input
            style={{ ...inp, width: "auto", flex: "1 1 130px", fontSize: 12.5, padding: "7px 10px" }}
            type="date"
            value={pmtFrom}
            onChange={(e) => setPmtFrom(e.target.value)}
            onFocus={focusOn}
            onBlur={focusOff}
          />
          <span style={{ fontSize: 11.5, color: T.hint }}>to</span>
          <input
            style={{ ...inp, width: "auto", flex: "1 1 130px", fontSize: 12.5, padding: "7px 10px" }}
            type="date"
            value={pmtTo}
            onChange={(e) => setPmtTo(e.target.value)}
            onFocus={focusOn}
            onBlur={focusOff}
          />
          {(pmtFrom || pmtTo) && (
            <button
              style={btn("ghost", { padding: "6px 10px", color: T.coral, fontSize: 11.5, border: `1px solid rgba(227,74,47,0.25)`, borderRadius: 7 })}
              onClick={() => { setPmtFrom(""); setPmtTo(""); }}
            >
              Clear ×
            </button>
          )}
        </div>

        {(pmtFrom || pmtTo) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: T.hint }}>
              Showing <strong style={{ color: T.navy }}>{filteredPayments.length}</strong> of {salePayments.length} payments
              &nbsp;·&nbsp;Total: <strong style={{ color: T.success }}>{fmtINR(filteredTotal)}</strong>
            </span>
          </div>
        )}

        {salePayments.length === 0 ? (
          <p style={{ color: T.hint, fontSize: 12.5, textAlign: "center", padding: "1rem 0" }}>
            No payments recorded yet.
          </p>
        ) : filteredPayments.length === 0 ? (
          <p style={{ color: T.hint, fontSize: 12.5, textAlign: "center", padding: "1rem 0" }}>
            No payments in this date range.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredPayments.map((p) => {
              const paymentId = p.paymentId ? Number(p.paymentId) : null;
              const receiptLabel =
                p.receiptNumber ||
                (paymentId ? buildReceiptNumber(sale.receiptNo, paymentId) : `${sale.receiptNo}-P??`);

              const isDeleting = deletingPayment?.id === p.id;
              const isEditing = editingPayment?.id === p.id;

              if (isDeleting) {
                return (
                  <div key={p.id} style={{ background: "rgba(227,74,47,0.04)", border: `1.5px solid rgba(227,74,47,0.25)`, borderRadius: 9, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(227,74,47,0.08)", border: `1px solid rgba(227,74,47,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <polyline points="3 6 5 6 21 6" stroke={T.coral} strokeWidth="2" strokeLinecap="round" />
                          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.coral }}>Delete payment {receiptLabel}?</p>
                        <p style={{ fontSize: 11.5, color: T.hint, marginTop: 1, lineHeight: 1.5 }}>
                          This will permanently remove <strong style={{ color: T.navy }}>{fmtINR(p.amount)}</strong> and adjust the outstanding balance.
                          The Payment ID ({paymentId}) will not be reused.
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: T.hint, marginBottom: 8 }}>
                      Type <strong style={{ fontFamily: "'DM Mono', monospace", color: T.coral }}>{receiptLabel}</strong> to confirm deletion.
                    </p>
                    <input
                      style={{ ...inp, borderColor: deleteError ? T.coral : T.border2, boxShadow: deleteError ? `0 0 0 3px rgba(227,74,47,0.10)` : "none", marginBottom: 4, width: "100%", boxSizing: "border-box" }}
                      placeholder={`Type ${receiptLabel} to confirm`}
                      value={deleteInput}
                      onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(false); }}
                      onFocus={focusOn}
                      onBlur={focusOff}
                      onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
                      autoFocus
                    />
                    {deleteError && <p style={{ fontSize: 11.5, color: T.coral, marginBottom: 6 }}>Text doesn't match. Try again.</p>}
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 10, flexWrap: "wrap" }}>
                      <button style={btn("default", { flex: "1 1 auto", maxWidth: 120 })} onClick={() => { setDeletingPayment(null); setDeleteInput(""); setDeleteError(false); }}>Cancel</button>
                      <button style={btn("primary", { opacity: deleteInput === receiptLabel ? 1 : 0.4, flex: "1 1 auto", maxWidth: 160 })} onClick={handleDeleteConfirm} disabled={deleteInput !== receiptLabel}>
                        Delete Payment
                      </button>
                    </div>
                  </div>
                );
              }

              if (isEditing) {
                return (
                  <div key={p.id} style={{ border: `1.5px solid rgba(55,138,221,0.35)`, borderRadius: 9, padding: "14px 16px", background: "rgba(55,138,221,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>Editing {receiptLabel}</p>
                        <p style={{ fontSize: 11.5, color: T.hint, marginTop: 1 }}>Update payment details below</p>
                      </div>
                      <button style={btn("ghost", { fontSize: 11.5, padding: "5px 10px", color: T.hint, flexShrink: 0 })} onClick={() => setEditingPayment(null)}>Cancel</button>
                    </div>
                    <EditPaymentForm
                      payment={p}
                      onSave={(updated) => { onEditPayment(p, updated); setEditingPayment(null); }}
                      onClose={() => setEditingPayment(null)}
                      saving={editPaymentSaving}
                    />
                  </div>
                );
              }

              return (
                <div key={p.id} style={{ background: T.bg, borderRadius: 9, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: "1 1 160px", minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.coral, fontFamily: "'DM Mono', monospace" }}>
                        {receiptLabel}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: T.success, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {fmtINR(p.amount)}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 6, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 10, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Date</p>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: T.navy }}>
                        {p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Mode</p>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: T.navy }}>{p.paymentMode || "—"}</p>
                    </div>
                    {p.transactionId && (
                      <div>
                        <p style={{ fontSize: 10, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Txn / Cheque</p>
                        <p style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Mono', monospace" }}>{p.transactionId}</p>
                      </div>
                    )}
                    {p.bankName && (
                      <div>
                        <p style={{ fontSize: 10, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2 }}>Bank</p>
                        <p style={{ fontSize: 12, color: T.muted }}>{p.bankName}</p>
                      </div>
                    )}
                  </div>

                  {p.notes && (
                    <p style={{ fontSize: 11, color: T.hint, fontStyle: "italic", marginBottom: 8, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
                      {p.notes}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      style={btn("primary", { fontSize: 11, padding: "5px 10px" })}
                      onClick={() => generateSaleReceiptPDF(sale, p)}
                      title="Download receipt PDF"
                    >
                      ↓ Receipt
                    </button>
                    <button
                      style={btn("outline", { fontSize: 11, padding: "5px 10px" })}
                      onClick={() => { setEditingPayment(p); setDeletingPayment(null); setDeleteInput(""); }}
                      title="Edit this payment"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={btn("danger", { fontSize: 11, padding: "5px 10px" })}
                      onClick={() => { setDeletingPayment({ ...p, receiptLabel }); setEditingPayment(null); setDeleteInput(""); setDeleteError(false); }}
                      title="Delete this payment"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              );
            })}

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 6, padding: "10px 14px",
              borderTop: `1.5px solid ${T.border2}`, marginTop: 4,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  {(pmtFrom || pmtTo) ? "Filtered Payments" : "Total Payments Recorded"}
                </span>
                {(pmtFrom || pmtTo) && (
                  <span style={{ fontSize: 11, color: T.hint }}>
                    {filteredPayments.length} of {salePayments.length} payments shown
                  </span>
                )}
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.success }}>
                {fmtINR(filteredTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {sale.notes && (
        <div style={{ ...card, padding: "12px 16px", borderLeft: `3px solid ${T.amber}` }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.hint, marginBottom: 4 }}>NOTES</p>
          <p style={{ fontSize: 13, color: T.navy }}>{sale.notes}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={btn("default")} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function FlatSalePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [flatSales, setFlatSales] = useState([]);
  const [flatPayments, setFlatPayments] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ─── Auth Bootstrap ─────────────────────────────────────────────────── */
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser({ email: session.email, uid: session.uid });
      setToken(session.token);
    } else {
      navigate("/sales");
    }
  }, [navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleAuthError = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setFlatSales([]);
    setFlatPayments([]);
    setSessionExpired(true);
  }, []);

  const loadAll = useCallback(
    async (tok) => {
      setLoading(true);
      try {
        const [fsD, fpD, compD] = await Promise.all([
          fsList(tok, "flatSales"),
          fsList(tok, "flatPayments"),
          fsList(tok, "companies"),
        ]);
        setFlatSales(fsD.map(docToObj).filter(Boolean));
        setFlatPayments(fpD.map(docToObj).filter(Boolean));
        const companies = compD.map(docToObj).filter(Boolean);
        if (companies.length > 0) setCompany(companies[0]);
      } catch (e) {
        if (e.message === "AUTH_EXPIRED") handleAuthError();
        else showToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    },
    [handleAuthError]
  );

  useEffect(() => {
    if (token) loadAll(token);
  }, [token, loadAll]);

  function handleLogout() {
    clearSession();
    setUser(null);
    setToken(null);
    navigate("/sales");
  }

  /* ─── Derived data ───────────────────────────────────────────────────── */
  const projects = useMemo(
    () => [...new Set(flatSales.map((s) => s.projectName).filter(Boolean))],
    [flatSales]
  );

  const filtered = useMemo(
    () =>
      flatSales.filter((s) => {
        if (filterStatus && s.status !== filterStatus) return false;
        if (filterProject && s.projectName !== filterProject) return false;
        if (dateFrom && s.bookingDate < dateFrom) return false;
        if (dateTo && s.bookingDate > dateTo) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            (s.customerName || "").toLowerCase().includes(q) ||
            (s.customerSecondName || "").toLowerCase().includes(q) ||
            (s.receiptNo || "").toLowerCase().includes(q) ||
            (s.mobile || "").includes(q) ||
            (s.flatNo || "").toLowerCase().includes(q) ||
            (s.projectName || "").toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [flatSales, filterStatus, filterProject, dateFrom, dateTo, search]
  );

  /* ─── Stats ──────────────────────────────────────────────────────────── */
  const totalFlats = flatSales.length;
  const soldFlats = flatSales.filter((s) => s.status === "Sold").length;
  const bookedFlats = flatSales.filter((s) => s.status === "Booked").length;
  const cancelledFlats = flatSales.filter((s) => s.status === "Cancelled").length;

  /* ─── CRUD: Sale ─────────────────────────────────────────────────────── */
  async function saveFlatSale(form, existing) {
    if (!form.customerName?.trim()) { showToast("Customer name is required", "error"); return; }
    if (!form.flatNo?.trim()) { showToast("Flat number is required", "error"); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        customerSecondName: form.customerSecondName || "",  // ← NEW
        totalAmount: Number(form.totalAmount || 0),
        flatPrice: Number(form.flatPrice || 0),
        gstAmount: Number(form.gstAmount || 0),
        registrationAmount: Number(form.registrationAmount || 0),
        stampDuty: Number(form.stampDuty || 0),
        otherCharges: Number(form.otherCharges || 0),
        bookingAmount: Number(form.bookingAmount || 0),
        paidAmount: Number(form.paidAmount || 0),
        remainingAmount: Number(form.remainingAmount || 0),
        carpetArea: Number(form.carpetArea || 0),
        builtUpArea: Number(form.builtUpArea || 0),
        verandahBalconyArea: form.verandahBalconyArea || "",
        openMarginArea: form.openMarginArea || "",
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (existing) {
        await fsSet(token, `flatSales/${existing.id}`, data);
        await logActivity(token, "flat_sale_updated", `Flat sale updated for ${form.customerName} – ${form.projectName} Flat ${form.flatNo}`, { amount: form.totalAmount });
      } else {
        await fsCreate(token, "flatSales", data);
        await logActivity(token, "flat_sale_added", `New flat sale: ${form.customerName} – ${form.projectName} Flat ${form.flatNo} (${form.receiptNo})`, { amount: form.totalAmount });
      }
      showToast(existing ? "Sale updated" : "Sale added successfully");
      await loadAll(token);
      setModal(null);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  /* ─── CRUD: Add Payment ──────────────────────────────────────────────── */
  async function saveFlatPayment(sale, form) {
    const amount = Number(form.amount || 0);
    if (!amount || amount <= 0) { showToast("Enter a valid amount", "error"); return; }
    setSaving(true);
    try {
      const nextPaymentId = getNextPaymentId(flatPayments);
      const receiptNumber = buildReceiptNumber(sale.receiptNo, nextPaymentId);

      await fsCreate(token, "flatPayments", {
        saleId: sale.id,
        receiptNo: sale.receiptNo || "",
        receiptNumber,
        paymentId: nextPaymentId,
        customerName: sale.customerName || "",
        customerSecondName: sale.customerSecondName || "",  // ← NEW
        flatNo: sale.flatNo || "",
        projectName: sale.projectName || "",
        paymentDate: form.paymentDate,
        amount,
        paymentMode: form.paymentMode,
        transactionId: form.transactionId || "",
        bankName: form.bankName || "",
        notes: form.notes || "",
        createdAt: new Date().toISOString(),
      });

      const newPaid = Number(sale.paidAmount || 0) + amount;
      const newRemaining = Number(sale.totalAmount || 0) - newPaid;
      await fsSet(token, `flatSales/${sale.id}`, {
        ...sale,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        updatedAt: new Date().toISOString(),
      });

      await logActivity(
        token,
        "flat_payment_added",
        `Payment ${receiptNumber} of ${fmtINR(amount)} recorded for ${sale.customerName} – ${sale.receiptNo}`,
        { amount }
      );
      showToast(`Payment recorded — ${receiptNumber}`);
      await loadAll(token);
      setModal(null);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message || "Failed to record payment", "error");
    } finally {
      setSaving(false);
    }
  }

  /* ─── CRUD: Edit Payment ─────────────────────────────────────────────── */
  async function editFlatPayment(payment, updatedForm) {
    const oldAmount = Number(payment.amount || 0);
    const newAmount = Number(updatedForm.amount || 0);
    setSaving(true);
    try {
      await fsSet(token, `flatPayments/${payment.id}`, {
        ...payment,
        paymentDate: updatedForm.paymentDate,
        amount: newAmount,
        paymentMode: updatedForm.paymentMode,
        transactionId: updatedForm.transactionId || "",
        bankName: updatedForm.bankName || "",
        notes: updatedForm.notes || "",
        updatedAt: new Date().toISOString(),
      });
      const sale = flatSales.find((s) => s.id === payment.saleId);
      if (sale) {
        const newPaid = Number(sale.paidAmount || 0) - oldAmount + newAmount;
        const newRemaining = Number(sale.totalAmount || 0) - newPaid;
        await fsSet(token, `flatSales/${sale.id}`, {
          ...sale,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          updatedAt: new Date().toISOString(),
        });
      }
      await logActivity(
        token,
        "flat_payment_edited",
        `Payment ${payment.receiptNumber || payment.receiptNo} updated (${fmtINR(oldAmount)} → ${fmtINR(newAmount)}) for ${payment.customerName}`,
        { amount: newAmount }
      );
      showToast("Payment updated successfully");
      await loadAll(token);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message || "Failed to update payment", "error");
    } finally {
      setSaving(false);
    }
  }

  /* ─── CRUD: Delete Payment ───────────────────────────────────────────── */
  async function deleteFlatPayment(payment) {
    setSaving(true);
    try {
      await fsDelete(token, `flatPayments/${payment.id}`);
      const sale = flatSales.find((s) => s.id === payment.saleId);
      if (sale) {
        const newPaid = Number(sale.paidAmount || 0) - Number(payment.amount || 0);
        const newRemaining = Number(sale.totalAmount || 0) - newPaid;
        await fsSet(token, `flatSales/${sale.id}`, {
          ...sale,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          updatedAt: new Date().toISOString(),
        });
      }
      await logActivity(
        token,
        "flat_payment_deleted",
        `Payment ${payment.receiptNumber || payment.receiptNo} (ID #${payment.paymentId}) of ${fmtINR(payment.amount)} deleted for ${payment.customerName}`,
        { amount: payment.amount }
      );
      showToast("Payment deleted");
      await loadAll(token);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message || "Failed to delete payment", "error");
    } finally {
      setSaving(false);
    }
  }

  /* ─── CRUD: Delete Sale ──────────────────────────────────────────────── */
  async function confirmDeleteFlatSale(sale) {
    setDeleting(true);
    try {
      const salePmts = flatPayments.filter((p) => p.saleId === sale.id);
      await Promise.all(salePmts.map((p) => fsDelete(token, `flatPayments/${p.id}`)));
      await fsDelete(token, `flatSales/${sale.id}`);
      await logActivity(token, "flat_sale_deleted", `Flat sale deleted: ${sale.customerName} – ${sale.receiptNo}`);
      await loadAll(token);
      showToast("Sale record deleted");
      setDeleteModal(null);
    } catch (e) {
      showToast(e.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  }

  /* ─── Download Customer Sale Receipt PDF ────────────────────────────── */
  function downloadCustomerReceipt(sale) {
    const salePmts = flatPayments
      .filter((p) => p.saleId === sale.id)
      .sort((a, b) => (Number(a.paymentId) || 0) - (Number(b.paymentId) || 0));
    generateCustomerSaleReceiptPDF(sale, company, salePmts);
  }

  const statusBadgeMap = { Sold: "green", Booked: "blue", Cancelled: "red" };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {sessionExpired && <SessionExpiredBanner onRelogin={() => navigate("/sales")} />}

      <Navbar user={user} onLogout={handleLogout} onBackToDashboard={() => navigate("/dashboard")} />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 60px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Page Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>
                  Flat Sales & Customer Receipts
                </h1>
                <p style={{ fontSize: 13, color: T.hint, marginTop: 3 }}>
                  Manage all flat sales, customer payments and download receipts
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={btn("success")} onClick={() => exportFlatSalesExcel(filtered)}>
                  📊 Export Sales in Excel
                </button>
                <button style={btn("primary")} onClick={() => setModal({ type: "addFlatSale" })}>
                  + New Sale
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
              <StatCard label="Total Sales" value={totalFlats} icon="🏠" accent={T.navy} delay={0} />
              <StatCard label="Sold" value={soldFlats} icon="✅" accent={T.success} delay={50} />
              <StatCard label="Booked" value={bookedFlats} icon="📋" accent={T.blue} delay={100} />
              <StatCard label="Cancelled" value={cancelledFlats} icon="❌" accent={T.coral} delay={150} />
            </div>

            {/* Filters */}
            <div style={{ ...card, padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  style={{ ...inp, flex: "2 1 200px", maxWidth: 280 }}
                  placeholder="Search by name, receipt no, mobile, flat…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
                <select style={{ ...inp, width: "auto", minWidth: 140 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
                  <option value="">All Status</option>
                  <option value="Booked">Booked</option>
                  <option value="Sold">Sold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select style={{ ...inp, width: "auto", minWidth: 150 }} value={filterProject} onChange={(e) => setFilterProject(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
                  <option value="">All Projects</option>
                  {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input style={{ ...inp, width: "auto", flex: "1 1 130px" }} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
                <span style={{ color: T.hint, fontSize: 12 }}>to</span>
                <input style={{ ...inp, width: "auto", flex: "1 1 130px" }} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
                {(search || filterStatus || filterProject || dateFrom || dateTo) && (
                  <button
                    style={btn("ghost", { padding: "8px 12px", color: T.coral, fontSize: 12 })}
                    onClick={() => { setSearch(""); setFilterStatus(""); setFilterProject(""); setDateFrom(""); setDateTo(""); }}
                  >
                    Clear ×
                  </button>
                )}
              </div>
              {filtered.length !== flatSales.length && (
                <p style={{ fontSize: 11.5, color: T.hint, marginTop: 8 }}>
                  Showing {filtered.length} of {flatSales.length} records
                </p>
              )}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <Empty icon="🏠" text="No flat sales found. Click '+ New Sale' to add one." />
            ) : (
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                {/* Desktop Table */}
                <div style={{ overflowX: "auto" }} className="flat-table">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    <thead>
                      <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                        {["Receipt No", "Customer", "Project / Flat", "Booking Date", "Status", "Actions"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "11px 14px", color: T.hint, fontWeight: 600, fontSize: 11, letterSpacing: "0.3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, i) => (
                        <tr
                          key={s.id}
                          style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.1s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "13px 14px", fontSize: 12, color: T.coral, fontWeight: 700, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>
                            {s.receiptNo}
                          </td>
                          {/* ── CHANGED: show both names in table ── */}
                          <td style={{ padding: "13px 14px" }}>
                            <p style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{s.customerName}</p>
                            {s.customerSecondName && (
                              <p style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>& {s.customerSecondName}</p>
                            )}
                            <p style={{ fontSize: 11, color: T.hint, marginTop: 1 }}>{s.mobile}</p>
                          </td>
                          <td style={{ padding: "13px 14px" }}>
                            <p style={{ fontWeight: 600, color: T.navy, fontSize: 12.5 }}>{s.projectName}</p>
                            <p style={{ fontSize: 11, color: T.hint, marginTop: 1 }}>
                              Flat {s.flatNo}{s.wing ? ` · Wing ${s.wing}` : ""}{s.buildingName ? ` · ${s.buildingName}` : ""}
                            </p>
                          </td>
                          <td style={{ padding: "13px 14px", color: T.hint, fontSize: 12, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>
                            {s.bookingDate ? new Date(s.bookingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </td>
                          <td style={{ padding: "13px 14px" }}>
                            <Badge color={statusBadgeMap[s.status] || "navy"}>{s.status}</Badge>
                          </td>
                          <td style={{ padding: "13px 14px" }}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button style={btn("default", { fontSize: 11, padding: "5px 9px" })} onClick={() => setModal({ type: "viewFlatSale", data: s })} title="View">View</button>
                              <button style={btn("primary", { fontSize: 11, padding: "5px 9px" })} onClick={() => setModal({ type: "flatPayment", sale: s })} title="Add Payment">Collect Payment</button>
                              <button style={btn("teal", { fontSize: 11, padding: "5px 9px" })} onClick={() => downloadCustomerReceipt(s)} title="Download Sale Receipt">Download Receipt</button>
                              <button style={btn("outline", { fontSize: 11, padding: "5px 9px" })} onClick={() => setModal({ type: "editFlatSale", data: s })} title="Edit">Edit</button>
                              <button style={btn("danger", { fontSize: 11, padding: "5px 9px" })} onClick={() => setDeleteModal({ sale: s, name: s.customerName, receiptNo: s.receiptNo })} title="Delete">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="flat-mobile" style={{ display: "none", flexDirection: "column" }}>
                  {filtered.map((s, i) => (
                    <div key={s.id} style={{ padding: "14px 15px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                            <p style={{ fontWeight: 700, fontSize: 13.5, color: T.navy }}>{s.customerName}</p>
                            <Badge color={statusBadgeMap[s.status] || "navy"}>{s.status}</Badge>
                          </div>
                          {s.customerSecondName && (
                            <p style={{ fontSize: 12, color: T.muted, marginBottom: 2 }}>& {s.customerSecondName}</p>
                          )}
                          <p style={{ fontSize: 11.5, color: T.hint }}>{s.receiptNo} · Flat {s.flatNo} · {s.projectName}</p>
                          <p style={{ fontSize: 11.5, color: T.hint, marginTop: 1 }}>
                            {s.mobile} · {s.bookingDate ? new Date(s.bookingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                        <button style={btn("default", { fontSize: 11, padding: "5px 10px" })} onClick={() => setModal({ type: "viewFlatSale", data: s })}>View</button>
                        <button style={btn("primary", { fontSize: 11, padding: "5px 10px" })} onClick={() => setModal({ type: "flatPayment", sale: s })}>Collect Payment</button>
                        <button style={btn("teal", { fontSize: 11, padding: "5px 10px" })} onClick={() => downloadCustomerReceipt(s)}>Download Receipt</button>
                        <button style={btn("outline", { fontSize: 11, padding: "5px 10px" })} onClick={() => setModal({ type: "editFlatSale", data: s })}>Edit</button>
                        <button style={btn("danger", { fontSize: 11, padding: "5px 10px" })} onClick={() => setDeleteModal({ sale: s, name: s.customerName, receiptNo: s.receiptNo })}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {modal?.type === "addFlatSale" && (
        <Modal title="New Flat Sale" subtitle="Add customer flat sale record" onClose={() => setModal(null)} width={720}>
          <FlatSaleForm existingSales={flatSales} onSave={(f) => saveFlatSale(f, null)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {modal?.type === "editFlatSale" && (
        <Modal title="Edit Flat Sale" subtitle={`${modal.data.customerName} · ${modal.data.receiptNo}`} onClose={() => setModal(null)} width={720}>
          <FlatSaleForm initial={modal.data} existingSales={flatSales.filter((s) => s.id !== modal.data.id)} onSave={(f) => saveFlatSale(f, modal.data)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {modal?.type === "flatPayment" && (
        <Modal title="Record Customer Payment" subtitle={`${modal.sale.customerName} · ${modal.sale.receiptNo}`} onClose={() => setModal(null)} width={500}>
          <FlatPaymentForm sale={modal.sale} onSave={(f) => saveFlatPayment(modal.sale, f)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {modal?.type === "viewFlatSale" &&
        (() => {
          const sale = modal.data;
          const liveSale = flatSales.find((s) => s.id === sale.id) || sale;
          const salePmts = flatPayments.filter((p) => p.saleId === sale.id);
          return (
            <Modal title={`Sale Detail — ${sale.receiptNo}`} subtitle={sale.customerName} onClose={() => setModal(null)} width={740}>
              <SaleDetailView
                sale={liveSale}
                salePayments={salePmts}
                onClose={() => setModal(null)}
                onAddPayment={() => setModal({ type: "flatPayment", sale: liveSale })}
                onEditPayment={(payment, updatedForm) => editFlatPayment(payment, updatedForm)}
                onDeletePayment={(payment) => deleteFlatPayment(payment)}
                editPaymentSaving={saving}
              />
            </Modal>
          );
        })()}

      {deleteModal && (
        <DeleteConfirmModal
          name={deleteModal.name}
          receiptNo={deleteModal.receiptNo}
          onConfirm={() => confirmDeleteFlatSale(deleteModal.sale)}
          onCancel={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? T.coral : T.success, color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, zIndex: 3000, display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 16px rgba(0,0,0,0.18)`, animation: "toastIn 0.25s ease both", whiteSpace: "nowrap" }}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}