import { useState } from "react";
import { Toaster, toast } from "sonner";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Modal from "./components/Modal";
import Button from "./components/Button";
import {
  initialCustomers,
  initialTransactions,
  initialShopInfo,
} from "./data/dummyData";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard"); // 'dashboard' | 'customers' | 'customer-details' | 'transactions' | 'reports' | 'settings' | 'login'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [shopInfo, setShopInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("hisabkitab_shopInfo");
      return saved ? JSON.parse(saved) : initialShopInfo;
    } catch {
      return initialShopInfo;
    }
  });

  const handleUpdateShopInfo = (updatedInfo) => {
    setShopInfo(updatedInfo);
    try {
      localStorage.setItem("hisabkitab_shopInfo", JSON.stringify(updatedInfo));
    } catch (err) {
      console.error("Failed to persist shop info to localStorage", err);
    }
    toast.success("Profile & Store Settings Saved!", {
      description: `${updatedInfo.name} settings and profile updated successfully.`,
    });
  };

  const [customers, setCustomers] = useState(initialCustomers);
  const [transactions, setTransactions] = useState(initialTransactions);

  // Modal State: Add Transaction
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({
    customerId: "",
    type: "Udhaar",
    amount: "",
    description: "",
    paymentMethod: "Cash",
    billNumber: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Modal State: Add Customer
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [custForm, setCustForm] = useState({
    name: "",
    phone: "",
    address: "",
    openingBalance: "",
  });

  // Navigation Helper
  const handleNavigate = (page, customerId = null) => {
    setCurrentPage(page);
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open Add Transaction Modal
  const handleOpenAddTransaction = (type = "Udhaar", customerId = null) => {
    const defaultCust = customerId || (customers[0] ? customers[0].id : "");
    const generatedSlip = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    setTxnForm({
      customerId: defaultCust,
      type: type,
      amount: "",
      description: "",
      paymentMethod: type === "Udhaar" ? "Khata Credit" : "Cash",
      billNumber: generatedSlip,
      date: new Date().toISOString().split("T")[0],
    });
    setTxnModalOpen(true);
  };

  // Submit New Transaction
  const handleSaveTransaction = (e) => {
    e.preventDefault();
    if (!txnForm.customerId) {
      toast.error("Please select a customer for this entry.");
      return;
    }
    if (!txnForm.amount || Number(txnForm.amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0.");
      return;
    }

    const targetCustomer = customers.find((c) => c.id === txnForm.customerId);
    const customerName = targetCustomer ? targetCustomer.name : "Customer";
    const amountNum = Number(txnForm.amount);

    const newTxn = {
      id: `tx-${Date.now()}`,
      customerId: txnForm.customerId,
      customerName,
      type: txnForm.type,
      amount: amountNum,
      date: txnForm.date || new Date().toISOString().split("T")[0],
      description: txnForm.description || (txnForm.type === "Udhaar" ? "General goods" : "Account payment"),
      paymentMethod: txnForm.paymentMethod,
      billNumber: txnForm.billNumber || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    // Update transactions list
    setTransactions((prev) => [newTxn, ...prev]);

    // Update customer balances
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === txnForm.customerId) {
          const isUdhaar = txnForm.type === "Udhaar";
          const newUdhaar = (cust.totalUdhaar || 0) + (isUdhaar ? amountNum : 0);
          const newJama = (cust.totalJama || 0) + (!isUdhaar ? amountNum : 0);
          const newBalance = newUdhaar - newJama;
          return {
            ...cust,
            totalUdhaar: newUdhaar,
            totalJama: newJama,
            balance: newBalance,
            status: newBalance > 0 ? "Active" : "Clear",
            lastTransactionDate: newTxn.date,
          };
        }
        return cust;
      })
    );

    setTxnModalOpen(false);

    if (txnForm.type === "Udhaar") {
      toast.warning(`Udhaar Recorded: ${shopInfo.currency} ${amountNum.toLocaleString()}`, {
        description: `Debited to ${customerName} (${newTxn.billNumber})`,
      });
    } else {
      toast.success(`Jama Payment: ${shopInfo.currency} ${amountNum.toLocaleString()}`, {
        description: `Received from ${customerName} via ${txnForm.paymentMethod}`,
      });
    }
  };

  // Open Add Customer Modal
  const handleOpenAddCustomer = () => {
    setCustForm({
      name: "",
      phone: "",
      address: "",
      openingBalance: "",
    });
    setCustModalOpen(true);
  };

  // Submit New Customer
  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!custForm.name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if (!custForm.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    const newId = `c${Date.now()}`;
    const openBal = Number(custForm.openingBalance || 0);

    const newCustomer = {
      id: newId,
      name: custForm.name.trim(),
      phone: custForm.phone.trim(),
      address: custForm.address.trim() || "Local Customer",
      totalUdhaar: openBal > 0 ? openBal : 0,
      totalJama: 0,
      balance: openBal,
      status: openBal > 0 ? "Active" : "Clear",
      lastTransactionDate: new Date().toISOString().split("T")[0],
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    // If opening balance > 0, create an initial transaction entry
    if (openBal > 0) {
      const initialTxn = {
        id: `tx-${Date.now()}`,
        customerId: newId,
        customerName: newCustomer.name,
        type: "Udhaar",
        amount: openBal,
        date: new Date().toISOString().split("T")[0],
        description: "Opening Previous Udhaar Balance",
        paymentMethod: "Khata Credit",
        billNumber: `OPEN-${Math.floor(100 + Math.random() * 900)}`,
      };
      setTransactions((prev) => [initialTxn, ...prev]);
    }

    setCustModalOpen(false);
    toast.success(`Customer Registered: ${newCustomer.name}`, {
      description: `Khata account created with ${shopInfo.currency} ${openBal.toLocaleString()} initial balance.`,
    });
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage("dashboard");
    toast.success("Welcome Back to HisabKitab!", {
      description: `Signed in as ${shopInfo.owner} (${shopInfo.name})`,
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage("login");
    toast.info("Logged Out", {
      description: "You have signed out of your khata account.",
    });
  };

  if (!isAuthenticated || currentPage === "login") {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <Login onLogin={handleLogin} shopInfo={shopInfo} />
      </>
    );
  }

  // Titles for Header
  const pageTitles = {
    dashboard: {
      title: "Khata Dashboard",
      subtitle: `Welcome back, ${shopInfo.owner}! Overview of ${shopInfo.name}`,
    },
    customers: {
      title: "Customers Directory",
      subtitle: "Manage all customer accounts, udhaar ledgers, and contact details",
    },
    "customer-details": {
      title: "Customer Khata Ledger",
      subtitle: "Statement of debits, credits, and account history",
    },
    transactions: {
      title: "Transaction Ledger",
      subtitle: "Chronological log of all Udhaar (credits) and Jama (payments)",
    },
    reports: {
      title: "Financial Analytics & Reports",
      subtitle: "Monthly cash recovery velocity, turnover, and credit health",
    },
    settings: {
      title: "Profile & Store Settings",
      subtitle: "Manage your personal profile, business identity, location, contact, and khata rules",
    },
  };

  const currentHeaderInfo = pageTitles[currentPage] || pageTitles.dashboard;
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <DashboardLayout
        currentPage={currentPage}
        setCurrentPage={handleNavigate}
        shopInfo={shopInfo}
        onLogout={handleLogout}
        title={currentHeaderInfo.title}
        subtitle={currentHeaderInfo.subtitle}
        onQuickAddTransaction={() => handleOpenAddTransaction("Udhaar")}
      >
        {currentPage === "dashboard" && (
          <Dashboard
            customers={customers}
            transactions={transactions}
            onNavigate={handleNavigate}
            onOpenAddTransaction={handleOpenAddTransaction}
            onOpenAddCustomer={handleOpenAddCustomer}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "customers" && (
          <Customers
            customers={customers}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
            onOpenAddCustomer={handleOpenAddCustomer}
            onOpenAddTransaction={handleOpenAddTransaction}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "customer-details" && (
          <CustomerDetails
            customer={activeCustomer}
            transactions={transactions}
            onBack={() => handleNavigate("customers")}
            onOpenAddTransaction={handleOpenAddTransaction}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "transactions" && (
          <Transactions
            transactions={transactions}
            customers={customers}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
            onOpenAddTransaction={handleOpenAddTransaction}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "reports" && (
          <Reports
            customers={customers}
            transactions={transactions}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "settings" && (
          <Settings
            shopInfo={shopInfo}
            onUpdateShopInfo={handleUpdateShopInfo}
          />
        )}
      </DashboardLayout>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        title={
          txnForm.type === "Udhaar"
            ? "Record Udhaar (Credit Given)"
            : "Record Jama (Payment Received)"
        }
      >
        <form onSubmit={handleSaveTransaction} className="modal-form">
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-toggle-btn type-udhaar ${
                  txnForm.type === "Udhaar" ? "active" : ""
                }`}
                onClick={() =>
                  setTxnForm((prev) => ({
                    ...prev,
                    type: "Udhaar",
                    paymentMethod: "Khata Credit",
                  }))
                }
              >
                Udhaar (Debit)
              </button>
              <button
                type="button"
                className={`type-toggle-btn type-jama ${
                  txnForm.type === "Jama" ? "active" : ""
                }`}
                onClick={() =>
                  setTxnForm((prev) => ({
                    ...prev,
                    type: "Jama",
                    paymentMethod: "Cash",
                  }))
                }
              >
                Jama (Credit)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-cust">
              Select Customer *
            </label>
            <select
              id="txn-cust"
              className="form-input"
              value={txnForm.customerId}
              onChange={(e) =>
                setTxnForm((prev) => ({ ...prev, customerId: e.target.value }))
              }
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Balance: {shopInfo.currency} {c.balance})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-amount">
                Amount ({shopInfo.currency}) *
              </label>
              <input
                id="txn-amount"
                type="number"
                min="1"
                step="any"
                className="form-input"
                placeholder="e.g. 2500"
                value={txnForm.amount}
                onChange={(e) =>
                  setTxnForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-date">
                Date
              </label>
              <input
                id="txn-date"
                type="date"
                className="form-input"
                value={txnForm.date}
                onChange={(e) =>
                  setTxnForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-method">
                Payment Channel
              </label>
              <select
                id="txn-method"
                className="form-input"
                value={txnForm.paymentMethod}
                onChange={(e) =>
                  setTxnForm((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              >
                <option value="Cash">Cash at Counter</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Khata Credit">Khata Credit</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-bill">
                Bill / Receipt No.
              </label>
              <input
                id="txn-bill"
                type="text"
                className="form-input"
                placeholder="e.g. INV-1092"
                value={txnForm.billNumber}
                onChange={(e) =>
                  setTxnForm((prev) => ({ ...prev, billNumber: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-desc">
              Description / Item Notes
            </label>
            <input
              id="txn-desc"
              type="text"
              className="form-input"
              placeholder="e.g. 5kg Sugar, 2L Cooking Oil"
              value={txnForm.description}
              onChange={(e) =>
                setTxnForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTxnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={txnForm.type === "Udhaar" ? "danger" : "success"}
            >
              Save {txnForm.type} Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={custModalOpen}
        onClose={() => setCustModalOpen(false)}
        title="Register New Customer Khata"
      >
        <form onSubmit={handleSaveCustomer} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="cust-name">
              Full Customer Name *
            </label>
            <input
              id="cust-name"
              type="text"
              className="form-input"
              placeholder="e.g. Tariq Mehmood"
              value={custForm.name}
              onChange={(e) =>
                setCustForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-phone">
                Phone Number *
              </label>
              <input
                id="cust-phone"
                type="text"
                className="form-input"
                placeholder="e.g. 0300-1234567"
                value={custForm.phone}
                onChange={(e) =>
                  setCustForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cust-opening">
                Opening Balance ({shopInfo.currency})
              </label>
              <input
                id="cust-opening"
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder="0 if new account"
                value={custForm.openingBalance}
                onChange={(e) =>
                  setCustForm((prev) => ({
                    ...prev,
                    openingBalance: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cust-address">
              Shop / Home Address (Optional)
            </label>
            <input
              id="cust-address"
              type="text"
              className="form-input"
              placeholder="e.g. Street 4, Sector G-8, Islamabad"
              value={custForm.address}
              onChange={(e) =>
                setCustForm((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Customer
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}