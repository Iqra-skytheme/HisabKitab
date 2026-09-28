import { generateUniqueReceiptSerial } from "../utils/receiptUtils";


// Helper to escape CSV fields
function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

// Trigger browser file download
function triggerDownload(content, filename, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Print HTML via an isolated iframe to trigger browser PDF saving
function printHtmlDocument(title, htmlContent) {
  // Create hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.title = title;
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch {
      // Fallback for popups if iframe print is restricted
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        printWin.print();
      }
    }
    // Clean up iframe after printing
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 400);
}

// -------------------------------------------------------------
// EXCEL / CSV EXPORTS
// -------------------------------------------------------------

/**
 * Export overall financial ledger to Excel / CSV
 */
export function exportOverallExcel(customers = [], transactions = [], shopInfo = {}, period = "All Time") {
  const currency = shopInfo?.currency || "Rs.";
  const storeName = shopInfo?.name || "Bismillah Store";
  const owner = shopInfo?.owner || "Shop Owner";
  const dateStr = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalUdhaar = transactions
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = transactions
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netReceivable = totalUdhaar - totalJama;
  const recoveryRate = totalUdhaar > 0 ? Math.round((totalJama / totalUdhaar) * 100) : 100;

  let csv = "";

  // Title & Metadata
  csv += `${escapeCsv("HISABKITAB - FINANCIAL LEDGER & RECOVERY REPORT")}\n`;
  csv += `${escapeCsv("Store Name:")},${escapeCsv(storeName)}\n`;
  csv += `${escapeCsv("Proprietor:")},${escapeCsv(owner)}\n`;
  csv += `${escapeCsv("Report Period:")},${escapeCsv(period)}\n`;
  csv += `${escapeCsv("Generated On:")},${escapeCsv(dateStr)}\n\n`;

  // Executive Summary
  csv += `${escapeCsv("--- EXECUTIVE FINANCIAL SUMMARY ---")}\n`;
  csv += `${escapeCsv("Metric")},${escapeCsv("Value")}\n`;
  csv += `${escapeCsv("Total Registered Customers")},${escapeCsv(customers.length)}\n`;
  csv += `${escapeCsv("Total Credit Extended (Udhaar)")},${escapeCsv(`${currency} ${totalUdhaar.toLocaleString()}`)}\n`;
  csv += `${escapeCsv("Total Cash Collected (Jama)")},${escapeCsv(`${currency} ${totalJama.toLocaleString()}`)}\n`;
  csv += `${escapeCsv("Net Outstanding Receivable")},${escapeCsv(`${currency} ${Math.max(0, netReceivable).toLocaleString()}`)}\n`;
  csv += `${escapeCsv("Overall Recovery Rate")},${escapeCsv(`${recoveryRate}%`)}\n\n`;

  // Customers Directory Breakdown
  csv += `${escapeCsv("--- CUSTOMER KHATA BALANCES ---")}\n`;
  csv += [
    escapeCsv("Customer Name"),
    escapeCsv("Phone Number"),
    escapeCsv("Address"),
    escapeCsv("Total Udhaar"),
    escapeCsv("Total Jama"),
    escapeCsv("Net Balance Owed"),
    escapeCsv("Account Status"),
  ].join(",") + "\n";

  customers.forEach((c) => {
    csv += [
      escapeCsv(c.name),
      escapeCsv(c.phone),
      escapeCsv(c.address || "Local"),
      escapeCsv(`${currency} ${(c.totalUdhaar || 0).toLocaleString()}`),
      escapeCsv(`${currency} ${(c.totalJama || 0).toLocaleString()}`),
      escapeCsv(`${currency} ${(c.balance || 0).toLocaleString()}`),
      escapeCsv((c.balance || 0) > 0 ? "Pending Balance" : "Cleared"),
    ].join(",") + "\n";
  });
  csv += "\n";

  // Detailed Transactions
  csv += `${escapeCsv("--- COMPLETE TRANSACTION LEDGER ---")}\n`;
  csv += [
    escapeCsv("Date"),
    escapeCsv("Slip #"),
    escapeCsv("Customer Name"),
    escapeCsv("Type"),
    escapeCsv("Description"),
    escapeCsv("Payment Method"),
    escapeCsv("Amount"),
  ].join(",") + "\n";

  transactions.forEach((t) => {
    csv += [
      escapeCsv(t.date),
      escapeCsv(t.billNumber || "-"),
      escapeCsv(t.customerName),
      escapeCsv(t.type),
      escapeCsv(t.description || "N/A"),
      escapeCsv(t.paymentMethod || "Cash"),
      escapeCsv(`${t.type === "Udhaar" ? "-" : "+"} ${currency} ${Number(t.amount || 0).toLocaleString()}`),
    ].join(",") + "\n";
  });

  const filename = `${storeName.replace(/\s+/g, "_")}_Financial_Report_${new Date().toISOString().split("T")[0]}.csv`;
  triggerDownload(csv, filename);
}

