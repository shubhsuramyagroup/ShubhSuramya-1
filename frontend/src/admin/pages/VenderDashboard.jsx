import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

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
const FS = () =>
  `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;

async function fsList(token, col) {
  const r = await fetch(`${FS()}/${col}?pageSize=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    // If unauthorized, token is expired — propagate so caller can handle
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
  await fetch(`${FS()}/${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
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

/* ─── Auth helpers ───────────────────────────────────────────────────────── */
const AUTH_KEY = "shubh_admin_session";

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
  // Store expiry so we can validate on reload
  const expiresAt = Date.now() + Number(d.expiresIn || 3600) * 1000;
  return { token: d.idToken, uid: d.localId, email: d.email, expiresAt };
}

async function refreshToken(refreshToken) {
  const r = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FB.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refreshToken }),
    }
  );
  const d = await r.json();
  if (!r.ok) throw new Error("Token refresh failed");
  return {
    token: d.id_token,
    refreshToken: d.refresh_token,
    expiresAt: Date.now() + Number(d.expires_in || 3600) * 1000,
  };
}

function saveSession(user) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("Could not save session", e);
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Must have a token field (our own format)
    if (!parsed?.token) return null;
    // Check if expired (with 60s buffer)
    if (parsed.expiresAt && Date.now() > parsed.expiresAt - 60_000) {
      // Token expired — remove session
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

/* ─── Razorpay helper ────────────────────────────────────────────────────── */
function openRazorpayCheckout({ amount, vendorName, description, onSuccess, onFailure }) {
  if (!RAZORPAY_KEY_ID) { alert("Razorpay Key ID missing in .env"); return; }
  if (!window.Razorpay) { alert("Razorpay SDK not loaded."); return; }
  const rzp = new window.Razorpay({
    key: RAZORPAY_KEY_ID,
    amount: Math.round(amount * 100),
    currency: "INR",
    name: "Shubh Infracon",
    description: `Payment to ${vendorName} – ${description || "Vendor payment"}`,
    handler: (res) => onSuccess(res.razorpay_payment_id),
    prefill: { name: vendorName },
    theme: { color: "#E34A2F" },
    modal: { ondismiss: () => onFailure("Payment cancelled") },
  });
  rzp.on("payment.failed", (resp) => onFailure(resp.error.description));
  rzp.open();
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  navy: "#1E2A5A",
  coral: "#E34A2F",
  cream: "#FDFAF6",
  cream2: "#F5F0E8",
  gold: "#f5a623",
  white: "#ffffff",
  muted: "#6B7194",
  hint: "#9CA3B8",
  border: "rgba(30,42,90,0.10)",
  border2: "rgba(30,42,90,0.16)",
  success: "#1D9E75",
  danger: "#E34A2F",
  amber: "#EF9F27",
  blue: "#378ADD",
};

const fmtINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

/* ─── Shared button factory ──────────────────────────────────────────────── */
const makeBtn = (variant = "default", extra = {}) => ({
  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
  fontSize: 13, fontWeight: 600, letterSpacing: "0.3px",
  padding: "10px 20px", borderRadius: 50,
  border: variant === "outline" ? `1.5px solid ${T.navy}` : "none",
  background:
    variant === "primary" ? `linear-gradient(135deg,${T.coral},#f5743a)` :
    variant === "navy" ? `linear-gradient(135deg,${T.navy},#2d3d7a)` :
    variant === "razorpay" ? "linear-gradient(135deg,#3395FF,#1a7de8)" :
    variant === "danger" ? `linear-gradient(135deg,${T.danger},#c73b22)` :
    variant === "outline" ? "transparent" :
    variant === "ghost" ? "transparent" : "rgba(30,42,90,0.06)",
  color:
    ["primary", "navy", "razorpay", "danger"].includes(variant) ? "#fff" :
    variant === "outline" ? T.navy : T.navy,
  boxShadow:
    variant === "primary" ? "0 4px 16px rgba(227,74,47,0.35)" :
    variant === "navy" ? "0 4px 16px rgba(30,42,90,0.35)" :
    variant === "razorpay" ? "0 4px 16px rgba(51,149,255,0.35)" : "none",
  transition: "all 0.2s cubic-bezier(.22,1,.36,1)",
  fontFamily: "'Manrope', sans-serif",
  ...extra,
});

/* ─── Input style ────────────────────────────────────────────────────────── */
const inp = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: 12, border: `1.5px solid ${T.border2}`,
  background: "#fff", color: T.navy, fontSize: 13,
  outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  fontFamily: "'Manrope', sans-serif",
};

/* ─── Card style ─────────────────────────────────────────────────────────── */
const card = {
  background: "#fff", borderRadius: 20,
  border: `1px solid ${T.border}`,
  padding: "24px", boxShadow: "0 2px 20px rgba(30,42,90,0.06)",
};

