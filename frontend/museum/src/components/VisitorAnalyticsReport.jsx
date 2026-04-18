// components/VisitorAnalyticsReport.jsx
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import "../styles/VisitorAnalyticsReport.css";

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

const LEVEL_COLORS = {
  "Bronze":            { bg: "#fdf2e9", color: "#a04000" },
  "Silver":            { bg: "#f2f3f4", color: "#566573" },
  "Gold":              { bg: "#fef9e7", color: "#9a7d0a" },
  "Platinum":          { bg: "#eaf4fb", color: "#1a5276" },
  "Benefactor":        { bg: "#f3e8ff", color: "#6b21a8" },
  "Leadership Circle": { bg: "#fff1f2", color: "#9f1239" },
};

const EVENT_TYPES = ["General", "Tour", "Workshop", "Exhibition", "Lecture", "Activity", "Member Only"];

export default function VisitorAnalyticsReport() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [loading,      setLoading]      = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [eventType, setEventType] = useState("");

  // Event vs Tickets state
  const [evtVsTixSummary,     setEvtVsTixSummary]     = useState(null);
  const [engagementBreakdown, setEngagementBreakdown] = useState([]);

  // Member Event Participation state
  const [memberEventSummary, setMemberEventSummary] = useState(null);
  const [memberEventByLevel, setMemberEventByLevel] = useState([]);

  // Events state
  const [eventsData, setEventsData] = useState([]);

  async function handleGenerate() {
    setLoading(true);
    setHasGenerated(false);
    try {
      let eventsUrl = `${BASE_URL}/reports/visitor-analytics?`;
      if (startDate) eventsUrl += `startDate=${startDate}&`;
      if (endDate)   eventsUrl += `endDate=${endDate}&`;

      const [evtVsTixRes, memberRes, analyticsRes] = await Promise.all([
        fetch(`${BASE_URL}/reports/event-vs-tickets`),
        fetch(`${BASE_URL}/reports/member-event-participation`),
        fetch(eventsUrl),
      ]);

      const evtVsTixJson  = await evtVsTixRes.json();
      const memberJson    = await memberRes.json();
      const analyticsJson = await analyticsRes.json();

      // Event vs Tickets
      setEvtVsTixSummary(evtVsTixJson.summary || null);
      setEngagementBreakdown(Array.isArray(evtVsTixJson.engagementBreakdown) ? evtVsTixJson.engagementBreakdown : []);

      // Member Event Participation
      setMemberEventSummary(memberJson.summary || null);
      setMemberEventByLevel(Array.isArray(memberJson.byLevel) ? memberJson.byLevel : []);

      // Events — filter by type on frontend if selected
      let events = Array.isArray(analyticsJson.events) ? analyticsJson.events : [];
      if (eventType) events = events.filter(e => e.event_type === eventType);
      setEventsData(events);

      setHasGenerated(true);
    } catch (err) {
      console.error("Failed to load visitor analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setHasGenerated(false);
    setStartDate("");
    setEndDate("");
    setEventType("");
    setEvtVsTixSummary(null);
    setEngagementBreakdown([]);
    setMemberEventSummary(null);
    setMemberEventByLevel([]);
    setEventsData([]);
  }

  return (
    <div className="visitor-analytics-report">
      <div className="report-header">
        <h2>Visitor Analytics</h2>
        <p>Analyze event participation, visitor engagement, and membership activity</p>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Start Date (Optional)</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>End Date (Optional)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Event Type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}>
              <option value="">All Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-group" style={{ flexDirection: "row", alignItems: "flex-end", gap: "0.5rem" }}>
            <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? "Loading..." : "Generate Report"}
            </button>
            <button className="reset-btn" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading report data...</div>}

      {hasGenerated && (
        <>
          {/* ── SECTION 1: EVENTS ── */}
          <div className="data-section" style={{ marginBottom: "2rem" }}>
            <div className="data-header">
              <h3>Events {eventType ? `— ${eventType}` : ""}</h3>
            </div>
            {eventsData.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Capacity</th>
                      <th>Attendees</th>
                      <th>Fill Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventsData.map((e, i) => {
                      const fillRate = e.capacity > 0 ? ((e.total_attendees / e.capacity) * 100).toFixed(1) : 0;
                      const fillColor = fillRate >= 80 ? "#065f46" : fillRate >= 50 ? "#92400e" : "#374151";
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{e.event_name}</td>
                          <td>{formatDate(e.event_date)}</td>
                          <td style={{ textAlign: "center" }}>{e.capacity}</td>
                          <td style={{ textAlign: "center" }}>{e.total_attendees}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ flex: 1, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(fillRate, 100)}%`, background: fillColor, borderRadius: 4, transition: "width 0.3s" }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: fillColor, minWidth: 36 }}>{fillRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                      <td colSpan={2} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>
                        Total Events: {eventsData.length}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "center" }}>
                        {eventsData.reduce((s, e) => s + (e.capacity || 0), 0)}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "center" }}>
                        {eventsData.reduce((s, e) => s + (e.total_attendees || 0), 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="no-results">No events found for the selected filters.</div>
            )}
          </div>

          {/* ── SECTION 2: EVENT VS TICKET ENGAGEMENT ── */}
          <div className="data-section" style={{ marginBottom: "2rem" }}>
            <div className="data-header">
              <h3>Event vs Ticket Engagement</h3>
            </div>

            {evtVsTixSummary && (
              <div className="va-summary-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="va-summary-card primary">
                  <div className="va-summary-label">Total Users</div>
                  <div className="va-summary-value">{formatNumber(evtVsTixSummary.total_users)}</div>
                </div>
                <div className="va-summary-card primary">
                  <div className="va-summary-label">Both Events & Tickets</div>
                  <div className="va-summary-value">{formatNumber(evtVsTixSummary.both)}</div>
                </div>
                <div className="va-summary-card primary">
                  <div className="va-summary-label">Events Only</div>
                  <div className="va-summary-value">{formatNumber(evtVsTixSummary.events_only)}</div>
                </div>
                <div className="va-summary-card primary">
                  <div className="va-summary-label">Tickets Only</div>
                  <div className="va-summary-value">{formatNumber(evtVsTixSummary.tickets_only)}</div>
                </div>
              </div>
            )}

            {engagementBreakdown.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: 4 }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Engagement Breakdown
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={engagementBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [formatNumber(v), "Users"]} />
                      <Bar dataKey="count" name="Users" radius={[2, 2, 0, 0]}>
                        {engagementBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {engagementBreakdown.map((e, i) => (
                    <div key={e.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "#ffffff", border: "1px solid #e5e5e5", borderRadius: 4, borderLeft: `4px solid ${CHART_COLORS[i % CHART_COLORS.length]}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{e.type}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{formatNumber(e.count)} users</div>
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length] }}>{e.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 3: MEMBER EVENT PARTICIPATION ── */}
          <div className="data-section">
            <div className="data-header">
              <h3>Member Event Participation</h3>
            </div>

            {memberEventByLevel.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ background: "#ffffff", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 4 }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Signups by Membership Level
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={memberEventByLevel} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="membership_level" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total_signups" name="Signups" radius={[2, 2, 0, 0]}>
                        {memberEventByLevel.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {memberEventByLevel.map((l, i) => (
                    <div key={l.membership_level} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "#ffffff", border: "1px solid #e5e5e5", borderRadius: 4, borderLeft: `4px solid ${CHART_COLORS[i % CHART_COLORS.length]}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{l.membership_level}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{formatNumber(l.total_members)} members · avg {l.avg_events_per_member || 0} events</div>
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length] }}>{formatNumber(l.total_signups)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {memberEventByLevel.length === 0 && (
              <div className="no-results">No member event participation data found.</div>
            )}
          </div>
        </>
      )}

      {!hasGenerated && !loading && (
        <div className="no-results">Set your filters above and click Generate Report.</div>
      )}
    </div>
  );
}