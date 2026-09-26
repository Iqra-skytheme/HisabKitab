import { useState, useMemo } from "react";
import Table from "../components/Table";
import Button from "../components/Button";

export default function Transactions({
  transactions = [],
  onSelectCustomer,
  onOpenAddTransaction,
  currency = "Rs.",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'Udhaar', 'Jama'
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        txn.customerName.toLowerCase().includes(q) ||
        (txn.description && txn.description.toLowerCase().includes(q)) ||
        (txn.billNumber && txn.billNumber.toLowerCase().includes(q));

      const matchesType =
        typeFilter === "all" ? true : txn.type === typeFilter;

      const matchesMethod =
        methodFilter === "all" ? true : txn.paymentMethod === methodFilter;

      return matchesSearch && matchesType && matchesMethod;
    });
  }, [transactions, searchQuery, typeFilter, methodFilter]);

  const totalFilteredUdhaar = filteredTransactions
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalFilteredJama = filteredTransactions
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const columns = [
    {
      header: "Slip #",
      key: "billNumber",
      width: "110px",
      render: (row) => (
        <span className="font-mono text-muted">{row.billNumber || "—"}</span>
      ),
    },
    {
      header: "Customer",
      key: "customerName",
      render: (row) => (
        <button
          type="button"
          className="customer-link-btn"
          onClick={() => onSelectCustomer && onSelectCustomer(row.customerId)}
        >
          <span className="customer-avatar-mini">
            {row.customerName ? row.customerName.charAt(0) : "C"}
          </span>
          <span className="customer-name-bold">{row.customerName}</span>
        </button>
      ),
    },
    {
      header: "Type",
      key: "type",
      render: (row) => (
        <span className={`badge-pill badge-${row.type.toLowerCase()}`}>
          {row.type === "Udhaar" ? "▼ Udhaar" : "▲ Jama"}
        </span>
      ),
    },
    {
      header: "Date",
      key: "date",
      render: (row) => <span className="date-cell">{row.date}</span>,
    },
    {
      header: "Description",
      key: "description",
      render: (row) => (
        <span className="txn-desc-cell">{row.description || "N/A"}</span>
      ),
    },
    {
      header: "Payment Method",
      key: "paymentMethod",
      render: (row) => (
        <span className="payment-method-tag">
          {row.paymentMethod || "Cash"}
        </span>
      ),
    },
    {
      header: "Amount",
      key: "amount",
      align: "right",
      render: (row) => (
        <span
          className={`amount-cell ${
            row.type === "Udhaar" ? "text-danger" : "text-success"
          }`}
        >
          {row.type === "Udhaar" ? "-" : "+"} {currency}{" "}
          {Number(row.amount).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="page-transactions">
      {/* Summary Filter Strip */}
      <div className="transactions-summary-strip">
        <div className="summary-pill">
          <span className="summary-pill-label">Total Shown</span>
          <span className="summary-pill-val">{filteredTransactions.length} entries</span>
        </div>
        <div className="summary-pill">
          <span className="summary-pill-label">Total Udhaar</span>
          <span className="summary-pill-val text-danger">
            {currency} {totalFilteredUdhaar.toLocaleString()}
          </span>
        </div>
        <div className="summary-pill">
          <span className="summary-pill-label">Total Jama</span>
          <span className="summary-pill-val text-success">
            {currency} {totalFilteredJama.toLocaleString()}
          </span>
        </div>
        <div className="summary-pill">
          <span className="summary-pill-label">Net Difference</span>
          <span className="summary-pill-val font-semibold">
            {currency} {(totalFilteredUdhaar - totalFilteredJama).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="section-toolbar">
        <div className="toolbar-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by customer, invoice #, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${typeFilter === "all" ? "active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              All Types
            </button>
            <button
              type="button"
              className={`filter-pill ${typeFilter === "Udhaar" ? "active" : ""}`}
              onClick={() => setTypeFilter("Udhaar")}
            >
              Udhaar
            </button>
            <button
              type="button"
              className={`filter-pill ${typeFilter === "Jama" ? "active" : ""}`}
              onClick={() => setTypeFilter("Jama")}
            >
              Jama
            </button>
          </div>

          <select
            className="filter-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Khata Credit">Khata Credit</option>
          </select>

          <Button
            variant="primary"
            size="md"
            icon="+"
            onClick={() => onOpenAddTransaction("Udhaar")}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="dashboard-card no-padding">
        <Table
          columns={columns}
          data={filteredTransactions}
          keyField="id"
          emptyMessage={
            searchQuery || typeFilter !== "all"
              ? "No transactions match your search filter."
              : "No transactions recorded yet."
          }
        />
      </div>
    </div>
  );
}
