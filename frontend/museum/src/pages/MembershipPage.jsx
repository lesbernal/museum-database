// pages/MembershipPage.jsx
// Public landing page — shows all membership tiers.
// Logged-in visitors can purchase directly.
// Logged-in members can renew or upgrade.
// Donation-based tiers are shown as informational only.

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserById, createMembershipTransaction, getMyMemberRecord } from "../services/api";
import "../styles/MembershipPage.css";

// ── Tier definitions ──────────────────────────────────────────────────────────
const PURCHASABLE_TIERS = [
  {
    level:       "Bronze",
    price:       75,
    color:       "#a04000",
    bg:          "#fdf2e9",
    border:      "#f0a070",
    description: "Perfect for the casual museum enthusiast.",
    perks: [
      "Unlimited free general admission for 1 year",
      "10% discount at the Museum Shop",
      "Member-only newsletter",
      "Advance ticket booking",
    ],
  },
  {
    level:       "Silver",
    price:       150,
    color:       "#566573",
    bg:          "#f2f3f4",
    border:      "#aab7b8",
    description: "For frequent visitors who love the museum.",
    perks: [
      "Everything in Bronze",
      "Guest passes (2 per year)",
      "15% discount at the Museum Shop and Café",
      "Invitations to member preview events",
    ],
  },
  {
    level:       "Gold",
    price:       300,
    color:       "#9a7d0a",
    bg:          "#fef9e7",
    border:      "#f4d03f",
    featured:    true,
    description: "Our most popular tier for dedicated supporters.",
    perks: [
      "Everything in Silver",
      "Guest passes (4 per year)",
      "20% discount at the Museum Shop and Café",
      "Access to member-only events and lectures",
      "Early access to exhibition tickets",
    ],
  },
  {
    level:       "Platinum",
    price:       600,
    color:       "#1a5276",
    bg:          "#eaf4fb",
    border:      "#7fb3d3",
    description: "For our most committed museum supporters.",
    perks: [
      "Everything in Gold",
      "Unlimited guest passes",
      "25% discount at the Museum Shop and Café",
      "Private curator-led tours (2 per year)",
      "Recognition in the annual report",
    ],
  },
];

const DONATION_TIERS = [
  {
    level:       "Benefactor",
    threshold:   1500,
    color:       "#6b21a8",
    bg:          "#f3e8ff",
    border:      "#c084fc",
    description: "Earned by donating $1,500 or more within your membership year.",
    perks: [
      "Everything in Platinum",
      "Named recognition on the museum donor wall",
      "Invitations to exclusive fundraising galas",
      "Direct line to museum development team",
    ],
  },
  {
    level:       "Leadership Circle",
    threshold:   5000,
    color:       "#9f1239",
    bg:          "#fff1f2",
    border:      "#fb7185",
    description: "Earned by donating $5,000 or more within your membership year.",
    perks: [
      "Everything in Benefactor",
      "Seat on the Museum Advisory Council",
      "Artwork acquisition consultation",
      "Annual private dinner with museum leadership",
    ],
  },
];

const PAYMENT_METHODS = ["Credit Card", "Debit Card"];

