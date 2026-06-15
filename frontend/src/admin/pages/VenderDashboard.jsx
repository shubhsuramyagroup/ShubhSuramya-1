import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import logo from "../../../public/logo.png";
import logo1 from "../../../public/logo1.png";
import header from "../../../public/header.png";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const r = await fetch(`${FS()}/${col}?pageSize=300`, { headers: { Authorization: `Bearer ${token}` } });
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

/* ─── Auth Session (read-only — written by separate Login page) ──────────── */
const AUTH_KEY = "shubh_admin_session";
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

const fmtINR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const today = () => new Date().toISOString().slice(0, 10);
function getMonthKey(d) { if (!d) return ""; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`; }
function formatMonthLabel(key) { if (!key) return ""; const [y, m] = key.split("-"); return `${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[parseInt(m, 10) - 1]} ${y}`; }
function isToday(d) { return d === today(); }
function isThisMonth(d) { return d && getMonthKey(d) === getMonthKey(today()); }

/* ─── Receipt Number Generator ──────────────────────────────────────────── */
function generateReceiptNo(existingSales) {
  const year = new Date().getFullYear();
  const prefix = `SSG-${year}-`;
  const nums = existingSales
    .map(s => s.receiptNo)
    .filter(r => r && r.startsWith(prefix))
    .map(r => parseInt(r.replace(prefix, ""), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

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
  @media (max-width: 700px) { .flat-table { display: none !important; } .flat-mobile { display: flex !important; } }
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

/* ─── Excel Exports ──────────────────────────────────────────────────────── */
const exportVendorBillsExcel = (vendors, bills, companies) => {
  const excelData = [];
  vendors.forEach((vendor) => {
    const company = companies.find((c) => c.id === vendor.companyId);
    const vendorBills = bills.filter((b) => b.vendorId === vendor.id);
    if (vendorBills.length === 0) {
      excelData.push({ Company: company?.name || "", Vendor: vendor.name, InvoiceNo: "", InvoiceDate: "", Description: "", NetAmount: 0, PaidAmount: 0, DueAmount: 0 });
    } else {
      vendorBills.forEach((bill) => {
        excelData.push({ Company: company?.name || "", Vendor: vendor.name, InvoiceNo: bill.invoiceNo || "", InvoiceDate: bill.invoiceDate || "", Description: bill.description || "", TotalBill: bill.totalBill || 0, CGST: bill.cgst || 0, SGST: bill.sgst || 0, TDS: bill.tds || 0, NetAmount: bill.netAmount || 0, PaidAmount: bill.amountPaid || 0, DueAmount: Number(bill.netAmount || 0) - Number(bill.amountPaid || 0) });
      });
    }
  });
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Bills");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Vendor_Bills_Report.xlsx");
};

const exportPaymentsExcel = (payments, companies) => {
  const excelData = payments.sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((p) => {
    const company = companies.find((c) => c.id === p.companyId);
    return { Date: p.date || "", Company: company?.name || "", Vendor: p.vendorName || "", Particulars: p.particulars || "", "Cheque / UTR No": p.chequeNo || "", "Payment Mode": p.paymentMode || "", "Amount Paid": p.amountPaid || 0, "Razorpay ID": p.razorpayId || "" };
  });
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Payments_Report.xlsx");
};

const exportFlatSalesExcel = (sales) => {
  const excelData = sales.map((s) => ({
    "Receipt No": s.receiptNo || "",
    "Customer Name": s.customerName || "",
    "Mobile": s.mobile || "",
    "Email": s.email || "",
    "PAN": s.pan || "",
    "Aadhaar": s.aadhaar || "",
    "Project": s.projectName || "",
    "Building": s.buildingName || "",
    "Wing": s.wing || "",
    "Floor": s.floorNo || "",
    "Flat No": s.flatNo || "",
    "Flat Type": s.flatType || "",
    "Carpet Area": s.carpetArea || "",
    "Booking Date": s.bookingDate || "",
    "Agreement Date": s.agreementDate || "",
    "Possession Date": s.possessionDate || "",
    "Sales Executive": s.salesExecutive || "",
    "Flat Price": Number(s.flatPrice || 0),
    "GST": Number(s.gstAmount || 0),
    "Registration": Number(s.registrationAmount || 0),
    "Stamp Duty": Number(s.stampDuty || 0),
    "Other Charges": Number(s.otherCharges || 0),
    "Total Amount": Number(s.totalAmount || 0),
    "Booking Amount": Number(s.bookingAmount || 0),
    "Paid Amount": Number(s.paidAmount || 0),
    "Remaining Amount": Number(s.remainingAmount || 0),
    "Status": s.status || "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Flat Sales");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Flat_Sales_Report.xlsx");
};

/* ─── PDF Receipt Generator ──────────────────────────────────────────────── */
async function generateSaleReceiptPDF(sale, payment, paymentIndex = 0) {
  if (!payment) { alert("Payment not found."); return; }
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
  const receiptNo = sale.receiptNo
    ? `${sale.receiptNo}-P${String(paymentIndex + 1).padStart(2, "0")}`
    : `P${String(paymentIndex + 1).padStart(2, "0")}`;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Receipt No.:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text(receiptNo, 36, y);
  y += 14;
  autoTable(doc, {
    startY: y, theme: "grid", tableWidth: W - 28, margin: { left: 14, right: 14 },
    styles: { fontSize: 10, cellPadding: 5, lineColor: [210, 215, 230], lineWidth: 0.3 },
    columnStyles: { 0: { fontStyle: "bold", textColor: [100, 115, 150], cellWidth: 68, fillColor: [245, 247, 252] }, 1: { fontStyle: "normal", textColor: [18, 30, 90], fillColor: [255, 255, 255] } },
    body: [
      ["Received From:", sale.customerName || "—"],
      ["Customer Email:", sale.email || "—"],
      ["Customer Phone:", sale.mobile || "—"],
      ["Amount Paid:", fmtINR(payment.amount || 0)],
      ["Total (incl. GST):", fmtINR((payment.amount || 0) + (payment.gstAmount || 0))],
      ["Payment Method:", payment.paymentMode || "—"],
      ["Shop/Flat:", `Flat ${sale.flatNo || "—"}, ${sale.wing || ""} Wing, Floor ${sale.floorNo || "—"}, ${sale.buildingName || ""} — ${sale.projectName || ""}`],
    ],
  });
  y = doc.lastAutoTable.finalY + 16;
  if (payment.transactionId || payment.bankName || payment.notes) {
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 130, 155);
    if (payment.transactionId) { doc.text(`Transaction ID: ${payment.transactionId}`, 14, y); y += 5; }
    if (payment.bankName) { doc.text(`Bank: ${payment.bankName}`, 14, y); y += 5; }
    if (payment.notes) { doc.text(`Notes: ${payment.notes}`, 14, y); y += 5; }
    y += 6;
  }
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(18, 30, 90);
  doc.text("Authorized By: Shubh Suramya Group", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
  doc.text("Signature:", 14, y);
  doc.setDrawColor(18, 30, 90); doc.setLineWidth(0.4); doc.line(36, y, 95, y);
  y += 12;
  doc.setFont("helvetica", "italic"); doc.setTextColor(80, 100, 140);
  doc.text("Thank you for your payment!", 14, y);
  const footerY = H - 22;
  doc.setFillColor(22, 34, 94); doc.rect(0, footerY, W, 22, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 210, 240);
  doc.text("Shubh Suramya Group  |  Shubh Suramya Corporate House opp suramaya dreams, Suramya Road, Near Eklingji Road, Sanand-382110", W / 2, footerY + 8, { align: "center" });
  doc.text("www.shubhsuramya.com  |  shubhsuramayagroup@gmail.com  |  +91 96872 58222", W / 2, footerY + 14, { align: "center" });
  doc.setTextColor(150, 165, 200); doc.setFontSize(8); doc.text("01", W - 14, footerY + 15, { align: "right" });
  doc.save(`Receipt_${receiptNo}.pdf`);
}

/* ─── Button helper ──────────────────────────────────────────────────────── */
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
    teal: { background: T.teal, color: "#fff", boxShadow: "0 2px 8px rgba(13,148,136,0.22)" },
    amber: { background: T.amber, color: "#fff", boxShadow: "0 2px 8px rgba(239,159,39,0.22)" },
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
    teal: { bg: "rgba(13,148,136,0.08)", text: T.teal },
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
  const typeLabel = type === "company" ? "Company" : type === "vendor" ? "Vendor" : type === "flatSale" ? "Sale Record" : "Bill";
  const cascadeMsg = type === "company" ? "All vendors and bills under this company will be permanently deleted." : type === "vendor" ? "All bills under this vendor will be permanently deleted." : type === "flatSale" ? "This flat sale record and all associated payments will be permanently deleted." : "This bill will be permanently deleted.";

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
            <p style={{ fontSize: 11, color: T.hint }}>{type === "bill" ? "Invoice" : `${typeLabel} name`}</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: T.coral, fontFamily: "'DM Mono', monospace" }}>{matchValue}</p>
          </div>
          <Field label={`Type "${matchValue}" to confirm deletion`}>
            <input style={{ ...inp, borderColor: mismatch ? T.coral : T.border2, boxShadow: mismatch ? `0 0 0 3px rgba(227,74,47,0.10)` : "none" }} value={input} onChange={(e) => { setInput(e.target.value); setMismatch(false); }} placeholder="Type to confirm…" onFocus={focusOn} onBlur={focusOff} onKeyDown={(e) => e.key === "Enter" && handleDelete()} autoFocus />
          </Field>
          {mismatch && <p style={{ fontSize: 12, color: T.coral, marginTop: 8 }}>Text doesn't match. Try again.</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
            <button style={btn("default")} onClick={onCancel} disabled={loading}>Cancel</button>
            <button style={btn("primary", { opacity: matches ? 1 : 0.4 })} onClick={handleDelete} disabled={loading || !matches}>{loading ? "Deleting…" : `Delete ${typeLabel}`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── InfoBanner ─────────────────────────────────────────────────────────── */
function InfoBanner({ name, sub, right }) {
  return (
    <div style={{ background: T.navy, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>{name}</p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.50)" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────────────────────────── */
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

/* ─── ChartTooltip ───────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.navy, borderRadius: 10, padding: "9px 14px", boxShadow: "0 8px 24px rgba(10,14,30,0.22)", border: `1px solid rgba(255,255,255,0.07)` }}>
      {label && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", marginBottom: 5 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
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
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Activity Icon ──────────────────────────────────────────────────────── */
function ActivityIcon({ type }) {
  const map = { company_added: "🏢", vendor_added: "👥", bill_added: "📋", payment_made: "💳", bill_deleted: "🗑️", vendor_deleted: "🗑️", company_deleted: "🗑️", flat_sale_added: "🏠", flat_payment_added: "💰", flat_sale_deleted: "🗑️" };
  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
      {map[type] || "📌"}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SESSION EXPIRED
═══════════════════════════════════════════════════════════════════════════ */
function SessionExpiredBanner({ onRelogin }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.60)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 360, width: "100%", padding: "2rem", textAlign: "center", boxShadow: "0 20px 60px rgba(10,14,30,0.22)", border: `1px solid ${T.border}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: T.coral }} />
        <div style={{ fontSize: 36, marginBottom: 14 }}>⏱</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Session Expired</h2>
        <p style={{ color: T.hint, fontSize: 13.5, lineHeight: 1.6, marginBottom: 22 }}>Please sign in again to continue.</p>
        <button style={{ ...btn("primary"), width: "100%", justifyContent: "center", padding: "11px 20px" }} onClick={onRelogin}>Go to Login</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════════════════ */
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
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center justify-center flex-shrink-0">
              <img src={logo} alt="logo" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain" />
            </div>
            <div className="flex items-center justify-center flex-shrink-0">
              <img src={logo1} alt="logo text" className="h-8 w-12 sm:h-10 sm:w-14 md:h-11 md:w-16 lg:h-12 lg:w-20 object-contain" />
            </div>
          </div>

          <nav style={{ display: "flex", gap: 1 }} className="desktop-nav">
            {navItems.map((n) => (
              <button key={n.key} onClick={() => setTab(n.key)} style={{ background: tab === n.key ? (n.key === "flatSales" ? "rgba(13,148,136,0.08)" : T.bg) : "transparent", border: "none", borderRadius: 8, padding: "7px 14px", color: tab === n.key ? (n.key === "flatSales" ? T.teal : T.navy) : T.muted, fontWeight: tab === n.key ? 600 : 500, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="user-pill" style={{ display: "flex", alignItems: "center", gap: 7, background: T.bg, borderRadius: 8, padding: "5px 10px 5px 7px", border: `1px solid ${T.border}` }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <span style={{ fontSize: 12, color: T.muted, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
            </div>
            <button onClick={onLogout} title="Logout" style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(227,74,47,0.06)", border: `1px solid rgba(227,74,47,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(227,74,47,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(227,74,47,0.06)"}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={() => setMobileOpen(o => !o)} className="hamburger" style={{ width: 32, height: 32, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={T.navy} strokeWidth="2" width="14" height="14">{mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>}</svg>
            </button>
          </div>
        </div>

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

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD TAB
═══════════════════════════════════════════════════════════════════════════ */
function DashboardTab({ companies, vendors, bills, payments, activityLog, flatSales, setTab, loading }) {
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,10fr))", gap: 10 }}>
        <StatCard label="Companies"       value={companies.length}  icon="🏢" delay={0} />
        <StatCard label="Vendors"         value={vendors.length}    icon="👥" delay={40} />
        <StatCard label="Total Bills"     value={bills.length}      icon="📋" delay={80} />
        <StatCard label="Paid Bills"      value={paidBillCnt}       icon="✅" accent={T.success} delay={120} />
        <StatCard label="Pending Bills"   value={pendBillCnt}       icon="⏳" accent={T.amber} delay={160} />
        <StatCard label="Net Payable"     value={fmtINR(totalNet)}  icon="💼" accent={T.navy} delay={200} />
        <StatCard label="Amount Paid"     value={fmtINR(totalPaid)} icon="💚" accent={T.success} delay={240} />
        <StatCard label="Outstanding"     value={fmtINR(totalDue)}  accent={totalDue > 0 ? T.coral : T.success} icon={totalDue > 0 ? "⚠️" : "🎉"} delay={280} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
        <ChartCard title="Company-wise Bills" accent={T.coral}>
          {companyBarData.length === 0 ? <Empty icon="📊" text="No data yet." /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={companyBarData} barSize={16} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,42,90,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.hint }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: T.hint }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(30,42,90,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
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
                  <Pie data={[{ name: "Paid", value: totalPaid }, { name: "Pending", value: totalDue > 0 ? totalDue : 0 }]} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={4} dataKey="value">
                    <Cell fill={T.success} /><Cell fill={T.coral} />
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {[{ name: "Paid", value: totalPaid }, { name: "Pending", value: totalDue > 0 ? totalDue : 0 }].map((d, i) => (
                  <div key={d.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? T.success : T.coral }} />
                      <span style={{ fontSize: 12, color: T.hint }}>{d.name}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? T.success : T.coral, marginLeft: 14, marginTop: 2 }}>{fmtINR(d.value)}</p>
                    <p style={{ fontSize: 10.5, color: T.hint, marginLeft: 14 }}>{totalNet > 0 ? ((d.value / totalNet) * 100).toFixed(1) : 0}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy }}>Top Companies</h3>
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
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.navy }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.navy }}>{fmtINR(c.total)}</span>
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
            
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.navy }}>Top Vendors</h3>
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
      <SectionHeader title="Payment History" action={<button style={btn("success")} onClick={() => exportPaymentsExcel(filtered, companies)}>📊 Download Excel</button>} />
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
            <select style={{ ...inp, width: "auto", minWidth: 160 }} value={filterCo} onChange={e => setFilterCo(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.4 }}>🧾</div>
            <p style={{ color: T.hint, fontSize: 13 }}>No payments recorded yet.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }} className="pay-table">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    {["Date", "Vendor", "Particulars", "Cheque / UTR", "Mode", "Amount"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 16px", color: T.hint, fontWeight: 600, fontSize: 11, letterSpacing: "0.3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "13px 16px", color: T.hint, whiteSpace: "nowrap", fontSize: 12.5, fontFamily: "'DM Mono', monospace" }}>
                        {p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "-"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.navy, border: `1px solid ${T.border}`, flexShrink: 0 }}>{(p.vendorName || "?")[0].toUpperCase()}</div>
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
  const cVendors = (cid) => vendors.filter((v) => v.companyId === cid);
  const cBills = (cid) => { const vids = cVendors(cid).map((v) => v.id); return bills.filter((b) => vids.includes(b.vendorId)); };
  const sum = (arr, k) => arr.reduce((s, v) => s + Number(v[k] || 0), 0);

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <SectionHeader title="Companies" action={<button style={btn("primary")} onClick={onAdd}>+ Add Company</button>} />
      {companies.length === 0 && <Empty icon="🏢" text="No companies yet. Add your first one." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: 14, width: "100%" }}>
        {companies.map((c, i) => {
          const cb = cBills(c.id);
          const net = sum(cb, "netAmount"), paid = sum(cb, "amountPaid"), due = net - paid;
          const pct = net > 0 ? (paid / net) * 100 : 0;
          return (
            <div key={c.id} style={{ ...card, padding: 0, overflow: "hidden", animation: `fadeUp 0.4s ease ${i * 60}ms both`, display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
              <div style={{ height: 3, background: pct >= 100 ? T.success : T.coral }} />
              <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" strokeWidth="1.8" /><path d="M3 9h18M9 21V9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14.5, color: T.navy, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                      <p style={{ fontSize: 11.5, color: T.hint, marginTop: 2, margin: "2px 0 0 0" }}>{cVendors(c.id).length} vendors · {cb.length} bills</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => onEdit(c)} type="button" style={{ width: 28, height: 28, borderRadius: 7, background: T.bg, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#e8e5e0"} onMouseLeave={e => e.currentTarget.style.background = T.bg}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={T.navy} strokeWidth="2" strokeLinecap="round" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={T.navy} strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                    <button onClick={() => onDelete(c)} type="button" style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(227,74,47,0.06)", border: `1px solid rgba(227,74,47,0.16)`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(227,74,47,0.12)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(227,74,47,0.06)"}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke={T.coral} strokeWidth="2" strokeLinecap="round" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={T.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>
                {(c.gstin || c.address) && (
                  <div style={{ marginBottom: 12, wordBreak: "break-word" }}>
                    {c.gstin && <p style={{ fontSize: 11.5, color: T.hint, marginBottom: 3, margin: "0 0 3px 0" }}>GSTIN: <strong style={{ color: T.navy }}>{c.gstin}</strong></p>}
                    {c.address && <p style={{ fontSize: 11.5, color: T.hint, margin: 0 }}>📍 {c.address}</p>}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(75px, 1fr))", gap: 7, marginBottom: 14 }}>
                  {[["Payable", `Rs. ${Number(net || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, null], ["Paid", `Rs. ${Number(paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, T.success], ["Due", `Rs. ${Number(due || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, due > 0 ? T.coral : T.success]].map(([l, v, col]) => (
                    <div key={l} style={{ background: T.bg, borderRadius: 8, padding: "8px 6px", textAlign: "center", border: `1px solid ${T.border}`, minWidth: 0 }}>
                      <p style={{ fontSize: 9.5, color: T.hint, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.4px", margin: 0 }}>{l}</p>
                      <p style={{ fontSize: 11.5, fontWeight: 700, color: col || T.navy, marginTop: 3, margin: "3px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, gap: 6, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 10.5, color: T.hint, margin: 0 }}>{pct.toFixed(0)}% settled</p>
                    <p style={{ fontSize: 10.5, color: pct >= 100 ? T.success : T.hint, margin: 0 }}>{pct >= 100 ? "✓ Fully paid" : `${(100 - pct).toFixed(0)}% remaining`}</p>
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

async function generateVendorStatementPDF(vendor, company, vendorBills, dateFrom, dateTo) {
  if (!vendorBills || vendorBills.length === 0) { alert("No bills found for this vendor."); return; }

  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, H = 297, HEADER_H = 58;

  doc.addImage(header, "PNG", 0, 0, W, HEADER_H);

  doc.setTextColor(18, 30, 90);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Vendor Payment Statement", W / 2, HEADER_H + 16, { align: "center" });

  doc.setDrawColor(18, 30, 90);
  doc.setLineWidth(0.4);
  doc.line(40, HEADER_H + 18.5, W - 40, HEADER_H + 18.5);

  let y = HEADER_H + 30;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Generated Date:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), 45, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Company:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text(company?.name || "—", 36, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Vendor:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text(vendor?.name || "—", 36, y);
  y += 6;

  if (dateFrom || dateTo) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Invoice Date Range:", 14, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(18, 30, 90);
    const fromTxt = dateFrom ? new Date(dateFrom).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";
    const toTxt = dateTo ? new Date(dateTo).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";
    doc.text(`${fromTxt}  to  ${toTxt}`, 52, y);
    y += 6;
  }

  y += 8;

  const totalNet = vendorBills.reduce((s, b) => s + Number(b.netAmount || 0), 0);
  const totalPaid = vendorBills.reduce((s, b) => s + Number(b.amountPaid || 0), 0);
  const totalRemaining = totalNet - totalPaid;

  /* ── Summary row: Total / Paid / Remaining ── */
  autoTable(doc, {
    startY: y,
    theme: "grid",
    tableWidth: W - 28,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 11, cellPadding: 8, lineColor: [210, 215, 230], lineWidth: 0.3, halign: "center" },
    headStyles: { fillColor: [18, 30, 90], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontStyle: "bold", fontSize: 13 },
    columnStyles: {
      0: { textColor: [18, 30, 90] },
      1: { textColor: [29, 158, 117] },
      2: { textColor: totalRemaining > 0 ? [227, 74, 47] : [29, 158, 117] },
    },
    head: [["Total Bill Amount", "Total Paid Amount", "Total Remaining Amount"]],
    body: [[fmtINR(totalNet), fmtINR(totalPaid), fmtINR(totalRemaining)]],
  });

  y = doc.lastAutoTable.finalY + 14;

  /* ── Bill-wise breakdown ── */
  const body = vendorBills.map((b, i) => [
    i + 1,
    b.invoiceNo || "—",
    b.invoiceDate
      ? new Date(b.invoiceDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : "—",
    fmtINR(b.totalBill),
    fmtINR(b.netAmount),
    fmtINR(b.amountPaid),
    fmtINR(Number(b.netAmount || 0) - Number(b.amountPaid || 0)),
  ]);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 4, lineColor: [210, 215, 230], lineWidth: 0.3 },
    headStyles: { fillColor: [18, 30, 90], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    head: [["Sr No", "Invoice No", "Invoice Date", "Sub Total", "Net Amount", "Paid Amount", "Remaining"]],
    body,
    didDrawPage: () => {
      const footerY = H - 22;
      doc.setFillColor(22, 34, 94);
      doc.rect(0, footerY, W, 22, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 210, 240);
      doc.text(
        "Shubh Suramya Group  |  Shubh Suramya Corporate House opp suramaya dreams, Suramya Road, Near Eklingji Road, Sanand-382110",
        W / 2,
        footerY + 8,
        { align: "center" }
      );
      doc.text(
        "www.shubhsuramya.com  |  shubhsuramayagroup@gmail.com  |  +91 96872 58222",
        W / 2,
        footerY + 14,
        { align: "center" }
      );
      doc.setTextColor(150, 165, 200);
      doc.setFontSize(8);
      doc.text(
        String(doc.internal.getCurrentPageInfo().pageNumber).padStart(2, "0"),
        W - 14,
        footerY + 15,
        { align: "right" }
      );
    },
  });

  const safeName = (vendor?.name || "Vendor").replace(/[^a-z0-9]+/gi, "_");
  doc.save(`Vendor_Statement_${safeName}_${today()}.pdf`);
}

/* ─── Vendor Outstanding Report PDF (Total / Paid / Remaining per vendor) ──── */
/* ─── Vendor Outstanding Report PDF (Total / Paid / Remaining per vendor) ──── */
async function generateVendorOutstandingPDF(rows, dateFrom, dateTo) {
  if (!rows || rows.length === 0) { alert("No outstanding vendor payments found."); return; }

  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, H = 297, HEADER_H = 58;

  doc.addImage(header, "PNG", 0, 0, W, HEADER_H);

  doc.setTextColor(18, 30, 90);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Vendor Outstanding Payment Report", W / 2, HEADER_H + 16, { align: "center" });

  doc.setDrawColor(18, 30, 90);
  doc.setLineWidth(0.4);
  doc.line(40, HEADER_H + 18.5, W - 40, HEADER_H + 18.5);

  let y = HEADER_H + 30;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Generated Date:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 30, 90);
  doc.text(
    new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    45,
    y
  );

  if (dateFrom || dateTo) {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Invoice Date Range:", 14, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(18, 30, 90);
    const fromTxt = dateFrom ? new Date(dateFrom).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";
    const toTxt = dateTo ? new Date(dateTo).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";
    doc.text(`${fromTxt}  to  ${toTxt}`, 52, y);
  }

  y += 12;

  const body = rows.map((r, i) => [
    i + 1,
    r.company,
    r.vendor,
    r.gstin || "—",
    r.billCount,
    fmtINR(r.totalAmount),
    fmtINR(r.paidAmount),
    fmtINR(r.remaining),
  ]);

  const grandTotal = rows.reduce((s, r) => s + r.totalAmount, 0);
  const grandPaid = rows.reduce((s, r) => s + r.paidAmount, 0);
  const grandRemaining = rows.reduce((s, r) => s + r.remaining, 0);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 4, lineColor: [210, 215, 230], lineWidth: 0.3 },
    headStyles: { fillColor: [18, 30, 90], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      4: { halign: "center", cellWidth: 14 },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
    head: [["Sr No", "Company", "Vendor", "GSTIN", "Bills", "Total Amount", "Paid Amount", "Remaining Amount"]],
    body,
    foot: [["", "", "", "", "Grand Total", fmtINR(grandTotal), fmtINR(grandPaid), fmtINR(grandRemaining)]],
    footStyles: { fillColor: [245, 247, 252], textColor: [18, 30, 90], fontStyle: "bold", fontSize: 9.5 },
    didDrawPage: () => {
      const footerY = H - 22;
      doc.setFillColor(22, 34, 94);
      doc.rect(0, footerY, W, 22, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 210, 240);
      doc.text(
        "Shubh Suramya Group  |  Shubh Suramya Corporate House opp suramaya dreams, Suramya Road, Near Eklingji Road, Sanand-382110",
        W / 2,
        footerY + 8,
        { align: "center" }
      );
      doc.text(
        "www.shubhsuramya.com  |  shubhsuramayagroup@gmail.com  |  +91 96872 58222",
        W / 2,
        footerY + 14,
        { align: "center" }
      );
      doc.setTextColor(150, 165, 200);
      doc.setFontSize(8);
      doc.text(
        String(doc.internal.getCurrentPageInfo().pageNumber).padStart(2, "0"),
        W - 14,
        footerY + 15,
        { align: "right" }
      );
    },
  });

  doc.save(`Vendor_Outstanding_Report_${today()}.pdf`);
}

/* ─── Date Formatter: YYYY-MM-DD → DD-MM-YYYY ───────────────────────────── */
function formatDMY(dateStr) {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   VENDORS TAB
═══════════════════════════════════════════════════════════════════════════ */
function VendorsTab({ vendors, companies, bills, onAdd, onEdit, onDelete, onAddBill, onEditBill, onDeleteBill, onPay }) {
  const [filterCo, setFilterCo] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = Newest to Oldest, "asc" = Oldest to Newest

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = vendors.filter(v => !filterCo || v.companyId === filterCo).filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()));

  /* ── Date-filtered & sorted bills (applies to all bill tables / vendor lists) ── */
  const sortedFilteredBills = useMemo(() => {
    let result = bills.filter(b => {
      if (dateFrom || dateTo) {
        if (!b.invoiceDate) return false;
        if (dateFrom && b.invoiceDate < dateFrom) return false;
        if (dateTo && b.invoiceDate > dateTo) return false;
      }
      return true;
    });
    result = [...result].sort((a, b) => {
      const da = a.invoiceDate || "", db = b.invoiceDate || "";
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return sortOrder === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });
    return result;
  }, [bills, dateFrom, dateTo, sortOrder]);

  /* ── Outstanding rows for the all-vendors PDF report (grouped per vendor) ── */
  const outstandingRows = useMemo(() => {
    const grouped = {};
    sortedFilteredBills.forEach(b => {
      const v = vendors.find(vv => vv.id === b.vendorId);
      if (!v) return;
      if (filterCo && v.companyId !== filterCo) return;
      if (search && !(v.name || "").toLowerCase().includes(search.toLowerCase())) return;

      const comp = companies.find(c => c.id === v.companyId);
      const key = v.id;
      if (!grouped[key]) {
        grouped[key] = {
          company: comp?.name || "—",
          vendor: v.name || "—",
          gstin: v.gstin || "—",
          billCount: 0,
          totalAmount: 0,
          paidAmount: 0,
        };
      }
      grouped[key].billCount += 1;
      grouped[key].totalAmount += Number(b.netAmount || 0);
      grouped[key].paidAmount += Number(b.amountPaid || 0);
    });

    return Object.values(grouped)
      .map(r => ({ ...r, remaining: r.totalAmount - r.paidAmount }))
      .filter(r => r.remaining > 0.01);
  }, [sortedFilteredBills, vendors, companies, filterCo, search]);

  const handleClearDateFilter = () => { setDateFrom(""); setDateTo(""); };

  const handleDownloadReport = () => {
    if (outstandingRows.length === 0) { alert("No outstanding vendor payments found."); return; }
    generateVendorOutstandingPDF(outstandingRows, dateFrom, dateTo);
  };

  return (
    <div>
      <SectionHeader
        title="Vendors"
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button style={btn("success")} onClick={() => exportVendorBillsExcel(vendors, bills, companies)}>📊 Download Excel</button>
            <button style={btn("navy")} onClick={handleDownloadReport}>📄 Download PDF Report</button>
            <button style={btn("primary")} onClick={onAdd} disabled={companies.length === 0}>+ Add Vendor</button>
          </div>
        }
      />

      {/* ── Vendor Search / Company Filter ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <input style={{ ...inp, flex: "1 1 200px", maxWidth: 280 }} placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
        <select style={{ ...inp, width: "auto", minWidth: 160 }} value={filterCo} onChange={e => setFilterCo(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || filterCo) && filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: 12, color: T.hint, fontWeight: 600, background: "#fff", borderRadius: 8, border: `1px solid ${T.border}` }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Bill Date Filter & Sorting ── */}
      <div style={{ ...card, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.hint, flexShrink: 0 }}>Filter bills by Invoice Date</span>
          <input style={{ ...inp, width: "auto" }} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
          <span style={{ color: T.hint, fontSize: 12 }}>to</span>
          <input style={{ ...inp, width: "auto" }} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
          {(dateFrom || dateTo) && (
            <button style={btn("ghost", { padding: "8px 12px", color: T.coral, fontSize: 12 })} onClick={handleClearDateFilter}>Clear Filter ×</button>
          )}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: T.hint, flexShrink: 0 }}>Sort by Invoice Date</span>
            <select style={{ ...inp, width: "auto", minWidth: 170 }} value={sortOrder} onChange={e => setSortOrder(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
              <option value="desc">Newest to Oldest</option>
              <option value="asc">Oldest to Newest</option>
            </select>
          </div>
        </div>
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

          // Bills for this vendor, with date filter + sort applied
          const vFilteredBills = sortedFilteredBills.filter(b => b.vendorId === v.id);

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
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button style={btn("default", { fontSize: 11.5, padding: "6px 11px" })} onClick={() => toggle(v.id)}>{isOpen ? "▲ Hide" : "▼ Bills"}</button>
                    <button
                      style={btn("teal", { fontSize: 11.5, padding: "6px 11px" })}
                      onClick={() => {
                        if (vFilteredBills.length === 0) { alert("No bills found for this vendor."); return; }
                        generateVendorStatementPDF(v, comp, vFilteredBills, dateFrom, dateTo);
                      }}
                    >
                      ⬇ Download
                    </button>
                    <button style={btn("primary", { fontSize: 11.5, padding: "6px 11px" })} onClick={() => onAddBill(v)}>+ Bill</button>
                    <button style={btn("outline", { fontSize: 11.5, padding: "6px 11px" })} onClick={() => onEdit(v)}>Edit</button>
                    <button style={btn("danger", { fontSize: 11.5, padding: "6px 10px" })} onClick={() => onDelete(v)}>Delete</button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${T.border}`, background: T.bg, padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>
                    Bills ({vFilteredBills.length}{(dateFrom || dateTo) ? ` of ${vBills.length}` : ""})
                  </p>
                  {vFilteredBills.length === 0 ? (
                    <p style={{ color: T.hint, fontSize: 12.5 }}>
                      {(dateFrom || dateTo) ? "No bills match the selected date range." : "No bills yet. Click \"+ Bill\" to add one."}
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {vFilteredBills.map((b) => {
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
                                  {b.invoiceDate && <span style={{ fontSize: 11.5, color: T.hint }}>{formatDMY(b.invoiceDate)}</span>}
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

/* ─── Forms ──────────────────────────────────────────────────────────────── */
function CompanyFormWrapped({ initial, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { name: "", gstin: "", pan: "", stateCode: "24", msmeNo: "", address: "", phone: "", email: "", totalBudget: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Company Name *"><input style={inp} type="text" value={f.name} onChange={set("name")} onFocus={focusOn} onBlur={focusOff} placeholder="Enter company name" autoFocus /></Field>
      <Divider label="Registration Details" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {[["GSTIN", "gstin"], ["PAN", "pan"], ["State Code", "stateCode"], ["MSME No.", "msmeNo"]].map(([l, k]) => (
          <Field key={k} label={l}><input style={inp} type="text" value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder={`Enter ${l}`} /></Field>
        ))}
      </div>
      <Divider label="Contact & Budget" />
      <Field label="Address"><input style={inp} type="text" value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} placeholder="Full address" /></Field>
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

function VendorFormWrapped({ initial, companies, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { name: "", companyId: companies[0]?.id || "", gstin: "", pan: "", phone: "", email: "", address: "", description: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Company *">
        <select style={inp} value={f.companyId} onChange={set("companyId")} onFocus={focusOn} onBlur={focusOff}>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Vendor Name *"><input style={inp} type="text" value={f.name} onChange={set("name")} onFocus={focusOn} onBlur={focusOff} placeholder="Enter vendor name" autoFocus /></Field>
      <Divider label="Registration & Contact" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {[["GSTIN", "gstin", "text"], ["PAN", "pan", "text"], ["Phone", "phone", "tel"], ["Email", "email", "email"]].map(([l, k, t]) => (
          <Field key={k} label={l}><input style={inp} type={t} value={f[k]} onChange={set(k)} onFocus={focusOn} onBlur={focusOff} placeholder={`Enter ${l}`} /></Field>
        ))}
      </div>
      <Field label="Address"><input style={inp} type="text" value={f.address} onChange={set("address")} onFocus={focusOn} onBlur={focusOff} placeholder="Full address" /></Field>
      <Field label="Work Description"><input style={inp} type="text" value={f.description} onChange={set("description")} onFocus={focusOn} onBlur={focusOff} placeholder="Describe the work or services" /></Field>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={() => onSave(f)} disabled={saving}>{saving ? "Saving…" : initial ? "Update Vendor" : "Add Vendor"}</button>
      </div>
    </div>
  );
}

function BillFormWrapped({ initial, vendor, companies, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { hsnCode: "", invoiceNo: "", invoiceDate: today(), totalBill: "", cgst: "", sgst: "", tds: "", description: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const subTotal = Number(f.totalBill || 0), cgstAmt = Number(f.cgst || 0), sgstAmt = Number(f.sgst || 0);
  const billWithGST = subTotal + cgstAmt + sgstAmt, tdsAmt = Number(f.tds || 0), netAmount = billWithGST - tdsAmt;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InfoBanner name={vendor.name} sub={companies.find(c => c.id === vendor.companyId)?.name || ""} right={<Badge color="coral">{initial ? "Edit Bill" : "New Bill"}</Badge>} />
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
      <div style={{ background: T.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 2 }}>
          <p>GST Total: <strong style={{ color: T.navy }}>{fmtINR(billWithGST)}</strong></p>
          <p>TDS Deduction: <strong style={{ color: T.coral }}>−{fmtINR(tdsAmt)}</strong></p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: T.hint }}>Net Payable</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: T.coral }}>{fmtINR(netAmount)}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={() => onSave({ ...f, billWithGST, netAmount })} disabled={saving}>{saving ? "Saving…" : initial ? "Update Bill" : "Add Bill"}</button>
      </div>
    </div>
  );
}

function PaymentFormWrapped({ bill, vendor, onSave, onClose, saving }) {
  const due = Number(bill.netAmount || 0) - Number(bill.amountPaid || 0);
  const [f, setF] = useState({ date: today(), particulars: "", chequeNo: "", amountPaid: String(due > 0 ? due.toFixed(2) : ""), paymentMode: "Razorpay X" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const pct = Number(bill.netAmount) > 0 ? (Number(bill.amountPaid) / Number(bill.netAmount)) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: T.navy, borderRadius: 10, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{vendor.name}</p>
            {bill.invoiceNo && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Invoice #{bill.invoiceNo} · {bill.invoiceDate}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)" }}>Outstanding</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#ff8a75" }}>{fmtINR(due)}</p>
          </div>
        </div>
        <ProgressBar pct={pct} color="rgba(255,255,255,0.35)" />
        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>{pct.toFixed(1)}% settled</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        <Field label="Payment Date"><input style={inp} type="date" value={f.date} onChange={set("date")} onFocus={focusOn} onBlur={focusOff} /></Field>
        <Field label="Amount (₹) *"><input style={inp} type="number" value={f.amountPaid} onChange={set("amountPaid")} onFocus={focusOn} onBlur={focusOff} placeholder="0.00" /></Field>
        <Field label="Particulars"><input style={inp} type="text" value={f.particulars} onChange={set("particulars")} placeholder="Reference / note" onFocus={focusOn} onBlur={focusOff} /></Field>
        <Field label="Cheque / UTR No."><input style={inp} type="text" value={f.chequeNo} onChange={set("chequeNo")} placeholder="Optional" onFocus={focusOn} onBlur={focusOff} /></Field>
      </div>
      <Field label="Payment Mode">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {["Cash", "Cheque", "NEFT", "RTGS", "UPI"].map((m) => {
            const active = f.paymentMode === m;
            return (
              <button key={m} onClick={() => setF((p) => ({ ...p, paymentMode: m }))} style={{ padding: "7px 24px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", border: active ? "none" : `1.5px solid ${T.border2}`, background: active ? (m === "Razorpay X" ? "#3395FF" : T.coral) : "#fff", color: active ? "#fff" : T.muted }}>
                {m}
              </button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button style={btn("default")} onClick={onClose}>Cancel</button>
        <button style={btn("primary")} onClick={() => onSave(f, false)} disabled={saving || !f.amountPaid}>{saving ? "Recording…" : "Record Payment"}</button>
      </div>
    </div>
  );
}

/* ─── Payment Success ────────────────────────────────────────────────────── */
function PaymentSuccess({ amount, vendor, paymentId, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,30,0.50)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 360, width: "100%", padding: "2rem", textAlign: "center", boxShadow: "0 20px 60px rgba(10,14,30,0.20)", animation: "modalIn 0.3s cubic-bezier(.34,1.4,.64,1) both", border: `1px solid ${T.border}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: T.success }} />
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `rgba(29,158,117,0.09)`, border: `2px solid rgba(29,158,117,0.20)`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none"><path d="M6 15l7 7 11-13" stroke={T.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Payment Recorded</h2>
        <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>{fmtINR(amount)} recorded for <strong style={{ color: T.navy }}>{vendor}</strong></p>
        {paymentId && (
          <div style={{ background: T.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 18, border: `1px solid ${T.border}`, textAlign: "left" }}>
            <p style={{ fontSize: 11, color: T.hint }}>Razorpay ID</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{paymentId}</p>
          </div>
        )}
        <button style={{ ...btn("success"), width: "100%", justifyContent: "center", padding: "11px 20px" }} onClick={onClose}>Done</button>
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
  const [flatSales, setFlatSales] = useState([]);
  const [flatPayments, setFlatPayments] = useState([]);

  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [successPayment, setSuccessPayment] = useState(null);
  const [searchParams] = useSearchParams();


  // ── Bootstrap: read session written by the separate Login page ────────
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser({ email: session.email, uid: session.uid });
      setToken(session.token);
    } else {
      // No valid session → redirect to login page
      navigate("/vendors");
    }
  }, [navigate]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const handleAuthError = useCallback(() => {
    clearSession();
    setToken(null); setUser(null);
    setCompanies([]); setVendors([]); setBills([]); setPayments([]);
    setFlatSales([]); setFlatPayments([]);
    setSessionExpired(true);
  }, []);

  const loadAll = useCallback(async (tok) => {
    setLoading(true);
    try {
      const [cD, vD, bD, pD, aD, fsD, fpD] = await Promise.all([
        fsList(tok, "companies"),
        fsList(tok, "vendors"),
        fsList(tok, "bills"),
        fsList(tok, "payments"),
        fsList(tok, "activity_log"),
        fsList(tok, "flatSales"),
        fsList(tok, "flatPayments"),
      ]);
      setCompanies(cD.map(docToObj).filter(Boolean));
      setVendors(vD.map(docToObj).filter(Boolean));
      setBills(bD.map(docToObj).filter(Boolean));
      setPayments(pD.map(docToObj).filter(Boolean));
      setActivityLog(aD.map(docToObj).filter(Boolean));
      setFlatSales(fsD.map(docToObj).filter(Boolean));
      setFlatPayments(fpD.map(docToObj).filter(Boolean));
    } catch (e) {
      if (e.message === "AUTH_EXPIRED") handleAuthError();
      else showToast("Failed to load data", "error");
    } finally { setLoading(false); }
  }, [handleAuthError]);

  useEffect(() => { if (token) loadAll(token); }, [token, loadAll]);

  function handleLogout() {
    clearSession();
    setUser(null); setToken(null);
    setCompanies([]); setVendors([]); setBills([]); setPayments([]);
    setFlatSales([]); setFlatPayments([]);
    setSessionExpired(false);
    navigate("/vendors");
  }

  /* ─── Company CRUD ───────────────────────────────────────────────────── */
  async function saveCompany(form, existing) {
    setSaving(true);
    try {
      if (existing) { await fsSet(token, `companies/${existing.id}`, form); await logActivity(token, "company_added", `Company "${form.name}" updated`, { companyName: form.name }); }
      else { await fsCreate(token, "companies", { ...form, createdAt: new Date().toISOString() }); await logActivity(token, "company_added", `New company "${form.name}" added`, { companyName: form.name }); }
      showToast(existing ? "Company updated" : "Company added"); await loadAll(token); setModal(null);
    } catch (e) { e.message?.includes("401") ? handleAuthError() : showToast(e.message, "error"); }
    finally { setSaving(false); }
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
      openRazorpayCheckout({ amount, vendorName: vendor.name, description: form.particulars || bill.description, onSuccess: async (paymentId) => { try { await commitPayment(bill, vendor, { ...form, chequeNo: paymentId }, amount, paymentId); } catch (e) { showToast(e.message, "error"); } finally { setSaving(false); } }, onFailure: (msg) => { showToast(`Razorpay: ${msg}`, "error"); setSaving(false); } });
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

  /* ─── Delete helpers ─────────────────────────────────────────────────── */
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
      await logActivity(token, "company_deleted", `Company "${company.name}" deleted`, { companyName: company.name });
      await loadAll(token); showToast("Company deleted"); setDeleteModal(null);
    } catch (e) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(false); }
  }

  async function confirmDeleteVendor(vendor) {
    setDeleting(true);
    try {
      const vendorBills = bills.filter(b => b.vendorId === vendor.id);
      await Promise.all(vendorBills.map(b => fsDelete(token, `bills/${b.id}`)));
      await fsDelete(token, `vendors/${vendor.id}`);
      await logActivity(token, "vendor_deleted", `Vendor "${vendor.name}" deleted`, { vendorName: vendor.name });
      await loadAll(token); showToast("Vendor deleted"); setDeleteModal(null);
    } catch (e) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(false); }
  }

  async function confirmDeleteBill(bill, vendor) {
    setDeleting(true);
    try {
      await fsDelete(token, `bills/${bill.id}`);
      await logActivity(token, "bill_deleted", `Bill #${bill.invoiceNo || bill.id} deleted for ${vendor?.name || ""}`, { vendorName: vendor?.name || "", amount: bill.netAmount });
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
    else if (type === "flatSale") confirmDeleteFlatSale(item);
  }

  /* ─── Flat Sales CRUD ────────────────────────────────────────────────── */
  async function saveFlatSale(form, existing) {
    if (!form.customerName?.trim()) { showToast("Customer name is required", "error"); return; }
    if (!form.flatNo?.trim()) { showToast("Flat number is required", "error"); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
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
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (existing) {
        await fsSet(token, `flatSales/${existing.id}`, data);
        await logActivity(token, "flat_sale_added", `Flat sale updated for ${form.customerName} – ${form.projectName} Flat ${form.flatNo}`, { amount: form.totalAmount });
      } else {
        await fsCreate(token, "flatSales", data);
        await logActivity(token, "flat_sale_added", `New flat sale: ${form.customerName} – ${form.projectName} Flat ${form.flatNo} (${form.receiptNo})`, { amount: form.totalAmount });
      }
      showToast(existing ? "Sale updated" : "Sale added successfully"); await loadAll(token); setModal(null);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message || "Failed to save", "error");
    } finally { setSaving(false); }
  }

  async function saveFlatPayment(sale, form) {
    const amount = Number(form.amount || 0);
    try {
      await fsCreate(token, "flatPayments", {
        saleId: sale.id, receiptNo: sale.receiptNo || "", customerName: sale.customerName || "",
        flatNo: sale.flatNo || "", projectName: sale.projectName || "",
        paymentDate: form.paymentDate, amount, paymentMode: form.paymentMode,
        transactionId: form.transactionId || "", notes: form.notes || "",
        createdAt: new Date().toISOString(),
      });
      const newPaid = Number(sale.paidAmount || 0) + amount;
      const newRemaining = Number(sale.totalAmount || 0) - newPaid;
      await fsSet(token, `flatSales/${sale.id}`, { ...sale, paidAmount: newPaid, remainingAmount: newRemaining < 0 ? 0 : newRemaining });
      await logActivity(token, "flat_payment_added", `Payment of ${fmtINR(amount)} recorded for ${sale.customerName} – ${sale.receiptNo}`, { amount });
      showToast("Payment recorded"); await loadAll(token); setModal(null);
    } catch (e) {
      e.message?.includes("401") ? handleAuthError() : showToast(e.message || "Failed to record payment", "error");
    } finally { setSaving(false); }
  }

  async function confirmDeleteFlatSale(sale) {
    setDeleting(true);
    try {
      const salePmts = flatPayments.filter(p => p.saleId === sale.id);
      await Promise.all(salePmts.map(p => fsDelete(token, `flatPayments/${p.id}`)));
      await fsDelete(token, `flatSales/${sale.id}`);
      await logActivity(token, "flat_sale_deleted", `Flat sale deleted: ${sale.customerName} – ${sale.receiptNo}`);
      await loadAll(token); showToast("Sale record deleted"); setDeleteModal(null);
    } catch (e) { showToast(e.message || "Delete failed", "error"); }
    finally { setDeleting(false); }
  }

  // Redirect to login if no session (avoids flash of content)
  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {sessionExpired && <SessionExpiredBanner onRelogin={() => navigate("/login")} />}
      <Navbar user={user} tab={tab} setTab={setTab} onLogout={handleLogout} />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 60px" }}>
        {loading ? <Spinner /> : (
          <>
            {tab === "dashboard" && <DashboardTab companies={companies} vendors={vendors} bills={bills} payments={payments} activityLog={activityLog} flatSales={flatSales} setTab={setTab} loading={loading} />}
            {tab === "companies" && <CompaniesTab companies={companies} vendors={vendors} bills={bills} onAdd={() => setModal({ type: "addCompany" })} onEdit={(c) => setModal({ type: "editCompany", data: c })} onDelete={triggerDeleteCompany} />}
            {tab === "vendors" && <VendorsTab vendors={vendors} companies={companies} bills={bills} onAdd={() => setModal({ type: "addVendor" })} onEdit={(v) => setModal({ type: "editVendor", data: v })} onDelete={triggerDeleteVendor} onAddBill={(v) => setModal({ type: "addBill", vendor: v })} onEditBill={(b, v) => setModal({ type: "editBill", data: b, vendor: v })} onDeleteBill={triggerDeleteBill} onPay={(b, v) => setModal({ type: "payment", bill: b, vendor: v })} />}
            {tab === "payments" && <PaymentsTab payments={payments} companies={companies} />}
            {tab === "flatSales" && (
              <FlatSalesTab
                flatSales={flatSales} flatPayments={flatPayments} loading={loading}
                onAdd={() => setModal({ type: "addFlatSale" })}
                onEdit={(s) => setModal({ type: "editFlatSale", data: s })}
                onDelete={(s) => setDeleteModal({ type: "flatSale", item: s, name: s.customerName })}
                onAddPayment={(s) => setModal({ type: "flatPayment", sale: s })}
                onView={(s) => setModal({ type: "viewFlatSale", data: s })}
              />
            )}
          </>
        )}
      </main>

      {/* ── Delete Modal ── */}
      {deleteModal && (
        <DeleteConfirmModal
          type={deleteModal.type}
          name={deleteModal.type === "bill" ? (deleteModal.item.description || deleteModal.item.vendorName || "Bill") : deleteModal.type === "flatSale" ? deleteModal.item.customerName : deleteModal.item.name}
          invoiceNo={deleteModal.type === "bill" ? (deleteModal.item.invoiceNo || deleteModal.item.id) : deleteModal.type === "flatSale" ? deleteModal.item.receiptNo : undefined}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}

      {/* ── Company / Vendor / Bill / Payment Modals ── */}
      {modal?.type === "addCompany" && <Modal title="Add Company" onClose={() => setModal(null)} width={580}><CompanyFormWrapped onSave={(f) => saveCompany(f, null)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "editCompany" && <Modal title="Edit Company" subtitle={modal.data.name} onClose={() => setModal(null)} width={580}><CompanyFormWrapped initial={modal.data} onSave={(f) => saveCompany(f, modal.data)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "addVendor" && <Modal title="Add Vendor" onClose={() => setModal(null)} width={540}><VendorFormWrapped companies={companies} onSave={(f) => saveVendor(f, null)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "editVendor" && <Modal title="Edit Vendor" subtitle={modal.data.name} onClose={() => setModal(null)} width={540}><VendorFormWrapped initial={modal.data} companies={companies} onSave={(f) => saveVendor(f, modal.data)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "addBill" && <Modal title="Add Bill" subtitle={`for ${modal.vendor.name}`} onClose={() => setModal(null)} width={600}><BillFormWrapped vendor={modal.vendor} companies={companies} onSave={(f) => saveBill(f, modal.vendor, null)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "editBill" && <Modal title="Edit Bill" subtitle={`${modal.vendor.name} · #${modal.data.invoiceNo || "—"}`} onClose={() => setModal(null)} width={600}><BillFormWrapped initial={modal.data} vendor={modal.vendor} companies={companies} onSave={(f) => saveBill(f, modal.vendor, modal.data)} onClose={() => setModal(null)} saving={saving} /></Modal>}
      {modal?.type === "payment" && <Modal title="Record Payment" subtitle={`${modal.vendor.name} · Invoice #${modal.bill.invoiceNo || "—"}`} onClose={() => setModal(null)} width={500}><PaymentFormWrapped bill={modal.bill} vendor={modal.vendor} onSave={(f, useRzp) => recordPayment(modal.bill, modal.vendor, f, useRzp)} onClose={() => setModal(null)} saving={saving} /></Modal>}

      {/* ── Flat Sales Modals ── */}
      {modal?.type === "addFlatSale" && (
        <Modal title="New Flat Sale" subtitle="Add customer flat sale record" onClose={() => setModal(null)} width={720}>
          <FlatSaleFormWrapped existingSales={flatSales} onSave={(f) => saveFlatSale(f, null)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "editFlatSale" && (
        <Modal title="Edit Flat Sale" subtitle={`${modal.data.customerName} · ${modal.data.receiptNo}`} onClose={() => setModal(null)} width={720}>
          <FlatSaleFormWrapped initial={modal.data} existingSales={flatSales.filter(s => s.id !== modal.data.id)} onSave={(f) => saveFlatSale(f, modal.data)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "flatPayment" && (
        <Modal title="Record Customer Payment" subtitle={`${modal.sale.customerName} · ${modal.sale.receiptNo}`} onClose={() => setModal(null)} width={500}>
          <FlatPaymentFormWrapped sale={modal.sale} onSave={(f) => saveFlatPayment(modal.sale, f)} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === "viewFlatSale" && (() => {
        const sale = modal.data;
        const salePmts = flatPayments.filter(p => p.saleId === sale.id);
        return (
          <Modal title={`Sale Detail — ${sale.receiptNo}`} subtitle={sale.customerName} onClose={() => setModal(null)} width={680}>
            <SaleDetailView sale={sale} salePayments={salePmts} onClose={() => setModal(null)} onAddPayment={() => setModal({ type: "flatPayment", sale })} onDownloadPDF={() => generateSaleReceiptPDF(sale, salePmts)} />
          </Modal>
        );
      })()}

      {/* ── Payment success ── */}
      {successPayment && <PaymentSuccess amount={successPayment.amount} vendor={successPayment.vendor} paymentId={successPayment.paymentId} onClose={() => setSuccessPayment(null)} />}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? T.coral : T.success, color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, zIndex: 3000, display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 16px rgba(0,0,0,0.18)`, animation: "toastIn 0.25s ease both", whiteSpace: "nowrap" }}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>{toast.msg}
        </div>
      )}
    </div>
  );
}