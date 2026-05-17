import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

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
  const expiresAt = Date.now() + Number(d.expiresIn || 3600) * 1000;
  return { token: d.idToken, uid: d.localId, email: d.email, expiresAt };
}

function saveSession(user) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch (e) {}
}
function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt - 60_000) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}
function clearSession() { localStorage.removeItem(AUTH_KEY); }

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

/* ─── Style helpers ──────────────────────────────────────────────────────── */
const makeBtn = (variant = "default", extra = {}) => ({
  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
  fontSize: 13, fontWeight: 600, letterSpacing: "0.3px",
  padding: "9px 18px", borderRadius: 50,
  border: variant === "outline" ? `1.5px solid ${T.navy}` : "none",
  background:
    variant === "primary" ? `linear-gradient(135deg,${T.coral},#f5743a)` :
    variant === "navy" ? `linear-gradient(135deg,${T.navy},#2d3d7a)` :
    variant === "razorpay" ? "linear-gradient(135deg,#3395FF,#1a7de8)" :
    variant === "danger" ? `linear-gradient(135deg,${T.danger},#c73b22)` :
    variant === "success" ? `linear-gradient(135deg,${T.success},#25c492)` :
    variant === "ghost" ? "transparent" : "rgba(30,42,90,0.06)",
  color: ["primary","navy","razorpay","danger","success"].includes(variant) ? "#fff" : T.navy,
  boxShadow:
    variant === "primary" ? "0 3px 12px rgba(227,74,47,0.30)" :
    variant === "navy" ? "0 3px 12px rgba(30,42,90,0.30)" :
    variant === "razorpay" ? "0 3px 12px rgba(51,149,255,0.30)" : "none",
  transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif", ...extra,
});

