// components/ReportsPanel.jsx
import { useState } from "react";
import RevenueReport from "./RevenueReport";
import VisitorAnalyticsReport from "./VisitorAnalyticsReport";
import "../styles/ReportsPanel.css";

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState("revenue");

  return (
    <div className="reports-panel">
      <div className="report-buttons">
        <button
          className={activeReport === "revenue" ? "active" : ""}
          onClick={() => setActiveReport("revenue")}
        >
          Revenue Report
        </button>
        <button
          className={activeReport === "artCollection" ? "active" : ""}
          onClick={() => setActiveReport("artCollection")}
        >
          Art Collection
        </button>
        <button
          className={activeReport === "visitorAnalytics" ? "active" : ""}
          onClick={() => setActiveReport("visitorAnalytics")}
        >
          Visitor Analytics
        </button>
        <button
          className={activeReport === "giftShop" ? "active" : ""}
          onClick={() => setActiveReport("giftShop")}
        >
          Gift Shop
        </button>
      </div>

      {activeReport === "revenue"          && <RevenueReport />}
      {activeReport === "artCollection"    && <div className="coming-soon">Art Collection Report Coming Soon</div>}
      {activeReport === "visitorAnalytics" && <VisitorAnalyticsReport />}
      {activeReport === "giftShop"         && <div className="coming-soon">Gift Shop Report Coming Soon</div>}
    </div>
  );
}