/**
 * Export an individual customer's khata statement to Excel / CSV
 */
export function exportCustomerExcel(customer, transactions = [], shopInfo = {}) {
  if (!customer) return;

  const currency = shopInfo?.currency || "Rs.";
  const storeName = shopInfo?.name || "Bismillah Store";
  const owner = shopInfo?.owner || "Shop Owner";
  const dateStr = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter transactions for this customer and sort chronologically
  const customerTxns = transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;
  const statementRows = customerTxns.map((t) => {
    const delta = t.type === "Udhaar" ? Number(t.amount) : -Number(t.amount);
    runningBalance += delta;
    return {
      ...t,
      balanceAfter: runningBalance,
    };
  });

  const totalUdhaar = customerTxns
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = customerTxns
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalUdhaar - totalJama;

  let csv = "";

  // Customer Statement Header
  csv += `${escapeCsv("HISABKITAB - CUSTOMER KHATA STATEMENT")}\n`;
  csv += `${escapeCsv("Store Name:")},${escapeCsv(storeName)}\n`;
  csv += `${escapeCsv("Proprietor:")},${escapeCsv(owner)}\n`;
  csv += `${escapeCsv("Customer Name:")},${escapeCsv(customer.name)}\n`;
  csv += `${escapeCsv("Phone Number:")},${escapeCsv(customer.phone)}\n`;
  csv += `${escapeCsv("Address:")},${escapeCsv(customer.address || "Local Customer")}\n`;
  csv += `${escapeCsv("Statement Date:")},${escapeCsv(dateStr)}\n`;
  csv += `${escapeCsv("Current Account Status:")},${escapeCsv(netBalance > 0 ? "Pending Balance" : "Account Cleared")}\n`;
  csv += `${escapeCsv("Current Outstanding Balance:")},${escapeCsv(`${currency} ${netBalance.toLocaleString()}`)}\n\n`;

  // Summary Totals
  csv += `${escapeCsv("--- ACCOUNT SUMMARY ---")}\n`;
  csv += `${escapeCsv("Total Udhaar Taken:")},${escapeCsv(`${currency} ${totalUdhaar.toLocaleString()}`)}\n`;
  csv += `${escapeCsv("Total Jama Paid:")},${escapeCsv(`${currency} ${totalJama.toLocaleString()}`)}\n`;
  csv += `${escapeCsv("Net Balance Due:")},${escapeCsv(`${currency} ${netBalance.toLocaleString()}`)}\n\n`;

  // Chronological Statement Table
  csv += `${escapeCsv("--- DETAILED STATEMENT OF ACCOUNT ---")}\n`;
  csv += [
    escapeCsv("Date"),
    escapeCsv("Slip #"),
    escapeCsv("Entry Type"),
    escapeCsv("Description / Items"),
    escapeCsv("Payment Method"),
    escapeCsv("Debit (Udhaar)"),
    escapeCsv("Credit (Jama)"),
    escapeCsv("Account Balance"),
  ].join(",") + "\n";

  statementRows.forEach((row) => {
    const isUdhaar = row.type === "Udhaar";
    csv += [
      escapeCsv(row.date),
      escapeCsv(row.billNumber || "-"),
      escapeCsv(isUdhaar ? "Udhaar (Credit Given)" : "Jama (Payment Received)"),
      escapeCsv(row.description || (isUdhaar ? "Goods purchase" : "Account payment")),
      escapeCsv(row.paymentMethod || "Cash"),
      escapeCsv(isUdhaar ? `${currency} ${Number(row.amount).toLocaleString()}` : "-"),
      escapeCsv(!isUdhaar ? `${currency} ${Number(row.amount).toLocaleString()}` : "-"),
      escapeCsv(`${currency} ${row.balanceAfter.toLocaleString()}`),
    ].join(",") + "\n";
  });

  const cleanCustomerName = customer.name.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Khata_Statement_${cleanCustomerName}_${new Date().toISOString().split("T")[0]}.csv`;
  triggerDownload(csv, filename);
}

// -------------------------------------------------------------
// PDF EXPORTS (Via High-Resolution Clean Print Document)
// -------------------------------------------------------------

/**
 * Generate and trigger print/save PDF for overall financial report
 */
export function exportOverallPDF(customers = [], transactions = [], shopInfo = {}, period = "All Time", monthlyReportData = []) {
  const currency = shopInfo?.currency || "Rs.";
  const storeName = shopInfo?.name || "Bismillah Store";
  const owner = shopInfo?.owner || "Shop Owner";
  const phone = shopInfo?.phone || "+92 300 1234567";
  const address = shopInfo?.address || "Main Bazaar, Pakistan";
  const dateStr = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalUdhaar = transactions
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = transactions
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netReceivable = totalUdhaar - totalJama;
  const recoveryRate = totalUdhaar > 0 ? Math.round((totalJama / totalUdhaar) * 100) : 100;
  const pendingCustomers = customers.filter((c) => (c.balance || 0) > 0);

  const recentTxns = [...transactions].slice(0, 15);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${storeName} - Financial Ledger Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.4;
      padding: 10px;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .store-brand h1 {
      font-size: 20pt;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .store-brand p {
      font-size: 9pt;
      color: #64748b;
      margin-top: 2px;
    }
    .report-meta {
      text-align: right;
    }
    .report-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
      font-size: 9pt;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .report-meta p {
      font-size: 9pt;
      color: #64748b;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .kpi-val {
      font-size: 14pt;
      font-weight: 700;
      margin-top: 4px;
    }
    .text-danger { color: #dc2626; }
    .text-success { color: #16a34a; }
    .text-primary { color: #2563eb; }
    .text-warning { color: #d97706; }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-left: 3px solid #2563eb;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .text-right { text-align: right; }
    .footer-stamp-area {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #64748b;
    }
    .sign-box {
      width: 180px;
      border-top: 1px solid #94a3b8;
      text-align: center;
      padding-top: 4px;
      margin-top: 35px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="store-brand">
      <h1>${storeName}</h1>
      <p>Proprietor: <strong>${owner}</strong> • ${phone}</p>
      <p>${address}</p>
    </div>
    <div class="report-meta">
      <span class="report-badge">FINANCIAL REPORT</span>
      <p><strong>Period:</strong> ${period}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Total Accounts:</strong> ${customers.length}</p>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Recovery Rate</div>
      <div class="kpi-val text-success">${recoveryRate}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Credit (Udhaar)</div>
      <div class="kpi-val text-danger">${currency} ${totalUdhaar.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Cash (Jama)</div>
      <div class="kpi-val text-primary">${currency} ${totalJama.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Net Receivable</div>
      <div class="kpi-val text-warning">${currency} ${Math.max(0, netReceivable).toLocaleString()}</div>
    </div>
  </div>

  <div class="section-title">Pending Khata Recovery Accounts (${pendingCustomers.length})</div>
  <table>
    <thead>
      <tr>
        <th>Customer Name</th>
        <th>Phone Number</th>
        <th>Address</th>
        <th class="text-right">Total Udhaar</th>
        <th class="text-right">Total Jama</th>
        <th class="text-right">Balance Due</th>
      </tr>
    </thead>
    <tbody>
      ${pendingCustomers.length === 0 ? '<tr><td colspan="6" style="text-align:center;">All accounts are cleared!</td></tr>' : ''}
      ${pendingCustomers.map((c) => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.phone}</td>
          <td>${c.address || "Local"}</td>
          <td class="text-right text-danger">${currency} ${(c.totalUdhaar || 0).toLocaleString()}</td>
          <td class="text-right text-success">${currency} ${(c.totalJama || 0).toLocaleString()}</td>
          <td class="text-right font-semibold text-danger"><strong>${currency} ${(c.balance || 0).toLocaleString()}</strong></td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="section-title">Recent Transactions Ledger Summary</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Slip #</th>
        <th>Customer</th>
        <th>Type</th>
        <th>Description</th>
        <th>Payment Method</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${recentTxns.map((t) => `
        <tr>
          <td>${t.date}</td>
          <td>${t.billNumber || "-"}</td>
          <td><strong>${t.customerName}</strong></td>
          <td><span style="font-weight:600; color: ${t.type === "Udhaar" ? "#dc2626" : "#16a34a"}">${t.type}</span></td>
          <td>${t.description || "N/A"}</td>
          <td>${t.paymentMethod || "Cash"}</td>
          <td class="text-right" style="color: ${t.type === "Udhaar" ? "#dc2626" : "#16a34a"}">
            <strong>${t.type === "Udhaar" ? "-" : "+"} ${currency} ${Number(t.amount).toLocaleString()}</strong>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer-stamp-area">
    <div>
      <p>Generated digitally by HisabKitab Cloud Ledger.</p>
      <p>Official Record of Accounts for ${storeName}.</p>
    </div>
    <div>
      <div class="sign-box">Authorized Store Signature</div>
    </div>
  </div>
</body>
</html>`;

  printHtmlDocument(`${storeName}_Financial_Report`, html);
}

/**
 * Generate and trigger print/save PDF for an individual customer's khata statement
 */
export function exportCustomerPDF(customer, transactions = [], shopInfo = {}) {
  if (!customer) return;

  const currency = shopInfo?.currency || "Rs.";
  const storeName = shopInfo?.name || "Bismillah Store";
  const owner = shopInfo?.owner || "Shop Owner";
  const phone = shopInfo?.phone || "+92 300 1234567";
  const address = shopInfo?.address || "Main Bazaar, Pakistan";
  const dateStr = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter transactions for this customer and sort chronologically
  const customerTxns = transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;
  const statementRows = customerTxns.map((t) => {
    const delta = t.type === "Udhaar" ? Number(t.amount) : -Number(t.amount);
    runningBalance += delta;
    return {
      ...t,
      balanceAfter: runningBalance,
    };
  });

  const totalUdhaar = customerTxns
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = customerTxns
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalUdhaar - totalJama;
  const uniqueStatementSerial = `HK-STMT-${customer.id ? customer.id.toUpperCase() : "CUST"}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${customer.name} - Khata Statement (${storeName})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.4;
      padding: 10px;
    }
    .statement-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .store-brand h1 {
      font-size: 19pt;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .store-brand p {
      font-size: 9pt;
      color: #64748b;
      margin-top: 2px;
    }
    .statement-meta {
      text-align: right;
    }
    .statement-tag {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
      font-size: 9pt;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .customer-profile-strip {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .customer-info h2 {
      font-size: 13pt;
      color: #0f172a;
      font-weight: 700;
    }
    .customer-info p {
      font-size: 9pt;
      color: #64748b;
      margin-top: 2px;
    }
    .balance-box {
      text-align: right;
    }
    .balance-label {
      font-size: 8pt;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
    }
    .balance-amount {
      font-size: 16pt;
      font-weight: 800;
    }
    .text-danger { color: #dc2626; }
    .text-success { color: #16a34a; }

    .summary-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .summary-item {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      background: #ffffff;
    }
    .summary-item-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .summary-item-val {
      font-size: 13pt;
      font-weight: 700;
      margin-top: 2px;
    }

    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-left: 3px solid #2563eb;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 7px 8px;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 7px 8px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .text-right { text-align: right; }
    .sign-container {
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #64748b;
    }
    .sign-line {
      width: 160px;
      border-top: 1px solid #94a3b8;
      text-align: center;
      padding-top: 4px;
      margin-top: 35px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="statement-header">
    <div class="store-brand">
      <h1>${storeName}</h1>
      <p>Proprietor: <strong>${owner}</strong> • ${phone}</p>
      <p>${address}</p>
    </div>
    <div class="statement-meta">
      <span class="statement-tag">CUSTOMER KHATA STATEMENT</span>
      <p><strong>Receipt Serial:</strong> <span style="font-family:monospace;font-weight:700;">${uniqueStatementSerial}</span></p>
      <p><strong>Statement Date:</strong> ${dateStr}</p>
      <p><strong>Entries Recorded:</strong> ${customerTxns.length}</p>
    </div>
  </div>

  <div class="customer-profile-strip">
    <div class="customer-info">
      <h2>${customer.name}</h2>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      <p><strong>Address:</strong> ${customer.address || "Local Customer"}</p>
    </div>
    <div class="balance-box">
      <div class="balance-label">${netBalance > 0 ? "Outstanding Balance Owed" : "Account Status"}</div>
      <div class="balance-amount ${netBalance > 0 ? "text-danger" : "text-success"}">
        ${currency} ${netBalance.toLocaleString()}
      </div>
    </div>
  </div>

  <div class="summary-strip">
    <div class="summary-item">
      <div class="summary-item-label">Total Credit (Udhaar)</div>
      <div class="summary-item-val text-danger">${currency} ${totalUdhaar.toLocaleString()}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Total Payments (Jama)</div>
      <div class="summary-item-val text-success">${currency} ${totalJama.toLocaleString()}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Net Balance</div>
      <div class="summary-item-val ${netBalance > 0 ? "text-danger" : "text-success"}">
        ${currency} ${netBalance.toLocaleString()}
      </div>
    </div>
  </div>

  <div class="section-title">Chronological Statement of Account</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Slip #</th>
        <th>Description / Goods</th>
        <th>Method</th>
        <th class="text-right">Debit (Udhaar)</th>
        <th class="text-right">Credit (Jama)</th>
        <th class="text-right">Account Balance</th>
      </tr>
    </thead>
    <tbody>
      ${statementRows.length === 0 ? '<tr><td colspan="7" style="text-align:center;">No transactions recorded yet.</td></tr>' : ''}
      ${statementRows.map((r) => {
        const isUdhaar = r.type === "Udhaar";
        return `
          <tr>
            <td>${r.date}</td>
            <td>${r.billNumber || "-"}</td>
            <td><strong>${r.description || (isUdhaar ? "Goods purchase" : "Account payment")}</strong></td>
            <td>${r.paymentMethod || "Cash"}</td>
            <td class="text-right text-danger">${isUdhaar ? `${currency} ${Number(r.amount).toLocaleString()}` : "-"}</td>
            <td class="text-right text-success">${!isUdhaar ? `${currency} ${Number(r.amount).toLocaleString()}` : "-"}</td>
            <td class="text-right font-semibold"><strong>${currency} ${r.balanceAfter.toLocaleString()}</strong></td>
          </tr>
        `;
      }).join("")}
    </tbody>
  </table>

  <div class="sign-container">
    <div>
      <div class="sign-line">Customer Signature</div>
    </div>
    <div style="text-align: right;">
      <div class="sign-line" style="margin-left: auto;">Authorized Store Stamp</div>
    </div>
  </div>
</body>
</html>`;

  const cleanCustomerName = customer.name.replace(/[^a-zA-Z0-9]/g, "_");
  printHtmlDocument(`Khata_Statement_${cleanCustomerName}`, html);
}

/**
 * Print/Export an individual, official person transaction receipt slip
 * Each receipt contains a guaranteed unique receipt number and digital verification serial.
 */
export function exportTransactionReceiptPDF(transaction = {}, customer = {}, shopInfo = {}) {
  const currency = shopInfo?.currency || "Rs.";
  const storeName = shopInfo?.name || "Bismillah Store";
  const owner = shopInfo?.owner || "Shop Owner";
  const phone = shopInfo?.phone || "+92 300 1234567";
  const address = shopInfo?.address || "Main Bazaar, Gujranwala, Punjab, Pakistan";
  const customerName = transaction.customerName || customer.name || "Customer";
  const customerPhone = customer.phone || "On File";
  const customerAddress = customer.address || "";
  const isUdhaar = transaction.type === "Udhaar";

  const dateStr = transaction.date || new Date().toISOString().split("T")[0];
  const timeStr = new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
  const uniqueSerial = generateUniqueReceiptSerial(transaction);
  const billNo = transaction.billNumber || "REC-N/A";
  const amountFormatted = `${currency} ${Number(transaction.amount || 0).toLocaleString()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt - ${billNo} - ${customerName}</title>
  <style>
    @page {
      size: A5 portrait;
      margin: 12mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 10pt;
      line-height: 1.4;
    }
    .receipt-container {
      max-width: 480px;
      margin: 0 auto;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 24px;
      background: #ffffff;
      position: relative;
    }
    .receipt-header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .store-name {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .store-sub {
      font-size: 9pt;
      color: #475569;
      margin: 2px 0;
    }
    .receipt-badge-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 8px 12px;
      background: ${isUdhaar ? "#fef2f2" : "#f0fdf4"};
      border: 1px solid ${isUdhaar ? "#fecaca" : "#bbf7d0"};
      border-radius: 8px;
    }
    .receipt-type-tag {
      font-size: 11pt;
      font-weight: 800;
      color: ${isUdhaar ? "#b91c1c" : "#15803d"};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .receipt-number {
      font-family: "Courier New", monospace, monospace;
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
    }
    .unique-pill {
      font-size: 7.5pt;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      color: #334155;
      font-weight: 600;
      display: inline-block;
      margin-top: 2px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9.5pt;
    }
    .info-table td {
      padding: 6px 4px;
      vertical-align: top;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
      width: 120px;
    }
    .info-value {
      color: #0f172a;
      font-weight: 500;
    }
    .amount-highlight-box {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      margin: 18px 0;
    }
    .amount-label {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
    }
    .amount-value {
      font-size: 24pt;
      font-weight: 900;
      color: ${isUdhaar ? "#dc2626" : "#16a34a"};
      margin-top: 4px;
      letter-spacing: -0.02em;
    }
    .meta-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      margin-top: 16px;
      font-size: 8pt;
      color: #64748b;
      text-align: center;
    }
    .serial-tag {
      font-family: monospace;
      font-size: 8.5pt;
      font-weight: 700;
      color: #1e293b;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
      margin: 6px 0;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 8px;
    }
    .sig-col {
      width: 150px;
      text-align: center;
      border-top: 1px solid #94a3b8;
      font-size: 8.5pt;
      font-weight: 600;
      color: #475569;
      padding-top: 4px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-header">
      <h1 class="store-name">${storeName}</h1>
      <p class="store-sub">Proprietor: <strong>${owner}</strong> • Tel: ${phone}</p>
      <p class="store-sub">${address}</p>
    </div>

    <div class="receipt-badge-strip">
      <div>
        <div class="receipt-type-tag">${isUdhaar ? "Udhaar (Credit Slip)" : "Jama (Payment Receipt)"}</div>
        <span class="unique-pill">AUTHENTICATED • UNIQUE SLIP</span>
      </div>
      <div style="text-align: right;">
        <div class="receipt-number">${billNo}</div>
        <div style="font-size: 8pt; color: #64748b;">${dateStr} ${timeStr}</div>
      </div>
    </div>

    <table class="info-table">
      <tr>
        <td class="info-label">Customer Name:</td>
        <td class="info-value"><strong>${customerName}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Contact / Phone:</td>
        <td class="info-value">${customerPhone}</td>
      </tr>
      ${customerAddress ? `
      <tr>
        <td class="info-label">Address:</td>
        <td class="info-value">${customerAddress}</td>
      </tr>
      ` : ""}
      <tr>
        <td class="info-label">Payment Channel:</td>
        <td class="info-value"><strong>${transaction.paymentMethod || "Cash"}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Particulars / Notes:</td>
        <td class="info-value">${transaction.description || (isUdhaar ? "General goods purchase" : "Account credit payment")}</td>
      </tr>
    </table>

    <div class="amount-highlight-box">
      <div class="amount-label">${isUdhaar ? "Net Amount Debited" : "Net Amount Received"}</div>
      <div class="amount-value">${amountFormatted}</div>
      <div style="font-size: 8.5pt; color: #475569; margin-top: 4px;">
        ${isUdhaar ? "Added to customer khata ledger." : "Deducted from customer khata balance."}
      </div>
    </div>

    <div class="signatures-row">
      <div class="sig-col">Customer Signature</div>
      <div class="sig-col">Authorized Cashier / Stamp</div>
    </div>

    <div class="meta-footer">
      <div>Unique Digital Audit Serial:</div>
      <div class="serial-tag">${uniqueSerial}</div>
      <div>Official computer-generated receipt from HisabKitab khata system.</div>
    </div>
  </div>
</body>
</html>`;

  const cleanNo = billNo.replace(/[^a-zA-Z0-9]/g, "_");
  printHtmlDocument(`Receipt_${cleanNo}`, html);
}
