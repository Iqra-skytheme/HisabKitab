/**
 * HisabKitab WhatsApp Integration & Verification Service
 * 
 * Provides robust international phone formatting, WhatsApp registration status verification,
 * and direct Click-to-Chat redirection without requiring manual contact selection.
 */

import { toast } from "sonner";

const UNREGISTERED_NUMBERS_KEY = "hisabkitab_unregistered_wa_numbers";
const REGISTERED_NUMBERS_KEY = "hisabkitab_registered_wa_numbers";

/**
 * Get the list of numbers manually marked as unregistered
 * @returns {string[]} Array of normalized phone digit strings
 */
export function getUnregisteredNumbers() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = localStorage.getItem(UNREGISTERED_NUMBERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read unregistered WhatsApp numbers", err);
    return [];
  }
}

/**
 * Get the list of numbers manually marked as registered
 * @returns {string[]} Array of normalized phone digit strings
 */
export function getRegisteredNumbers() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = localStorage.getItem(REGISTERED_NUMBERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read registered WhatsApp numbers", err);
    return [];
  }
}

/**
 * Persistently save or toggle WhatsApp registration status for a phone number
 * @param {string} phone 
 * @param {boolean} isRegistered 
 * @returns {boolean} New registration status
 */
export function setNumberWhatsAppStatus(phone, isRegistered) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return isRegistered;
    const clean = String(phone || "").replace(/\D/g, "");
    if (!clean) return isRegistered;

    const unregList = getUnregisteredNumbers();
    const regList = getRegisteredNumbers();

    if (isRegistered) {
      // Remove from unregistered, add to registered
      const newUnreg = unregList.filter((p) => p !== clean && !clean.endsWith(p) && !p.endsWith(clean));
      const newReg = regList.includes(clean) ? regList : [...regList, clean];
      localStorage.setItem(UNREGISTERED_NUMBERS_KEY, JSON.stringify(newUnreg));
      localStorage.setItem(REGISTERED_NUMBERS_KEY, JSON.stringify(newReg));
    } else {
      // Remove from registered, add to unregistered
      const newReg = regList.filter((p) => p !== clean && !clean.endsWith(p) && !p.endsWith(clean));
      const newUnreg = unregList.includes(clean) ? unregList : [...unregList, clean];
      localStorage.setItem(REGISTERED_NUMBERS_KEY, JSON.stringify(newReg));
      localStorage.setItem(UNREGISTERED_NUMBERS_KEY, JSON.stringify(newUnreg));
    }
    return isRegistered;
  } catch (err) {
    console.error("Failed to save WhatsApp status", err);
    return isRegistered;
  }
}

/**
 * Extract country code digits from strings like "+92", "92", "+1", "971"
 * @param {string} countryCode
 * @returns {string} Digits only (defaults to "92")
 */
export function extractCountryDigits(countryCode = "+92") {
  const digits = String(countryCode || "+92").replace(/\D/g, "");
  return digits || "92";
}

/**
 * Formats any phone number into standard international format for WhatsApp (wa.me/<number>)
 * WhatsApp requires digits only, country code included, without '+' or leading '00' or '0'.
 * 
 * Correctly strips national trunk prefixes (e.g. 0300... -> 92300... and +92 0300... -> 92300...)
 * Rejects landlines and malformed strings that cannot support WhatsApp Click-to-Chat.
 * 
 * Examples:
 * - "0301-2345678" -> "923012345678"
 * - "+92 300 1234567" -> "923001234567"
 * - "+92 0300 1234567" -> "923001234567"
 * - "03219876543" -> "923219876543"
 * - "+1 (555) 123-4567" -> "15551234567"
 * - "00923001234567" -> "923001234567"
 * 
 * @param {string} rawPhone
 * @param {string} defaultCountryCode
 * @returns {{ valid: boolean, formatted: string|null, reason?: string }}
 */
