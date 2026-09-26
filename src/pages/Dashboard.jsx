import StatCard from "../components/StatCard";
import Table from "../components/Table";
import Button from "../components/Button";

export default function Dashboard({
  customers = [],
  transactions = [],
  onNavigate,
  onOpenAddTransaction,
  onOpenAddCustomer,
  currency = "Rs.",
}) {
  // Compute totals
  const totalUdhaar = transactions
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = transactions
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalUdhaar - totalJama;

  // Recent 5 transactions
  const recentTransactions = [...transactions].slice(0, 5);

  // Top customers by balance
  const topDebtors = [...customers]
    .filter((c) => (c.balance || 0) > 0)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 4);

  const columns = [
    {
      header: "Customer",
      key: "customerName",
      render: (row) => (
        <div className="table-customer-cell">
          <div className="avatar-circle">
            {row.customerName ? row.customerName.charAt(0) : "C"}
          </div>
          <div>
            <span className="customer-name-bold">{row.customerName}</span>
            <span className="customer-meta-sub">{row.billNumber}</span>
          </div>
        </div>
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
      header: "Method",
      key: "paymentMethod",
      render: (row) => (
        <span className="payment-method-tag">{row.paymentMethod || "Cash"}</span>
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
    <div className="page-dashboard">
      {/* Overview Stat Cards */}
      <section className="dashboard-stats-grid">
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered accounts"
          icon="👥"
          variant="primary"
          trend={{ direction: "up", label: "+4 new" }}
          onClick={() => onNavigate("customers")}
        />

        <StatCard
          title="Total Udhaar (Given)"
          value={`${currency} ${totalUdhaar.toLocaleString()}`}
          subtitle="Total credit extended"
          icon="📉"
          variant="danger"
          trend={{ direction: "up", label: "Credit" }}
        />

        <StatCard
          title="Total Jama (Received)"
          value={`${currency} ${totalJama.toLocaleString()}`}
          subtitle="Total cash collected"
          icon="📈"
          variant="success"
          trend={{ direction: "up", label: "Collected" }}
        />

        <StatCard
          title="Net Receivable"
          value={`${currency} ${Math.max(0, netBalance).toLocaleString()}`}
          subtitle={netBalance >= 0 ? "Pending market recovery" : "Advance collected"}
          icon="💰"
          variant="warning"
        />
      </section>

      {/* Quick Action Bar */}
      <section className="dashboard-quick-actions">
        <div className="quick-actions-info">
          <h3>Quick Operations</h3>
          <p>Instantly log a transaction or register a new customer khata</p>
        </div>
        <div className="quick-actions-btns">
          <Button
            variant="danger"
            size="md"
            icon="+"
            onClick={() => onOpenAddTransaction("Udhaar")}
          >
            Give Udhaar
          </Button>
          <Button
            variant="success"
            size="md"
            icon="+"
            onClick={() => onOpenAddTransaction("Jama")}
          >
            Receive Jama
          </Button>
          <Button
            variant="outline"
            size="md"
            icon="👤"
            onClick={onOpenAddCustomer}
          >
            New Customer
          </Button>
        </div>
      </section>

      {/* Grid: Recent Transactions & Top Debtors */}
      <div className="dashboard-content-split">
        {/* Recent Transactions */}
        <div className="dashboard-card transactions-card">
          <div className="card-header-flex">
            <div>
              <h2 className="card-heading">Recent Transactions</h2>
              <p className="card-subheading">Latest ledger entries recorded</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("transactions")}
            >
              View All →
            </Button>
          </div>

          <Table
            columns={columns}
            data={recentTransactions}
            keyField="id"
            emptyMessage="No transactions recorded yet."
          />
        </div>

        {/* Top Debtors Side Card */}
        <div className="dashboard-card top-debtors-card">
          <div className="card-header-flex">
            <div>
              <h2 className="card-heading">Pending Recovery</h2>
              <p className="card-subheading">Top customers with balance</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("customers")}
            >
              All →
            </Button>
          </div>

          {topDebtors.length === 0 ? (
            <div className="empty-debtors">
              <span>🎉</span>
              <p>All accounts are cleared!</p>
            </div>
          ) : (
            <div className="debtors-list">
              {topDebtors.map((customer) => (
                <div
                  key={customer.id}
                  className="debtor-item"
                  onClick={() => onNavigate("customer-details", customer.id)}
                >
                  <div className="debtor-left">
                    <div className="avatar-circle">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="debtor-name">{customer.name}</h4>
                      <p className="debtor-phone">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="debtor-right">
                    <span className="debtor-amount">
                      {currency} {(customer.balance || 0).toLocaleString()}
                    </span>
                    <span className="debtor-action-hint">View Ledger →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