// ── Checkout modal ────────────────────────────────────────────────────────────
function CheckoutModal({ tier, profile, onClose, onSuccess }) {
  const [form, setForm] = useState({
    card_name:   "",
    card_number: "",
    card_expiry: "",
    card_cvv:    "",
    payment_method: "Credit Card",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user_id = parseInt(localStorage.getItem("user_id"));
      const existingMember = await getMyMemberRecord().catch(() => null);
      const transaction_type = existingMember?.user_id
        ? (existingMember.membership_level === tier.level ? "Renewal" : "Upgrade")
        : "New";

      await createMembershipTransaction({
        user_id,
        membership_level: tier.level,
        amount:           tier.price,
        payment_method:   form.payment_method,
        transaction_type,
      });

      // Update localStorage role so next nav reflects member status
      localStorage.setItem("role", "member");
      onSuccess(tier);
    } catch (err) {
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mp-overlay" onClick={onClose}>
      <div className="mp-modal" onClick={e => e.stopPropagation()}>
        <div className="mp-modal-header">
          <div>
            <h2>Purchase {tier.level} Membership</h2>
            <p className="mp-modal-price">${tier.price.toLocaleString()} / year</p>
          </div>
          <button className="mp-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="mp-modal-body" onSubmit={handleSubmit}>
          {/* Contact info (read-only from profile) */}
          <div className="mp-section-label">Your Information</div>
          <div className="mp-form-row">
            <div className="mp-form-group">
              <label>Name</label>
              <input readOnly value={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()} />
            </div>
            <div className="mp-form-group">
              <label>Email</label>
              <input readOnly value={profile?.email || ""} />
            </div>
          </div>

          {/* Payment */}
          <div className="mp-section-label">Payment</div>
          <div className="mp-form-group">
            <label>Payment Method</label>
            <select value={form.payment_method}
              onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="mp-form-group">
            <label>Name on Card</label>
            <input placeholder="Jane Doe" required value={form.card_name}
              onChange={e => setForm(p => ({ ...p, card_name: e.target.value }))} />
          </div>
          <div className="mp-form-group">
            <label>Card Number</label>
            <input placeholder="•••• •••• •••• ••••" required value={form.card_number}
              inputMode="numeric" autoComplete="off"
              onChange={e => setForm(p => ({ ...p, card_number: e.target.value }))} />
          </div>
          <div className="mp-form-row">
            <div className="mp-form-group">
              <label>Expiry</label>
              <input placeholder="MM/YY" required value={form.card_expiry}
                onChange={e => setForm(p => ({ ...p, card_expiry: e.target.value }))} />
            </div>
            <div className="mp-form-group">
              <label>CVV</label>
              <input placeholder="•••" required value={form.card_cvv}
                inputMode="numeric" autoComplete="off"
                onChange={e => setForm(p => ({ ...p, card_cvv: e.target.value }))} />
            </div>
          </div>

          {error && <div className="mp-error">{error}</div>}

          <div className="mp-modal-footer">
            <button type="button" className="mp-btn mp-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="mp-btn mp-btn-primary" disabled={submitting}>
              {submitting ? "Processing…" : `Pay $${tier.price.toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Success modal ─────────────────────────────────────────────────────────────
function SuccessModal({ tier, onClose }) {
  const navigate = useNavigate();
  return (
    <div className="mp-overlay">
      <div className="mp-modal mp-success-modal">
        <div className="mp-success-icon">✓</div>
        <h2>Welcome, {tier.level} Member!</h2>
        <p>Your membership is now active for one year. You now have access to all {tier.level} benefits.</p>
        <div className="mp-success-actions">
          <button className="mp-btn mp-btn-primary"
            onClick={() => { onClose(); navigate("/member-dashboard"); }}>
            Go to My Dashboard
          </button>
          <button className="mp-btn mp-btn-outline" onClick={onClose}>
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MembershipPage() {
  const navigate = useNavigate();
  const [profile,      setProfile]      = useState(null);
  const [memberRec,    setMemberRec]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [checkoutTier, setCheckoutTier] = useState(null);
  const [successTier,  setSuccessTier]  = useState(null);
  const isLoggedIn = !!localStorage.getItem("token");
  const role       = localStorage.getItem("role");

  useEffect(() => {
    async function load() {
      if (!isLoggedIn) { setLoading(false); return; }
      try {
        const uid = localStorage.getItem("user_id");
        const [prof, mem] = await Promise.allSettled([
          getUserById(uid),
          getMyMemberRecord(),
        ]);
        if (prof.status === "fulfilled") setProfile(prof.value);
        if (mem.status  === "fulfilled") setMemberRec(mem.value?.user_id ? mem.value : null);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isLoggedIn]);

  function handleSelectTier(tier) {
    if (!isLoggedIn) { navigate("/login"); return; }
    setCheckoutTier(tier);
  }

  function handleSuccess(tier) {
    setCheckoutTier(null);
    setSuccessTier(tier);
    setMemberRec({ membership_level: tier.level });
  }

  function getTierAction(tier) {
    if (!isLoggedIn) return { label: "Sign In to Join", disabled: false };
    if (!memberRec)  return { label: "Join Now", disabled: false };
    if (memberRec.membership_level === tier.level)
      return { label: "Renew", disabled: false };
    const tiers = PURCHASABLE_TIERS.map(t => t.level);
    const current = tiers.indexOf(memberRec.membership_level);
    const target  = tiers.indexOf(tier.level);
    if (target < current) return { label: "Current tier is higher", disabled: true };
    return { label: "Upgrade", disabled: false };
  }

  return (
    <div className="mp-page">
      {/* ── Hero ── */}
      <section className="mp-hero">
        <div className="mp-hero-overlay" />
        <div className="mp-hero-content">
          <p className="mp-kicker">Membership</p>
          <h1>Become Part of the Museum</h1>
          <p>Support world-class art and enjoy exclusive benefits year-round.</p>
          {isLoggedIn && memberRec && (
            <div className="mp-current-badge">
              Your current tier: <strong>{memberRec.membership_level}</strong>
            </div>
          )}
          {!isLoggedIn && (
            <div className="mp-hero-actions">
              <Link to="/login" className="mp-btn mp-btn-primary">Sign In to Join</Link>
              <Link to="/"      className="mp-btn mp-btn-ghost">Back to Home</Link>
            </div>
          )}
          {isLoggedIn && (
            <div className="mp-hero-actions">
              <Link to="/" className="mp-btn mp-btn-ghost">Back to Home</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Purchasable tiers ── */}
      <section className="mp-section">
        <div className="mp-section-header">
          <h2>Membership Tiers</h2>
          <p>Choose the level that fits your connection to the arts.</p>
        </div>

        <div className="mp-tiers-grid">
          {PURCHASABLE_TIERS.map(tier => {
            const { label, disabled } = getTierAction(tier);
            return (
              <div
                key={tier.level}
                className={`mp-tier-card${tier.featured ? " mp-tier-featured" : ""}`}
                style={{ "--tier-color": tier.color, "--tier-bg": tier.bg, "--tier-border": tier.border }}
              >
                {tier.featured && <div className="mp-featured-badge">Most Popular</div>}
                <div className="mp-tier-header">
                  <h3>{tier.level}</h3>
                  <div className="mp-tier-price">
                    <span className="mp-price-amount">${tier.price}</span>
                    <span className="mp-price-period">/ year</span>
                  </div>
                  <p className="mp-tier-desc">{tier.description}</p>
                </div>
                <ul className="mp-perks">
                  {tier.perks.map(p => (
                    <li key={p}><span className="mp-check">✓</span>{p}</li>
                  ))}
                </ul>
                <button
                  className={`mp-btn mp-tier-btn${tier.featured ? " mp-btn-primary" : " mp-btn-outline-tier"}`}
                  disabled={disabled || loading}
                  onClick={() => !disabled && handleSelectTier(tier)}
                  style={!tier.featured ? { borderColor: tier.color, color: tier.color } : {}}
                >
                  {loading ? "Loading…" : label}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Donation-based tiers ── */}
      <section className="mp-section mp-section-donation">
        <div className="mp-section-header">
          <h2>Philanthropy Tiers</h2>
          <p>Unlock these exclusive tiers through cumulative donations within your membership year.</p>
        </div>

        <div className="mp-donation-grid">
          {DONATION_TIERS.map(tier => (
            <div
              key={tier.level}
              className="mp-donation-card"
              style={{ "--tier-color": tier.color, "--tier-bg": tier.bg, "--tier-border": tier.border }}
            >
              <div className="mp-donation-header">
                <h3>{tier.level}</h3>
                <div className="mp-donation-threshold">
                  Donate <strong>${tier.threshold.toLocaleString()}+</strong> within your membership year
                </div>
                <p className="mp-tier-desc">{tier.description}</p>
              </div>
              <ul className="mp-perks">
                {tier.perks.map(p => (
                  <li key={p}><span className="mp-check">✓</span>{p}</li>
                ))}
              </ul>
              <Link to="/donations" className="mp-btn mp-btn-outline-tier"
                style={{ borderColor: tier.color, color: tier.color, textDecoration: "none", display: "block", textAlign: "center" }}>
                Make a Donation
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ strip ── */}
      <section className="mp-faq">
        <div className="mp-faq-item">
          <h4>When does my membership start?</h4>
          <p>Immediately upon purchase. Your expiration date is exactly one year from today.</p>
        </div>
        <div className="mp-faq-item">
          <h4>Can I upgrade mid-year?</h4>
          <p>Yes. Upgrading resets your membership start date to today with a new one-year term.</p>
        </div>
        <div className="mp-faq-item">
          <h4>How do donation tiers work?</h4>
          <p>Cumulative donations within your membership year automatically advance your tier. No action needed — your dashboard will reflect the change.</p>
        </div>
        <div className="mp-faq-item">
          <h4>Can donations alone grant membership?</h4>
          <p>Yes. If your cumulative donations reach $75 or more, you'll automatically receive a Bronze membership even without a direct purchase.</p>
        </div>
      </section>

      {/* ── Modals ── */}
      {checkoutTier && (
        <CheckoutModal
          tier={checkoutTier}
          profile={profile}
          onClose={() => setCheckoutTier(null)}
          onSuccess={handleSuccess}
        />
      )}
      {successTier && (
        <SuccessModal
          tier={successTier}
          onClose={() => setSuccessTier(null)}
        />
      )}
    </div>
  );
}