export function formatPhoneForWhatsApp(rawPhone, defaultCountryCode = "+92") {
  if (!rawPhone || typeof rawPhone !== "string" || !rawPhone.trim()) {
    return {
      valid: false,
      formatted: null,
      reason: "Phone number is empty or not provided.",
    };
  }

  const trimmed = rawPhone.trim();
  const countryDigits = extractCountryDigits(defaultCountryCode);

  // Reject strings containing letters or disallowed symbols
  if (/[^0-9+\s\-().]/.test(trimmed)) {
    return {
      valid: false,
      formatted: null,
      reason: "Phone number contains invalid non-numeric characters.",
    };
  }

  // Remove all non-digits
  let digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return {
      valid: false,
      formatted: null,
      reason: "Phone number contains no digits.",
    };
  }

  // 1. If starts with 00 (international dialing prefix), strip leading 00
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // 2. Normalize country code and trunk zero:
  if (digits.startsWith(countryDigits)) {
    // If number already starts with country digits, check if followed by trunk 0 (e.g. 9203001234567)
    const rest = digits.slice(countryDigits.length);
    if (rest.startsWith("0")) {
      digits = countryDigits + rest.replace(/^0+/, "");
    }
  } else if (digits.startsWith("0")) {
    // Starts with national trunk 0 (e.g. 03001234567) -> strip leading zeros and prepend country code
    digits = countryDigits + digits.replace(/^0+/, "");
  } else {
    // Doesn't start with country code or 0
    // Check if it's a 10-digit mobile number starting with 3 (e.g. 3012345678)
    if (countryDigits === "92" && digits.length === 10 && digits.startsWith("3")) {
      digits = "92" + digits;
    } else if (digits.length <= 10 && countryDigits) {
      digits = countryDigits + digits;
    }
  }

  // 3. Length validation (E.164 standard: 8 to 15 digits)
  if (digits.length < 8 || digits.length > 15) {
    return {
      valid: false,
      formatted: null,
      reason: "Phone number does not match standard international length (8-15 digits).",
    };
  }

  // 4. Reject placeholder/dummy numbers (e.g. 0000000000, 1111111111, 1234567890)
  if (/^(\d)\1+$/.test(digits) || digits.includes("1234567890")) {
    return {
      valid: false,
      formatted: null,
      reason: "Placeholder or test numbers are not registered on WhatsApp.",
    };
  }

  // 5. Specific check for Pakistan mobile numbers (+92):
  // Must be 12 digits total (92 + 10 digits) and start with 923 (mobile operators: 0300-0359)
  if (digits.startsWith("92")) {
    if (digits.length !== 12) {
      return {
        valid: false,
        formatted: null,
        reason: "Pakistani mobile numbers must be 11 digits (e.g., 0300-1234567).",
      };
    }
    // Must start with 923 (mobile prefix). Landlines (042, 051, 021, etc.) start with 924, 925, 922 etc.
    if (!digits.startsWith("923")) {
      return {
        valid: false,
        formatted: null,
        reason: "Landline numbers cannot receive WhatsApp messages. Please provide a mobile number (03xx).",
      };
    }
  }

  return {
    valid: true,
    formatted: digits,
  };
}

/**
 * Verifies if a phone number or customer is registered on WhatsApp.
 * 
 * Rules:
 * 1. Checks explicit customer flags (`isWhatsAppRegistered: false` or `whatsappRegistered: false`)
 * 2. Checks local persistent unregistered / registered lists
 * 3. Validates phone format, country code, and mobile network compatibility
 * 
 * @param {Object|string} customerOrPhone 
 * @param {Object} [options]
 * @returns {{ isRegistered: boolean, formattedPhone: string|null, rawPhone: string, reason?: string, detail?: string, customerName?: string }}
 */
