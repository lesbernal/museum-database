// pages/MembershipPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserById, getMyMemberRecord } from "../services/api";
import "../styles/MembershipPage.css";

// Purchasable tier perks — guest passes removed entirely
const PURCHASABLE_TIERS = [
  {
    level:"Bronze", price:75, color:"#a04000", bg:"#fdf2e9", border:"#f0a070",
    description:"Perfect for the casual museum enthusiast.",
    perks:["10% off all tickets","10% discount at the Museum Shop and Café","Member-only newsletter","Advance ticket booking"],
  },
  {
    level:"Silver", price:150, color:"#566573", bg:"#f2f3f4", border:"#aab7b8",
    description:"For frequent visitors who love the museum.",
    perks:["15% off all tickets","Everything in Bronze","15% discount at Museum Shop and Café","Invitations to member preview events"],
  },
  {
    level:"Gold", price:300, color:"#9a7d0a", bg:"#fef9e7", border:"#f4d03f",
    description:"For dedicated supporters who want premium access.",
    perks:["20% off all tickets","Everything in Silver","20% discount at Museum Shop and Café","Access to member-only events","Early access to exhibition tickets"],
  },
  {
    level:"Platinum", price:600, color:"#1a5276", bg:"#eaf4fb", border:"#7fb3d3",
    description:"For our most committed museum supporters.",
    perks:["25% off all tickets","Everything in Gold","25% discount at Museum Shop and Café","Private curator-led tours (2 per year)","Recognition in the annual report"],
  },
];

const DONATION_TIERS = [
  {
    level:"Benefactor", threshold:1500, color:"#6b21a8", bg:"#f3e8ff", border:"#c084fc",
    description:"Earned by donating $1,500 or more within your membership year.",
    perks:["Everything in Platinum","Free admission for you and your guests","Named recognition on the museum donor wall","Invitations to exclusive fundraising galas","Direct line to museum development team"],
  },
  {
    level:"Leadership Circle", threshold:5000, color:"#9f1239", bg:"#fff1f2", border:"#fb7185",
    description:"Earned by donating $5,000 or more within your membership year.",
    perks:["Everything in Benefactor","Seat on the Museum Advisory Council","Artwork acquisition consultation","Annual private dinner with museum leadership"],
  },
];

const DONATION_TIER_NAMES = DONATION_TIERS.map(t=>t.level);
const TIER_PRICES = Object.fromEntries(PURCHASABLE_TIERS.map(t=>[t.level,t.price]));

