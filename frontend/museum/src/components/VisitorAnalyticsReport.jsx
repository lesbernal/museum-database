// components/VisitorAnalyticsReport.jsx
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import "../styles/RevenueReport.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CHART_COLORS = ["#c5a028", "#1d4ed8", "#065f46", "#92400e", "#5b21b6", "#9d174d"];

const formatNumber = (v) => {
  if (!v && v !== 0) return "0";
  return new Intl.NumberFormat("en-US").format(v);
};

const formatDate = (d) => {
  if (!d) return "—";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-");
  return `${m}/${day}/${y}`;
};

const formatCurrency = (v) => {
  if (!v && v !== 0) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
};

export default function VisitorAnalyticsReport() {
  const [activeSection, setActiveSection] = useState("topAttendees");
  const [hasGenerated,  setHasGenerated]  = useState(false);
  const [loading,       setLoading]       = useState(false);

  // Top Attendees state
  const [topAttendeesData,    setTopAttendeesData]    = useState([]);
  const [topAttendeesSummary, setTopAttendeesSummary] = useState(null);
  const [topLimit,            setTopLimit]            = useState(10);

  // Event vs Tickets state
  const [evtVsTixData,       setEvtVsTixData]       = useState([]);
  const [evtVsTixSummary,    setEvtVsTixSummary]    = useState(null);
  const [engagementBreakdown,setEngagementBreakdown]= useState([]);

  async function handleGenerate() {
    setLoading(true);
    setHasGenerated(false);
    try {
      if (activeSection === "topAttendees") {
        const res  = await fetch(`${BASE_URL}/reports/top-event-attendees?limit=${topLimit}`);
        const data = await res.json();
        setTopAttendeesData(Array.isArray(data.data) ? data.data : []);
        setTopAttendeesSummary(data.summary || null);
      } else {
        const res  = await fetch(`${BASE_URL}/reports/event-vs-tickets`);
        const data = await res.json();
        setEvtVsTixData(Array.isArray(data.data) ? data.data : []);
        setEvtVsTixSummary(data.summary || null);
        setEngagementBreakdown(Array.isArray(data.engagementBreakdown) ? data.engagementBreakdown : []);
      }
      setHasGenerated(true);
    } catch (err) {
      console.error("Failed to load visitor analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setHasGenerated(false);
    setTopAttendeesData([]);
    setTopAttendeesSummary(null);
    setEvtVsTixData([]);
    setEvtVsTixSummary(null);
    setEngagementBreakdown([]);
    setTopLimit(10);
  }

  return (
    <div className="revenue-report">
      <div className="report-header">
        <h2>Visitor Analytics — Event Reports</h2>
        <p>Analyze event participation and visitor engagement across tickets and events</p>
      </div>

      {/* Section selector */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
        {[
          { id: "topAttendees", label: "Top Event Attendees" },
          { id: "evtVsTix",     label: "Event vs Ticket Engagement" },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => { setActiveSection(s.id); setHasGenerated(false); }}
            style={{
              padding: "0.5rem 1.25rem",
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-primary)",
              fontSize: "var(--font-size-sm)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              color: activeSection === s.id ? "var(--color-gold)" : "var(--color-gray)",
              borderBottom: activeSection === s.id ? "2px solid var(--color-gold)" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          {activeSection === "topAttendees" && (
            <div className="filter-group">
              <label>Number of Results</label>
              <select value={topLimit} onChange={e => setTopLimit(Number(e.target.value))}>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={25}>Top 25</option>
                <option value={50}>Top 50</option>
              </select>
            </div>
          )}
          {activeSection === "evtVsTix" && (
            <div className="filter-group">
              <label>Report</label>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-gray)", margin: 0, paddingTop: "0.4rem" }}>
                Shows all visitors and members
              </p>
            </div>
          )}
          <div className="filter-group" style={{ justifyContent: "flex-end", flexDirection: "row", alignItems: "flex-end", gap: "0.5rem" }}>
            <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? "Loading..." : "Generate Report"}
            </button>
            <button className="reset-btn" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading report data...</div>}

      {/* ── TOP ATTENDEES ── */}
      {hasGenerated && activeSection === "topAttendees" && (
        <>
          {/* Summary stats */}
          {topAttendeesSummary && (
            <div className="summary-section">
              <div className="summary-grid">
                <div className="summary-card primary">
                  <div className="summary-label">Users Signed Up</div>
                  <div className="summary-value">{formatNumber(topAttendeesSummary.total_users_signed_up)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Events with Signups</div>
                  <div className="summary-value">{formatNumber(topAttendeesSummary.total_events_with_signups)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Total Spots Reserved</div>
                  <div className="summary-value">{formatNumber(topAttendeesSummary.total_spots_reserved)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Avg Spots per Signup</div>
                  <div className="summary-value">{topAttendeesSummary.avg_spots_per_signup}</div>
                </div>
              </div>
            </div>
          )}

          {/* Bar chart */}
          {topAttendeesData.length > 0 && (
            <div className="data-section" style={{ marginBottom: "2rem" }}>
              <div className="data-header">
                <h3>Top {topLimit} Most Active Event Attendees</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topAttendeesData.map(r => ({ name: r.full_name, events: r.total_events, spots: r.total_spots }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="events" name="Events Signed Up" radius={[2, 2, 0, 0]}>
                    {topAttendeesData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          {topAttendeesData.length > 0 ? (
            <div className="data-section">
              <div className="data-header"><h3>Attendee Details</h3></div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Events</th>
                      <th>Total Spots</th>
                      <th>Last Signup</th>
                      <th>Event Types Attended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAttendeesData.map((r, i) => (
                      <tr key={r.user_id}>
                        <td style={{ fontWeight: 600, color: "var(--color-gold)" }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{r.full_name}</td>
                        <td>{r.email}</td>
                        <td>
                          <span style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: r.role === "member" ? "#fef9c3" : "#f3f4f6",
                            color: r.role === "member" ? "#854d0e" : "#374151",
                          }}>
                            {r.role}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{r.total_events}</td>
                        <td style={{ textAlign: "center" }}>{r.total_spots}</td>
                        <td>{formatDate(r.last_signup_date)}</td>
                        <td style={{ fontSize: "0.78rem", color: "var(--color-gray-light)" }}>{r.event_types_attended || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-results">No signup data found. Users need to sign up for events first.</div>
          )}
        </>
      )}

      {/* ── EVENT VS TICKETS ── */}
      {hasGenerated && activeSection === "evtVsTix" && (
        <>
          {/* Summary stats */}
          {evtVsTixSummary && (
            <div className="summary-section">
              <div className="summary-grid">
                <div className="summary-card primary">
                  <div className="summary-label">Total Users</div>
                  <div className="summary-value">{formatNumber(evtVsTixSummary.total_users)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Both Events & Tickets</div>
                  <div className="summary-value">{formatNumber(evtVsTixSummary.both)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Events Only</div>
                  <div className="summary-value">{formatNumber(evtVsTixSummary.events_only)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Tickets Only</div>
                  <div className="summary-value">{formatNumber(evtVsTixSummary.tickets_only)}</div>
                </div>
              </div>
              {evtVsTixSummary.most_engaged && (
                <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--color-cream)", border: "1px solid var(--color-border)", fontSize: "0.875rem", color: "var(--color-gray)" }}>
                  Most engaged visitor: <strong style={{ color: "var(--color-gold)" }}>{evtVsTixSummary.most_engaged}</strong>
                </div>
              )}
            </div>
          )}

          {/* Engagement breakdown chart */}
          {engagementBreakdown.length > 0 && (
            <div className="data-section" style={{ marginBottom: "2rem" }}>
              <div className="data-header">
                <h3>Visitor Engagement Breakdown</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={engagementBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [formatNumber(v), n]} />
                  <Bar dataKey="count" name="Users" radius={[2, 2, 0, 0]}>
                    {engagementBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Percentage breakdown */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                {engagementBreakdown.map((e, i) => (
                  <div key={e.type} style={{ flex: 1, minWidth: 140, padding: "0.75rem", background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: 4, textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 600, color: CHART_COLORS[i % CHART_COLORS.length] }}>{e.percentage}%</div>
                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-light)" }}>{e.type}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-gray)" }}>{formatNumber(e.count)} users</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          {evtVsTixData.length > 0 ? (
            <div className="data-section">
              <div className="data-header"><h3>User Engagement Details</h3></div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Events Signed Up</th>
                      <th>Tickets Purchased</th>
                      <th>Engagement Type</th>
                      <th>Total Ticket Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evtVsTixData.map((r, i) => {
                      const engagementColors = {
                        "Both":         { bg: "#d1fae5", color: "#065f46" },
                        "Events Only":  { bg: "#dbeafe", color: "#1d4ed8" },
                        "Tickets Only": { bg: "#fef3c7", color: "#92400e" },
                        "Neither":      { bg: "#f3f4f6", color: "#374151" },
                      };
                      const style = engagementColors[r.engagement_type] || engagementColors["Neither"];
                      return (
                        <tr key={r.user_id}>
                          <td style={{ fontWeight: 500 }}>{r.full_name}</td>
                          <td>{r.email}</td>
                          <td>
                            <span style={{
                              padding: "0.2rem 0.6rem", borderRadius: "999px",
                              fontSize: "0.72rem", fontWeight: 600,
                              background: r.role === "member" ? "#fef9c3" : "#f3f4f6",
                              color: r.role === "member" ? "#854d0e" : "#374151",
                            }}>
                              {r.role}
                            </span>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>{r.events_signed_up}</td>
                          <td style={{ textAlign: "center" }}>{r.tickets_purchased}</td>
                          <td>
                            <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: style.bg, color: style.color }}>
                              {r.engagement_type}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(r.total_ticket_spend)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-results">No engagement data found.</div>
          )}
        </>
      )}

      {!hasGenerated && !loading && (
        <div className="no-results">Select a report type above and click Generate Report.</div>
      )}
    </div>
  );
}