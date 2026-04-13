// src/components/FormUtils.jsx
// Shared reusable form components used across Login, VisitorDashboard,
// MemberDashboard, and EmployeeDashboard.

import { useState } from "react";
import "../styles/FormUtils.css";

// ── US States list ─────────────────────────────────────────────────────────────
export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

// ── Password input with show/hide toggle ──────────────────────────────────────
export function PasswordInput({ value, onChange, placeholder = "Password", name, required, id, className }) {
  const [show, setShow] = useState(false);
  return (
    <div className="fu-password-wrap">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
      />
      <button
        type="button"
        className="fu-eye-btn"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          // Eye-off icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          // Eye icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Phone input — formats as (XXX) XXX-XXXX, validates 10 digits ──────────────
export function PhoneInput({ value, onChange, name, required, className, placeholder = "(XXX) XXX-XXXX" }) {
  const [error, setError] = useState("");

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }

  function handleChange(e) {
    const formatted = formatPhone(e.target.value);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 10) {
      setError("Phone number must be 10 digits");
    } else {
      setError("");
    }
    // Pass the formatted value up but also raw digits for DB storage
    onChange({ target: { name, value: formatted } });
  }

  return (
    <div className="fu-field-wrap">
      <input
        name={name}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={className}
        maxLength={14}
      />
      {error && <span className="fu-field-error">{error}</span>}
    </div>
  );
}

// ── State select dropdown ─────────────────────────────────────────────────────
export function StateSelect({ value, onChange, name, required, className }) {
  return (
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      required={required}
      className={className}
    >
      <option value="">— State —</option>
      {US_STATES.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

// ── Zip code input — restricts to 5 digits ────────────────────────────────────
export function ZipInput({ value, onChange, name, required, className, placeholder = "00000" }) {
  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 5);
    onChange({ target: { name, value: digits } });
  }
  return (
    <input
      name={name}
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
      maxLength={5}
      inputMode="numeric"
    />
  );
}