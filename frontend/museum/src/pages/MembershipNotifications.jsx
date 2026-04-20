// pages/MembershipNotifications.jsx
// Dismissible notification banners for the logged-in member.
// GET  /membership-notifications?user_id=X
// PATCH /membership-notifications/:id/dismiss

import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TYPE_STYLE = {
  upgrade_earned: {
    bg: "#f0fdf4",
    border: "#86efac",
    color: "#166534",
    label: "Membership Upgrade",
  },
  expiry_warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    color: "#92400e",
    label: "Membership Expiry Notice",
  },
  default: {
    bg: "#f0f9ff",
    border: "#7dd3fc",
    color: "#0c4a6e",
    label: "Membership Notice",
  },
};

export default function MembershipNotifications() {
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem("user_id");
  const token  = localStorage.getItem("token");

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE_URL}/membership-notifications?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        // Deduplicate by notification_id and discard rows with no valid id.
        //
        // Root cause of the "dismiss one removes all" bug:
        //   If notification_id is null/undefined on some rows, then dismiss(undefined)
        //   calls filter(n => n.notification_id !== undefined) which matches every
        //   well-formed row too — removing everything. Deduplication and the null
        //   guard here prevent that from ever happening.
        const seen = new Set();
        const deduped = data.filter(n => {
          if (!n.notification_id) return false;           // drop rows with no id
          if (seen.has(n.notification_id)) return false;  // drop duplicates
          seen.add(n.notification_id);
          return true;
        });
        setNotifications(deduped);
      })
      .catch(() => {});
  }, [userId]);

  function dismiss(notifId) {
    // Never fire with a falsy id — that would filter out everything
    if (!notifId) return;
    // Optimistic removal, keyed strictly to this id
    setNotifications(prev => prev.filter(n => n.notification_id !== notifId));
    fetch(`${BASE_URL}/membership-notifications/${notifId}/dismiss`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  if (!notifications.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
      {notifications.map(n => {
        if (!n.notification_id) return null; // never render rows without a valid id
        const style = TYPE_STYLE[n.notification_type] || TYPE_STYLE.default;
        return (
          <div
            key={n.notification_id}
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderLeft: `4px solid ${style.border}`,
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              borderRadius: 4,
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: style.color,
                margin: "0 0 0.2rem",
                fontWeight: 600,
              }}>
                {style.label}
              </p>
              <p style={{
                fontSize: "0.88rem",
                color: style.color,
                margin: 0,
                lineHeight: 1.6,
                fontWeight: 500,
              }}>
                {n.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(n.notification_id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.1rem",
                color: style.color,
                opacity: 0.6,
                padding: "0 0.25rem",
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}