export function checkWhatsAppRegistration(customerOrPhone, options = {}) {
  let rawPhone = "";
  let isCustomerFlaggedUnregistered = false;
  let customerName = "Customer";

  if (typeof customerOrPhone === "string") {
    rawPhone = customerOrPhone;
  } else if (customerOrPhone && typeof customerOrPhone === "object") {
    rawPhone = customerOrPhone.phone || "";
    customerName = customerOrPhone.name || "Customer";
    if (
      customerOrPhone.isWhatsAppRegistered === false ||
      customerOrPhone.whatsappRegistered === false ||
      customerOrPhone.status === "Unregistered_WhatsApp"
    ) {
      isCustomerFlaggedUnregistered = true;
    }
  }

  const defaultCountry = options.countryCode || "+92";
  const formatResult = formatPhoneForWhatsApp(rawPhone, defaultCountry);

  // If format is invalid, number cannot be registered on WhatsApp
  if (!formatResult.valid) {
    return {
      isRegistered: false,
      formattedPhone: null,
      rawPhone,
      customerName,
      reason: "This number is not registered on WhatsApp.",
      detail: formatResult.reason || "Invalid phone number format for WhatsApp.",
    };
  }

  const formattedPhone = formatResult.formatted;

  // Check persistent storage overrides
  const unregisteredList = getUnregisteredNumbers();
  const registeredList = getRegisteredNumbers();

  const isStoredUnregistered = unregisteredList.some(
    (p) => p === formattedPhone || formattedPhone.endsWith(p) || p.endsWith(formattedPhone)
  );
  const isStoredRegistered = registeredList.some(
    (p) => p === formattedPhone || formattedPhone.endsWith(p) || p.endsWith(formattedPhone)
  );

  // Explicitly marked as not registered
  if (isStoredUnregistered || (isCustomerFlaggedUnregistered && !isStoredRegistered)) {
    return {
      isRegistered: false,
      formattedPhone,
      rawPhone,
      customerName,
      reason: "This number is not registered on WhatsApp.",
      detail: `${customerName} (${rawPhone}) is marked as not registered on WhatsApp.`,
    };
  }

  // Explicitly registered or passes all mobile number validations
  return {
    isRegistered: true,
    formattedPhone,
    rawPhone,
    customerName,
  };
}

/**
 * Builds the friendly payment reminder message text
 * @param {Object} customer
 * @param {Object} [shopInfo]
 * @param {number|null} [balance]
 * @returns {string}
 */
export function generateReminderMessage(customer, shopInfo = {}, balance = null) {
  const shopName = shopInfo?.name || "Alam Garments";
  const currency = shopInfo?.currency || "Rs.";
  const customerName = customer?.name || "Valued Customer";

  const netBal = balance !== null && balance !== undefined
    ? Number(balance)
    : Number(customer?.balance || 0);

  if (netBal > 0) {
    return (
      `Assalam-o-Alaikum ${customerName},\n\n` +
      `This is a friendly khata reminder from *${shopName}*.\n` +
      `Your current pending balance is *${currency} ${netBal.toLocaleString()}*.\n\n` +
      `Please clear your pending payment at your earliest convenience.\n` +
      `Shukriya!`
    );
  } else if (netBal === 0) {
    return (
      `Assalam-o-Alaikum ${customerName},\n\n` +
      `Thank you for doing business with *${shopName}*.\n` +
      `Your khata account is completely cleared (Balance: ${currency} 0).\n\n` +
      `We appreciate your prompt payments. Shukriya!`
    );
  } else {
    // Negative balance means customer has advance credit
    return (
      `Assalam-o-Alaikum ${customerName},\n\n` +
      `Greetings from *${shopName}*.\n` +
      `You currently have an advance balance of *${currency} ${Math.abs(netBal).toLocaleString()}* on file with us.\n\n` +
      `Thank you for being our valued customer!`
    );
  }
}

/**
 * Returns direct WhatsApp URL pointing directly to the specific phone number.
 * 
 * IMPORTANT: Having the full international number in the path (wa.me/<number>)
 * or in query (web.whatsapp.com/send?phone=<number>) directly opens chat with
 * that specific recipient, completely avoiding the generic "Select contact" / "Forward to" screen!
 * 
 * @param {string} formattedPhone Phone number in international digits-only format
 * @param {string} messageText Message to prefill
 * @param {Object} [options]
 * @param {string} [options.whatsappMode] "universal" (wa.me) | "web" (web.whatsapp.com) | "app" (whatsapp://)
 * @returns {string} Fully formed direct chat URL
 */
