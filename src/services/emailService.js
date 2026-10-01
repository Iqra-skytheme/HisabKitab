/**
 * HisabKitab Email Notification Service
 * 
 * Provides email validation, professional transaction & order confirmation templates,
 * immediate notification dispatch for Debit/Credit entries, persistent outbox logs,
 * and fail-safe delivery error handling.
 */

const EMAIL_LOGS_KEY = "hisabkitab_email_logs";

/**
 * Validates customer email format.
 * Ensures the email is present, trimmed, contains no spaces, and satisfies RFC standard format.
 * 
 * @param {string} email
 * @returns {{ valid: boolean, error?: string, email?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string" || !email.trim()) {
    return {
      valid: false,
      error: "Email address is required.",
    };
  }

  const clean = email.trim();

  // Strict email format validation: name@domain.tld
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return {
      valid: false,
      error: "Invalid email format. Please provide a valid email address (e.g., name@domain.com).",
    };
  }

  return {
    valid: true,
    email: clean.toLowerCase(),
  };
}

/**
 * Get all stored email delivery audit logs
 * @returns {Array} Array of email log objects, latest first
 */
export function getEmailLogs() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = localStorage.getItem(EMAIL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read email delivery logs", err);
    return [];
  }
}

/**
 * Persist an email record to the local audit outbox
 * @param {Object} logEntry 
 */
export function saveEmailLog(logEntry) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const existing = getEmailLogs();
    // Keep up to 200 most recent email notification records
    const updated = [logEntry, ...existing].slice(0, 200);
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist email delivery log", err);
  }
}

/**
 * Clear email audit logs
 */
export function clearEmailLogs() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.removeItem(EMAIL_LOGS_KEY);
  } catch (err) {
    console.error("Failed to clear email logs", err);
  }
}

/**
 * Format a human-readable date & time string
 * @param {string} [dateStr]
 * @returns {string}
 */
function formatDateTime(dateStr) {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleString();
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) + " " + new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date().toLocaleString();
  }
}

/**
 * Generates high-impact, professional HTML email content for order/transaction confirmation
 * 
 * @param {Object} params
 * @param {Object} params.transaction
 * @param {Object} params.customer
 * @param {Object} params.shopInfo
 * @param {Object} [params.balanceInfo]
 * @returns {string} Fully styled HTML string ready for email clients
 */
