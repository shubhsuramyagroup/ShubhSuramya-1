// ─────────────────────────────────────────────────────────────────────────────
// adminShared.jsx  —  Shared UI primitives for all admin pages
// Import what you need: Toast, BackButton, PageHeader, AdminInput,
//                       AdminSection, AdminLabel, AdminAddBtn, AdminDeleteBtn
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

/* ── Toast ─────────────────────────────────────────────────────────────────── */
// Usage: <Toast show={toast} onClose={() => setToast(null)} />
// toast = { type: "success"|"error", message: "..." }  or null
export function Toast({ show, onClose }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show) return null;

  const isError = show.type === "error";

  return (
    <div
      className="fixed top-5 right-4 z-[99999] max-w-[calc(100vw-32px)]"
      style={{
        animation: "toastSlideIn 0.4s cubic-bezier(.34,1.56,.64,1) both",
      }}
    >
      <div
        className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-2xl
                    border border-l-4 min-w-[260px]`}
        style={{
          borderColor: isError ? "#fca5a5" : "#a7f3d0",
          borderLeftColor: isError ? "#ef4444" : "#10b981",
          boxShadow: isError
            ? "0 8px 32px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.08)"
            : "0 8px 32px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base`}
          style={{ background: isError ? "#fef2f2" : "#ecfdf5" }}
        >
          {isError ? "✕" : "✓"}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`font-bold text-[13px] ${isError ? "text-red-600" : "text-emerald-700"}`}
          >
            {isError ? "Error" : "Success"}
          </p>
          <p className="text-gray-500 text-[12px] truncate">{show.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-gray-500 transition-colors ml-1 flex-shrink-0 text-lg leading-none"
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

/* ── Back Button ───────────────────────────────────────────────────────────── */
export function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[#1F2A44] text-sm font-semibold
                 hover:text-[#E4572E] transition-colors duration-200 group"
    >
      <span
        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center
                       group-hover:border-[#E4572E] group-hover:bg-[#FFF0EC] transition-all duration-200"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3 h-3"
        >
          <path d="M10 4L6 8l4 4" />
        </svg>
      </span>
      {label}
    </button>
  );
}

/* ── Page Header ───────────────────────────────────────────────────────────── */
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
      <div>
        <p className="text-[#E34A2F] text-[10.5px] font-bold tracking-[2.5px] uppercase mb-2">
          {eyebrow}
        </p>
        <h1
          className="font-semibold text-[#1F2A44] leading-tight tracking-tight"
          style={{ fontSize: "clamp(26px, 4vw, 44px)" }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ── Admin Section Card ────────────────────────────────────────────────────── */
export function AdminSection({ title, hint, children }) {
  return (
    <div
      className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100
                    shadow-sm p-5 sm:p-8 mb-5"
    >
      {title && (
        <div className="mb-5 pb-4 border-b border-gray-100">
          <p className="text-[#E34A2F] text-[10px] font-bold tracking-[2px] uppercase mb-1">
            Section
          </p>
          <h2 className="text-[#1F2A44] font-semibold text-lg">{title}</h2>
          {hint && (
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{hint}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Admin Label ───────────────────────────────────────────────────────────── */
export function AdminLabel({ children, required }) {
  return (
    <label className="block text-[#1F2A44] text-[12px] font-semibold tracking-wide mb-1.5">
      {children}
      {required && <span className="text-[#E4572E] ml-0.5">*</span>}
    </label>
  );
}

/* ── Shared input className ────────────────────────────────────────────────── */
export const inputCls =
  "w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-[#1F2A44] " +
  "placeholder:text-gray-300 outline-none focus:border-[#E4572E] focus:ring-2 " +
  "focus:ring-[#E4572E]/10 transition-all duration-200";

export const textareaCls = inputCls + " resize-vertical min-h-[120px]";

/* ── Add Button ────────────────────────────────────────────────────────────── */
export function AdminAddBtn({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 mt-4 bg-[#E4572E] text-white
                 px-4 py-2.5 rounded-full text-[12px] font-semibold tracking-wide
                 hover:bg-[#c93d1e] hover:scale-[1.03] transition-all duration-200"
    >
      {children}
    </button>
  );
}

/* ── Delete / Remove Button ────────────────────────────────────────────────── */
export function AdminDeleteBtn({ onClick, label = "Remove" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200
                 text-red-600 rounded-lg text-[12px] font-semibold flex-shrink-0
                 hover:bg-red-100 transition-colors duration-150"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
      >
        <line x1="4" y1="4" x2="12" y2="12" />
        <line x1="12" y1="4" x2="4" y2="12" />
      </svg>
      {label}
    </button>
  );
}

/* ── Submit Button ─────────────────────────────────────────────────────────── */
export function AdminSubmitBtn({ loading, label, loadingLabel = "Saving…" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-[#1F2A44] text-white py-4 rounded-2xl font-semibold text-[15px]
                 tracking-wide hover:bg-[#E4572E] transition-all duration-300
                 disabled:opacity-60 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2"
    >
      {loading && (
        <span
          className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
          style={{ animation: "spin 0.7s linear infinite" }}
        />
      )}
      {loading ? loadingLabel : label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

/* ── Delete Confirmation Modal ─────────────────────────────────────────────── */
// itemName = the exact string user must type
// onClose / onConfirm handlers
// deleting = boolean while delete is in flight
export function DeleteModal({
  title,
  itemName,
  inputName,
  setInputName,
  error,
  deleting,
  onClose,
  onConfirm,
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#1F2A44]/50 backdrop-blur-sm z-[1000]"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-[460px] max-h-[90vh]
                     overflow-y-auto bg-white rounded-3xl p-6 sm:p-8
                     shadow-[0_24px_80px_rgba(31,42,68,0.2)]"
          style={{
            animation: "modalPop 0.3s cubic-bezier(.34,1.56,.64,1) both",
          }}
        >
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-full bg-red-50 border border-red-100
                       flex items-center justify-center mx-auto mb-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-center text-[#1F2A44] font-semibold text-xl mb-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-center text-gray-500 text-sm leading-relaxed mb-3">
            This action is{" "}
            <span className="text-red-500 font-semibold">
              permanent
            </span>{" "}
            and cannot be undone. Type the name below to confirm:
          </p>

          {/* Item Name */}
          <div
            className="bg-[#F8F7F4] border border-dashed border-gray-300 rounded-xl
                       px-4 py-3 text-center font-mono text-sm font-bold
                       text-[#1F2A44] mb-4 select-all leading-relaxed"
          >
            {itemName}
          </div>

          {/* Input */}
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Type name here..."
            disabled={deleting}
            className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all
            ${
              error
                ? "border-red-400"
                : inputName === itemName && inputName
                ? "border-emerald-400"
                : "border-gray-200 focus:border-[#E4572E]"
            }`}
          />

          {/* Validation Text */}
          {inputName.length > 0 && !error && (
            <p
              className={`text-[11px] font-semibold mt-1.5 ${
                inputName === itemName
                  ? "text-emerald-500"
                  : "text-red-400"
              }`}
            >
              {inputName === itemName
                ? "✓ Name matches"
                : "✗ Does not match yet"}
            </p>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-xl
                         px-4 py-3 mt-3 text-red-600
                         text-[12px] font-medium"
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200
                         text-[#1F2A44] font-semibold text-sm
                         hover:border-gray-300 transition-colors
                         disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={deleting || !inputName}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white
                         font-bold text-sm hover:bg-red-600
                         transition-colors disabled:bg-red-200
                         disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {deleting && (
                <span
                  className="w-3.5 h-3.5 rounded-full border-2
                             border-white/40 border-t-white"
                  style={{
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              )}

              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>

          <style>{`
            @keyframes modalPop {
              from {
                opacity: 0;
                transform: scale(0.94);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}