const inp = {
  width: "100%", boxSizing: "border-box", padding: "10px 13px",
  borderRadius: 10, border: `1.5px solid ${T.border2}`,
  background: "#fff", color: T.navy, fontSize: 13, outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const card = {
  background: "#fff", borderRadius: 16,
  border: `1px solid ${T.border}`,
  padding: "20px", boxShadow: "0 1px 12px rgba(30,42,90,0.06)",
};

/* ─── Micro components ───────────────────────────────────────────────────── */
function Badge({ children, color = "navy" }) {
  const map = {
    navy:  { bg: "rgba(30,42,90,0.08)",   text: T.navy },
    coral: { bg: "rgba(227,74,47,0.10)",  text: T.coral },
    green: { bg: "rgba(29,158,117,0.10)", text: "#0e7a5a" },
    red:   { bg: "rgba(227,74,47,0.10)",  text: T.coral },
    amber: { bg: "rgba(239,159,39,0.12)", text: "#9a620a" },
    blue:  { bg: "rgba(55,138,221,0.10)", text: "#1a5a9e" },
  };
  const t = map[color] || map.navy;
  return (
    <span style={{ background: t.bg, color: t.text, fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 99, letterSpacing: "0.5px",
      textTransform: "uppercase", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {children}
    </span>
  );
}

function ProgressBar({ pct, color }) {
  const c = color || (pct >= 100 ? T.success : T.amber);
  return (
    <div style={{ height: 4, background: "rgba(30,42,90,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct || 0)}%`,
        background: c, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "5rem 0", gap: 14 }}>
      <div style={{ width: 36, height: 36, border: `3px solid rgba(30,42,90,0.1)`,
        borderTopColor: T.coral, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ color: T.muted, fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", margin: 0 }}>
        Loading…
      </p>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "3rem 2rem" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <p style={{ margin: 0, color: T.muted, fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{text}</p>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, width = 540 }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.50)",
        backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: T.cream, borderRadius: 20, width: "100%", maxWidth: width,
        maxHeight: "94vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(10,14,30,0.20)", border: `1px solid ${T.border}`,
        animation: "modalIn 0.28s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.navy,
                fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</h3>
              {subtitle && <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted,
                fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{subtitle}</p>}
            </div>
            <button style={{ ...makeBtn("ghost", { padding: 6, borderRadius: 8,
              background: "rgba(30,42,90,0.06)" }) }} onClick={onClose}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke={T.navy} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg,${T.coral},${T.gold})`,
            borderRadius: 99, marginBottom: 0 }} />
        </div>
        <div style={{ padding: "18px 24px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 5,
        fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase",
        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: T.hint,
        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{hint}</p>}
    </div>
  );
}

const focusOn  = (e) => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = `0 0 0 3px ${T.coral}20`; };
const focusOff = (e) => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; };

/* ─── Section Header ─────────────────────────────────────────────────────── */
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy,
        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</h2>
      {action}
    </div>
  );
}

/* ─── Forms ──────────────────────────────────────────────────────────────── */
function CompanyForm({ initial, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || {
    name: "", gstin: "", pan: "", stateCode: "24",
    msmeNo: "", address: "", phone: "", email: "", totalBudget: "",
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Company Name *">
            <input style={inp} type="text" value={f.name} onChange={set("name")} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        </div>
        {[["GSTIN","gstin","text"],["PAN","pan","text"],["State Code","stateCode","text"],["MSME No.","msmeNo","text"]].map(([l,k,t]) => (
          <Field key={k} label={l}>
            <input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        ))}
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Address">
            <input style={inp} type="text" value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        </div>
        {[["Phone","phone","tel"],["Email","email","email"],["Total Budget (₹)","totalBudget","number"]].map(([l,k,t]) => (
          <Field key={k} label={l}>
            <input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <button style={makeBtn("default")} onClick={onClose}>Cancel</button>
        <button style={makeBtn("primary")} onClick={() => onSave(f)} disabled={saving}>
          {saving ? "Saving…" : initial ? "Update" : "Add Company"}
        </button>
      </div>
    </div>
  );
}

function VendorForm({ initial, companies, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || {
    name: "", companyId: companies[0]?.id || "",
    gstin: "", pan: "", phone: "", email: "", address: "", description: "",
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Company *">
        <select style={inp} value={f.companyId} onChange={set("companyId")} onFocus={focusOn} onBlur={focusOff}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Vendor Name *">
            <input style={inp} type="text" value={f.name} onChange={set("name")} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        </div>
        {[["GSTIN","gstin","text"],["PAN","pan","text"],["Phone","phone","tel"],["Email","email","email"]].map(([l,k,t]) => (
          <Field key={k} label={l}>
            <input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        ))}
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Address">
            <input style={inp} type="text" value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Description / Work">
            <input style={inp} type="text" value={f.description} onChange={set("description")} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <button style={makeBtn("default")} onClick={onClose}>Cancel</button>
        <button style={makeBtn("primary")} onClick={() => onSave(f)} disabled={saving}>
          {saving ? "Saving…" : initial ? "Update" : "Add Vendor"}
        </button>
      </div>
    </div>
  );
}

/* ─── Bill Form ──────────────────────────────────────────────────────────── */
function BillForm({ initial, vendor, companies, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || {
    hsnCode: "", invoiceNo: "", invoiceDate: today(),
    totalBill: "", cgst: "", sgst: "", tds: "", description: "",
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const subTotal    = Number(f.totalBill || 0);
  const cgstAmt     = Number(f.cgst || 0);
  const sgstAmt     = Number(f.sgst || 0);
  const billWithGST = subTotal + cgstAmt + sgstAmt;
  const tdsAmt      = Number(f.tds || 0);
  const netAmount   = billWithGST - tdsAmt;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Vendor info */}
      <div style={{ background: `linear-gradient(135deg,${T.navy},#2d3d7a)`, borderRadius: 12,
        padding: "14px 16px", color: "#fff", display: "flex", justifyContent: "space-between",
        alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {vendor.name}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.65, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {companies.find(c => c.id === vendor.companyId)?.name || ""}
          </p>
        </div>
        <Badge color="coral">{initial ? "Edit Bill" : "New Bill"}</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["Description","description","text"],["HSN Code","hsnCode","text"],
          ["Invoice No.","invoiceNo","text"],["Invoice Date","invoiceDate","date"]].map(([l,k,t]) => (
          <Field key={k} label={l}>
            <input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} />
          </Field>
        ))}
      </div>

      {/* Bill breakdown */}
      <div style={{ background: "rgba(30,42,90,0.03)", borderRadius: 12, padding: 16,
        border: `1px solid ${T.border}` }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: T.navy,
          letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Bill Breakdown
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {[["Sub Total (₹)","totalBill"],["CGST (₹)","cgst"],["SGST (₹)","sgst"],["TDS (₹)","tds"]].map(([l,k]) => (
            <Field key={k} label={l}>
              <input style={inp} type="number" value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} />
            </Field>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1.7 }}>
            <p style={{ margin: 0 }}>GST Total: {fmtINR(billWithGST)}</p>
            <p style={{ margin: 0 }}>TDS: −{fmtINR(tdsAmt)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: T.muted, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Net Payable</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.coral,
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{fmtINR(netAmount)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <button style={makeBtn("default")} onClick={onClose}>Cancel</button>
        <button style={makeBtn("primary")} onClick={() => onSave({ ...f, billWithGST, netAmount })} disabled={saving}>
          {saving ? "Saving…" : initial ? "Update Bill" : "Add Bill"}
        </button>
      </div>
    </div>
  );
}

/* ─── Payment Form ───────────────────────────────────────────────────────── */
function PaymentForm({ bill, vendor, onSave, onClose, saving }) {
  const due = Number(bill.netAmount || 0) - Number(bill.amountPaid || 0);
  const [f, setF] = useState({
    date: today(), particulars: "", chequeNo: "",
    amountPaid: String(due > 0 ? due.toFixed(2) : ""),
    paymentMode: "Razorpay X",
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const isRazorpay = f.paymentMode === "Razorpay X";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Bill summary */}
      <div style={{ background: `linear-gradient(135deg,${T.navy},#2d3d7a)`, borderRadius: 12,
        padding: "16px 18px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {vendor.name}
            </p>
            {bill.invoiceNo && (
              <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.65, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Invoice #{bill.invoiceNo} · {bill.invoiceDate}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 10, opacity: 0.6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Outstanding</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#ff8070",
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{fmtINR(due)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12, paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, opacity: 0.6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Net Payable</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {fmtINR(bill.netAmount)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 10, opacity: 0.6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Paid</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6ee7c0",
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{fmtINR(bill.amountPaid)}</p>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar
            pct={Number(bill.netAmount) > 0 ? (Number(bill.amountPaid) / Number(bill.netAmount)) * 100 : 0}
            color="#6ee7c0"
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Payment Date">
          <input style={inp} type="date" value={f.date} onChange={set("date")} onFocus={focusOn} onBlur={focusOff} />
        </Field>
        <Field label="Amount (₹) *">
          <input style={inp} type="number" value={f.amountPaid} onChange={set("amountPaid")} onFocus={focusOn} onBlur={focusOff} />
        </Field>
        <Field label="Particulars">
          <input style={inp} type="text" value={f.particulars} onChange={set("particulars")}
            placeholder="Reference / description" onFocus={focusOn} onBlur={focusOff} />
        </Field>
        <Field label="Cheque / UTR No.">
          <input style={inp} type="text" value={f.chequeNo} onChange={set("chequeNo")}
            placeholder="Optional" onFocus={focusOn} onBlur={focusOff} />
        </Field>
      </div>

      <Field label="Payment Mode">
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {["Cash","Cheque","NEFT","RTGS","UPI","Razorpay X"].map((m) => (
            <button key={m} onClick={() => setF((p) => ({ ...p, paymentMode: m }))} style={{
              padding: "7px 14px", borderRadius: 50, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: f.paymentMode === m ? "none" : `1.5px solid ${T.border2}`,
              background: f.paymentMode === m
                ? (m === "Razorpay X" ? "linear-gradient(135deg,#3395FF,#1a7de8)" : `linear-gradient(135deg,${T.coral},#f5743a)`)
                : "#fff",
              color: f.paymentMode === m ? "#fff" : T.muted,
              transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}>{m}</button>
          ))}
        </div>
      </Field>

      {isRazorpay && (
        <div style={{ background: "rgba(51,149,255,0.07)", borderRadius: 10, padding: "10px 14px",
          border: "1px solid rgba(51,149,255,0.18)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#185FA5", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            ℹ️ Clicking "Pay via Razorpay X" opens secure checkout for {fmtINR(f.amountPaid)}.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <button style={makeBtn("default")} onClick={onClose}>Cancel</button>
        {isRazorpay ? (
          <button style={makeBtn("razorpay")} onClick={() => onSave(f, true)} disabled={saving || !f.amountPaid}>
            {saving ? "Processing…" : `⚡ Pay ${fmtINR(f.amountPaid)}`}
          </button>
        ) : (
          <button style={makeBtn("primary")} onClick={() => onSave(f, false)} disabled={saving || !f.amountPaid}>
            {saving ? "Recording…" : "✓ Record Payment"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Payment Success ────────────────────────────────────────────────────── */
function PaymentSuccess({ amount, vendor, paymentId, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.60)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 2000, padding: 16 }}>
      <div style={{ background: T.cream, borderRadius: 20, maxWidth: 380, width: "100%",
        padding: "2.5rem 2rem", textAlign: "center",
        boxShadow: "0 24px 60px rgba(10,14,30,0.22)",
        animation: "modalIn 0.35s cubic-bezier(.34,1.56,.64,1) both",
        border: `1px solid ${T.border}` }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%",
          background: `linear-gradient(135deg,${T.success},#25c492)`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16, boxShadow: `0 6px 20px rgba(29,158,117,0.30)` }}>
          <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
            <path d="M6 15l7 7 11-13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: T.navy,
          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Payment Successful!</h2>
        <p style={{ margin: "0 0 20px", color: T.muted, fontSize: 13,
          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {fmtINR(amount)} recorded for <strong style={{ color: T.navy }}>{vendor}</strong>
        </p>
        {paymentId && (
          <div style={{ background: "rgba(30,42,90,0.05)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 10, color: T.muted, textTransform: "uppercase",
              letterSpacing: "1px", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Razorpay ID</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 600, color: T.blue,
              fontFamily: "monospace" }}>{paymentId}</p>
          </div>
        )}
        <button style={{ ...makeBtn("primary", { width: "100%", justifyContent: "center", padding: "11px 20px" }) }}
          onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* ─── Session Expired ────────────────────────────────────────────────────── */
function SessionExpiredBanner({ onLogin }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.70)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 3000, padding: 16 }}>
      <div style={{ background: T.cream, borderRadius: 20, maxWidth: 380, width: "100%",
        padding: "2.5rem 2rem", textAlign: "center",
        boxShadow: "0 24px 60px rgba(10,14,30,0.22)", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>⏱️</div>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: T.navy,
          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Session Expired</h2>
        <p style={{ margin: "0 0 20px", color: T.muted, fontSize: 13,
          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Your session has expired. Please sign in again.
        </p>
        <button style={{ ...makeBtn("primary", { width: "100%", justifyContent: "center", padding: "11px 20px" }) }}
          onClick={onLogin}>Sign In Again</button>
      </div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar({ user, tab, setTab, onLogout }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "▦" },
    { key: "companies", label: "Companies", icon: "🏢" },
    { key: "vendors",   label: "Vendors",   icon: "👥" },
    { key: "payments",  label: "Payments",  icon: "🧾" },
  ];

  return (
    <header style={{ background: T.navy, position: "sticky", top: 0, zIndex: 500,
      boxShadow: "0 2px 20px rgba(10,14,30,0.22)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg,${T.coral},${T.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(227,74,47,0.35)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 14,
                fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Shubh Infracon</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 9.5,
                fontFamily: "'Plus Jakarta Sans',sans-serif", textTransform: "uppercase",
                letterSpacing: "0.8px" }}>Vendor Management</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 2 }}>
            {navItems.map((n) => (
              <button key={n.key} onClick={() => setTab(n.key)} style={{
                background: tab === n.key ? "rgba(255,255,255,0.12)" : "transparent",
                border: tab === n.key ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
                borderRadius: 50, padding: "7px 15px",
                color: tab === n.key ? "#fff" : "rgba(255,255,255,0.50)",
                fontWeight: tab === n.key ? 700 : 500, fontSize: 12.5, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.18s",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 10 }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          {/* User / Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.09)", borderRadius: 50,
              padding: "5px 12px 5px 7px", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%",
                background: `linear-gradient(135deg,${T.coral},${T.gold})`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.70)",
                fontFamily: "'Plus Jakarta Sans',sans-serif", maxWidth: 130,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
            </div>
            {/* Logout → navigates to / */}
            <button onClick={onLogout} title="Logout" style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(227,74,47,0.14)", border: "1px solid rgba(227,74,47,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="#ff6b5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── StatCard ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, accent, delay = 0 }) {
  return (
    <div style={{ ...card, position: "relative", overflow: "hidden",
      animation: `fadeUp 0.5s ease ${delay}ms both` }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70,
        borderRadius: "50%", background: accent ? `${accent}12` : "rgba(30,42,90,0.04)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 10.5, color: T.muted, textTransform: "uppercase",
          letterSpacing: "0.8px", fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{label}</p>
        {icon && (
          <div style={{ width: 30, height: 30, borderRadius: 8,
            background: accent ? `${accent}15` : "rgba(30,42,90,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: accent || T.navy,
        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{value}</p>
    </div>
  );
}

/* ─── Dashboard Tab ──────────────────────────────────────────────────────── */
function DashboardTab({ companies, vendors, bills, payments, setTab }) {
  const sum = (arr, key) => arr.reduce((s, v) => s + Number(v[key] || 0), 0);

  const totalNet  = sum(bills, "netAmount");
  const totalPaid = sum(bills, "amountPaid");
  const totalDue  = totalNet - totalPaid;
  const totalTDS  = sum(bills, "tds");

  const cVendors = (cid) => vendors.filter(v => v.companyId === cid).length;
  const cBills   = (cid) => {
    const vids = vendors.filter(v => v.companyId === cid).map(v => v.id);
    return bills.filter(b => vids.includes(b.vendorId));
  };
  const cNet  = (cid) => sum(cBills(cid), "netAmount");
  const cPaid = (cid) => sum(cBills(cid), "amountPaid");

  const recentPayments = [...payments]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <StatCard label="Companies"    value={companies.length} icon="🏢" delay={0} />
        <StatCard label="Vendors"      value={vendors.length}   icon="👥" delay={50} />
        <StatCard label="Total Bills"  value={bills.length}     icon="📋" delay={100} />
        <StatCard label="Net Payable"  value={fmtINR(totalNet)}  accent={T.navy}    icon="💼" delay={150} />
        <StatCard label="Amount Paid"  value={fmtINR(totalPaid)} accent={T.success} icon="✅" delay={200} />
        <StatCard label="Outstanding"  value={fmtINR(totalDue)}
          accent={totalDue > 0 ? T.coral : T.success} icon={totalDue > 0 ? "⚠️" : "🎉"} delay={250} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Companies panel */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.navy,
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Companies</h3>
            <button style={{ ...makeBtn("default", { fontSize: 11, padding: "5px 12px",
              background: "#fff", border: `1.5px solid ${T.border2}` }) }}
              onClick={() => setTab("companies")}>View All →</button>
          </div>
          {companies.length === 0 ? (
            <p style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "1.5rem 0",
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No companies yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {companies.slice(0, 4).map((c) => {
                const net  = cNet(c.id);
                const paid = cPaid(c.id);
                const pct  = net > 0 ? (paid / net) * 100 : 0;
                return (
                  <div key={c.id} style={{ padding: "12px 14px", borderRadius: 10,
                    background: "rgba(30,42,90,0.03)", border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.navy,
                          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{c.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted,
                          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                          {cVendors(c.id)} vendor{cVendors(c.id) !== 1 ? "s" : ""}
                          &nbsp;·&nbsp;{cBills(c.id).length} bill{cBills(c.id).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.coral,
                          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{fmtINR(net - paid)}</p>
                        <p style={{ margin: 0, fontSize: 10, color: T.muted,
                          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>due</p>
                      </div>
                    </div>
                    <ProgressBar pct={pct} />
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: T.hint,
                      fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pct.toFixed(0)}% settled</p>
                  </div>
                );
              })}
              {companies.length > 4 && (
                <button style={{ ...makeBtn("default", { fontSize: 11, padding: "7px 14px",
                  width: "100%", justifyContent: "center", background: "#fff",
                  border: `1.5px solid ${T.border2}` }) }}
                  onClick={() => setTab("companies")}>
                  +{companies.length - 4} more companies →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Vendors panel */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.navy,
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Vendors</h3>
            <button style={{ ...makeBtn("default", { fontSize: 11, padding: "5px 12px",
              background: "#fff", border: `1.5px solid ${T.border2}` }) }}
              onClick={() => setTab("vendors")}>View All →</button>
          </div>
          {vendors.length === 0 ? (
            <p style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "1.5rem 0",
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No vendors yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {vendors.slice(0, 5).map((v) => {
                const vBills  = bills.filter(b => b.vendorId === v.id);
                const vNet    = vBills.reduce((s, b) => s + Number(b.netAmount || 0), 0);
                const vPaid   = vBills.reduce((s, b) => s + Number(b.amountPaid || 0), 0);
                const vDue    = vNet - vPaid;
                const comp    = companies.find(c => c.id === v.companyId);
                const status  = vDue <= 0 && vNet > 0 ? "paid" : vPaid > 0 ? "partial" : "unpaid";
                const sColor  = { paid: T.success, partial: T.amber, unpaid: T.coral }[status];
                return (
                  <div key={v.id} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "10px 12px", borderRadius: 10,
                    background: "rgba(30,42,90,0.03)", border: `1px solid ${T.border}`,
                    borderLeft: `3px solid ${sColor}` }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.navy,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10.5, color: T.muted,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {comp?.name || "—"} · {vBills.length} bill{vBills.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: sColor,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{fmtINR(vDue)}</p>
                      <p style={{ margin: 0, fontSize: 10, color: T.muted,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>due</p>
                    </div>
                  </div>
                );
              })}
              {vendors.length > 5 && (
                <button style={{ ...makeBtn("default", { fontSize: 11, padding: "7px 14px",
                  width: "100%", justifyContent: "center", background: "#fff",
                  border: `1.5px solid ${T.border2}` }) }}
                  onClick={() => setTab("vendors")}>
                  +{vendors.length - 5} more vendors →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment History panel */}
      <div style={{ ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.navy,
            fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Payment History</h3>
          <button style={{ ...makeBtn("default", { fontSize: 11, padding: "5px 12px",
            background: "#fff", border: `1.5px solid ${T.border2}` }) }}
            onClick={() => setTab("payments")}>View All →</button>
        </div>
        {recentPayments.length === 0 ? (
          <p style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "1.5rem 0",
            fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No payments yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recentPayments.map((p, i) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "12px 0",
                borderBottom: i < recentPayments.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10,
                    background: "rgba(29,158,117,0.09)", border: `1px solid rgba(29,158,117,0.15)`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke={T.success} strokeWidth="1.8" />
                      <path d="M2 10h20" stroke={T.success} strokeWidth="1.8" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.navy,
                      fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{p.vendorName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted,
                      fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      {p.date} · {p.particulars || "—"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge color={p.paymentMode === "Razorpay X" ? "blue" : "green"}>{p.paymentMode}</Badge>
                  <span style={{ fontWeight: 700, color: T.success, fontSize: 14,
                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{fmtINR(p.amountPaid)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Companies Tab ──────────────────────────────────────────────────────── */
function CompaniesTab({ companies, vendors, bills, onAdd, onEdit, onDelete }) {
  const cVendors = (cid) => vendors.filter(v => v.companyId === cid);
  const cBills   = (cid) => {
    const vids = cVendors(cid).map(v => v.id);
    return bills.filter(b => vids.includes(b.vendorId));
  };
  const sum = (arr, k) => arr.reduce((s, v) => s + Number(v[k] || 0), 0);

  return (
    <div>
      <SectionHeader title="Companies" action={
        <button style={makeBtn("primary")} onClick={onAdd}>+ Add Company</button>
      } />
      {companies.length === 0 && <Empty icon="🏢" text="No companies yet. Add your first one." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {companies.map((c, i) => {
          const cb   = cBills(c.id);
          const net  = sum(cb, "netAmount");
          const paid = sum(cb, "amountPaid");
          const due  = net - paid;
          const pct  = net > 0 ? (paid / net) * 100 : 0;
          return (
            <div key={c.id} style={{ ...card, padding: 0, overflow: "hidden",
              animation: `fadeUp 0.45s ease ${i * 70}ms both` }}>
              <div style={{ height: 3, background: pct >= 100
                ? `linear-gradient(90deg,${T.success},#25c492)`
                : `linear-gradient(90deg,${T.coral},${T.gold})` }} />
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11,
                      background: `linear-gradient(135deg,${T.navy},#2d3d7a)`,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" strokeWidth="1.8" />
                        <path d="M3 9h18M9 21V9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: T.navy,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{c.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {cVendors(c.id).length} vendors · {cb.length} bills
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => onEdit(c)} style={{ width: 30, height: 30,
                      borderRadius: 8, background: "rgba(30,42,90,0.06)",
                      border: `1px solid ${T.border}`, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={T.navy} strokeWidth="2" strokeLinecap="round" />
                        <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={T.navy} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button onClick={() => onDelete(c.id)} style={{ width: 30, height: 30,
                      borderRadius: 8, background: "rgba(227,74,47,0.07)",
                      border: "1px solid rgba(227,74,47,0.18)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <polyline points="3 6 5 6 21 6" stroke={T.coral} strokeWidth="2" strokeLinecap="round" />
                        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"
                          stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                {c.gstin && (
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted,
                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    GSTIN: <strong>{c.gstin}</strong>
                  </p>
                )}
                {c.address && (
                  <p style={{ margin: "0 0 12px", fontSize: 11, color: T.hint,
                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>📍 {c.address}</p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                  {[["Payable", fmtINR(net), null],
                    ["Paid",    fmtINR(paid), T.success],
                    ["Due",     fmtINR(due),  due > 0 ? T.coral : T.success]].map(([l, v, col]) => (
                    <div key={l} style={{ background: "rgba(30,42,90,0.04)", borderRadius: 9,
                      padding: "9px 10px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 9.5, color: col || T.muted,
                        textTransform: "uppercase", fontWeight: 600,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{l}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 700,
                        color: col || T.navy, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <ProgressBar pct={pct} />
                  <p style={{ margin: "4px 0 0", fontSize: 10.5, color: T.hint,
                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pct.toFixed(0)}% settled</p>
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
function VendorsTab({ vendors, companies, bills, onAdd, onEdit, onDelete, onAddBill, onEditBill, onDeleteBill, onPay }) {
  const [filterCo, setFilterCo] = useState("");
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = vendors
    .filter(v => !filterCo || v.companyId === filterCo)
    .filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Vendors" action={
        <button style={makeBtn("primary")} onClick={onAdd} disabled={companies.length === 0}>
          + Add Vendor
        </button>
      } />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 260 }}>
          <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={T.muted} strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke={T.muted} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input style={{ ...inp, paddingLeft: 33 }} placeholder="Search vendors…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onFocus={focusOn} onBlur={focusOff} />
        </div>
        <select style={{ ...inp, width: "auto" }} value={filterCo}
          onChange={(e) => setFilterCo(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <Empty icon="👥" text={search ? "No vendors match." : "No vendors yet."} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((v, i) => {
          const comp   = companies.find(c => c.id === v.companyId);
          const vBills = bills.filter(b => b.vendorId === v.id);
          const vNet   = vBills.reduce((s, b) => s + Number(b.netAmount  || 0), 0);
          const vPaid  = vBills.reduce((s, b) => s + Number(b.amountPaid || 0), 0);
          const vDue   = vNet - vPaid;
          const pct    = vNet > 0 ? (vPaid / vNet) * 100 : 0;
          const status = vDue <= 0 && vNet > 0 ? "paid" : vPaid > 0 ? "partial" : "unpaid";
          const sColor = { paid: T.success, partial: T.amber, unpaid: T.coral }[status];
          const sBadge = { paid: "green", partial: "amber", unpaid: "red" }[status];
          const isOpen = expanded[v.id];

          return (
            <div key={v.id} style={{ ...card, padding: 0, overflow: "hidden",
              borderLeft: `3px solid ${sColor}`,
              animation: `fadeUp 0.45s ease ${i * 50}ms both` }}>
              {/* Vendor header */}
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 6 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: T.navy,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v.name}</p>
                      {comp && <Badge color="navy">{comp.name}</Badge>}
                      <Badge color={sBadge}>{status === "paid" ? "✓ Paid" : status === "partial" ? "Partial" : "Unpaid"}</Badge>
                    </div>
                    {v.description && (
                      <p style={{ margin: "0 0 10px", fontSize: 12, color: T.muted,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v.description}</p>
                    )}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {[["Net", fmtINR(vNet), null], ["Paid", fmtINR(vPaid), T.success],
                        ["Due", fmtINR(vDue), vDue > 0 ? T.coral : T.success]].map(([l, val, col]) => (
                        <div key={l}>
                          <p style={{ margin: 0, fontSize: 10, color: T.muted, textTransform: "uppercase",
                            fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{l}</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: col || T.navy,
                            fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{val}</p>
                        </div>
                      ))}
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: T.muted, textTransform: "uppercase",
                          fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Bills</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.navy,
                          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{vBills.length}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <ProgressBar pct={pct} />
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: T.hint,
                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pct.toFixed(1)}% settled</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    <button style={makeBtn("default", { fontSize: 11, padding: "7px 12px",
                      background: "#fff", border: `1.5px solid ${T.border2}` })}
                      onClick={() => toggle(v.id)}>
                      {isOpen ? "▲ Hide" : "▼ Bills"}
                    </button>
                    <button style={makeBtn("primary", { fontSize: 11, padding: "7px 12px" })}
                      onClick={() => onAddBill(v)}>+ Bill</button>
                    <button style={makeBtn("default", { fontSize: 11, padding: "7px 12px",
                      background: "#fff", border: `1.5px solid ${T.border2}` })}
                      onClick={() => onEdit(v)}>✏️ Edit</button>
                    <button style={makeBtn("danger", { fontSize: 11, padding: "7px 12px" })}
                      onClick={() => onDelete(v.id)}>🗑️</button>
                  </div>
                </div>
              </div>

              {/* Bills list (expandable) */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${T.border}`,
                  background: "rgba(30,42,90,0.02)", padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.muted,
                      textTransform: "uppercase", letterSpacing: "0.8px",
                      fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      Bills ({vBills.length})
                    </p>
                  </div>
                  {vBills.length === 0 ? (
                    <p style={{ color: T.muted, fontSize: 12, padding: "0.5rem 0",
                      fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      No bills yet. Click "+ Bill" to add one.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {vBills.map((b) => {
                        const bDue  = Number(b.netAmount || 0) - Number(b.amountPaid || 0);
                        const bPct  = Number(b.netAmount) > 0 ? (Number(b.amountPaid) / Number(b.netAmount)) * 100 : 0;
                        const bStat = bDue <= 0 && Number(b.netAmount) > 0 ? "paid" : Number(b.amountPaid) > 0 ? "partial" : "unpaid";
                        const bCol  = { paid: T.success, partial: T.amber, unpaid: T.coral }[bStat];
                        return (
                          <div key={b.id} style={{ background: "#fff", borderRadius: 10,
                            border: `1px solid ${T.border}`, padding: "12px 14px",
                            borderLeft: `3px solid ${bCol}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between",
                              alignItems: "flex-start", gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7,
                                  flexWrap: "wrap", marginBottom: 6 }}>
                                  {b.invoiceNo && (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: T.navy,
                                      fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                      #{b.invoiceNo}
                                    </span>
                                  )}
                                  {b.invoiceDate && (
                                    <span style={{ fontSize: 11, color: T.muted,
                                      fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                      {b.invoiceDate}
                                    </span>
                                  )}
                                  <Badge color={bStat === "paid" ? "green" : bStat === "partial" ? "amber" : "red"}>
                                    {bStat === "paid" ? "Paid" : bStat === "partial" ? "Partial" : "Unpaid"}
                                  </Badge>
                                </div>
                                {b.description && (
                                  <p style={{ margin: "0 0 6px", fontSize: 11.5, color: T.muted,
                                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{b.description}</p>
                                )}
                                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                                  {[["Sub Total", b.totalBill], ["CGST", b.cgst], ["SGST", b.sgst],
                                    ["TDS", b.tds], ["Net", b.netAmount],
                                    ["Paid", b.amountPaid, T.success], ["Due", bDue, bDue > 0 ? T.coral : T.success]
                                  ].map(([l, val, col]) => (
                                    <div key={l}>
                                      <p style={{ margin: 0, fontSize: 9.5, color: T.muted,
                                        textTransform: "uppercase", fontWeight: 600,
                                        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{l}</p>
                                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600,
                                        color: col || T.navy, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                        {fmtINR(val)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ marginTop: 8 }}>
                                  <ProgressBar pct={bPct} />
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                {bDue > 0 && (
                                  <button style={makeBtn("primary", { fontSize: 10.5, padding: "5px 10px" })}
                                    onClick={() => onPay(b, v)}>💳 Pay</button>
                                )}
                                <button style={makeBtn("default", { fontSize: 10.5, padding: "5px 10px",
                                  background: "#fff", border: `1.5px solid ${T.border2}` })}
                                  onClick={() => onEditBill(b, v)}>✏️</button>
                                <button style={makeBtn("danger", { fontSize: 10.5, padding: "5px 10px" })}
                                  onClick={() => onDeleteBill(b.id)}>🗑️</button>
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

/* ─── Payments Tab ───────────────────────────────────────────────────────── */
function PaymentsTab({ payments, companies }) {
  const [filterCo, setFilterCo] = useState("");
  const sum = (arr, k) => arr.reduce((s, v) => s + Number(v[k] || 0), 0);
  const filtered = [...payments]
    .filter(p => !filterCo || p.companyId === filterCo)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return (
    <div>
      <SectionHeader title="Payment History" action={
        <select style={{ ...inp, width: "auto" }} value={filterCo}
          onChange={(e) => setFilterCo(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      } />
      <div style={{ ...card, padding: 0 }}>
        <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ margin: 0, fontSize: 13, color: T.muted,
            fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <strong style={{ color: T.navy }}>{filtered.length}</strong> transactions ·
            Total <strong style={{ color: T.success }}>{fmtINR(sum(filtered, "amountPaid"))}</strong>
          </p>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ fontSize: 32, margin: "0 0 10px" }}>🧾</p>
            <p style={{ color: T.muted, fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", margin: 0 }}>
              No payments yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13,
              fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <thead>
                <tr style={{ background: "rgba(30,42,90,0.03)" }}>
                  {["Date","Vendor","Particulars","Cheque / UTR","Mode","Amount"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 16px", color: T.muted,
                      fontWeight: 600, fontSize: 11, letterSpacing: "0.6px",
                      textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(30,42,90,0.025)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 16px", color: T.muted, whiteSpace: "nowrap" }}>{p.date}</td>
                    <td style={{ padding: "13px 16px", fontWeight: 600, color: T.navy }}>{p.vendorName}</td>
                    <td style={{ padding: "13px 16px", color: T.muted, maxWidth: 160,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.particulars || "—"}
                    </td>
                    <td style={{ padding: "13px 16px", color: T.muted, fontFamily: "monospace", fontSize: 12 }}>
                      {p.chequeNo || "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <Badge color={p.paymentMode === "Razorpay X" ? "blue" : "green"}>{p.paymentMode}</Badge>
                    </td>
                    <td style={{ padding: "13px 16px", fontWeight: 700, color: T.success,
                      whiteSpace: "nowrap", fontSize: 14 }}>{fmtINR(p.amountPaid)}</td>
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
function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [show,     setShow]     = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError(""); setLoading(true);
    try {
      const u = await signIn(email, password);
      onLogin(u);
    } catch (e) {
      setError(e.message
        .replace("INVALID_LOGIN_CREDENTIALS", "Invalid email or password.")
        .replace("TOO_MANY_ATTEMPTS_TRY_LATER", "Too many attempts. Try later."));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: T.cream, padding: "2rem",
      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        input:focus,select:focus{outline:none;}
        button:disabled{opacity:0.55;cursor:not-allowed;}
      `}</style>

      <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp 0.5s ease 0.1s both" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16,
            background: `linear-gradient(135deg,${T.coral},${T.gold})`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(227,74,47,0.32)", marginBottom: 14 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22"
                stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.navy }}>
            Shubh Infracon
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Admin Portal · Sign in to continue</p>
        </div>

        <div style={{ ...card, padding: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Email Address">
              <input style={inp} type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shubhinfra.com"
                onFocus={focusOn} onBlur={focusOff}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()} autoFocus />
            </Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input style={{ ...inp, paddingRight: 40 }}
                  type={show ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onFocus={focusOn} onBlur={focusOff}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                <button onClick={() => setShow(s => !s)} style={{ position: "absolute",
                  right: 11, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 3 }}>
                  {show
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke={T.muted} strokeWidth="2" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke={T.muted} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={T.muted} strokeWidth="2" /><circle cx="12" cy="12" r="3" stroke={T.muted} strokeWidth="2" />
                      </svg>
                  }
                </button>
              </div>
            </Field>

            {error && (
              <div style={{ background: "rgba(227,74,47,0.07)", border: "1px solid rgba(227,74,47,0.22)",
                borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: 12.5, color: T.coral }}>{error}</p>
              </div>
            )}

            <button style={{ ...makeBtn("primary", { justifyContent: "center",
              padding: "12px 20px", fontSize: 14, width: "100%", marginTop: 2 }) }}
              onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                    animation: "spin 0.6s linear infinite" }} /> Signing in…</>
                : "Sign In →"
              }
            </button>
          </div>
        </div>

        <p style={{ margin: "20px 0 0", fontSize: 11, color: T.hint, textAlign: "center", lineHeight: 1.7 }}>
          Restricted to authorised administrators only.<br />Shubh Infracon · Sanand, Gujarat
        </p>
      </div>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────────────────── */
export default function App() {
  const navigate = useNavigate();

  const [user,           setUser]           = useState(null);
  const [token,          setToken]          = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tab,            setTab]            = useState("dashboard");
  const [companies,      setCompanies]      = useState([]);
  const [vendors,        setVendors]        = useState([]);
  const [bills,          setBills]          = useState([]);
  const [payments,       setPayments]       = useState([]);
  const [modal,          setModal]          = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [toast,          setToast]          = useState(null);
  const [successPayment, setSuccessPayment] = useState(null);
  const [searchParams]                      = useSearchParams();

  /* Load Razorpay SDK */
  useEffect(() => {
    if (!document.getElementById("razorpay-sdk")) {
      const sc = document.createElement("script");
      sc.id = "razorpay-sdk"; sc.src = "https://checkout.razorpay.com/v1/checkout.js"; sc.async = true;
      document.head.appendChild(sc);
    }
    const tabParam = searchParams.get("tab");
    if (tabParam && ["dashboard","companies","vendors","payments"].includes(tabParam)) setTab(tabParam);
  }, [searchParams]);

  /* Restore session */
  useEffect(() => {
    const session = loadSession();
    if (session) { setUser({ email: session.email, uid: session.uid }); setToken(session.token); }
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleAuthError = useCallback(() => {
    clearSession(); setToken(null); setUser(null);
    setCompanies([]); setVendors([]); setBills([]); setPayments([]);
    setSessionExpired(true);
  }, []);

  const loadAll = useCallback(async (tok) => {
    setLoading(true);
    try {
      const [cD, vD, bD, pD] = await Promise.all([
        fsList(tok, "companies"),
        fsList(tok, "vendors"),
        fsList(tok, "bills"),
        fsList(tok, "payments"),
      ]);
      setCompanies(cD.map(docToObj).filter(Boolean));
      setVendors(vD.map(docToObj).filter(Boolean));
      setBills(bD.map(docToObj).filter(Boolean));
      setPayments(pD.map(docToObj).filter(Boolean));
    } catch (e) {
      if (e.message === "AUTH_EXPIRED") handleAuthError();
      else showToast("Failed to load data", "error");
    } finally { setLoading(false); }
  }, [handleAuthError]);

  useEffect(() => { if (token) loadAll(token); }, [token, loadAll]);

  function handleLogin(u) {
    saveSession(u);
    setUser({ email: u.email, uid: u.uid });
    setToken(u.token);
    setSessionExpired(false);
  }

  function handleLogout() {
    clearSession();
    setUser(null); setToken(null);
    setCompanies([]); setVendors([]); setBills([]); setPayments([]);
    setSessionExpired(false);
    navigate("/");          // ← navigate to / on logout
  }

  /* ── Company CRUD ── */
  async function saveCompany(form, existing) {
    setSaving(true);
    try {
      existing
        ? await fsSet(token, `companies/${existing.id}`, form)
        : await fsCreate(token, "companies", { ...form, createdAt: new Date().toISOString() });
      showToast(existing ? "Company updated" : "Company added");
      await loadAll(token); setModal(null);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message, "error");
    } finally { setSaving(false); }
  }

  async function deleteCompany(id) {
    if (!window.confirm("Delete this company and all its vendors & bills?")) return;
    setSaving(true);
    try {
      await fsDelete(token, `companies/${id}`);
      const cvids = vendors.filter(v => v.companyId === id).map(v => v.id);
      await Promise.all([
        ...vendors.filter(v => v.companyId === id).map(v => fsDelete(token, `vendors/${v.id}`)),
        ...bills.filter(b => cvids.includes(b.vendorId)).map(b => fsDelete(token, `bills/${b.id}`)),
      ]);
      await loadAll(token); showToast("Company deleted");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  }

  /* ── Vendor CRUD ── */
  async function saveVendor(form, existing) {
    setSaving(true);
    try {
      existing
        ? await fsSet(token, `vendors/${existing.id}`, form)
        : await fsCreate(token, "vendors", { ...form, createdAt: new Date().toISOString() });
      showToast(existing ? "Vendor updated" : "Vendor added");
      await loadAll(token); setModal(null);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message, "error");
    } finally { setSaving(false); }
  }

  async function deleteVendor(id) {
    if (!window.confirm("Delete this vendor and all its bills?")) return;
    try {
      await fsDelete(token, `vendors/${id}`);
      await Promise.all(bills.filter(b => b.vendorId === id).map(b => fsDelete(token, `bills/${b.id}`)));
      await loadAll(token); showToast("Vendor deleted");
    } catch (e) { showToast(e.message, "error"); }
  }

  /* ── Bill CRUD ── */
  async function saveBill(form, vendor, existing) {
    setSaving(true);
    try {
      const data = {
        ...form,
        vendorId: vendor.id,
        vendorName: vendor.name,
        companyId: vendor.companyId,
        amountPaid: existing?.amountPaid ?? 0,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      existing
        ? await fsSet(token, `bills/${existing.id}`, data)
        : await fsCreate(token, "bills", data);
      showToast(existing ? "Bill updated" : "Bill added");
      await loadAll(token); setModal(null);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message, "error");
    } finally { setSaving(false); }
  }

  async function deleteBill(id) {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await fsDelete(token, `bills/${id}`);
      await loadAll(token); showToast("Bill deleted");
    } catch (e) { showToast(e.message, "error"); }
  }

  /* ── Payment ── */
  async function recordPayment(bill, vendor, form, useRazorpay) {
    const amount = Number(form.amountPaid || 0);
    const due    = Number(bill.netAmount || 0) - Number(bill.amountPaid || 0);
    if (!amount || amount <= 0) { showToast("Enter a valid amount", "error"); return; }
    if (amount > due + 0.01)   { showToast("Amount exceeds outstanding balance", "error"); return; }

    if (useRazorpay) {
      setSaving(true);
      openRazorpayCheckout({
        amount, vendorName: vendor.name, description: form.particulars || bill.description,
        onSuccess: async (paymentId) => {
          try { await commitPayment(bill, vendor, { ...form, chequeNo: paymentId }, amount, paymentId); }
          catch (e) { showToast(e.message, "error"); } finally { setSaving(false); }
        },
        onFailure: (msg) => { showToast(`Razorpay: ${msg}`, "error"); setSaving(false); },
      });
    } else {
      setSaving(true);
      try { await commitPayment(bill, vendor, form, amount, null); }
      catch (e) { showToast(e.message, "error"); } finally { setSaving(false); }
    }
  }

  async function commitPayment(bill, vendor, form, amount, razorpayId) {
    const newPaid = Number(bill.amountPaid || 0) + amount;
    await fsCreate(token, "payments", {
      billId: bill.id, vendorId: vendor.id, vendorName: vendor.name,
      companyId: vendor.companyId, date: form.date,
      particulars: form.particulars || "", chequeNo: form.chequeNo || razorpayId || "",
      amountPaid: amount, paymentMode: form.paymentMode,
      razorpayId: razorpayId || "", createdAt: new Date().toISOString(),
    });
    await fsSet(token, `bills/${bill.id}`, { ...bill, amountPaid: newPaid });
    await loadAll(token);
    setModal(null);
    setSuccessPayment({ amount, vendor: vendor.name, paymentId: razorpayId });
  }

  /* Not logged in */
  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        input:focus,select:focus{outline:none;}
        button:disabled{opacity:0.55;cursor:not-allowed;}
        button:not(:disabled):hover{opacity:0.85;}
        button:not(:disabled):active{transform:scale(0.97);}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:rgba(30,42,90,0.18);border-radius:99px}
      `}</style>

      {sessionExpired && (
        <SessionExpiredBanner onLogin={() => setSessionExpired(false)} />
      )}

      <Navbar user={user} tab={tab} setTab={setTab} onLogout={handleLogout} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 60px" }}>
        {loading ? <Spinner /> : (
          <>
            {tab === "dashboard" && (
              <DashboardTab
                companies={companies} vendors={vendors} bills={bills}
                payments={payments} setTab={setTab}
              />
            )}
            {tab === "companies" && (
              <CompaniesTab
                companies={companies} vendors={vendors} bills={bills}
                onAdd={() => setModal({ type: "addCompany" })}
                onEdit={(c) => setModal({ type: "editCompany", data: c })}
                onDelete={deleteCompany}
              />
            )}
            {tab === "vendors" && (
              <VendorsTab
                vendors={vendors} companies={companies} bills={bills}
                onAdd={() => setModal({ type: "addVendor" })}
                onEdit={(v) => setModal({ type: "editVendor", data: v })}
                onDelete={deleteVendor}
                onAddBill={(v) => setModal({ type: "addBill", vendor: v })}
                onEditBill={(b, v) => setModal({ type: "editBill", data: b, vendor: v })}
                onDeleteBill={deleteBill}
                onPay={(b, v) => setModal({ type: "payment", bill: b, vendor: v })}
              />
            )}
            {tab === "payments" && (
              <PaymentsTab payments={payments} companies={companies} />
            )}
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {modal?.type === "addCompany" && (
        <Modal title="Add Company" onClose={() => setModal(null)} width={600}>
          <CompanyForm onSave={(f) => saveCompany(f, null)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "editCompany" && (
        <Modal title="Edit Company" subtitle={modal.data.name} onClose={() => setModal(null)} width={600}>
          <CompanyForm initial={modal.data} onSave={(f) => saveCompany(f, modal.data)}
            onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "addVendor" && (
        <Modal title="Add Vendor" onClose={() => setModal(null)} width={560}>
          <VendorForm companies={companies} onSave={(f) => saveVendor(f, null)}
            onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "editVendor" && (
        <Modal title="Edit Vendor" subtitle={modal.data.name} onClose={() => setModal(null)} width={560}>
          <VendorForm initial={modal.data} companies={companies}
            onSave={(f) => saveVendor(f, modal.data)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "addBill" && (
        <Modal title="Add Bill" subtitle={`for ${modal.vendor.name}`} onClose={() => setModal(null)} width={620}>
          <BillForm vendor={modal.vendor} companies={companies}
            onSave={(f) => saveBill(f, modal.vendor, null)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "editBill" && (
        <Modal title="Edit Bill" subtitle={`${modal.vendor.name} · #${modal.data.invoiceNo || "—"}`}
          onClose={() => setModal(null)} width={620}>
          <BillForm initial={modal.data} vendor={modal.vendor} companies={companies}
            onSave={(f) => saveBill(f, modal.vendor, modal.data)}
            onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "payment" && (
        <Modal title="Record Payment"
          subtitle={`${modal.vendor.name} · Invoice #${modal.bill.invoiceNo || "—"}`}
          onClose={() => setModal(null)} width={520}>
          <PaymentForm bill={modal.bill} vendor={modal.vendor}
            onSave={(f, useRzp) => recordPayment(modal.bill, modal.vendor, f, useRzp)}
            onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {successPayment && (
        <PaymentSuccess
          amount={successPayment.amount} vendor={successPayment.vendor}
          paymentId={successPayment.paymentId} onClose={() => setSuccessPayment(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error"
            ? `linear-gradient(135deg,${T.coral},#c73b22)`
            : `linear-gradient(135deg,${T.success},#25c492)`,
          color: "#fff", padding: "11px 20px", borderRadius: 50, fontSize: 13, fontWeight: 600,
          zIndex: 3000, display: "flex", alignItems: "center", gap: 7,
          boxShadow: toast.type === "error"
            ? "0 6px 20px rgba(227,74,47,0.35)" : "0 6px 20px rgba(29,158,117,0.35)",
          animation: "toastIn 0.28s cubic-bezier(.34,1.56,.64,1) both",
          whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}