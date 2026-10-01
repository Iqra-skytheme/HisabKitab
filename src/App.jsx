import { useState, useEffect } from "react";
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
  COUNTRY_CODES,
} from "./data/dummyData";
import {
  getActiveSession,
  clearSession,
  initOwnerCredentials,
} from "./services/authService";
import {
  generateUniqueReceiptNumber,
  isReceiptNumberUnique,
} from "./utils/receiptUtils";
import { exportTransactionReceiptPDF } from "./services/exportService";
import {
  validateEmail,
  sendTransactionEmailNotification,
  generateTransactionEmailHtml,
  generateTransactionEmailText,
} from "./services/emailService";


export default function App() {
  // Session check on load: if authenticated, stay logged in across page reloads
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const activeSession = getActiveSession();
      return !!activeSession;
    } catch {
      return false;
    }
  });

  // Page persistence: remember current page (e.g. Customers) across refreshes
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const activeSession = getActiveSession();
      if (!activeSession) return "login";
      const savedPage = localStorage.getItem("hisabkitab_currentPage");
      return savedPage && savedPage !== "login" ? savedPage : "dashboard";
    } catch {
      return "dashboard";
    }
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    try {
      return localStorage.getItem("hisabkitab_selectedCustomerId") || null;
    } catch {
      return null;
    }
  });

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

  useEffect(() => {
    initOwnerCredentials();
  }, []);

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
    email: "",
    countryCode: "+92",
    phone: "",
    address: "",
    openingBalance: "",
    isWhatsAppRegistered: true,
  });

  // Modal State: Edit Customer
  const [editCustModalOpen, setEditCustModalOpen] = useState(false);
  const [editCustForm, setEditCustForm] = useState({
    id: "",
    name: "",
    email: "",
    countryCode: "+92",
    phone: "",
    address: "",
    isWhatsAppRegistered: true,
  });

  // Modal State: Email Notification Preview
  const [emailPreviewModalOpen, setEmailPreviewModalOpen] = useState(false);
  const [previewEmailData, setPreviewEmailData] = useState(null);

  const [activeTxnFilter, setActiveTxnFilter] = useState("all");
  const [activeCustFilter, setActiveCustFilter] = useState("all");

  // Navigation Helper with Page Persistence and Filter Parameters
  const handleNavigate = (page, targetOrFilter = null) => {
    setCurrentPage(page);

    if (page === "transactions") {
      if (typeof targetOrFilter === "object" && targetOrFilter?.typeFilter) {
        setActiveTxnFilter(targetOrFilter.typeFilter);
      } else if (typeof targetOrFilter === "string" && ["all", "Udhaar", "Jama"].includes(targetOrFilter)) {
        setActiveTxnFilter(targetOrFilter);
      } else {
        setActiveTxnFilter("all");
      }
    }

    if (page === "customers") {
      if (typeof targetOrFilter === "object" && targetOrFilter?.statusFilter) {
        setActiveCustFilter(targetOrFilter.statusFilter);
      } else if (typeof targetOrFilter === "string" && ["all", "pending", "cleared"].includes(targetOrFilter)) {
        setActiveCustFilter(targetOrFilter);
      } else {
        setActiveCustFilter("all");
      }
    }

    try {
      localStorage.setItem("hisabkitab_currentPage", page);
      if (page === "customer-details") {
        const id = typeof targetOrFilter === "string" ? targetOrFilter : targetOrFilter?.id;
        if (id) {
          setSelectedCustomerId(id);
          localStorage.setItem("hisabkitab_selectedCustomerId", id);
        }
      } else {
        setSelectedCustomerId(null);
        localStorage.removeItem("hisabkitab_selectedCustomerId");
      }
    } catch (err) {
      console.error("Failed to persist current page", err);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open Add Transaction Modal
  const handleOpenAddTransaction = (type = "Udhaar", customerId = null) => {
    const defaultCust = customerId || (customers[0] ? customers[0].id : "");
    const generatedSlip = generateUniqueReceiptNumber(transactions, type);
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

    let candidateBillNumber = (txnForm.billNumber || "").trim();

    // If billNumber is empty, automatically generate a guaranteed unique one
    if (!candidateBillNumber) {
      candidateBillNumber = generateUniqueReceiptNumber(transactions, txnForm.type);
    } else {
      // Validate uniqueness against all existing transactions in the system
      const isUnique = isReceiptNumberUnique(candidateBillNumber, transactions);
      if (!isUnique) {
        const freshUniqueNumber = generateUniqueReceiptNumber(transactions, txnForm.type);
        toast.error("Duplicate Receipt Number!", {
          description: `"${candidateBillNumber}" already exists in records. Assigned new unique receipt: ${freshUniqueNumber}`,
        });
        setTxnForm((prev) => ({ ...prev, billNumber: freshUniqueNumber }));
        return;
      }
    }

    const targetCustomer = customers.find((c) => c.id === txnForm.customerId);
    const customerName = targetCustomer ? targetCustomer.name : "Customer";
    const customerEmail = targetCustomer ? targetCustomer.email : "";
    const amountNum = Number(txnForm.amount);

    const newTxn = {
      // eslint-disable-next-line react-hooks/purity
      id: `tx-${Date.now()}`,
      customerId: txnForm.customerId,
      customerName,
      customerEmail,
      type: txnForm.type,
      amount: amountNum,
      date: txnForm.date || new Date().toISOString().split("T")[0],
      description: txnForm.description || (txnForm.type === "Udhaar" ? "General goods" : "Account payment"),
      paymentMethod: txnForm.paymentMethod,
      billNumber: candidateBillNumber,
    };

    // Calculate updated balance
    const isUdhaar = txnForm.type === "Udhaar";
    const prevUdhaar = targetCustomer?.totalUdhaar || 0;
    const prevJama = targetCustomer?.totalJama || 0;
    const newUdhaar = prevUdhaar + (isUdhaar ? amountNum : 0);
    const newJama = prevJama + (!isUdhaar ? amountNum : 0);
    const newBalance = newUdhaar - newJama;

    // Update transactions list
    setTransactions((prev) => [newTxn, ...prev]);

    // Update customer balances
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === txnForm.customerId) {
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

    // Immediate Debit/Credit Email Notification Dispatch
    const emailResult = sendTransactionEmailNotification({
      transaction: newTxn,
      customer: targetCustomer,
      shopInfo,
      balanceInfo: {
        previousBalance: targetCustomer?.balance || 0,
        newBalance: newBalance,
        type: txnForm.type,
        amount: amountNum,
      },
    });

    if (txnForm.type === "Udhaar") {
      toast.warning(`Udhaar Recorded: ${shopInfo.currency} ${amountNum.toLocaleString()}`, {
        description: `Debited to ${customerName} (Receipt: ${newTxn.billNumber})`,
        action: {
          label: "Print Receipt",
          onClick: () => exportTransactionReceiptPDF(newTxn, targetCustomer, shopInfo),
        },
      });
    } else {
      toast.success(`Jama Payment: ${shopInfo.currency} ${amountNum.toLocaleString()}`, {
        description: `Received from ${customerName} (Receipt: ${newTxn.billNumber})`,
        action: {
          label: "Print Receipt",
          onClick: () => exportTransactionReceiptPDF(newTxn, targetCustomer, shopInfo),
        },
      });
    }

    // Separate email delivery status toast with preview action
    if (emailResult.success) {
      toast.info("📧 Confirmation Email Sent!", {
        description: `Delivered to ${targetCustomer?.email || "customer email"} with updated balance.`,
        action: {
          label: "View Email",
          onClick: () => handleOpenEmailPreview(emailResult.log),
        },
      });
    } else {
      toast.warning("Email Delivery Alert", {
        description: `Transaction saved, but email could not be delivered to ${targetCustomer?.email || "customer"}: ${emailResult.reason}`,
      });
    }
  };

  // Open Add Customer Modal
  const handleOpenAddCustomer = () => {
    setCustForm({
      name: "",
      email: "",
      countryCode: shopInfo?.countryCode || "+92",
      phone: "",
      address: "",
      openingBalance: "",
      isWhatsAppRegistered: true,
    });
    setCustModalOpen(true);
  };

  // Submit New Customer with Mandatory Email Validation
  const handleSaveCustomer = (e) => {
    e.preventDefault();
    const cleanName = custForm.name.trim();
    if (!cleanName) {
      toast.error("Customer name is required.");
      return;
    }

    // Strictly enforce alphabets and spaces only for customer name
    if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
      toast.error("Invalid Customer Name", {
        description: "Customer name must only contain alphabetic letters and spaces (no numbers allowed).",
      });
      return;
    }

    // Mandatory Email Validation
    const emailValidation = validateEmail(custForm.email);
    if (!emailValidation.valid) {
      toast.error("Valid Email Address Required", {
        description: emailValidation.error || "Email address is required to register a customer account.",
      });
      return;
    }
    const cleanEmail = emailValidation.email;

    if (!custForm.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    const cleanPhone = custForm.phone.trim();
    const countryPrefix = custForm.countryCode || "+92";
    const normalizedLocal = cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone;
    const fullPhone = `${countryPrefix} ${normalizedLocal}`;

    const newId = `c${Date.now()}`;
    const openBal = Number(custForm.openingBalance || 0);

    const newCustomer = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      phone: fullPhone,
      address: custForm.address.trim() || "Local Customer",
      totalUdhaar: openBal > 0 ? openBal : 0,
      totalJama: 0,
      balance: openBal,
      status: openBal > 0 ? "Active" : "Clear",
      lastTransactionDate: new Date().toISOString().split("T")[0],
      isWhatsAppRegistered: custForm.isWhatsAppRegistered ?? true,
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    // If opening balance > 0, create an initial transaction entry with unique receipt
    if (openBal > 0) {
      const openReceiptNo = generateUniqueReceiptNumber(transactions, "Opening");
      const initialTxn = {
        id: `tx-${Date.now()}`,
        customerId: newId,
        customerName: newCustomer.name,
        customerEmail: cleanEmail,
        type: "Udhaar",
        amount: openBal,
        date: new Date().toISOString().split("T")[0],
        description: "Opening Previous Udhaar Balance",
        paymentMethod: "Khata Credit",
        billNumber: openReceiptNo,
      };
      setTransactions((prev) => [initialTxn, ...prev]);

      // Automatically dispatch confirmation email for opening balance
      sendTransactionEmailNotification({
        transaction: initialTxn,
        customer: newCustomer,
        shopInfo,
        balanceInfo: {
          previousBalance: 0,
          newBalance: openBal,
          type: "Udhaar",
          amount: openBal,
        },
      });
    }

    setCustModalOpen(false);
    toast.success(`Customer Added: ${newCustomer.name}`, {
      description: `Khata account created with email: ${cleanEmail}.`,
    });
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomer = (customer) => {
    if (!customer) return;
    let countryCode = shopInfo?.countryCode || "+92";
    let localPhone = customer.phone || "";
    const match = customer.phone?.match(/^(\+\d+)\s*(.*)$/);
    if (match) {
      countryCode = match[1];
      localPhone = match[2];
    }
    setEditCustForm({
      id: customer.id,
      name: customer.name || "",
      email: customer.email || "",
      countryCode,
      phone: localPhone,
      address: customer.address || "",
      isWhatsAppRegistered: customer.isWhatsAppRegistered ?? true,
    });
    setEditCustModalOpen(true);
  };

  // Save Edited Customer with Mandatory Email Validation
  const handleSaveEditCustomer = (e) => {
    e.preventDefault();
    const cleanName = editCustForm.name.trim();
    if (!cleanName) {
      toast.error("Customer name is required.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
      toast.error("Invalid Customer Name", {
        description: "Customer name must only contain alphabetic letters and spaces.",
      });
      return;
    }

    // Mandatory Email Validation
    const emailValidation = validateEmail(editCustForm.email);
    if (!emailValidation.valid) {
      toast.error("Valid Email Address Required", {
        description: emailValidation.error || "Email address is mandatory for customer accounts.",
      });
      return;
    }
    const cleanEmail = emailValidation.email;

    if (!editCustForm.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    const cleanPhone = editCustForm.phone.trim();
    const countryPrefix = editCustForm.countryCode || "+92";
    const normalizedLocal = cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone;
    const fullPhone = `${countryPrefix} ${normalizedLocal}`;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === editCustForm.id
          ? {
              ...c,
              name: cleanName,
              email: cleanEmail,
              phone: fullPhone,
              address: editCustForm.address.trim() || "Local Customer",
              isWhatsAppRegistered: editCustForm.isWhatsAppRegistered,
            }
          : c
      )
    );

    // Sync updated customer name and email to existing transactions
    setTransactions((prev) =>
      prev.map((t) =>
        t.customerId === editCustForm.id
          ? { ...t, customerName: cleanName, customerEmail: cleanEmail }
          : t
      )
    );

    setEditCustModalOpen(false);
    toast.success(`Customer Updated: ${cleanName}`, {
      description: `Email and contact profile updated successfully.`,
    });
  };

  // Open Email Notification Preview
  const handleOpenEmailPreview = (emailLog) => {
    if (!emailLog) return;
    setPreviewEmailData(emailLog);
    setEmailPreviewModalOpen(true);
  };

  // Preview an email for any transaction on demand
  const handlePreviewTransactionEmail = (txn, cust = null) => {
    const targetCust = cust || customers.find((c) => c.id === txn.customerId) || {
      name: txn.customerName,
      email: txn.customerEmail,
      balance: 0,
    };
    const html = generateTransactionEmailHtml({
      transaction: txn,
      customer: targetCust,
      shopInfo,
      balanceInfo: {
        previousBalance: targetCust.balance || 0,
        newBalance: targetCust.balance || 0,
        type: txn.type,
        amount: txn.amount,
      },
    });
    const text = generateTransactionEmailText({
      transaction: txn,
      customer: targetCust,
      shopInfo,
      balanceInfo: {
        previousBalance: targetCust.balance || 0,
        newBalance: targetCust.balance || 0,
        type: txn.type,
        amount: txn.amount,
      },
    });
    const isUdhaar = txn.type === "Udhaar";
    setPreviewEmailData({
      id: `view-${Date.now()}`,
      recipientName: targetCust.name,
      recipientEmail: targetCust.email || "No email on record",
      subject: `[${shopInfo.name}] ${isUdhaar ? "Debit Order Confirmation" : "Payment Credit Receipt"} - #${txn.billNumber || "INV"}`,
      status: targetCust.email ? "Delivered" : "Failed",
      error: targetCust.email ? null : "Customer has no registered email address.",
      htmlContent: html,
      textContent: text,
    });
    setEmailPreviewModalOpen(true);
  };

  // Update existing customer record (e.g. toggling WhatsApp status)
  const handleUpdateCustomer = (customerId, updates) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, ...updates } : c))
    );
  };

  const handleLogin = (loginData) => {
    setIsAuthenticated(true);
    let targetPage = "dashboard";
    try {
      const savedPage = localStorage.getItem("hisabkitab_currentPage");
      if (savedPage && savedPage !== "login") {
        targetPage = savedPage;
      } else {
        localStorage.setItem("hisabkitab_currentPage", "dashboard");
      }
    } catch {
      targetPage = "dashboard";
    }
    setCurrentPage(targetPage);
    if (loginData?.shopInfo) {
      handleUpdateShopInfo({
        ...shopInfo,
        ...loginData.shopInfo,
      });
    }
    toast.success("Welcome Back to HisabKitab!", {
      description: `Signed in as ${loginData?.user?.name || shopInfo.owner}.`,
    });
  };

  const handleLogout = () => {
    clearSession();
    try {
      localStorage.removeItem("hisabkitab_currentPage");
      localStorage.removeItem("hisabkitab_selectedCustomerId");
    } catch (err) {
      console.error("Failed to clear navigation persistence", err);
    }
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
    },
    customers: {
      title: "Customers Directory",
    },
    "customer-details": {
      title: "Customer Khata Ledger",
    },
    transactions: {
      title: "Transaction Ledger",
    },
    reports: {
      title: "Financial Analytics & Reports",
    },
    settings: {
      title: "Profile & Store Settings",
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
            shopInfo={shopInfo}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}

        {currentPage === "customers" && (
          <Customers
            customers={customers}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
            onOpenAddCustomer={handleOpenAddCustomer}
            onOpenAddTransaction={handleOpenAddTransaction}
            onOpenEditCustomer={handleOpenEditCustomer}
            currency={shopInfo.currency}
            initialStatusFilter={activeCustFilter}
            shopInfo={shopInfo}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}

        {currentPage === "customer-details" && (
          <CustomerDetails
            customer={activeCustomer}
            transactions={transactions}
            onBack={() => handleNavigate("customers")}
            onOpenAddTransaction={handleOpenAddTransaction}
            onOpenEditCustomer={handleOpenEditCustomer}
            onPreviewEmail={handlePreviewTransactionEmail}
            currency={shopInfo.currency}
            shopInfo={shopInfo}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}

        {currentPage === "transactions" && (
          <Transactions
            transactions={transactions}
            customers={customers}
            shopInfo={shopInfo}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
            onOpenAddTransaction={handleOpenAddTransaction}
            onPreviewEmail={handlePreviewTransactionEmail}
            currency={shopInfo.currency}
            initialTypeFilter={activeTxnFilter}
          />
        )}

        {currentPage === "reports" && (
          <Reports
            customers={customers}
            transactions={transactions}
            currency={shopInfo.currency}
            shopInfo={shopInfo}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
          />
        )}

        {currentPage === "settings" && (
          <Settings
            shopInfo={shopInfo}
            onUpdateShopInfo={handleUpdateShopInfo}
            onPreviewEmail={handleOpenEmailPreview}
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
                    billNumber: generateUniqueReceiptNumber(transactions, "Udhaar"),
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
                    billNumber: generateUniqueReceiptNumber(transactions, "Jama"),
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="form-label" htmlFor="txn-bill" style={{ margin: 0 }}>
                  Bill / Receipt No.
                </label>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "0 2px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onClick={() => {
                    const freshSlip = generateUniqueReceiptNumber(transactions, txnForm.type);
                    setTxnForm((prev) => ({ ...prev, billNumber: freshSlip }));
                  }}
                  title="Regenerate a guaranteed unique receipt number"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Generate Unique
                </button>
              </div>
              <input
                id="txn-bill"
                type="text"
                className="form-input"
                placeholder="e.g. REC-2042"
                value={txnForm.billNumber}
                onChange={(e) =>
                  setTxnForm((prev) => ({ ...prev, billNumber: e.target.value }))
                }
                style={
                  txnForm.billNumber && !isReceiptNumberUnique(txnForm.billNumber, transactions)
                    ? { borderColor: "#ef4444", background: "#fef2f2" }
                    : {}
                }
              />
              {txnForm.billNumber && !isReceiptNumberUnique(txnForm.billNumber, transactions) ? (
                <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>
                  ⚠ Receipt #{txnForm.billNumber} is already used! Each receipt must be strictly unique.
                </div>
              ) : txnForm.billNumber ? (
                <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px" }}>
                  ✓ Guaranteed unique receipt number
                </div>
              ) : null}
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
        title="Add New Customer Khata"
      >
        <form onSubmit={handleSaveCustomer} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-name">
                Full Customer Name (Letters Only) *
              </label>
              <input
                id="cust-name"
                type="text"
                className="form-input"
                placeholder="e.g. Tariq Mehmood"
                value={custForm.name}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const alphabetsOnly = rawVal.replace(/[^a-zA-Z\s]/g, "");
                  setCustForm((prev) => ({ ...prev, name: alphabetsOnly }));
                  if (rawVal !== alphabetsOnly) {
                    toast.warning("Numbers Not Allowed", {
                      description: "Customer name can only contain alphabetic letters and spaces.",
                    });
                  }
                }}
                required
              />
              <span className="field-hint">Numbers and digits are not permitted.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cust-email">
                Email Address (Mandatory) *
              </label>
              <input
                id="cust-email"
                type="email"
                className="form-input"
                placeholder="e.g. tariq.mehmood@gmail.com"
                value={custForm.email}
                onChange={(e) =>
                  setCustForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <span className="field-hint">Required for automatic debit/credit confirmations.</span>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-phone">
                Country Code & Phone Number *
              </label>
              <div className="phone-input-group">
                <select
                  className="country-code-select"
                  value={custForm.countryCode || "+92"}
                  onChange={(e) =>
                    setCustForm((prev) => ({ ...prev, countryCode: e.target.value }))
                  }
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} ({item.country})
                    </option>
                  ))}
                </select>
                <input
                  id="cust-phone"
                  type="tel"
                  className="form-input phone-number-input"
                  placeholder="300-1234567"
                  value={custForm.phone}
                  onChange={(e) =>
                    setCustForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                />
              </div>
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

          <div className="form-group">
            <label className="checkbox-toggle-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--text-main)" }}>
              <input
                type="checkbox"
                checked={custForm.isWhatsAppRegistered ?? true}
                onChange={(e) =>
                  setCustForm((prev) => ({ ...prev, isWhatsAppRegistered: e.target.checked }))
                }
                style={{ width: "16px", height: "16px", accentColor: "#25D366" }}
              />
              <span>Registered on WhatsApp (enable 1-click reminders & digital receipts)</span>
            </label>
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
              Save Customer Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={editCustModalOpen}
        onClose={() => setEditCustModalOpen(false)}
        title="Edit Customer Profile & Email"
      >
        <form onSubmit={handleSaveEditCustomer} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-cust-name">
                Full Customer Name (Letters Only) *
              </label>
              <input
                id="edit-cust-name"
                type="text"
                className="form-input"
                placeholder="e.g. Tariq Mehmood"
                value={editCustForm.name}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const alphabetsOnly = rawVal.replace(/[^a-zA-Z\s]/g, "");
                  setEditCustForm((prev) => ({ ...prev, name: alphabetsOnly }));
                  if (rawVal !== alphabetsOnly) {
                    toast.warning("Numbers Not Allowed", {
                      description: "Customer name can only contain alphabetic letters and spaces.",
                    });
                  }
                }}
                required
              />
              <span className="field-hint">Numbers and digits are not permitted.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-cust-email">
                Email Address (Mandatory) *
              </label>
              <input
                id="edit-cust-email"
                type="email"
                className="form-input"
                placeholder="e.g. tariq.mehmood@gmail.com"
                value={editCustForm.email}
                onChange={(e) =>
                  setEditCustForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <span className="field-hint">Required for automatic debit/credit confirmations.</span>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-cust-phone">
                Country Code & Phone Number *
              </label>
              <div className="phone-input-group">
                <select
                  className="country-code-select"
                  value={editCustForm.countryCode || "+92"}
                  onChange={(e) =>
                    setEditCustForm((prev) => ({ ...prev, countryCode: e.target.value }))
                  }
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} ({item.country})
                    </option>
                  ))}
                </select>
                <input
                  id="edit-cust-phone"
                  type="tel"
                  className="form-input phone-number-input"
                  placeholder="300-1234567"
                  value={editCustForm.phone}
                  onChange={(e) =>
                    setEditCustForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-cust-address">
                Shop / Home Address
              </label>
              <input
                id="edit-cust-address"
                type="text"
                className="form-input"
                placeholder="e.g. Street 4, Sector G-8, Islamabad"
                value={editCustForm.address}
                onChange={(e) =>
                  setEditCustForm((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-toggle-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--text-main)" }}>
              <input
                type="checkbox"
                checked={editCustForm.isWhatsAppRegistered ?? true}
                onChange={(e) =>
                  setEditCustForm((prev) => ({ ...prev, isWhatsAppRegistered: e.target.checked }))
                }
                style={{ width: "16px", height: "16px", accentColor: "#25D366" }}
              />
              <span>Registered on WhatsApp (enable 1-click reminders & digital receipts)</span>
            </label>
          </div>

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditCustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Email Notification Preview Modal */}
      <Modal
        isOpen={emailPreviewModalOpen}
        onClose={() => setEmailPreviewModalOpen(false)}
        title="📧 Official Transaction Email Confirmation"
      >
        {previewEmailData && (
          <div className="email-preview-container" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>To:</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>{previewEmailData.recipientName} &lt;{previewEmailData.recipientEmail}&gt;</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Subject:</span>
                <span style={{ fontWeight: "600", color: "#2563eb" }}>{previewEmailData.subject}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748b" }}>Delivery Status:</span>
                <span style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                  backgroundColor: previewEmailData.status === "Delivered" ? "#dcfce7" : "#fee2e2",
                  color: previewEmailData.status === "Delivered" ? "#166534" : "#991b1b",
                }}>
                  {previewEmailData.status === "Delivered" ? "✓ Sent & Delivered" : "⚠ Delivery Failed"}
                </span>
              </div>
              {previewEmailData.error && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#b91c1c", background: "#fef2f2", padding: "6px 10px", borderRadius: "4px" }}>
                  Delivery Note: {previewEmailData.error}
                </div>
              )}
            </div>

            <div style={{
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              overflow: "hidden",
              height: "440px",
              background: "#ffffff",
            }}>
              {previewEmailData.htmlContent ? (
                <iframe
                  title="Email HTML Preview"
                  srcDoc={previewEmailData.htmlContent}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <pre style={{ padding: "16px", fontSize: "12px", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                  {previewEmailData.textContent || "No email content available."}
                </pre>
              )}
            </div>

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailPreviewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  navigator.clipboard.writeText(previewEmailData.textContent || "");
                  toast.success("Email Text Copied!", { description: "Copied email confirmation to clipboard." });
                }}
              >
                Copy Email Text
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}