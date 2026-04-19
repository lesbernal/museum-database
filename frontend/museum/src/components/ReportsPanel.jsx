// components/ReportsPanel.jsx
import { useState } from "react";
import RevenueReport from "./RevenueReport";
import ArtCollectionReport from "./ArtCollectionReport";
import MembershipReport from "./MembershipReport";
import VisitorAnalyticsReport from "./VisitorAnalyticsReport";
import "../styles/ReportsPanel.css";

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState("artCollection"); // Changed default to artCollection

  return (
    <div className="reports-panel">
      <div className="report-buttons">
        <button
          className={activeReport === "artCollection" ? "active" : ""}
          onClick={() => setActiveReport("artCollection")}
        >
          Art Collection
        </button>
        <button
          className={activeReport === "revenue" ? "active" : ""}
          onClick={() => setActiveReport("revenue")}
        >
          Revenue Report
        </button>
        <button
          className={activeReport === "visitorAnalytics" ? "active" : ""}
          onClick={() => setActiveReport("visitorAnalytics")}
        >
          Visitor Analytics
        </button>
        <button
          className={activeReport === "membership" ? "active" : ""}
          onClick={() => setActiveReport("membership")}
        >
          Membership & Donor
        </button>
      </div>

      {activeReport === "artCollection"    && <ArtCollectionReport />}
      {activeReport === "revenue"          && <RevenueReport />}
      {activeReport === "visitorAnalytics" && <VisitorAnalyticsReport />}
      {activeReport === "membership"       && <MembershipReport />}
      {activeReport === "giftShop"         && <div className="coming-soon">Gift Shop Report Coming Soon</div>}
    </div>
  );
}