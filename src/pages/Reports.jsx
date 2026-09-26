import { useState } from "react";
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
            📄 Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("Excel")}
          >
            📊 Export CSV / Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="dashboard-stats-grid">
        <StatCard
          title="Overall Recovery Rate"
          value={`${recoveryRate}%`}
          subtitle="Jama collected vs Udhaar given"
          icon="🎯"
          variant="success"
          trend={{ direction: "up", label: "+4% vs last month" }}
        />

        <StatCard
          title="Total Credit Extended"
          value={`${currency} ${totalUdhaar.toLocaleString()}`}
          subtitle="All recorded Udhaar"
          icon="💳"
          variant="danger"
        />

        <StatCard
          title="Total Cash Collected"
          value={`${currency} ${totalJama.toLocaleString()}`}
          subtitle="All recorded Jama"
          icon="💵"
          variant="primary"
        />

        <StatCard
          title="Active Khata Customers"
          value={customers.filter((c) => (c.balance || 0) > 0).length}
          subtitle={`Out of ${customers.length} total customers`}
          icon="👥"
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

      {/* Grid: Category Breakdown & Recovery Insights */}
      <div className="dashboard-content-split">
        {/* Category Breakdown */}
        <div className="dashboard-card">
          <h3 className="card-heading">Top Udhaar Categories</h3>
          <p className="card-subheading">Estimated distribution of credit purchases</p>

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
                          ? "#3b82f6"
                          : idx === 1
                          ? "#10b981"
                          : idx === 2
                          ? "#f59e0b"
                          : "#8b5cf6",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Tips & Recovery Guidelines */}
        <div className="dashboard-card tips-card">
          <h3 className="card-heading">Khata Health Insights</h3>
          <p className="card-subheading">AI suggestions to optimize your cash flow</p>

          <div className="insight-bullets">
            <div className="insight-bullet">
              <span className="bullet-icon">⚡</span>
              <div>
                <strong>Prompt WhatsApp Reminders:</strong>
                <p>
                  Sending reminders within 14 days of credit issuance increases
                  payment recovery by up to 34%.
                </p>
              </div>
            </div>

            <div className="insight-bullet">
              <span className="bullet-icon">🛡️</span>
              <div>
                <strong>Set Udhaar Limits:</strong>
                <p>
                  Consider putting a ceiling of {currency} 25,000 on retail customers
                  to maintain liquidity for stock purchases.
                </p>
              </div>
            </div>

            <div className="insight-bullet">
              <span className="bullet-icon">📱</span>
              <div>
                <strong>Accept Digital Payments:</strong>
                <p>
                  EasyPaisa and JazzCash QR codes at your counter facilitate
                  immediate partial clearances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
