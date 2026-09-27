import { useState } from "react";
import { toast } from "sonner";
import Button from "../components/Button";
import { COUNTRY_CODES } from "../data/dummyData";

export default function Login({ onLogin, shopInfo }) {
  const [authMode, setAuthMode] = useState("signin"); // 'signin' | 'register'
  
  // Sign In state
  const [signInCountryCode, setSignInCountryCode] = useState("+92");
  const [signInPhone, setSignInPhone] = useState("0300-1234567");
  const [signInPin, setSignInPin] = useState("1234");
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regShopName, setRegShopName] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("+92");
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regConfirmPin, setRegConfirmPin] = useState("");

  const [error, setError] = useState("");

  // Handle owner name input in registration - strictly alphabets and spaces only
  const handleOwnerNameChange = (e) => {
    const rawVal = e.target.value;
    const alphabetsOnly = rawVal.replace(/[^a-zA-Z\s]/g, "");
    setRegOwnerName(alphabetsOnly);
    if (rawVal !== alphabetsOnly) {
      toast.warning("Numbers Not Allowed", {
        description: "Owner name can only contain alphabetic letters and spaces.",
      });
    }
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    if (!signInPhone.trim()) {
      const err = "Please enter your registered phone number";
      setError(err);
      toast.error("Phone Number Required", { description: err });
      return;
    }
    if (!signInPin.trim()) {
      const err = "Please enter your 4-digit security PIN";
      setError(err);
      toast.error("Security PIN Required", { description: err });
      return;
    }
    setError("");
    const fullPhone = `${signInCountryCode} ${signInPhone.trim()}`;
    onLogin({
      identifier: fullPhone,
      pin: signInPin,
      rememberMe,
      user: { name: shopInfo?.owner || "Shopkeeper", phone: fullPhone },
    });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const cleanOwner = regOwnerName.trim();
    if (!cleanOwner) {
      setError("Please enter the business owner's full name");
      toast.error("Owner Name Required");
      return;
    }
    // Strict alphabetic check
    if (!/^[a-zA-Z\s]+$/.test(cleanOwner)) {
      setError("Owner name must contain only alphabetic letters and spaces");
      toast.error("Invalid Owner Name", {
        description: "Numbers and special characters are not allowed in owner name.",
      });
      return;
    }
    if (!regShopName.trim()) {
      setError("Please enter your business or shop name");
      toast.error("Shop Name Required");
      return;
    }
    if (!regPhone.trim()) {
      setError("Please enter your phone number");
      toast.error("Phone Number Required");
      return;
    }
    if (!regPin.trim() || regPin.length < 4) {
      setError("Please create a 4-digit security PIN");
      toast.error("PIN Too Short", { description: "PIN must be at least 4 digits." });
      return;
    }
    if (regPin !== regConfirmPin) {
      setError("Security PINs do not match");
      toast.error("PIN Mismatch", { description: "Both PIN fields must match." });
      return;
    }

    setError("");
    const fullPhone = `${regCountryCode} ${regPhone.trim()}`;
    
    // Log in with newly registered shop credentials
    onLogin({
      identifier: fullPhone,
      pin: regPin,
      rememberMe: true,
      user: { name: cleanOwner, phone: fullPhone },
      shopInfo: {
        owner: cleanOwner,
        name: regShopName.trim(),
        countryCode: regCountryCode,
        phone: regPhone.trim(),
      },
    });

    toast.success("Account Registered Successfully!", {
      description: `Welcome ${cleanOwner}! Your digital khata is active.`,
    });
  };

  const handleQuickDemoLogin = () => {
    toast.info("Fast Demo Login", {
      description: "Signing into demo store account...",
    });
    onLogin({
      identifier: "+92 0300-1234567",
      pin: "1234",
      rememberMe: true,
      user: { name: "Muhammad Ali", phone: "+92 0300-1234567" },
    });
  };

  return (
    <div className="login-page-root">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-box">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <path d="M8 7h8"></path>
              <path d="M8 11h6"></path>
            </svg>
          </div>
          <h1 className="login-title">HisabKitab</h1>
          <p className="login-subtitle">
            {shopInfo?.name || "Bismillah General Store"} • Digital Ledger
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${authMode === "signin" ? "active" : ""}`}
            onClick={() => { setAuthMode("signin"); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authMode === "register" ? "active" : ""}`}
            onClick={() => { setAuthMode("register"); setError(""); }}
          >
            Register Account
          </button>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        {/* 1. SIGN IN FORM */}
        {authMode === "signin" && (
          <form onSubmit={handleSignInSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signin-phone">
                Country Code & Phone Number
              </label>
              <div className="phone-input-group">
                <select
                  className="country-code-select"
                  value={signInCountryCode}
                  onChange={(e) => setSignInCountryCode(e.target.value)}
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} ({item.country})
                    </option>
                  ))}
                </select>
                <div className="input-with-icon" style={{ flex: 1 }}>
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <input
                    id="signin-phone"
                    type="tel"
                    className="form-input"
                    placeholder="300-1234567"
                    value={signInPhone}
                    onChange={(e) => setSignInPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-link">
                <label className="form-label" htmlFor="signin-pin">
                  Security PIN / Password
                </label>
                <button
                  type="button"
                  className="link-btn-text"
                  onClick={() => alert("Demo PIN is 1234")}
                >
                  Forgot PIN?
                </button>
              </div>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  id="signin-pin"
                  type="password"
                  className="form-input"
                  placeholder="Enter 4-digit PIN"
                  maxLength={8}
                  value={signInPin}
                  onChange={(e) => setSignInPin(e.target.value)}
                />
              </div>
            </div>

            <div className="form-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Keep me signed in on this device</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="login-submit-btn"
            >
              Access Khata Dashboard
            </Button>

            <div className="login-divider">
              <span>OR FAST TEST</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={handleQuickDemoLogin}
            >
              1-Click Quick Demo Sign In
            </Button>
          </form>
        )}

        {/* 2. REGISTER ACCOUNT FORM */}
        {authMode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-owner">
                Owner Full Name (Letters Only) *
              </label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  id="reg-owner"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Muhammad Bilal"
                  value={regOwnerName}
                  onChange={handleOwnerNameChange}
                  required
                />
              </div>
              <span className="field-hint">Numbers and digits are not permitted.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-shop">
                Shop / Business Name *
              </label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </span>
                <input
                  id="reg-shop"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Al-Madina Super Store"
                  value={regShopName}
                  onChange={(e) => setRegShopName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                Country Code & Mobile Number *
              </label>
              <div className="phone-input-group">
                <select
                  className="country-code-select"
                  value={regCountryCode}
                  onChange={(e) => setRegCountryCode(e.target.value)}
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} ({item.country})
                    </option>
                  ))}
                </select>
                <div className="input-with-icon" style={{ flex: 1 }}>
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    placeholder="300-1234567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pin">
                  Create 4-Digit PIN *
                </label>
                <input
                  id="reg-pin"
                  type="password"
                  className="form-input"
                  placeholder="e.g. 5678"
                  maxLength={6}
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm-pin">
                  Confirm PIN *
                </label>
                <input
                  id="reg-confirm-pin"
                  type="password"
                  className="form-input"
                  placeholder="Repeat PIN"
                  maxLength={6}
                  value={regConfirmPin}
                  onChange={(e) => setRegConfirmPin(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="login-submit-btn"
            >
              Create Free Khata Account
            </Button>
          </form>
        )}

        <div className="login-footer-info">
          <p>
            End-to-end encrypted khata data backed up automatically to secure
            cloud servers.
          </p>
        </div>
      </div>
    </div>
  );
}
