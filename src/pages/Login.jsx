import { useState, useEffect } from "react";
import { toast } from "sonner";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { COUNTRY_CODES } from "../data/dummyData";
import {
  authenticateOwner,
  initOwnerCredentials,
  getOwnerProfile,
} from "../services/authService";

export default function Login({ onLogin, shopInfo }) {
  const [countryCode, setCountryCode] = useState(shopInfo?.countryCode || "+92");
  const [phone, setPhone] = useState("0300-1234567");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Pre-seed owner credentials on component load if first visit
  useEffect(() => {
    initOwnerCredentials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      const err = "Please enter your authorized merchant phone number.";
      setError(err);
      toast.error("Phone Number Required", { description: err });
      return;
    }
    if (!pin.trim()) {
      const err = "Please enter your security PIN / password.";
      setError(err);
      toast.error("Security PIN Required", { description: err });
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const fullPhone = `${countryCode} ${phone.trim()}`;
      // Cryptographically verify against salted hash in backend
      const result = await authenticateOwner(fullPhone, pin, rememberMe);

      if (!result.success) {
        setError(result.message || "Invalid merchant credentials.");
        toast.error("Authentication Denied", {
          description: result.message || "Invalid authorized credentials.",
        });
        setIsLoading(false);
        return;
      }

      toast.success("Merchant Identity Verified!", {
        description: `Welcome back, ${result.user?.ownerName || shopInfo?.owner || "Owner"}! Cryptographic hash matched.`,
      });

      onLogin({
        identifier: fullPhone,
        rememberMe,
        user: {
          name: result.user?.ownerName || shopInfo?.owner || "Shop Owner",
          phone: fullPhone,
          token: result.token,
        },
        shopInfo: {
          name: result.user?.shopName || shopInfo?.name,
        },
      });
    } catch (err) {
      console.error("Login verification error", err);
      setError("An unexpected authentication error occurred.");
      toast.error("Authentication Error", {
        description: "Could not complete cryptographic hash verification.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = async () => {
    setCountryCode("+92");
    setPhone("0300-1234567");
    setPin("1234");
    setError("");
    toast.info("Authorized Credentials Pre-Filled", {
      description: "Click 'Verify & Access Khata Portal' to run cryptographic hash verification.",
    });
  };

  return (
    <div className="login-page-root">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div
            className="login-logo-container"
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Logo size={68} variant="icon" />
          </div>
          <h1 className="login-title">
            Hisab<span style={{ color: "#2563eb" }}>Kitab</span>
          </h1>
          <p className="login-subtitle">
            {shopInfo?.name || "Bismillah General Store"} • Merchant Portal
          </p>
        </div>

        {/* Private Single-Client Access Banner (Strictly NO registration) */}
        <div className="authorized-badge-strip">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Private Single-Client Portal • Public Registration Disabled</span>
        </div>

        {error && (
          <div className="login-error-alert" style={{ marginTop: "16px" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: "2px" }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Authorized User Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-phone">
              Authorized Mobile Number / User ID
            </label>
            <div className="phone-input-group">
              <select
                className="country-code-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="Country Code"
                disabled={isLoading}
              >
                {COUNTRY_CODES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} ({item.country})
                  </option>
                ))}
              </select>
              <div className="input-with-icon" style={{ flex: 1 }}>
                <span className="input-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                  disabled={isLoading}
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
                onClick={() => setForgotModalOpen(true)}
              >
                Forgot PIN?
              </button>
            </div>
            <div className="input-with-icon" style={{ position: "relative" }}>
              <span className="input-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                id="login-pin"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Enter 4-digit security PIN"
                maxLength={16}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isLoading}
                required
                style={{ paddingRight: "42px" }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
              >
                {showPassword ? (
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Keep me signed in on this store device</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg
                  className="animate-spin"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"></path>
                </svg>
                Verifying Salted Hash...
              </span>
            ) : (
              "Verify & Access Khata Portal"
            )}
          </Button>

          {/* Client Pre-configured Access Hint */}
          <div className="login-divider">
            <span>CLIENT AUTHORIZED ACCESS</span>
          </div>

          <div
            className="demo-credentials-pill"
            style={{
              background: "rgba(37, 99, 235, 0.05)",
              border: "1px dashed rgba(37, 99, 235, 0.3)",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "12px",
              color: "#475569",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div>
              <strong style={{ color: "#0f172a", display: "block" }}>
                Pre-configured Owner Credentials
              </strong>
              <span>Mobile: 0300-1234567 • PIN: 1234</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={handleQuickDemoFill}
              style={{ flexShrink: 0, fontSize: "11px", padding: "4px 8px" }}
            >
              Fill Credentials
            </button>
          </div>
        </form>

        {/* Security Concept & No Registration Notice */}
        <div className="login-footer-info" style={{ marginTop: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "11.5px",
              color: "#16a34a",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Bcrypt / PBKDF2 Salted Hash Verification (100k Iterations)</span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Passwords and PINs are cryptographically hashed and never stored in plain text.
            Public self-registration is strictly restricted for store privacy.
          </p>
        </div>
      </div>

      {/* Forgot PIN Modal */}
      {forgotModalOpen && (
        <div className="modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Security PIN Recovery</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setForgotModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
              <p>
                Because HisabKitab uses <strong>Bcrypt-standard salted key derivation</strong>,
                passwords and PINs are irreversible and cannot be retrieved in plain text.
              </p>
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  padding: "12px",
                  margin: "14px 0",
                  color: "#1e40af",
                }}
              >
                <strong>Initial Pre-seeded PIN:</strong> <code>1234</code>
                <br />
                <strong>Owner Mobile:</strong> <code>0300-1234567</code>
              </div>
              <p style={{ margin: 0 }}>
                Once logged in, you can update your PIN at any time from <strong>Settings &rarr; Security</strong>, which will rotate the cryptographic salt and generate a new hash.
              </p>
            </div>
            <div className="modal-footer">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setForgotModalOpen(false);
                  handleQuickDemoFill();
                }}
              >
                Use Pre-Seeded Credentials
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
