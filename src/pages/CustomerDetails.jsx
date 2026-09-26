import { toast } from "sonner";
import Table from "../components/Table";
import Button from "../components/Button";

function computeCustomerStatement(txns) {
  const sorted = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));
  let balance = 0;
  const list = [];
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const delta = item.type === "Udhaar" ? Number(item.amount) : -Number(item.amount);
    balance += delta;
    list.push({
      ...item,
      runningBalance: balance,
    });
  }
  return list.reverse();
}

export default function CustomerDetails({
  customer,
  transactions = [],
  onBack,
  onOpenAddTransaction,
  currency = "Rs.",
}) {
  if (!customer) {
    return (
      <div className="empty-state-card">
        <h3>Customer Not Found</h3>
        <p>The customer details you are looking for do not exist or were removed.</p>
        <Button variant="primary" onClick={onBack}>
          ← Back to Customers
        </Button>
      </div>
    );
  }

  // Filter transactions for this customer
  const customerTxns = transactions.filter(
    (t) => t.customerId === customer.id
  );

  const txnsWithRunning = computeCustomerStatement(customerTxns);

  const totalUdhaar = customerTxns
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = customerTxns
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalUdhaar - totalJama;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Assalam-o-Alaikum ${customer.name},\nThis is a friendly reminder from Bismillah General Store.\nYour pending khata balance is ${currency} ${netBalance.toLocaleString()}.\nPlease clear at your earliest convenience. Shukriya!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("WhatsApp Reminder Opened", {
      description: `Friendly payment reminder generated for ${customer.name} (${currency} ${netBalance.toLocaleString()})`,
    });
  };

  const columns = [
    {
      header: "Date",
      key: "date",
      render: (row) => <span className="date-cell">{row.date}</span>,
    },
    {
      header: "Type",
      key: "type",
      render: (row) => (
        <span className={`badge-pill badge-${row.type.toLowerCase()}`}>
          {row.type === "Udhaar" ? "▼ Udhaar (Debit)" : "▲ Jama (Credit)"}
        </span>
      ),
    },
    {
      header: "Description / Items",
      key: "description",
      render: (row) => (
        <div>
          <span className="txn-desc-title">{row.description}</span>
          <span className="customer-meta-sub">
            {row.billNumber} • {row.paymentMethod}
          </span>
        </div>
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
    {
      header: "Account Balance",
      key: "runningBalance",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-dark">
          {currency} {row.runningBalance.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="page-customer-details">
      {/* Navigation Breadcrumb */}
      <div className="customer-breadcrumb">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back to Customers
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{customer.name} Khata</span>
      </div>

      {/* Customer Header Card */}
      <div className="customer-profile-card">
        <div className="profile-info-row">
          <div className="profile-main-data">
            <div className="avatar-xl">{customer.name.charAt(0)}</div>
            <div>
              <div className="customer-name-heading">
                <h2>{customer.name}</h2>
                <span
                  className={`status-pill ${
                    netBalance > 0 ? "status-due" : "status-cleared"
                  }`}
                >
                  {netBalance > 0 ? "Pending Balance" : "Account Cleared"}
                </span>
              </div>
              <p className="profile-contact-line">
                <span>📞 {customer.phone}</span>
                {customer.address && <span>📍 {customer.address}</span>}
              </p>
            </div>
          </div>

          <div className="customer-action-buttons">
            <Button
              variant="danger"
              size="md"
              icon="+"
              onClick={() => onOpenAddTransaction("Udhaar", customer.id)}
            >
              Give Udhaar
            </Button>
            <Button
              variant="success"
              size="md"
              icon="+"
              onClick={() => onOpenAddTransaction("Jama", customer.id)}
            >
              Receive Jama
            </Button>
            <Button
              variant="outline"
              size="md"
              icon="💬"
              onClick={handleShareWhatsApp}
            >
              WhatsApp Reminder
            </Button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="customer-financial-strip">
          <div className="financial-cell">
            <span className="financial-label">Total Udhaar Taken</span>
            <span className="financial-val text-danger">
              {currency} {totalUdhaar.toLocaleString()}
            </span>
          </div>
          <div className="financial-divider"></div>
          <div className="financial-cell">
            <span className="financial-label">Total Jama Paid</span>
            <span className="financial-val text-success">
              {currency} {totalJama.toLocaleString()}
            </span>
          </div>
          <div className="financial-divider"></div>
          <div className="financial-cell">
            <span className="financial-label">Net Balance Owed</span>
            <span
              className={`financial-val ${
                netBalance > 0 ? "text-danger font-bold" : "text-success"
              }`}
            >
              {currency} {netBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger History */}
      <div className="dashboard-card no-padding">
        <div className="card-header-flex p-card-header">
          <div>
            <h2 className="card-heading">Khata Ledger Statement</h2>
            <p className="card-subheading">
              Complete chronological audit trail for this customer
            </p>
          </div>
          <span className="tag-count">{customerTxns.length} Entries</span>
        </div>

        <Table
          columns={columns}
          data={txnsWithRunning}
          keyField="id"
          emptyMessage="No ledger transactions found for this customer."
        />
      </div>
    </div>
  );
}
