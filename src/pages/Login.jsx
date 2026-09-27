import { useState } from "react";
import { toast } from "sonner";
import Button from "../components/Button";
import { COUNTRY_CODES } from "../data/dummyData";

export default function Login({ onLogin, shopInfo }) {
  const [countryCode, setCountryCode] = useState(shopInfo?.countryCode || "+92");
  const [phone, setPhone] = useState("0300-1234567");
  const [pin, setPin] = useState("1234");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      const err = "Please enter your authorized registered phone number";
      setError(err);
      toast.error("Phone Number Required", { description: err });
      return;
    }
    if (!pin.trim()) {
      const err = "Please enter your 4-digit security PIN";
      setError(err);
      toast.error("Security PIN Required", { description: err });
      return;
    }
    setError("");
    const fullPhone = `${countryCode} ${phone.trim()}`;
    onLogin({
      identifier: fullPhone,
      pin,
      rememberMe,
      user: { name: shopInfo?.owner || "Shopkeeper", phone: fullPhone },
    });
  };

  const handleQuickDemoLogin = () => {
    toast.info("Fast Demo Login", {
      description: `Signing in as authorized owner ${shopInfo?.owner || "Muhammad Ali"}...`,
    });
    onLogin({
      identifier: `${countryCode} 0300-1234567`,
      pin: "1234",
      rememberMe: true,
      user: { name: shopInfo?.owner || "Muhammad Ali", phone: `${countryCode} 0300-1234567` },
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
            {shopInfo?.name || "Bismillah General Store"} • Authorized Portal
          </p>
        </div>

        {/* Authorized Access Notice */}
        <div className="authorized-badge-strip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Single-User Authorized Merchant Access</span>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        {/* Authorized User Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-phone">
              Country Code & Authorized Mobile Number
            </label>
            <div className="phone-input-group">
              <select
                className="country-code-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
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
                  id="login-phone"
                  type="tel"
                  className="form-input"
                  placeholder="300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label className="form-label" htmlFor="login-pin">
                Security PIN / Password
              </label>
              <button
                type="button"
                className="link-btn-text"
                onClick={() => alert(`Default authorized PIN is ${shopInfo?.securityPin || "1234"}`)}
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
                id="login-pin"
                type="password"
                className="form-input"
                placeholder="Enter 4-digit PIN"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
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
            Access Khata Portal
          </Button>

          <div className="login-divider">
            <span>QUICK AUTHORIZATION</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={handleQuickDemoLogin}
          >
            1-Click Demo Sign In
          </Button>
        </form>

        <div className="login-footer-info">
          <p>
            Private ledger portal restricted exclusively to the designated merchant.
            Public registrations are disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