/* ─── Micro components ───────────────────────────────────────────────────── */
function Badge({ children, color = "navy", style = {} }) {
  const map = {
    navy: { bg: "rgba(30,42,90,0.08)", text: T.navy },
    coral: { bg: "rgba(227,74,47,0.10)", text: T.coral },
    green: { bg: "rgba(29,158,117,0.10)", text: "#0e7a5a" },
    red: { bg: "rgba(227,74,47,0.10)", text: T.coral },
    amber: { bg: "rgba(239,159,39,0.12)", text: "#9a620a" },
    blue: { bg: "rgba(55,138,221,0.10)", text: "#1a5a9e" },
  };
  const t = map[color] || map.navy;
  return (
    <span style={{ background: t.bg, color: t.text, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap", fontFamily: "'Manrope',sans-serif", ...style }}>
      {children}
    </span>
  );
}

function StatCard({ label, value, accent, icon, delay = 0 }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${T.border}`, padding: "22px 24px", boxShadow: "0 2px 20px rgba(30,42,90,0.06)", position: "relative", overflow: "hidden", animation: `fadeUp 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms both` }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: accent ? `radial-gradient(circle at top right, ${accent}18, transparent 70%)` : "radial-gradient(circle at top right, rgba(30,42,90,0.05), transparent 70%)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{label}</p>
        {icon && <div style={{ width: 34, height: 34, borderRadius: 10, background: accent ? `${accent}15` : "rgba(30,42,90,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>}
      </div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: accent || T.navy, fontVariantNumeric: "tabular-nums", fontFamily: "'Montserrat',sans-serif" }}>{value}</p>
    </div>
  );
}

function ProgressBar({ pct, color }) {
  const c = color || (pct >= 100 ? T.success : T.amber);
  return (
    <div style={{ height: 5, background: "rgba(30,42,90,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct || 0)}%`, background: c, borderRadius: 99, transition: "width 0.6s cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: `3px solid rgba(30,42,90,0.1)`, borderTopColor: T.coral, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ color: T.muted, fontSize: 13, fontFamily: "'Manrope',sans-serif", margin: 0 }}>Loading data…</p>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "4rem 2rem" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: 0, color: T.muted, fontSize: 14, fontFamily: "'Manrope',sans-serif" }}>{text}</p>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, width = 540 }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: T.cream, borderRadius: 24, width: "100%", maxWidth: width, maxHeight: "96vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(10,14,30,0.22)", border: `1px solid ${T.border}`, animation: "modalIn 0.3s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ padding: "24px 28px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: "'Montserrat',sans-serif" }}>{title}</h3>
              {subtitle && <p style={{ margin: "4px 0 0", fontSize: 12, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>{subtitle}</p>}
            </div>
            <button style={{ ...makeBtn("ghost", { padding: 8, borderRadius: 10, background: "rgba(30,42,90,0.06)" }), flexShrink: 0 }} onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke={T.navy} strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg,${T.coral},${T.gold})`, borderRadius: 99, marginTop: 16 }} />
        </div>
        <div style={{ padding: "20px 28px 28px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'Manrope',sans-serif" }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "5px 0 0", fontSize: 11, color: T.hint, fontFamily: "'Manrope',sans-serif" }}>{hint}</p>}
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <p style={{ margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: T.coral, fontFamily: "'Manrope',sans-serif" }}>{eyebrow}</p>
        <h2 style={{ margin: 0, fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, color: T.navy, fontFamily: "'Montserrat',sans-serif", letterSpacing: "-0.5px" }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ─── Forms ──────────────────────────────────────────────────────────────── */
function CompanyForm({ initial, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { name: "", gstin: "", pan: "", stateCode: "24", msmeNo: "", address: "", phone: "", email: "", totalBudget: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const rows = [
    ["Company name *", "name", "text", "col-span-2"],
    ["GSTIN", "gstin", "text", ""],
    ["PAN", "pan", "text", ""],
    ["State code", "stateCode", "text", ""],
    ["MSME No.", "msmeNo", "text", ""],
    ["Address", "address", "text", "col-span-2"],
    ["Phone", "phone", "tel", ""],
    ["Email", "email", "email", ""],
    ["Total budget (₹)", "totalBudget", "number", ""],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {rows.map(([label, key, type, span]) => (
          <div key={key} style={span === "col-span-2" ? { gridColumn: "1/-1" } : {}}>
            <Field label={label}>
              <input style={{ ...inp }} type={type} value={f[key]} onChange={set(key)} onFocus={e => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = `0 0 0 3px ${T.coral}22`; }} onBlur={e => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; }} />
            </Field>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
        <button style={{ ...makeBtn("default") }} onClick={onClose}>Cancel</button>
        <button style={{ ...makeBtn("primary") }} onClick={() => onSave(f)} disabled={saving}>
          {saving ? "Saving…" : initial ? "Update Company" : "Add Company"}
        </button>
      </div>
    </div>
  );
}

function VendorForm({ initial, companies, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || {
    name: "", companyId: companies[0]?.id || "", gstin: "", pan: "",
    phone: "", email: "", address: "", description: "", hsnCode: "",
    invoiceNo: "", invoiceDate: today(), totalBill: "", cgst: "", sgst: "", tds: "",
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const subTotal = Number(f.totalBill || 0);
  const cgstAmt = Number(f.cgst || 0);
  const sgstAmt = Number(f.sgst || 0);
  const billWithGST = subTotal + cgstAmt + sgstAmt;
  const tdsAmt = Number(f.tds || 0);
  const netAmount = billWithGST - tdsAmt;

  const focusStyle = (e) => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = `0 0 0 3px ${T.coral}22`; };
  const blurStyle = (e) => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Company *">
        <select style={{ ...inp }} value={f.companyId} onChange={set("companyId")} onFocus={focusStyle} onBlur={blurStyle}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          ["Vendor name *", "name", "text"], ["GSTIN", "gstin", "text"],
          ["PAN", "pan", "text"], ["Phone", "phone", "tel"],
          ["Email", "email", "email"], ["Address", "address", "text"],
          ["Description / Work", "description", "text"], ["HSN Code", "hsnCode", "text"],
          ["Invoice No.", "invoiceNo", "text"], ["Invoice Date", "invoiceDate", "date"],
        ].map(([label, key, type]) => (
          <Field key={key} label={label}>
            <input style={{ ...inp }} type={type} value={f[key]} onChange={set(key)} onFocus={focusStyle} onBlur={blurStyle} />
          </Field>
        ))}
      </div>

      {/* Bill breakdown */}
      <div style={{ background: `linear-gradient(135deg,rgba(30,42,90,0.04),rgba(227,74,47,0.03))`, borderRadius: 16, padding: "20px", border: `1px solid ${T.border}` }}>
        <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 12, color: T.navy, letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Manrope',sans-serif" }}>Bill Breakdown</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {[["Sub Total (₹)", "totalBill"], ["CGST (₹)", "cgst"], ["SGST (₹)", "sgst"], ["TDS (₹)", "tds"]].map(([label, key]) => (
            <Field key={key} label={label}>
              <input style={{ ...inp }} type="number" value={f[key]} onChange={set(key)} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>Bill with GST: {fmtINR(billWithGST)}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>TDS deducted: {fmtINR(tdsAmt)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>Net Payable</p>
            <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: T.coral, fontFamily: "'Montserrat',sans-serif" }}>{fmtINR(netAmount)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
        <button style={{ ...makeBtn("default") }} onClick={onClose}>Cancel</button>
        <button style={{ ...makeBtn("primary") }} onClick={() => onSave({ ...f, billWithGST, netAmount })} disabled={saving}>
          {saving ? "Saving…" : initial ? "Update Vendor" : "Add Vendor"}
        </button>
      </div>
    </div>
  );
}

function PaymentForm({ vendor, onSave, onClose, saving }) {
  const due = Number(vendor.netAmount || 0) - Number(vendor.amountPaid || 0);
  const [f, setF] = useState({ date: today(), particulars: "", chequeNo: "", amountPaid: String(due > 0 ? due.toFixed(2) : ""), paymentMode: "Razorpay X" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const isRazorpay = f.paymentMode === "Razorpay X";
  const focusStyle = (e) => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = `0 0 0 3px ${T.coral}22`; };
  const blurStyle = (e) => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Vendor summary card */}
      <div style={{ background: `linear-gradient(135deg,${T.navy},#2d3d7a)`, borderRadius: 16, padding: "20px 22px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: "'Montserrat',sans-serif" }}>{vendor.name}</p>
            {vendor.description && <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7, fontFamily: "'Manrope',sans-serif" }}>{vendor.description}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Manrope',sans-serif" }}>Outstanding</p>
            <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#ff8070", fontFamily: "'Montserrat',sans-serif" }}>{fmtINR(due)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div><p style={{ margin: 0, fontSize: 10, opacity: 0.6, fontFamily: "'Manrope',sans-serif" }}>Net Payable</p><p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, fontFamily: "'Manrope',sans-serif" }}>{fmtINR(vendor.netAmount)}</p></div>
          <div><p style={{ margin: 0, fontSize: 10, opacity: 0.6, fontFamily: "'Manrope',sans-serif" }}>Paid</p><p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "#6ee7c0", fontFamily: "'Manrope',sans-serif" }}>{fmtINR(vendor.amountPaid)}</p></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar pct={Number(vendor.netAmount) > 0 ? (Number(vendor.amountPaid) / Number(vendor.netAmount)) * 100 : 0} color="#6ee7c0" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Payment Date">
          <input style={{ ...inp }} type="date" value={f.date} onChange={set("date")} onFocus={focusStyle} onBlur={blurStyle} />
        </Field>
        <Field label="Amount (₹) *">
          <input style={{ ...inp }} type="number" value={f.amountPaid} onChange={set("amountPaid")} onFocus={focusStyle} onBlur={blurStyle} />
        </Field>
        <Field label="Particulars">
          <input style={{ ...inp }} type="text" value={f.particulars} onChange={set("particulars")} placeholder="Reference / description" onFocus={focusStyle} onBlur={blurStyle} />
        </Field>
        <Field label="Cheque / UTR No.">
          <input style={{ ...inp }} type="text" value={f.chequeNo} onChange={set("chequeNo")} placeholder="Optional" onFocus={focusStyle} onBlur={blurStyle} />
        </Field>
      </div>

      <Field label="Payment Mode">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Cash", "Cheque", "NEFT", "RTGS", "UPI", "Razorpay X"].map((m) => (
            <button key={m} onClick={() => setF((p) => ({ ...p, paymentMode: m }))} style={{
              padding: "8px 16px", borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: f.paymentMode === m ? "none" : `1.5px solid ${T.border2}`,
              background: f.paymentMode === m ? (m === "Razorpay X" ? "linear-gradient(135deg,#3395FF,#1a7de8)" : `linear-gradient(135deg,${T.coral},#f5743a)`) : "#fff",
              color: f.paymentMode === m ? "#fff" : T.muted,
              boxShadow: f.paymentMode === m ? (m === "Razorpay X" ? "0 3px 12px rgba(51,149,255,0.3)" : "0 3px 12px rgba(227,74,47,0.3)") : "none",
              transition: "all 0.2s", fontFamily: "'Manrope',sans-serif",
            }}>
              {m}
            </button>
          ))}
        </div>
      </Field>

      {isRazorpay && (
        <div style={{ background: "rgba(51,149,255,0.08)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(51,149,255,0.2)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#185FA5", fontFamily: "'Manrope',sans-serif", fontWeight: 500 }}>
            ℹ️ Clicking "Pay via Razorpay X" will open secure checkout for {fmtINR(f.amountPaid)}. Payment will be recorded automatically on success.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
        <button style={{ ...makeBtn("default") }} onClick={onClose}>Cancel</button>
        {isRazorpay ? (
          <button style={{ ...makeBtn("razorpay") }} onClick={() => onSave(f, true)} disabled={saving || !f.amountPaid}>
            {saving ? "Processing…" : `⚡ Pay ${fmtINR(f.amountPaid)} via Razorpay`}
          </button>
        ) : (
          <button style={{ ...makeBtn("primary") }} onClick={() => onSave(f, false)} disabled={saving || !f.amountPaid}>
            {saving ? "Recording…" : "✓ Record Payment"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Payment Success overlay ────────────────────────────────────────────── */
function PaymentSuccess({ amount, vendor, paymentId, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}>
      <div style={{ background: T.cream, borderRadius: 24, maxWidth: 420, width: "100%", padding: "3rem 2.5rem", textAlign: "center", boxShadow: "0 32px 80px rgba(10,14,30,0.25)", animation: "modalIn 0.4s cubic-bezier(.34,1.56,.64,1) both", border: `1px solid ${T.border}` }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${T.success},#25c492)`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: `0 8px 24px rgba(29,158,117,0.35)` }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M6 15l7 7 11-13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.navy, fontFamily: "'Montserrat',sans-serif" }}>Payment Successful!</h2>
        <p style={{ margin: "0 0 24px", color: T.muted, fontSize: 14, fontFamily: "'Manrope',sans-serif" }}>{fmtINR(amount)} recorded for <strong style={{ color: T.navy }}>{vendor}</strong></p>
        {paymentId && (
          <div style={{ background: "rgba(30,42,90,0.05)", borderRadius: 12, padding: "12px 16px", marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Manrope',sans-serif" }}>Razorpay Payment ID</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: T.blue, fontFamily: "monospace" }}>{paymentId}</p>
          </div>
        )}
        <button style={{ ...makeBtn("primary", { width: "100%", justifyContent: "center", padding: "12px 20px" }) }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* ─── Session Expired Banner ─────────────────────────────────────────────── */
function SessionExpiredBanner({ onLogin }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}>
      <div style={{ background: T.cream, borderRadius: 24, maxWidth: 400, width: "100%", padding: "2.5rem", textAlign: "center", boxShadow: "0 32px 80px rgba(10,14,30,0.25)", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏱️</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: T.navy, fontFamily: "'Montserrat',sans-serif" }}>Session Expired</h2>
        <p style={{ margin: "0 0 24px", color: T.muted, fontSize: 14, fontFamily: "'Manrope',sans-serif" }}>Your login session has expired. Please sign in again to continue.</p>
        <button style={{ ...makeBtn("primary", { width: "100%", justifyContent: "center", padding: "12px 20px" }) }} onClick={onLogin}>Sign In Again</button>
      </div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar({ user, tab, setTab, onLogout }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "⬛" },
    { key: "companies", label: "Companies", icon: "🏢" },
    { key: "vendors", label: "Vendors", icon: "👥" },
    { key: "payments", label: "Payments", icon: "🧾" },
  ];

  return (
    <header style={{ background: T.navy, position: "sticky", top: 0, zIndex: 500, boxShadow: "0 4px 30px rgba(10,14,30,0.25)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,${T.coral},${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(227,74,47,0.4)", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /><polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'Montserrat',sans-serif", letterSpacing: "-0.3px" }}>Shubh Infracon</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "'Manrope',sans-serif", letterSpacing: "0.8px", textTransform: "uppercase" }}>Vendor Management</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {navItems.map((n) => (
              <button key={n.key} onClick={() => setTab(n.key)} style={{
                background: tab === n.key ? "rgba(255,255,255,0.12)" : "transparent",
                border: tab === n.key ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                borderRadius: 50, padding: "8px 18px", color: tab === n.key ? "#fff" : "rgba(255,255,255,0.55)",
                fontWeight: tab === n.key ? 700 : 500, fontSize: 13, cursor: "pointer",
                fontFamily: "'Manrope',sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ fontSize: 11 }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          {/* User / Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 50, padding: "6px 14px 6px 8px", cursor: "pointer" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${T.coral},${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "'Manrope',sans-serif", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
              </div>
            </Link>
            <button onClick={onLogout} title="Logout" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(227,74,47,0.15)", border: "1px solid rgba(227,74,47,0.30)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="#ff6b5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Dashboard Tab ──────────────────────────────────────────────────────── */
function DashboardTab({ companies, vendors, payments, filterCompany, setFilterCompany, setTab }) {
  const sum = (arr, key) => arr.reduce((s, v) => s + Number(v[key] || 0), 0);
  const filteredVendors = vendors.filter((v) => !filterCompany || v.companyId === filterCompany);
  const filteredPayments = payments.filter((p) => !filterCompany || p.companyId === filterCompany);
  const totalBill = sum(filteredVendors, "billWithGST");
  const totalNet = sum(filteredVendors, "netAmount");
  const totalPaid = sum(filteredVendors, "amountPaid");
  const totalDue = totalNet - totalPaid;
  const totalTDS = sum(filteredVendors, "tds");
  const cNet = (cid) => sum(vendors.filter((v) => v.companyId === cid), "netAmount");
  const cPaid = (cid) => sum(vendors.filter((v) => v.companyId === cid), "amountPaid");
  const cCount = (cid) => vendors.filter((v) => v.companyId === cid).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <SectionHeader eyebrow="Overview" title="Dashboard" action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ ...makeBtn(filterCompany === "" ? "primary" : "default", { fontSize: 12, padding: "7px 14px" }), ...(filterCompany === "" ? {} : { background: "#fff", border: `1.5px solid ${T.border2}` }) }} onClick={() => setFilterCompany("")}>All</button>
          {companies.map((c) => (
            <button key={c.id} style={{ ...makeBtn(filterCompany === c.id ? "navy" : "default", { fontSize: 12, padding: "7px 14px" }), ...(filterCompany !== c.id ? { background: "#fff", border: `1.5px solid ${T.border2}` } : {}) }} onClick={() => setFilterCompany(c.id)}>{c.name}</button>
          ))}
        </div>
      } />

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>
        <StatCard label="Gross Bill" value={fmtINR(totalBill)} icon="📋" delay={0} />
        <StatCard label="TDS Deducted" value={fmtINR(totalTDS)} accent={T.amber} icon="📊" delay={60} />
        <StatCard label="Net Payable" value={fmtINR(totalNet)} accent={T.navy} icon="💼" delay={120} />
        <StatCard label="Amount Paid" value={fmtINR(totalPaid)} accent={T.success} icon="✅" delay={180} />
        <StatCard label="Outstanding" value={fmtINR(totalDue)} accent={totalDue > 0 ? T.coral : T.success} icon={totalDue > 0 ? "⚠️" : "🎉"} delay={240} />
      </div>

      {/* Company table */}
      <div style={{ ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: T.coral, fontFamily: "'Manrope',sans-serif" }}>Summary</p>
            <h3 style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 18, color: T.navy, fontFamily: "'Montserrat',sans-serif" }}>Company-wise Overview</h3>
          </div>
          <button style={{ ...makeBtn("primary", { fontSize: 12, padding: "9px 18px" }) }} onClick={() => setTab("companies")}>
            + Manage
          </button>
        </div>
        {companies.length === 0 ? (
          <p style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "2rem 0", fontFamily: "'Manrope',sans-serif" }}>No companies added yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Manrope',sans-serif" }}>
              <thead>
                <tr>
                  {["Company", "Vendors", "Net Payable", "Paid", "Due", "Progress"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: T.muted, fontWeight: 700, fontSize: 11, letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: `1.5px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => {
                  const net = cNet(c.id), paid = cPaid(c.id), due = net - paid, pct = net > 0 ? (paid / net) * 100 : 0;
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(30,42,90,0.025)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 14px" }}><span style={{ fontWeight: 700, color: T.navy }}>{c.name}</span></td>
                      <td style={{ padding: "14px 14px" }}><Badge color="navy">{cCount(c.id)}</Badge></td>
                      <td style={{ padding: "14px 14px", fontWeight: 600 }}>{fmtINR(net)}</td>
                      <td style={{ padding: "14px 14px", fontWeight: 600, color: T.success }}>{fmtINR(paid)}</td>
                      <td style={{ padding: "14px 14px", fontWeight: 700, color: due > 0 ? T.coral : T.success }}>{fmtINR(due)}</td>
                      <td style={{ padding: "14px 14px", minWidth: 140 }}>
                        <ProgressBar pct={pct} />
                        <span style={{ fontSize: 10, color: T.hint, display: "block", marginTop: 4 }}>{pct.toFixed(0)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent payments */}
      {payments.length > 0 && (
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: T.coral, fontFamily: "'Manrope',sans-serif" }}>Recent</p>
              <h3 style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 18, color: T.navy, fontFamily: "'Montserrat',sans-serif" }}>Payment History</h3>
            </div>
            <button style={{ ...makeBtn("default", { fontSize: 12, padding: "8px 16px", background: "#fff", border: `1.5px solid ${T.border2}` }) }} onClick={() => setTab("payments")}>View all →</button>
          </div>
          {[...filteredPayments].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5).map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,rgba(30,42,90,0.08),rgba(30,42,90,0.04))`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke={T.navy} strokeWidth="1.8" /><path d="M2 10h20" stroke={T.navy} strokeWidth="1.8" /></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: "'Manrope',sans-serif" }}>{p.vendorName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>{p.date} · {p.particulars || "—"}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge color={p.paymentMode === "Razorpay X" ? "blue" : "green"}>{p.paymentMode}</Badge>
                <span style={{ fontWeight: 800, color: T.success, fontSize: 15, fontFamily: "'Montserrat',sans-serif" }}>{fmtINR(p.amountPaid)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Companies Tab ──────────────────────────────────────────────────────── */
function CompaniesTab({ companies, vendors, onAdd, onEdit, onDelete }) {
  const sum = (arr, key) => arr.reduce((s, v) => s + Number(v[key] || 0), 0);
  const cNet = (cid) => sum(vendors.filter((v) => v.companyId === cid), "netAmount");
  const cPaid = (cid) => sum(vendors.filter((v) => v.companyId === cid), "amountPaid");
  const cCount = (cid) => vendors.filter((v) => v.companyId === cid).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionHeader eyebrow="Portfolio" title="Companies" action={
        <button style={{ ...makeBtn("primary") }} onClick={onAdd}>+ Add Company</button>
      } />
      {companies.length === 0 && <Empty icon="🏢" text="No companies added yet. Click 'Add Company' to get started." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
        {companies.map((c, i) => {
          const net = cNet(c.id), paid = cPaid(c.id), due = net - paid, pct = net > 0 ? (paid / net) * 100 : 0;
          return (
            <div key={c.id} style={{ ...card, position: "relative", overflow: "hidden", animation: `fadeUp 0.5s cubic-bezier(.22,1,.36,1) ${i * 80}ms both`, padding: 0 }}>
              <div style={{ height: 4, background: pct >= 100 ? `linear-gradient(90deg,${T.success},#25c492)` : `linear-gradient(90deg,${T.coral},${T.gold})` }} />
              <div style={{ padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${T.navy},#2d3d7a)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" strokeWidth="1.8" /><path d="M3 9h18M9 21V9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: T.navy, fontFamily: "'Montserrat',sans-serif" }}>{c.name}</p>
                      <div style={{ marginTop: 5 }}><Badge color="navy">{cCount(c.id)} vendors</Badge></div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onEdit(c)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(30,42,90,0.06)", border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={T.navy} strokeWidth="2" strokeLinecap="round" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={T.navy} strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                    <button onClick={() => onDelete(c.id)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(227,74,47,0.08)", border: "1px solid rgba(227,74,47,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke={T.coral} strokeWidth="2" strokeLinecap="round" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>
                {(c.gstin || c.pan) && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                    {c.gstin && <span style={{ fontSize: 11, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>GSTIN: <strong>{c.gstin}</strong></span>}
                    {c.pan && <span style={{ fontSize: 11, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>PAN: <strong>{c.pan}</strong></span>}
                  </div>
                )}
                {c.address && <p style={{ margin: "0 0 14px", fontSize: 12, color: T.hint, fontFamily: "'Manrope',sans-serif" }}>📍 {c.address}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                  {[
                    ["Net Payable", fmtINR(net), null],
                    ["Paid", fmtINR(paid), T.success],
                    ["Due", fmtINR(due), due > 0 ? T.coral : T.success],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: color === T.success ? "rgba(29,158,117,0.07)" : color === T.coral ? "rgba(227,74,47,0.07)" : "rgba(30,42,90,0.05)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 10, color: color || T.muted, textTransform: "uppercase", letterSpacing: "0.6px", fontFamily: "'Manrope',sans-serif", fontWeight: 600 }}>{label}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, color: color || T.navy, fontFamily: "'Montserrat',sans-serif" }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <ProgressBar pct={pct} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span style={{ fontSize: 10.5, color: T.hint, fontFamily: "'Manrope',sans-serif" }}>{pct.toFixed(0)}% settled</span>
                    {c.totalBudget > 0 && <span style={{ fontSize: 10.5, color: T.hint, fontFamily: "'Manrope',sans-serif" }}>Budget: {fmtINR(c.totalBudget)}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Vendors Tab ────────────────────────────────────────────────────────── */
function VendorsTab({ vendors, companies, onAdd, onEdit, onDelete, onPay }) {
  const [filterCompany, setFilterCompany] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const filtered = vendors
    .filter((v) => !filterCompany || v.companyId === filterCompany)
    .filter((v) => !searchQ || v.name?.toLowerCase().includes(searchQ.toLowerCase()) || v.description?.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionHeader eyebrow="Directory" title="Vendors" action={
        <button style={{ ...makeBtn("primary") }} onClick={onAdd} disabled={companies.length === 0}>+ Add Vendor</button>
      } />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={T.muted} strokeWidth="2" /><path d="M21 21l-4.35-4.35" stroke={T.muted} strokeWidth="2" strokeLinecap="round" /></svg>
          <input style={{ ...inp, paddingLeft: 36 }} placeholder="Search vendors…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onFocus={e => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = `0 0 0 3px ${T.coral}22`; }} onBlur={e => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; }} />
        </div>
        <select style={{ ...inp, width: "auto", flex: "0 0 auto" }} value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} onFocus={e => { e.target.style.borderColor = T.coral; }} onBlur={e => { e.target.style.borderColor = T.border2; }}>
          <option value="">All Companies</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <Empty icon="👥" text={searchQ ? "No vendors match your search." : "No vendors yet. Add your first vendor."} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((v, i) => {
          const comp = companies.find((c) => c.id === v.companyId);
          const paid = Number(v.amountPaid || 0), net = Number(v.netAmount || 0);
          const due = net - paid, pct = net > 0 ? (paid / net) * 100 : 0;
          const status = due <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
          const statusColor = { paid: T.success, partial: T.amber, unpaid: T.coral }[status];
          const statusBadge = { paid: "green", partial: "amber", unpaid: "red" }[status];

          return (
            <div key={v.id} style={{ ...card, padding: 0, overflow: "hidden", borderLeft: `3px solid ${statusColor}`, animation: `fadeUp 0.5s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` }}>
              <div style={{ padding: "20px 22px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: T.navy, fontFamily: "'Montserrat',sans-serif" }}>{v.name}</p>
                      {comp && <Badge color="navy">{comp.name}</Badge>}
                      <Badge color={statusBadge}>{status === "paid" ? "✓ Paid" : status === "partial" ? "Partial" : "Unpaid"}</Badge>
                      {v.invoiceNo && <span style={{ fontSize: 11, color: T.hint, fontFamily: "'Manrope',sans-serif" }}>#{v.invoiceNo} · {v.invoiceDate}</span>}
                    </div>
                    {v.description && <p style={{ margin: "0 0 12px", fontSize: 12.5, color: T.muted, fontFamily: "'Manrope',sans-serif" }}>{v.description}{v.hsnCode ? ` (HSN: ${v.hsnCode})` : ""}</p>}

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(30,42,90,0.04)", borderRadius: 14, padding: "14px 16px" }}>
                      {[
                        ["Sub Total", v.totalBill], ["CGST", v.cgst], ["SGST", v.sgst],
                        ["TDS", v.tds, T.amber], ["Net Payable", net],
                        ["Paid", paid, T.success], ["Due", due, due > 0 ? T.coral : T.success],
                      ].map(([label, val, accent]) => (
                        <div key={label}>
                          <p style={{ margin: 0, fontSize: 10, color: T.muted, letterSpacing: "0.5px", textTransform: "uppercase", fontFamily: "'Manrope',sans-serif", fontWeight: 600 }}>{label}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 13.5, fontWeight: 700, color: accent || T.navy, fontFamily: "'Montserrat',sans-serif" }}>{fmtINR(val)}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <ProgressBar pct={pct} />
                      <span style={{ fontSize: 10.5, color: T.hint, display: "block", marginTop: 4, fontFamily: "'Manrope',sans-serif" }}>{pct.toFixed(1)}% settled</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    <button style={{ ...makeBtn("primary", { fontSize: 12, padding: "9px 16px" }) }} onClick={() => onPay(v)}>💳 Pay</button>
                    <button style={{ ...makeBtn("default", { fontSize: 12, padding: "8px 14px", background: "#fff", border: `1.5px solid ${T.border2}` }) }} onClick={() => onEdit(v)}>✏️ Edit</button>
                    <button style={{ ...makeBtn("danger", { fontSize: 12, padding: "8px 14px" }) }} onClick={() => onDelete(v.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Payments Tab ───────────────────────────────────────────────────────── */
function PaymentsTab({ payments, companies }) {
  const [filterCompany, setFilterCompany] = useState("");
  const sum = (arr, key) => arr.reduce((s, v) => s + Number(v[key] || 0), 0);
  const filtered = [...payments]
    .filter((p) => !filterCompany || p.companyId === filterCompany)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionHeader eyebrow="Ledger" title="Payment History" action={
        <select style={{ ...inp, width: "auto" }} value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} onFocus={e => { e.target.style.borderColor = T.coral; }} onBlur={e => { e.target.style.borderColor = T.border2; }}>
          <option value="">All Companies</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      } />
      <div style={{ ...card, padding: 0 }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, fontFamily: "'Manrope',sans-serif" }}><strong style={{ color: T.navy }}>{filtered.length}</strong> transactions · Total <strong style={{ color: T.success }}>{fmtINR(sum(filtered, "amountPaid"))}</strong></p>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>🧾</p>
            <p style={{ color: T.muted, fontSize: 14, fontFamily: "'Manrope',sans-serif", margin: 0 }}>No payments recorded yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Manrope',sans-serif" }}>
              <thead>
                <tr style={{ background: "rgba(30,42,90,0.03)" }}>
                  {["Date", "Vendor", "Particulars", "Cheque / UTR", "Mode", "Amount"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: T.muted, fontWeight: 700, fontSize: 11, letterSpacing: "0.8px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(30,42,90,0.025)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px", color: T.muted, whiteSpace: "nowrap" }}>{p.date}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: T.navy }}>{p.vendorName}</td>
                    <td style={{ padding: "14px 16px", color: T.muted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.particulars || "—"}</td>
                    <td style={{ padding: "14px 16px", color: T.muted, fontFamily: "monospace", fontSize: 12 }}>{p.chequeNo || "—"}</td>
                    <td style={{ padding: "14px 16px" }}><Badge color={p.paymentMode === "Razorpay X" ? "blue" : "green"}>{p.paymentMode}</Badge></td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: T.success, whiteSpace: "nowrap", fontFamily: "'Montserrat',sans-serif", fontSize: 14 }}>{fmtINR(p.amountPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Login Page ─────────────────────────────────────────────────────────── */
function LoginPage({ onLogin, prefillEmail = "" }) {
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError(""); setLoading(true);
    try {
      const u = await signIn(email, password);
      onLogin(u);
    } catch (e) {
      setError(
        e.message
          .replace("INVALID_LOGIN_CREDENTIALS", "Invalid email or password.")
          .replace("TOO_MANY_ATTEMPTS_TRY_LATER", "Too many attempts. Try later.")
      );
    } finally { setLoading(false); }
  }
  const focusStyle = (e) => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = `0 0 0 3px ${T.coral}22`; };
  const blurStyle = (e) => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Manrope',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        input:focus,select:focus{outline:none;}
        button:disabled{opacity:0.55;cursor:not-allowed;}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:rgba(30,42,90,0.2);border-radius:99px}
        html{scroll-behavior:smooth}
      `}</style>

      <div style={{ width: "100%", maxWidth: 520, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: T.cream, boxShadow: "-20px 0 60px rgba(10,14,30,0.08)", margin: "0 auto" }}>
        <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.1s both" }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{ margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: T.coral, fontFamily: "'Manrope',sans-serif" }}>Admin Portal</p>
            <h2 style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 900, color: T.navy, fontFamily: "'Montserrat',sans-serif", letterSpacing: "-0.5px" }}>Welcome back</h2>
            <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>Sign in to manage vendors and payments.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Email Address">
              <input style={{ ...inp }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@shubhinfra.com" onFocus={focusStyle} onBlur={blurStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} autoFocus />
            </Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input style={{ ...inp, paddingRight: 44 }} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onFocus={focusStyle} onBlur={blurStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}>
                  {show
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke={T.muted} strokeWidth="2" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke={T.muted} strokeWidth="2" strokeLinecap="round" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={T.muted} strokeWidth="2" /><circle cx="12" cy="12" r="3" stroke={T.muted} strokeWidth="2" /></svg>
                  }
                </button>
              </div>
            </Field>

            {error && (
              <div style={{ background: "rgba(227,74,47,0.08)", border: "1px solid rgba(227,74,47,0.25)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: 13, color: T.coral, fontFamily: "'Manrope',sans-serif" }}>{error}</p>
              </div>
            )}

            <button style={{ ...makeBtn("primary", { justifyContent: "center", padding: "14px 20px", fontSize: 14, marginTop: 4, borderRadius: 50, width: "100%" }) }} onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} /> Signing in…</>
              ) : "Sign In →"}
            </button>
          </div>

          <p style={{ margin: "28px 0 0", fontSize: 11, color: T.hint, textAlign: "center", lineHeight: 1.7 }}>
            Restricted to authorised administrators only.<br />Shubh Infracon · Sanand, Gujarat
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [companies, setCompanies] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filterCompany, setFilterCompany] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [successPayment, setSuccessPayment] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchParams] = useSearchParams();

  // ── Load Razorpay SDK + scroll listener + tab deep-link ──
  useEffect(() => {
    if (!document.getElementById("razorpay-sdk")) {
      const sc = document.createElement("script");
      sc.id = "razorpay-sdk";
      sc.src = "https://checkout.razorpay.com/v1/checkout.js";
      sc.async = true;
      document.head.appendChild(sc);
    }
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });

    const tabParam = searchParams.get("tab");
    if (tabParam && ["dashboard", "companies", "vendors", "payments"].includes(tabParam)) {
      setTab(tabParam);
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, [searchParams]);

  // ── Restore session from localStorage on mount ──
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser({ email: session.email, uid: session.uid });
      setToken(session.token);
    }
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAuthError = useCallback(() => {
    // Token expired mid-session
    clearSession();
    setToken(null);
    setUser(null);
    setCompanies([]);
    setVendors([]);
    setPayments([]);
    setSessionExpired(true);
  }, []);

  const loadAll = useCallback(async (tok) => {
    setLoading(true);
    try {
      const [cD, vD, pD] = await Promise.all([
        fsList(tok, "companies"),
        fsList(tok, "vendors"),
        fsList(tok, "payments"),
      ]);
      setCompanies(cD.map(docToObj).filter(Boolean));
      setVendors(vD.map(docToObj).filter(Boolean));
      setPayments(pD.map(docToObj).filter(Boolean));
    } catch (e) {
      if (e.message === "AUTH_EXPIRED") {
        handleAuthError();
      } else {
        showToast("Failed to load data", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    if (token) loadAll(token);
  }, [token, loadAll]);

  function handleLogin(u) {
    // u = { token, uid, email, expiresAt }
    saveSession(u);
    setUser({ email: u.email, uid: u.uid });
    setToken(u.token);
    setSessionExpired(false);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setToken(null);
    setCompanies([]);
    setVendors([]);
    setPayments([]);
    setSessionExpired(false);
  }

  async function saveCompany(form, existing) {
    setSaving(true);
    try {
      existing
        ? await fsSet(token, `companies/${existing.id}`, form)
        : await fsCreate(token, "companies", { ...form, createdAt: new Date().toISOString() });
      showToast(existing ? "Company updated" : "Company added");
      await loadAll(token);
      setModal(null);
    } catch (e) {
      if (e.message?.includes("401")) handleAuthError();
      else showToast(e.message, "error");
    } finally { setSaving(false); }
  }

  async function deleteCompany(id) {
    if (!window.confirm("Delete this company and all its vendors?")) return;
    setSaving(true);
    try {
      await fsDelete(token, `companies/${id}`);
      await Promise.all(vendors.filter((v) => v.companyId === id).map((v) => fsDelete(token, `vendors/${v.id}`)));
      await loadAll(token);
      showToast("Company deleted");
    } catch (e) {
      showToast(e.message, "error");
    } finally { setSaving(false); }
  }

  async function saveVendor(form, existing) {
    setSaving(true);
    try {
      const data = { ...form, amountPaid: existing?.amountPaid ?? 0, createdAt: existing?.createdAt || new Date().toISOString() };
      existing
        ? await fsSet(token, `vendors/${existing.id}`, data)
        : await fsCreate(token, "vendors", data);
      showToast(existing ? "Vendor updated" : "Vendor added");
      await loadAll(token);
      setModal(null);
    } catch (e) {
      if (e.message?.includes("401")) handleAuthError();
      else showToast(e.message, "error");
    } finally { setSaving(false); }
  }

  async function deleteVendor(id) {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await fsDelete(token, `vendors/${id}`);
      await loadAll(token);
      showToast("Vendor deleted");
    } catch (e) { showToast(e.message, "error"); }
  }

  async function recordPayment(vendor, form, useRazorpay) {
    const amount = Number(form.amountPaid || 0);
    const due = Number(vendor.netAmount || 0) - Number(vendor.amountPaid || 0);

    if (!amount || amount <= 0) { showToast("Enter a valid amount", "error"); return; }
    if (amount > due + 0.01) { showToast("Amount exceeds outstanding balance", "error"); return; }
    if (form.particulars && form.particulars.length > 200) { showToast("Particulars too long", "error"); return; }

    if (useRazorpay) {
      setSaving(true);
      openRazorpayCheckout({
        amount, vendorName: vendor.name, description: form.particulars || vendor.description,
        onSuccess: async (paymentId) => {
          try { await commitPayment(vendor, { ...form, chequeNo: paymentId, paymentMode: "Razorpay X" }, amount, paymentId); }
          catch (e) { showToast(e.message, "error"); } finally { setSaving(false); }
        },
        onFailure: (msg) => { showToast(`Razorpay: ${msg}`, "error"); setSaving(false); },
      });
    } else {
      setSaving(true);
      try { await commitPayment(vendor, form, amount, null); }
      catch (e) { showToast(e.message, "error"); } finally { setSaving(false); }
    }
  }

  async function commitPayment(vendor, form, amount, razorpayId) {
    const newPaid = Number(vendor.amountPaid || 0) + amount;
    await fsCreate(token, "payments", {
      vendorId: vendor.id, vendorName: vendor.name, companyId: vendor.companyId,
      date: form.date, particulars: form.particulars || "", chequeNo: form.chequeNo || razorpayId || "",
      amountPaid: amount, paymentMode: form.paymentMode, razorpayId: razorpayId || "",
      createdAt: new Date().toISOString(),
    });
    await fsSet(token, `vendors/${vendor.id}`, { ...vendor, amountPaid: newPaid });
    await loadAll(token);
    setModal(null);
    setSuccessPayment({ amount, vendor: vendor.name, paymentId: razorpayId });
  }

  // Not logged in
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes scrollTopReveal{from{opacity:0;transform:translateY(16px) scale(0.85)}to{opacity:1;transform:translateY(0) scale(1)}}
        input:focus,select:focus{outline:none;}
        button:disabled{opacity:0.55;cursor:not-allowed;}
        button:not(:disabled):hover{opacity:0.88;}
        button:not(:disabled):active{transform:scale(0.97);}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:rgba(30,42,90,0.18);border-radius:99px}
        ::-webkit-scrollbar-track{background:transparent}
        html{scroll-behavior:smooth}
      `}</style>

      {/* Session expired overlay */}
      {sessionExpired && (
        <SessionExpiredBanner onLogin={() => setSessionExpired(false)} />
      )}

      <Navbar user={user} tab={tab} setTab={setTab} onLogout={handleLogout} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 60px" }}>
        {loading ? <Spinner /> : (
          <div>
            {tab === "dashboard" && <DashboardTab companies={companies} vendors={vendors} payments={payments} filterCompany={filterCompany} setFilterCompany={setFilterCompany} setTab={setTab} />}
            {tab === "companies" && <CompaniesTab companies={companies} vendors={vendors} onAdd={() => setModal({ type: "addCompany" })} onEdit={(c) => setModal({ type: "editCompany", data: c })} onDelete={deleteCompany} />}
            {tab === "vendors" && <VendorsTab vendors={vendors} companies={companies} onAdd={() => setModal({ type: "addVendor" })} onEdit={(v) => setModal({ type: "editVendor", data: v })} onDelete={deleteVendor} onPay={(v) => setModal({ type: "payment", data: v })} />}
            {tab === "payments" && <PaymentsTab payments={payments} companies={companies} />}
          </div>
        )}
      </main>

      {/* Scroll to top */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ position: "fixed", bottom: 28, right: 24, width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${T.coral},#f5743a)`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(227,74,47,0.4)", animation: "scrollTopReveal 0.4s cubic-bezier(.34,1.56,.64,1) both", zIndex: 900 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}

      {/* Modals */}
      {modal?.type === "addCompany" && (
        <Modal title="Add New Company" subtitle="Fill in the company details below" onClose={() => setModal(null)} width={640}>
          <CompanyForm onSave={(f) => saveCompany(f, null)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "editCompany" && (
        <Modal title="Edit Company" subtitle={modal.data.name} onClose={() => setModal(null)} width={640}>
          <CompanyForm initial={modal.data} onSave={(f) => saveCompany(f, modal.data)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "addVendor" && (
        <Modal title="Add New Vendor" subtitle="Enter vendor and invoice details" onClose={() => setModal(null)} width={700}>
          <VendorForm companies={companies} onSave={(f) => saveVendor(f, null)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "editVendor" && (
        <Modal title="Edit Vendor" subtitle={modal.data.name} onClose={() => setModal(null)} width={700}>
          <VendorForm initial={modal.data} companies={companies} onSave={(f) => saveVendor(f, modal.data)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "payment" && (
        <Modal title="Record Payment" subtitle={`Outstanding to ${modal.data.name}`} onClose={() => setModal(null)} width={540}>
          <PaymentForm vendor={modal.data} onSave={(f, useRzp) => recordPayment(modal.data, f, useRzp)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {successPayment && (
        <PaymentSuccess
          amount={successPayment.amount}
          vendor={successPayment.vendor}
          paymentId={successPayment.paymentId}
          onClose={() => setSuccessPayment(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? `linear-gradient(135deg,${T.coral},#c73b22)` : `linear-gradient(135deg,${T.success},#25c492)`, color: "#fff", padding: "13px 22px", borderRadius: 50, fontSize: 13, fontWeight: 600, zIndex: 3000, display: "flex", alignItems: "center", gap: 8, boxShadow: toast.type === "error" ? "0 8px 24px rgba(227,74,47,0.4)" : "0 8px 24px rgba(29,158,117,0.4)", animation: "toastIn 0.3s cubic-bezier(.34,1.56,.64,1) both", whiteSpace: "nowrap", fontFamily: "'Manrope',sans-serif" }}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}