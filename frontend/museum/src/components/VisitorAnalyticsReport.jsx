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
  const [eventSort, setEventSort] = useState("date_asc");

  // Event vs Tickets state
  const [evtVsTixSummary,     setEvtVsTixSummary]     = useState(null);
  const [engagementBreakdown, setEngagementBreakdown] = useState([]);

  // Member Event Participation state
  const [memberEventSummary, setMemberEventSummary] = useState(null);
  const [memberEventByLevel, setMemberEventByLevel] = useState([]);

  // Events state
  const [eventsData,         setEventsData]         = useState([]);
  const [archivedEventsData, setArchivedEventsData] = useState([]);

  // Event Revenue Impact state
  const [revenueImpactData,    setRevenueImpactData]    = useState([]);
  const [revenueImpactSummary, setRevenueImpactSummary] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setHasGenerated(false);
    try {
      let eventsUrl = `${BASE_URL}/reports/visitor-analytics?`;
      if (startDate) eventsUrl += `startDate=${startDate}&`;
      if (endDate)   eventsUrl += `endDate=${endDate}&`;

      const [evtVsTixRes, memberRes, analyticsRes, archivedRes, revenueImpactRes] = await Promise.all([
        fetch(`${BASE_URL}/reports/event-vs-tickets`),
        fetch(`${BASE_URL}/reports/member-event-participation`),
        fetch(eventsUrl),
        fetch(`${BASE_URL}/reports/archived-events`),
        fetch(`${BASE_URL}/reports/event-revenue-impact`),
      ]);

      const evtVsTixJson      = await evtVsTixRes.json();
      const memberJson        = await memberRes.json();
      const analyticsJson     = await analyticsRes.json();
      const archivedJson      = await archivedRes.json();
      const revenueImpactJson = await revenueImpactRes.json();

      setEvtVsTixSummary(evtVsTixJson.summary || null);
      setEngagementBreakdown(Array.isArray(evtVsTixJson.engagementBreakdown) ? evtVsTixJson.engagementBreakdown : []);
      setMemberEventSummary(memberJson.summary || null);
      setMemberEventByLevel(Array.isArray(memberJson.byLevel) ? memberJson.byLevel : []);

      let events = Array.isArray(analyticsJson.events) ? analyticsJson.events : [];
      if (eventType) events = events.filter(e => e.event_type === eventType);
      setEventsData(events);

      setArchivedEventsData(Array.isArray(archivedJson) ? archivedJson : []);
      setRevenueImpactData(Array.isArray(revenueImpactJson.data) ? revenueImpactJson.data : []);
      setRevenueImpactSummary(revenueImpactJson.summary || null);

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
    setEventSort("date_asc");
    setEvtVsTixSummary(null);
    setEngagementBreakdown([]);
    setMemberEventSummary(null);
    setMemberEventByLevel([]);
    setEventsData([]);
    setArchivedEventsData([]);
    setRevenueImpactData([]);
    setRevenueImpactSummary(null);
  }

  const sortedEventsData = [...eventsData].sort((a, b) => {
    switch (eventSort) {
      case "date_asc":       return new Date(a.event_date) - new Date(b.event_date);
      case "date_desc":      return new Date(b.event_date) - new Date(a.event_date);
      case "fill_desc":      return (b.total_attendees / b.capacity) - (a.total_attendees / a.capacity);
      case "fill_asc":       return (a.total_attendees / a.capacity) - (b.total_attendees / b.capacity);
      case "capacity_desc":  return b.capacity - a.capacity;
      case "attendees_desc": return b.total_attendees - a.total_attendees;
      default: return 0;
    }
  });

  // Chart data for revenue impact
  const revenueImpactChartData = revenueImpactData.slice(0, 10).map(r => ({
    name: r.event_name.length > 15 ? r.event_name.slice(0, 15) + "..." : r.event_name,
    Tickets:   parseFloat(r.ticket_revenue)   || 0,
    Cafe:      parseFloat(r.cafe_revenue)     || 0,
    GiftShop:  parseFloat(r.giftshop_revenue) || 0,
    Donations: parseFloat(r.donation_revenue) || 0,
  }));

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
          <div className="filter-group">
            <label>Sort Events By</label>
            <select value={eventSort} onChange={e => setEventSort(e.target.value)}>
              <option value="date_asc">Earliest First</option>
              <option value="date_desc">Latest First</option>
              <option value="fill_desc">Most Full First</option>
              <option value="fill_asc">Least Full First</option>
              <option value="capacity_desc">Largest Capacity First</option>
              <option value="attendees_desc">Most Attended First</option>
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
            {sortedEventsData.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Name</th><th>Type</th><th>Date</th>
                      <th>Capacity</th><th>Attendees</th><th>Fill Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEventsData.map((e, i) => {
                      const fillRate  = e.capacity > 0 ? ((e.total_attendees / e.capacity) * 100).toFixed(1) : 0;
                      const fillColor = fillRate >= 80 ? "#065f46" : fillRate >= 50 ? "#92400e" : "#374151";
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{e.event_name}</td>
                          <td><span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: "#f3f4f6", color: "#374151" }}>{e.event_type || "General"}</span></td>
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
                      <td colSpan={3} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>Total Events: {sortedEventsData.length}</td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "center" }}>{sortedEventsData.reduce((s, e) => s + (e.capacity || 0), 0)}</td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "center" }}>{sortedEventsData.reduce((s, e) => s + (e.total_attendees || 0), 0)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="no-results">No events found for the selected filters.</div>
            )}
          </div>

          {/* ── ARCHIVED EVENTS ── */}
          <div className="data-section" style={{ marginBottom: "2rem" }}>
            <div className="data-header"><h3>Archived Events</h3></div>
            {archivedEventsData.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Name</th><th>Type</th><th>Date</th>
                      <th>Capacity</th><th>Attendees</th><th>Fill Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedEventsData.map((e, i) => {
                      const fillRate  = e.capacity > 0 ? ((e.total_attendees / e.capacity) * 100).toFixed(1) : 0;
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, color: "#9ca3af" }}>{e.event_name}</td>
                          <td><span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: "#f3f4f6", color: "#9ca3af" }}>{e.event_type || "General"}</span></td>
                          <td style={{ color: "#9ca3af" }}>{formatDate(e.event_date)}</td>
                          <td style={{ textAlign: "center", color: "#9ca3af" }}>{e.capacity}</td>
                          <td style={{ textAlign: "center", color: "#9ca3af" }}>{e.total_attendees}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ flex: 1, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(fillRate, 100)}%`, background: "#d1d5db", borderRadius: 4 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", minWidth: 36 }}>{fillRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                      <td colSpan={3} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>Total Archived: {archivedEventsData.length}</td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "center" }}>{archivedEventsData.reduce((s, e) => s + (e.capacity || 0), 0)}</td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "center" }}>{archivedEventsData.reduce((s, e) => s + (e.total_attendees || 0), 0)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="no-results">No archived events found.</div>
            )}
          </div>

          {/* ── SECTION 4: EVENT REVENUE IMPACT ── */}
          <div className="data-section" style={{ marginBottom: "2rem" }}>
            <div className="data-header">
              <h3>Event Revenue Impact</h3>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: "1.5rem" }}>
              Shows total revenue generated across all sources on each event day — tickets, cafe, gift shop, and donations.
            </p>

            {/* Summary cards */}
            {revenueImpactSummary && (
              <div className="va-summary-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="va-summary-card primary">
                  <div className="va-summary-label">Total Revenue on Event Days</div>
                  <div className="va-summary-value">{formatCurrency(revenueImpactSummary.total_revenue)}</div>
                </div>
              </div>
            )}

            {/* Highest revenue event banner */}
            {revenueImpactSummary?.highest_revenue_event && revenueImpactSummary.highest_revenue_event !== "—" && (
              <div style={{ padding: "0.75rem 1rem", background: "#fef9c3", border: "1px solid #f4d03f", fontSize: 13, color: "#854d0e", marginBottom: "1.5rem", borderRadius: 4 }}>
                Highest revenue event day: <strong>{revenueImpactSummary.highest_revenue_event}</strong> — {formatCurrency(Math.max(...revenueImpactData.map(r => r.total_revenue)))}
              </div>
            )}

            {/* Table */}
            {revenueImpactData.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Name</th><th>Type</th><th>Date</th><th>Attendees</th>
                      <th style={{ textAlign: "right" }}>Tickets</th>
                      <th style={{ textAlign: "right" }}>Cafe</th>
                      <th style={{ textAlign: "right" }}>Gift Shop</th>
                      <th style={{ textAlign: "right" }}>Donations</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueImpactData.map((r, i) => (
                      <tr key={i} style={{ opacity: r.is_active === 0 ? 0.5 : 1 }}>
                        <td style={{ fontWeight: 500 }}>
                          {r.event_name}
                          {r.is_active === 0 && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.68rem", background: "#f3f4f6", color: "#9ca3af", padding: "0.1rem 0.4rem", borderRadius: 999, fontWeight: 600 }}>
                              Archived
                            </span>
                          )}
                        </td>
                        <td><span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: "#f3f4f6", color: "#374151" }}>{r.event_type || "General"}</span></td>
                        <td>{formatDate(r.event_date)}</td>
                        <td style={{ textAlign: "center" }}>{r.total_attendees}</td>
                        <td style={{ textAlign: "right", color: "#c5a028", fontWeight: 500 }}>{formatCurrency(r.ticket_revenue)}</td>
                        <td style={{ textAlign: "right", color: "#1d4ed8", fontWeight: 500 }}>{formatCurrency(r.cafe_revenue)}</td>
                        <td style={{ textAlign: "right", color: "#065f46", fontWeight: 500 }}>{formatCurrency(r.giftshop_revenue)}</td>
                        <td style={{ textAlign: "right", color: "#92400e", fontWeight: 500 }}>{formatCurrency(r.donation_revenue)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#1a1a2e" }}>{formatCurrency(r.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                      <td colSpan={4} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>
                        Total across {revenueImpactData.length} events
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#c5a028", textAlign: "right" }}>
                        {formatCurrency(revenueImpactData.reduce((s, r) => s + parseFloat(r.ticket_revenue), 0))}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#1d4ed8", textAlign: "right" }}>
                        {formatCurrency(revenueImpactData.reduce((s, r) => s + parseFloat(r.cafe_revenue), 0))}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#065f46", textAlign: "right" }}>
                        {formatCurrency(revenueImpactData.reduce((s, r) => s + parseFloat(r.giftshop_revenue), 0))}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#92400e", textAlign: "right" }}>
                        {formatCurrency(revenueImpactData.reduce((s, r) => s + parseFloat(r.donation_revenue), 0))}
                      </td>
                      <td style={{ padding: "0.625rem 1rem", fontWeight: 700, fontSize: 12, color: "#1a1a2e", textAlign: "right" }}>
                        {formatCurrency(revenueImpactData.reduce((s, r) => s + r.total_revenue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="no-results">No revenue impact data found.</div>
            )}
          </div>

          {/* ── SECTION 2: EVENT VS TICKET ENGAGEMENT ── */}
          <div className="data-section" style={{ marginBottom: "2rem" }}>
            <div className="data-header"><h3>Event vs Ticket Engagement</h3></div>
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
                <div style={{ background: "#ffffff", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 4 }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Engagement Breakdown</h4>
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
            <div className="data-header"><h3>Member Event Participation</h3></div>
            {memberEventByLevel.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ background: "#ffffff", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 4 }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Signups by Membership Level</h4>
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
            ) : (
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