import { useState } from "react";
import { toast } from "sonner";
import StatCard from "../components/StatCard";
import Button from "../components/Button";
import { monthlyReportData, categoryBreakdown } from "../data/dummyData";

export default function Reports({
  customers = [],
  transactions = [],
  currency = "Rs.",
}) {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [exportNotice, setExportNotice] = useState("");

  const totalUdhaar = transactions
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = transactions
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const recoveryRate =
    totalUdhaar > 0 ? Math.round((totalJama / totalUdhaar) * 100) : 100;

  const maxMonthlyVal = Math.max(
    ...monthlyReportData.map((d) => Math.max(d.udhaar, d.jama)),
    100000
  );

  const handleExport = (type) => {
    setExportNotice(`Exporting ${type} report... (Ready)`);
    toast.success(`${type} Statement Exported`, {
      description: `Ledger report for ${selectedPeriod} prepared and ready.`,
    });
    setTimeout(() => setExportNotice(""), 3500);
  };

  return (
    <div className="page-reports">
      {/* Top Banner & Export Bar */}
      <div className="reports-top-bar">
        <div>
          <h2 className="card-heading">Financial Intelligence & Ledger Analytics</h2>
          <p className="card-subheading">
            Track credit cycles, recovery velocity, and monthly sales trends
          </p>
        </div>

        <div className="reports-export-group">
          {exportNotice && <span className="export-toast">{exportNotice}</span>}
          <select
            className="filter-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Current Financial Year</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("PDF")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Export PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("Excel")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10"></path>
              <path d="M12 20V4"></path>
              <path d="M6 20v-6"></path>
            </svg>
            <span>Export CSV / Excel</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="dashboard-stats-grid">
        <StatCard
          title="Overall Recovery Rate"
          value={`${recoveryRate}%`}
          subtitle="Jama collected vs Udhaar given"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          }
          variant="success"
          trend={{ direction: "up", label: "+4% vs last month" }}
        />

        <StatCard
          title="Total Credit Extended"
          value={`${currency} ${totalUdhaar.toLocaleString()}`}
          subtitle="All recorded Udhaar"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          }
          variant="danger"
        />

        <StatCard
          title="Total Cash Collected"
          value={`${currency} ${totalJama.toLocaleString()}`}
          subtitle="All recorded Jama"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          }
          variant="primary"
        />

        <StatCard
          title="Active Khata Customers"
          value={customers.filter((c) => (c.balance || 0) > 0).length}
          subtitle={`Out of ${customers.length} total customers`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
          variant="warning"
        />
      </section>

      {/* Monthly Udhaar vs Jama Comparison Chart */}
      <div className="dashboard-card reports-chart-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-heading">Monthly Udhaar vs. Jama Comparison</h3>
            <p className="card-subheading">Credit cycle trends for the last 6 months</p>
          </div>

          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color legend-udhaar"></span> Udhaar (Credit)
            </span>
            <span className="legend-item">
              <span className="legend-color legend-jama"></span> Jama (Payment)
            </span>
          </div>
        </div>

        <div className="bar-chart-container">
          <div className="bar-chart-bars">
            {monthlyReportData.map((item, index) => {
              const udhaarHeight = Math.round((item.udhaar / maxMonthlyVal) * 100);
              const jamaHeight = Math.round((item.jama / maxMonthlyVal) * 100);

              return (
                <div key={index} className="chart-bar-group">
                  <div className="bars-pair">
                    <div
                      className="bar-fill bar-udhaar"
                      style={{ height: `${udhaarHeight}%` }}
                      title={`Udhaar: ${currency} ${item.udhaar.toLocaleString()}`}
                    >
                      <span className="bar-tooltip">
                        {currency} {(item.udhaar / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div
                      className="bar-fill bar-jama"
                      style={{ height: `${jamaHeight}%` }}
                      title={`Jama: ${currency} ${item.jama.toLocaleString()}`}
                    >
                      <span className="bar-tooltip">
                        {currency} {(item.jama / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                  <span className="chart-bar-label">{item.month}</span>
                  <span className="chart-bar-rate">{item.collectionRate}% rec.</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Monthly Performance Summary */}
      <div className="reports-analytics-split">
        {/* Category Breakdown */}
        <div className="dashboard-card category-breakdown-card">
          <h3 className="card-heading">Top Udhaar Categories</h3>
          <p className="card-subheading">Distribution of credit purchases by category</p>

          <div className="category-progress-list">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="category-progress-item">
                <div className="category-item-header">
                  <span className="category-name">{cat.category}</span>
                  <span className="category-amount">
                    {currency} {cat.amount.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor:
                        idx === 0
                          ? "#2563eb"
                          : idx === 1
                          ? "#16a34a"
                          : idx === 2
                          ? "#d97706"
                          : "#7c3aed",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Recovery Snapshot Table */}
        <div className="dashboard-card recovery-velocity-card">
          <h3 className="card-heading">Recovery Velocity</h3>
          <p className="card-subheading">Collection efficiency across recent months</p>

          <div className="report-summary-table-wrap">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Udhaar</th>
                  <th>Jama</th>
                  <th style={{ textAlign: "right" }}>Rec. %</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReportData.slice(-4).map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{row.month}</td>
                    <td className="text-danger font-medium">{currency} {(row.udhaar / 1000).toFixed(0)}k</td>
                    <td className="text-success font-medium">{currency} {(row.jama / 1000).toFixed(0)}k</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`badge-pill ${row.collectionRate >= 80 ? "badge-jama" : "badge-udhaar"}`}>
                        <span className="badge-dot"></span>
                        {row.collectionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