export function getDirectWhatsAppUrl(formattedPhone, messageText, options = {}) {
  const encoded = encodeURIComponent(messageText || "");
  const preferredMode = options.whatsappMode || options.mode || "universal";

  // Mode 1: Direct WhatsApp Web (bypasses intermediate landing page on desktop browsers)
  if (preferredMode === "web") {
    return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`;
  }

  // Mode 2: Native App Scheme (whatsapp://send?phone=...)
  if (preferredMode === "app") {
    return `whatsapp://send?phone=${formattedPhone}&text=${encoded}`;
  }

  // Mode 3: Official Universal Click-to-Chat (wa.me/<number>?text=<encoded>)
  // Officially supported on all desktop & mobile platforms
  return `https://wa.me/${formattedPhone}?text=${encoded}`;
}

/**
 * Primary dispatch function:
 * 1. Verifies WhatsApp registration
 * 2. If unregistered: Immediately displays clear "This number is not registered on WhatsApp."
 *    error message and stops execution (does NOT open WhatsApp or contact picker)
 * 3. If registered: Automatically opens direct WhatsApp chat with that specific number
 * 
 * @param {Object} params
 * @param {Object} [params.customer] Customer object
 * @param {string} [params.phone] Explicit phone string if different from customer.phone
 * @param {number} [params.balance] Balance amount (defaults to customer.balance)
 * @param {Object} [params.shopInfo] Shop settings object
 * @param {string} [params.customMessage] Optional custom message override
 * @param {Function} [params.onUnregistered] Optional callback when number is unregistered
 * @param {Function} [params.onRegistered] Optional callback when chat is opened
 * @returns {{ success: boolean, formattedPhone: string|null, reason?: string, waUrl?: string }}
 */
export function sendWhatsAppReminder({
  customer = null,
  phone = null,
  balance = null,
  shopInfo = {},
  customMessage = null,
  onUnregistered = null,
  onRegistered = null,
}) {
  const targetPhone = phone || customer?.phone || "";
  const customerName = customer?.name || "Customer";

  // Check WhatsApp registration status
  const regCheck = checkWhatsAppRegistration(customer || targetPhone, {
    countryCode: shopInfo?.countryCode || "+92",
  });

  if (!regCheck.isRegistered) {
    // Exact requested message
    const mainMsg = "This number is not registered on WhatsApp.";
    const subMsg = regCheck.detail || `The phone number (${targetPhone}) is not registered with WhatsApp.`;

    toast.error(mainMsg, {
      description: subMsg,
      duration: 5000,
    });

    if (typeof onUnregistered === "function") {
      onUnregistered(regCheck);
    }

    return {
      success: false,
      formattedPhone: regCheck.formattedPhone,
      reason: mainMsg,
      detail: subMsg,
    };
  }

  // Number is registered!
  const formattedPhone = regCheck.formattedPhone;
  const messageText = customMessage || generateReminderMessage(customer, shopInfo, balance);
  const waUrl = getDirectWhatsAppUrl(formattedPhone, messageText, {
    whatsappMode: shopInfo?.whatsappMode || "universal",
  });

  // Directly open WhatsApp chat with this specific phone number in a new tab
  window.open(waUrl, "_blank", "noopener,noreferrer");

  const formattedBal = balance !== null && balance !== undefined
    ? Number(balance).toLocaleString()
    : Number(customer?.balance || 0).toLocaleString();

  toast.success(`WhatsApp Chat Opened: ${customerName}`, {
    description: `Direct reminder opened for +${formattedPhone} (${shopInfo?.currency || "Rs."} ${formattedBal}).`,
  });

  if (typeof onRegistered === "function") {
    onRegistered({ formattedPhone, waUrl, customerName });
  }

  return {
    success: true,
    formattedPhone,
    waUrl,
  };
}