export default function MembershipPage() {
  const navigate = useNavigate();
  const [profile,   setProfile]   = useState(null);
  const [memberRec, setMemberRec] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(()=>{
    async function load() {
      if (!isLoggedIn) { setLoading(false); return; }
      try {
        const uid = localStorage.getItem("user_id");
        const [prof,mem] = await Promise.allSettled([getUserById(uid), getMyMemberRecord()]);
        if (prof.status==="fulfilled") setProfile(prof.value);
        if (mem.status ==="fulfilled") setMemberRec(mem.value?.user_id?mem.value:null);
      } catch{ /* silent */ }
      finally { setLoading(false); }
    }
    load();
  },[isLoggedIn]);

  const isDonationTier = DONATION_TIER_NAMES.includes(memberRec?.membership_level);
  const currentLevel   = memberRec?.membership_level;
  const currentTierIdx = PURCHASABLE_TIERS.findIndex(t=>t.level===currentLevel);

  // 60-day gate: only allow renew/upgrade when within 60 days of expiry or already expired
  const daysUntilExpiry = (() => {
    if (!memberRec?.expiration_date) return null;
    const [y,m,d] = String(memberRec.expiration_date).slice(0,10).split("-").map(Number);
    const exp  = new Date(y,m-1,d);
    const now  = new Date(); now.setHours(0,0,0,0);
    return Math.ceil((exp-now)/(1000*60*60*24));
  })();
  const isExpired      = daysUntilExpiry!==null&&daysUntilExpiry<=0;
  const inRenewWindow  = isExpired||(daysUntilExpiry!==null&&daysUntilExpiry<=60);
  // If outside the renew window they cannot purchase at all from this page
  const renewWindowBlocked = isLoggedIn&&memberRec&&!isDonationTier&&!inRenewWindow&&currentLevel===PURCHASABLE_TIERS.find(t=>t.level===currentLevel)?.level;

  function handleSelectTier(tier) {
    if (!isLoggedIn) { navigate("/login"); return; }
    const tiers = PURCHASABLE_TIERS.map(t=>t.level);
    let transaction_type = "New";
    let chargeAmount     = tier.price;
    if (memberRec&&!isDonationTier) {
      const targetIdx = tiers.indexOf(tier.level);
      if (targetIdx>currentTierIdx)       { transaction_type="Upgrade";  chargeAmount=tier.price-(TIER_PRICES[currentLevel]??0); }
      else if (targetIdx===currentTierIdx){ transaction_type="Renewal";  chargeAmount=tier.price; }
      else                                { transaction_type="Downgrade"; chargeAmount=tier.price; }
    }
    navigate("/checkout",{state:{ type:"membership", membership_level:tier.level, amount:chargeAmount, transaction_type, total:chargeAmount, tierLabel:`${tier.level} Membership`, tierDescription:tier.description }});
  }

  function getTierAction(tier) {
    if (!isLoggedIn)    return { label:"Sign In to Join", disabled:false };
    if (!memberRec)     return { label:"Join Now",        disabled:false };
    if (isDonationTier) return { label:"Not available",   disabled:true  };

    const tiers     = PURCHASABLE_TIERS.map(t=>t.level);
    const targetIdx = tiers.indexOf(tier.level);
    const diff      = tier.price-(TIER_PRICES[currentLevel]??0);

    if (currentLevel===tier.level) {
      if (!inRenewWindow) return { label:"Renew (available 60 days before expiry)", disabled:true };
      return { label:"Renew", disabled:false };
    }
    if (targetIdx>currentTierIdx) {
      if (!inRenewWindow) return { label:`Upgrade (available 60 days before expiry)`, disabled:true };
      return { label:`Upgrade (+$${diff})`, disabled:false };
    }
    // Downgrade — available anytime as a scheduled change
    return { label:"Downgrade (at next renewal)", disabled:false };
  }

  return (
    <div className="mp-page">
      <div className="mp-hero">
        <div className="mp-hero-overlay" />
        <div className="mp-hero-content">
          <p className="mp-eyebrow">Museum of Fine Arts, Houston</p>
          <h1 className="mp-title">Membership</h1>
          <p className="mp-subtitle">Support world-class art and enjoy exclusive benefits year-round.</p>
          {isLoggedIn&&memberRec&&(
            <div className="mp-current-badge">
              Your current tier: <strong>{memberRec.membership_level}</strong>
              {isDonationTier&&" (Philanthropy Tier)"}
              {!isDonationTier&&!inRenewWindow&&daysUntilExpiry!==null&&` · renew available in ${daysUntilExpiry-60} days`}
            </div>
          )}
          <div className="mp-hero-actions">
            {!isLoggedIn&&<Link to="/login" className="mp-btn mp-btn-primary">Sign In to Join</Link>}
            <Link to="/" className="mp-btn mp-btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>

      {/* Donation-tier members see a different section instead of the tier grid */}
      {isDonationTier ? (
        <section className="mp-section">
          <div className="mp-section-header">
            <h2>Your Philanthropy Membership</h2>
            <p>Your <strong>{currentLevel}</strong> membership was earned through your generous donations to the museum. This tier reflects your outstanding support and cannot be replaced by purchasing a standard membership.</p>
            <p style={{marginTop:"1rem",fontSize:"0.9rem",color:"#6b7280",lineHeight:1.7}}>
              Your philanthropy tier will remain active as long as your cumulative donations within your membership year meet the threshold. If your tier expires, you may purchase a standard membership or continue donating to reinstate your tier.
            </p>
            <Link to="/donations" className="mp-btn mp-btn-primary" style={{display:"inline-block",marginTop:"1rem"}}>Make a Donation</Link>
          </div>
        </section>
      ) : (
        <section className="mp-section">
          <div className="mp-section-header">
            <h2>Membership Tiers</h2>
            <p>Choose the level that fits your connection to the arts.</p>
            {isLoggedIn&&memberRec&&!isDonationTier&&currentTierIdx>=0&&(
              <p style={{fontSize:"0.85rem",color:"#6b7280",marginTop:"0.5rem"}}>
                Upgrading charges only the price difference. Downgrades take effect at your next renewal.
                {!inRenewWindow&&daysUntilExpiry!==null&&` Renew or upgrade will be available ${60-daysUntilExpiry<0?`in ${Math.abs(daysUntilExpiry-60)} days`:"soon"}.`}
              </p>
            )}
          </div>
          <div className="mp-tiers-grid">
            {PURCHASABLE_TIERS.map(tier=>{
              const {label,disabled} = getTierAction(tier);
              const isCurrent = currentLevel===tier.level;
              return (
                <div key={tier.level} className={`mp-tier-card ${isCurrent?"mp-tier-current":""}`}
                  style={{"--tier-color":tier.color,"--tier-bg":tier.bg,"--tier-border":tier.border}}>
                  <div className="mp-tier-header">
                    <h3>{tier.level}{isCurrent&&<span style={{fontSize:"0.7rem",marginLeft:8,fontWeight:400}}>← Current</span>}</h3>
                    <div className="mp-tier-price"><span className="mp-price-amount">${tier.price}</span><span className="mp-price-period">/ year</span></div>
                    <p className="mp-tier-desc">{tier.description}</p>
                  </div>
                  <ul className="mp-perks">{tier.perks.map(p=><li key={p}><span className="mp-check">✓</span><span>{p}</span></li>)}</ul>
                  <button className="mp-tier-btn" disabled={disabled||loading} onClick={()=>!disabled&&handleSelectTier(tier)}>
                    {loading?"Loading…":label}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Donation tiers — always visible */}
      <section className="mp-section mp-section-donation">
        <div className="mp-section-header">
          <h2>Philanthropy Tiers</h2>
          <p>These exclusive tiers are earned automatically through cumulative donations — they cannot be purchased.</p>
        </div>
        <div className="mp-donation-grid">
          {DONATION_TIERS.map(tier=>(
            <div key={tier.level} className="mp-donation-card" style={{"--tier-color":tier.color,"--tier-bg":tier.bg,"--tier-border":tier.border}}>
              <div className="mp-donation-header">
                <h3>{tier.level}</h3>
                <div className="mp-donation-threshold">Donate <strong>${tier.threshold.toLocaleString()}+</strong> within your membership year</div>
                <p className="mp-tier-desc">{tier.description}</p>
              </div>
              <ul className="mp-perks">{tier.perks.map(p=><li key={p}><span className="mp-check">✓</span><span>{p}</span></li>)}</ul>
              <Link to="/donations" className="mp-donation-btn">Make a Donation</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mp-faq-section">
        <div className="mp-faq-header"><h2>Frequently Asked Questions</h2><p>Everything you need to know about museum membership</p></div>
        <div className="mp-faq-grid">
          <div className="mp-faq-item">
            <h4>When does my membership start?</h4>
            <p>Immediately upon purchase. Your expiration date is exactly one year from today.</p>
          </div>
          <div className="mp-faq-item">
            <h4>How does upgrading work?</h4>
            <p>Upgrading is available within 60 days of expiry and charges only the price difference. For example, going from Bronze ($75) to Gold ($300) costs $225. Your expiration resets to one year from today.</p>
          </div>
          <div className="mp-faq-item">
            <h4>Can I renew early?</h4>
            <p>Renewal and upgrade options become available 60 days before your membership expires. This ensures your benefits carry over without gaps. Until then, your current membership remains fully active.</p>
          </div>
          <div className="mp-faq-item">
            <h4>How do Philanthropy Tiers work?</h4>
            <p>Benefactor and Leadership Circle tiers are earned automatically when your cumulative donations within a membership year reach the threshold ($1,500 and $5,000 respectively). These tiers are not purchasable and are a recognition of your generosity. If a philanthropy tier expires, you can purchase a standard membership or continue donating to earn the tier again.</p>
          </div>
          <div className="mp-faq-item">
            <h4>Can donations alone grant membership?</h4>
            <p>Yes. Cumulative donations of $75 or more within a year will automatically grant you a Bronze membership, and higher amounts will unlock higher tiers.</p>
          </div>
          <div className="mp-faq-item">
            <h4>Why can't I renew right now?</h4>
            <p>The renew and upgrade buttons appear 60 days before your membership expires. This is by design to prevent accidental early renewals that would extend from today rather than from your current expiry date.</p>
          </div>
        </div>
      </section>
    </div>
  );
}