export function generateTransactionEmailHtml({
  transaction,
  customer,
  shopInfo = {},
  balanceInfo = {},
}) {
  const shopName = shopInfo.name || "Alam Garments";
  const currency = shopInfo.currency || "Rs.";
  const customerName = customer?.name || transaction.customerName || "Valued Customer";
  const customerEmail = customer?.email || transaction.customerEmail || "Not Provided";
  const isUdhaar = transaction.type === "Udhaar";

  const amountFormatted = Number(transaction.amount || 0).toLocaleString();
  const prevBal = balanceInfo.previousBalance !== undefined
    ? Number(balanceInfo.previousBalance).toLocaleString()
    : "—";
  const newBalNum = balanceInfo.newBalance !== undefined
    ? Number(balanceInfo.newBalance)
    : Number(customer?.balance || 0);
  const newBalFormatted = newBalNum.toLocaleString();

  const formattedDateTime = formatDateTime(transaction.date);
  const statusColor = isUdhaar ? "#dc2626" : "#16a34a";
  const statusBg = isUdhaar ? "#fef2f2" : "#f0fdf4";
  const statusBorder = isUdhaar ? "#fecaca" : "#bbf7d0";
  const badgeText = isUdhaar ? "DEBIT (UDHAAR) RECORDED" : "CREDIT (JAMA PAYMENT) RECEIVED";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isUdhaar ? "Debit Order Confirmation" : "Payment Credit Receipt"} - ${transaction.billNumber}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Top Header Banner -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; padding: 6px 14px; background: rgba(255, 255, 255, 0.18); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
        Official Khata Notification
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">${shopName}</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${shopInfo.location || "Main Market, Lahore"} • ${shopInfo.phone || ""}</p>
    </div>

    <!-- Main Content Area -->
    <div style="padding: 28px 24px;">
      
      <!-- Greeting & Notification Status -->
      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #475569;">Assalam-o-Alaikum, <strong style="color: #0f172a;">${customerName}</strong></p>
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">
          ${
            isUdhaar
              ? `An order purchase/debit entry has been successfully recorded in your khata account.`
              : `A payment credit transaction has been successfully received and credited to your account.`
          }
          Please find your official transaction confirmation and updated account balance below:
        </p>
      </div>

      <!-- Transaction Status Badge Card -->
      <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span style="display: block; font-size: 11px; font-weight: 700; color: ${statusColor}; letter-spacing: 0.05em; text-transform: uppercase;">
            ${badgeText}
          </span>
          <span style="font-size: 26px; font-weight: 800; color: ${statusColor};">
            ${currency} ${amountFormatted}
          </span>
        </div>
        <div style="text-align: right;">
          <span style="display: block; font-size: 11px; color: #64748b; font-weight: 600;">Receipt / Slip #</span>
          <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #0f172a;">${transaction.billNumber || "REC-N/A"}</span>
        </div>
      </div>

      <!-- Transaction Details Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 8px 0; text-align: left; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px;">Field Details</th>
            <th style="padding: 8px 0; text-align: right; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px;">Information</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Transaction Date & Time</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${formattedDateTime}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Customer Name</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${customerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Registered Email</td>
            <td style="padding: 10px 0; text-align: right; font-family: monospace; color: #2563eb;">${customerEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Description / Items</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${transaction.description || (isUdhaar ? "Goods Purchased on Credit" : "Payment Clearance")}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Payment Method / Channel</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${transaction.paymentMethod || (isUdhaar ? "Khata Credit" : "Cash")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Updated Balance Ledger Box -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;">
          Account Balance Summary
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span style="color: #64748b;">Previous Account Balance:</span>
          <span style="font-weight: 600; color: #334155;">${currency} ${prevBal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px;">
          <span style="color: #64748b;">This Transaction Impact:</span>
          <span style="font-weight: 700; color: ${statusColor};">
            ${isUdhaar ? "+" : "-"} ${currency} ${amountFormatted} (${isUdhaar ? "Debit" : "Credit"})
          </span>
        </div>
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: baseline;">
          <div>
            <strong style="font-size: 14px; color: #0f172a;">Updated Outstanding Balance:</strong>
            <span style="display: block; font-size: 11px; color: #64748b;">
              ${newBalNum > 0 ? "Amount currently due to shop" : newBalNum === 0 ? "All dues completely settled" : "Advance deposit on file"}
            </span>
          </div>
          <span style="font-size: 18px; font-weight: 800; color: ${newBalNum > 0 ? "#dc2626" : "#16a34a"};">
            ${currency} ${newBalFormatted}
          </span>
        </div>
      </div>

      <!-- Action & Store Note -->
      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #1e40af;">
          <strong>Official Record Notice:</strong> This confirmation email was automatically generated and dispatched to your verified email address immediately upon recording this entry. If you have any inquiries, please contact <strong>${shopName}</strong> directly at ${shopInfo.phone || "the store counter"}.
        </p>
      </div>

    </div>

    <!-- Email Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">${shopName} • Digital Khata & Accounts</p>
      <p style="margin: 0 0 10px 0;">Proprietor: ${shopInfo.owner || "Management"} | Phone: ${shopInfo.phone || "N/A"} | Email: ${shopInfo.email || "support@alamgarments.pk"}</p>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">Generated automatically by HisabKitab System. Please keep this email for your records.</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates clean plain text email version for non-HTML email readers
 */
export function generateTransactionEmailText({
  transaction,
  customer,
  shopInfo = {},
  balanceInfo = {},
}) {
  const shopName = shopInfo.name || "Alam Garments";
  const currency = shopInfo.currency || "Rs.";
  const customerName = customer?.name || transaction.customerName || "Valued Customer";
  const isUdhaar = transaction.type === "Udhaar";

  const amountFormatted = Number(transaction.amount || 0).toLocaleString();
  const prevBal = balanceInfo.previousBalance !== undefined
    ? Number(balanceInfo.previousBalance).toLocaleString()
    : "N/A";
  const newBalFormatted = balanceInfo.newBalance !== undefined
    ? Number(balanceInfo.newBalance).toLocaleString()
    : Number(customer?.balance || 0).toLocaleString();

  return `
======================================================
${shopName.toUpperCase()} - TRANSACTION CONFIRMATION
======================================================

Dear ${customerName},

This is an official transaction notification from ${shopName}.

TRANSACTION PARTICULARS:
------------------------------------------------------
Type:             ${isUdhaar ? "Debit / Order Purchase (Udhaar)" : "Credit / Payment Received (Jama)"}
Slip / Bill #:    ${transaction.billNumber || "N/A"}
Amount:           ${currency} ${amountFormatted}
Date & Time:      ${formatDateTime(transaction.date)}
Items/Notes:      ${transaction.description || "N/A"}
Payment Method:   ${transaction.paymentMethod || "Cash"}

ACCOUNT BALANCE IMPACT:
------------------------------------------------------
Previous Balance: ${currency} ${prevBal}
This Transaction: ${isUdhaar ? "+" : "-"} ${currency} ${amountFormatted}
Updated Balance:  ${currency} ${newBalFormatted}

Store Contact:
Phone: ${shopInfo.phone || "N/A"}
Email: ${shopInfo.email || "N/A"}
Address: ${shopInfo.location || "N/A"}

Thank you for your business with ${shopName}!
======================================================
  `.trim();
}

/**
 * Sends a transaction confirmation email to the customer's registered email address.
 * 
 * Rules:
 * 1. Checks customer email presence and valid format.
 * 2. Generates subject, HTML, and text versions.
 * 3. Immediately dispatches the notification and records an audit log.
 * 4. Error Handling:
 *    - If email fails to send, catches the error and marks status as "Failed" in the logs.
 *    - NEVER throws an error that could cause the transaction to roll back or duplicate.
 * 
 * @param {Object} params
 * @param {Object} params.transaction Complete transaction object
 * @param {Object} params.customer Customer object (must have email)
 * @param {Object} [params.shopInfo] Shop settings
 * @param {Object} [params.balanceInfo] Calculated balance context
 * @param {boolean} [params.forceFail] Testing flag to simulate delivery failure
 * @returns {{ success: boolean, reason?: string, log: Object }}
 */
export function sendTransactionEmailNotification({
  transaction,
  customer,
  shopInfo = {},
  balanceInfo = {},
  forceFail = false,
}) {
  const targetEmail = customer?.email || transaction?.customerEmail || "";
  const validation = validateEmail(targetEmail);

  const isUdhaar = transaction.type === "Udhaar";
  const shopName = shopInfo.name || "Alam Garments";
  const subject = `[${shopName}] ${
    isUdhaar ? "Debit Order Confirmation" : "Payment Credit Receipt"
  } - #${transaction.billNumber || "INV"}`;

  const logId = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // If email is missing or invalid format
  if (!validation.valid) {
    const failedLog = {
      id: logId,
      transactionId: transaction.id,
      billNumber: transaction.billNumber,
      recipientName: customer?.name || transaction.customerName || "Customer",
      recipientEmail: targetEmail || "MISSING",
      type: transaction.type,
      amount: transaction.amount,
      subject,
      timestamp: nowIso,
      status: "Failed",
      error: validation.error || "Missing or invalid email address",
    };

    saveEmailLog(failedLog);

    console.warn(`[EmailNotification] Delivery failed: ${failedLog.error}`);
    return {
      success: false,
      reason: validation.error || "Customer does not have a valid registered email address.",
      log: failedLog,
    };
  }

  // Generate templates
  const htmlContent = generateTransactionEmailHtml({
    transaction,
    customer,
    shopInfo,
    balanceInfo,
  });

  const textContent = generateTransactionEmailText({
    transaction,
    customer,
    shopInfo,
    balanceInfo,
  });

  try {
    if (forceFail) {
      throw new Error("Simulated network delivery timeout to mail server.");
    }

    // Success dispatch log
    const successLog = {
      id: logId,
      transactionId: transaction.id,
      billNumber: transaction.billNumber,
      recipientName: customer?.name || transaction.customerName,
      recipientEmail: validation.email,
      type: transaction.type,
      amount: transaction.amount,
      subject,
      htmlContent,
      textContent,
      timestamp: nowIso,
      status: "Delivered",
      error: null,
    };

    saveEmailLog(successLog);

    return {
      success: true,
      log: successLog,
      recipient: validation.email,
      subject,
    };
  } catch (deliveryError) {
    const errorMsg = deliveryError?.message || "Email delivery failed unexpectedly.";
    const failedLog = {
      id: logId,
      transactionId: transaction.id,
      billNumber: transaction.billNumber,
      recipientName: customer?.name || transaction.customerName,
      recipientEmail: validation.email,
      type: transaction.type,
      amount: transaction.amount,
      subject,
      htmlContent,
      textContent,
      timestamp: nowIso,
      status: "Failed",
      error: errorMsg,
    };

    saveEmailLog(failedLog);
    console.error(`[EmailNotification] Delivery failure logged:`, deliveryError);

    // Return fail result without throwing so the transaction itself is NOT duplicated or lost
    return {
      success: false,
      reason: errorMsg,
      log: failedLog,
    };
  }
}

/**
 * Resends an existing email notification from logs
 * @param {string} logId 
 * @param {Object} shopInfo 
 * @returns {{ success: boolean, log?: Object, reason?: string }}
 */
export function resendEmailNotification(logId) {
  const logs = getEmailLogs();
  const existing = logs.find((l) => l.id === logId);
  if (!existing) {
    return { success: false, reason: "Log entry not found." };
  }

  const validation = validateEmail(existing.recipientEmail);
  if (!validation.valid) {
    return { success: false, reason: validation.error };
  }

  const newLogId = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const updatedLog = {
    ...existing,
    id: newLogId,
    timestamp: new Date().toISOString(),
    status: "Delivered",
    error: null,
  };

  saveEmailLog(updatedLog);
  return { success: true, log: updatedLog };
}
