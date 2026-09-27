import { useState } from "react";
import { toast } from "sonner";
import Button from "../components/Button";
import { COUNTRY_CODES } from "../data/dummyData";
import { updateOwnerPassword } from "../services/authService";

const PRESET_AVATARS = [
  { id: "av-blue", bg: "#2563eb", text: "MA", label: "Blue Monogram" },
  { id: "av-slate", bg: "#0f172a", text: "HK", label: "Dark Monogram" },
  { id: "av-emerald", bg: "#16a34a", text: "BS", label: "Emerald Store" },
  { id: "av-amber", bg: "#d97706", text: "MK", label: "Amber Retail" },
  { id: "av-indigo", bg: "#4f46e5", text: "TR", label: "Indigo Trader" },
  { id: "av-purple", bg: "#7c3aed", text: "GS", label: "Purple Mart" },
];

export default function Settings({
  shopInfo,
  onUpdateShopInfo,
}) {
  const [formData, setFormData] = useState({
    name: shopInfo?.name || "",
    owner: shopInfo?.owner || "",
    avatar: shopInfo?.avatar || "",
    bio: shopInfo?.bio || "",
    location: shopInfo?.location || "",
    countryCode: shopInfo?.countryCode || "+92",
    phone: shopInfo?.phone || "",
    email: shopInfo?.email || "",
    category: shopInfo?.category || "General Store & Kiryana",
    currency: shopInfo?.currency || "Rs.",
    taxNumber: shopInfo?.taxNumber || "",
    reminderDays: shopInfo?.reminderDays || "15",
    creditLimit: shopInfo?.creditLimit || 50000,
    whatsappReceipts: shopInfo?.whatsappReceipts ?? true,
    smsReminders: shopInfo?.smsReminders ?? true,
    autoBackup: shopInfo?.autoBackup ?? true,
    securityPin: shopInfo?.securityPin || "1234",
  });

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'store' | 'notifications' | 'security'
  const [saveStatus, setSaveStatus] = useState("");
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState("");

  // Security Credentials Update State
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [pinSuccessMsg, setPinSuccessMsg] = useState("");
  const [pinErrorMsg, setPinErrorMsg] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Strictly enforce alphabets and spaces only for owner name
  const handleOwnerChange = (e) => {
    const rawVal = e.target.value;
    const alphabetsOnly = rawVal.replace(/[^a-zA-Z\s]/g, "");
    handleChange("owner", alphabetsOnly);
    if (rawVal !== alphabetsOnly) {
      toast.warning("Numbers Not Allowed", {
        description: "Owner name can only contain alphabetic letters and spaces.",
      });
    }
  };

  // Handle local image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "Please choose an image smaller than 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result;
        if (typeof resultUrl === "string") {
          handleChange("avatar", resultUrl);
          setSelectedAvatarPreset("");
          toast.success("Profile photo uploaded!", {
            description: "Click Save Settings to apply your new avatar.",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedAvatarPreset(preset.id);
    handleChange("avatar", preset.bg); // stores background color as custom styled avatar
    toast.info("Avatar Style Selected", {
      description: `Selected ${preset.label}. Click Save Settings to apply.`,
    });
  };

  const handleRemovePhoto = () => {
    handleChange("avatar", "");
    setSelectedAvatarPreset("");
    toast.info("Profile photo cleared", {
      description: "Default initials badge will be shown.",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanOwner = formData.owner.trim();
    if (!cleanOwner || !formData.name.trim()) {
      toast.error("Missing Required Fields", {
        description: "Owner Name and Shop Name are required.",
      });
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(cleanOwner)) {
      toast.error("Invalid Owner Name", {
        description: "Owner name can only contain alphabetic letters and spaces (no numbers allowed).",
      });
      return;
    }

    onUpdateShopInfo(formData);
    setSaveStatus("Profile & Store Settings updated successfully!");
    setTimeout(() => {
      setSaveStatus("");
    }, 4000);
  };

  const handleReset = () => {
    if (confirm("Reset all unsaved changes back to current profile values?")) {
      setFormData({
        name: shopInfo?.name || "",
        owner: shopInfo?.owner || "",
        avatar: shopInfo?.avatar || "",
        bio: shopInfo?.bio || "",
        location: shopInfo?.location || "",
        countryCode: shopInfo?.countryCode || "+92",
        phone: shopInfo?.phone || "",
        email: shopInfo?.email || "",
        category: shopInfo?.category || "General Store & Kiryana",
        currency: shopInfo?.currency || "Rs.",
        taxNumber: shopInfo?.taxNumber || "",
        reminderDays: shopInfo?.reminderDays || "15",
        creditLimit: shopInfo?.creditLimit || 50000,
        whatsappReceipts: shopInfo?.whatsappReceipts ?? true,
        smsReminders: shopInfo?.smsReminders ?? true,
        autoBackup: shopInfo?.autoBackup ?? true,
        securityPin: shopInfo?.securityPin || "1234",
      });
      setSelectedAvatarPreset("");
      setSaveStatus("");
      toast.warning("Settings Reverted", {
        description: "Restored previous profile values.",
      });
    }
  };

  const isImageAvatar =
    formData.avatar &&
    (formData.avatar.startsWith("data:image") ||
      formData.avatar.startsWith("http"));

  const isColorPreset =
    formData.avatar && formData.avatar.startsWith("#");

  return (
    <div className="page-settings">
      {/* Settings Top Bar */}
      <div className="settings-header-banner">
        <div>
          <h2 className="settings-title">Profile & Store Settings</h2>
          <p className="settings-subtitle">
            Manage your personal profile, business identity, location, contact, and khata rules
          </p>
        </div>

        {saveStatus && (
          <div className="settings-save-toast">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      <div className="settings-layout-grid">
        {/* Left Column: Form Settings Tabs */}
        <div className="settings-main-card">
          {/* Navigation Tabs */}
          <div className="settings-tab-nav">
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile & Identity</span>
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "store" ? "active" : ""}`}
              onClick={() => setActiveTab("store")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Shop & Business</span>
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>Khata Rules & Alerts</span>
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Security & PIN</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="settings-form">
            {/* TAB 1: Profile & Identity */}
            {activeTab === "profile" && (
              <div className="settings-section-content">
                {/* Profile Picture / Avatar Editor */}
                <div className="settings-avatar-editor">
                  <div
                    className="avatar-preview-box"
                    style={isColorPreset ? { backgroundColor: formData.avatar } : {}}
                  >
                    {isImageAvatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile Preview"
                        className="avatar-preview-img"
                      />
                    ) : (
                      <div className="avatar-preview-fallback">
                        {formData.owner ? formData.owner.charAt(0).toUpperCase() : "M"}
                      </div>
                    )}
                  </div>

                  <div className="avatar-upload-controls">
                    <h4 className="avatar-ctrl-title">Profile Picture</h4>
                    <p className="avatar-ctrl-desc">
                      Upload your store photograph, owner portrait, or pick a color style
                    </p>

                    <div className="avatar-btn-row">
                      <label className="btn btn-outline btn-sm avatar-upload-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                      </label>

                      {formData.avatar && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePhoto}
                        >
                          Remove Photo
                        </Button>
                      )}
                    </div>

                    {/* Preset Color Themes */}
                    <div className="preset-avatars-list">
                      <span className="preset-label">Or choose initial palette:</span>
                      <div className="preset-chips">
                        {PRESET_AVATARS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            className={`preset-chip preset-color-chip ${
                              formData.avatar === preset.bg ||
                              selectedAvatarPreset === preset.id
                                ? "active"
                                : ""
                            }`}
                            style={{ backgroundColor: preset.bg, color: "#ffffff" }}
                            onClick={() => handleSelectPreset(preset)}
                            title={preset.label}
                          >
                            <span>{preset.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-divider"></div>

                {/* Personal Information */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-owner">
                      Owner Full Name (Letters Only) *
                    </label>
                    <input
                      id="setting-owner"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Muhammad Ali"
                      value={formData.owner}
                      onChange={handleOwnerChange}
                      required
                    />
                    <span className="field-hint">Numbers and digits are not permitted.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-phone">
                      Country Code & WhatsApp Number
                    </label>
                    <div className="phone-input-group">
                      <select
                        className="country-code-select"
                        value={formData.countryCode || "+92"}
                        onChange={(e) => handleChange("countryCode", e.target.value)}
                        aria-label="Country Code"
                      >
                        {COUNTRY_CODES.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code} ({item.country})
                          </option>
                        ))}
                      </select>
                      <input
                        id="setting-phone"
                        type="tel"
                        className="form-input phone-number-input"
                        placeholder="300-1234567"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="setting-email">
                    Email Address
                  </label>
                  <input
                    id="setting-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. store.owner@gmail.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                {/* Bio / Description */}
                <div className="form-group">
                  <div className="label-with-link">
                    <label className="form-label" htmlFor="setting-bio">
                      Store Tagline / Bio
                    </label>
                    <span className="char-count">
                      {formData.bio.length}/180 characters
                    </span>
                  </div>
                  <textarea
                    id="setting-bio"
                    className="form-input form-textarea"
                    rows="3"
                    maxLength={180}
                    placeholder="Write a brief description or store introduction..."
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  ></textarea>
                  <span className="field-hint">
                    Displayed on your customer ledger statements and profile card.
                  </span>
                </div>

                {/* Location / Address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="setting-location">
                    Shop Address & Location *
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </span>
                    <input
                      id="setting-location"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Shop #14, Main Market, Gulberg, Lahore"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      required
                    />
                  </div>
                  <span className="field-hint">
                    Appears on digital invoice headers and receipt summaries.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: Shop & Business */}
            {activeTab === "store" && (
              <div className="settings-section-content">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-name">
                      Shop / Business Name *
                    </label>
                    <input
                      id="setting-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bismillah General Store"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-category">
                      Business Category
                    </label>
                    <select
                      id="setting-category"
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                    >
                      <option value="General Store & Kiryana">General Store & Kiryana</option>
                      <option value="Medical Store & Pharmacy">Medical Store & Pharmacy</option>
                      <option value="Mobile & Electronics">Mobile & Electronics</option>
                      <option value="Meat, Fish & Poultry">Meat, Fish & Poultry</option>
                      <option value="Wholesale Grain & Pulses">Wholesale Grain & Pulses</option>
                      <option value="Garments & Clothing">Garments & Clothing</option>
                      <option value="Hardware & Sanitary">Hardware & Sanitary</option>
                      <option value="Restaurant & Cafe">Restaurant & Cafe</option>
                      <option value="General Trading">General Trading & Retail</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-currency">
                      Primary Currency
                    </label>
                    <select
                      id="setting-currency"
                      className="form-input"
                      value={formData.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                    >
                      <option value="Rs.">Rs. (Pakistani / Indian Rupee)</option>
                      <option value="$">$ (US Dollar - USD)</option>
                      <option value="€">€ (Euro - EUR)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="£">£ (British Pound - GBP)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-tax">
                      Tax / NTN Registration (Optional)
                    </label>
                    <input
                      id="setting-tax"
                      type="text"
                      className="form-input"
                      placeholder="e.g. NTN-8492019-PK"
                      value={formData.taxNumber}
                      onChange={(e) => handleChange("taxNumber", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-reminders">
                      Credit Payment Due Cycle
                    </label>
                    <select
                      id="setting-reminders"
                      className="form-input"
                      value={formData.reminderDays}
                      onChange={(e) => handleChange("reminderDays", e.target.value)}
                    >
                      <option value="7">Every 7 Days (Weekly)</option>
                      <option value="15">Every 15 Days (Fortnightly)</option>
                      <option value="30">Every 30 Days (Monthly)</option>
                      <option value="45">Every 45 Days</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-limit">
                      Default Customer Credit Ceiling ({formData.currency})
                    </label>
                    <input
                      id="setting-limit"
                      type="number"
                      className="form-input"
                      min="1000"
                      step="1000"
                      value={formData.creditLimit}
                      onChange={(e) => handleChange("creditLimit", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Khata Rules & Notifications */}
            {activeTab === "notifications" && (
              <div className="settings-section-content">
                <div className="toggle-list">
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4 className="toggle-title">WhatsApp Instant Receipts</h4>
                      <p className="toggle-desc">
                        Provide quick 1-click WhatsApp transaction confirmation slips to customers.
                      </p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={formData.whatsappReceipts}
                        onChange={(e) =>
                          handleChange("whatsappReceipts", e.target.checked)
                        }
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4 className="toggle-title">SMS Overdue Reminders</h4>
                      <p className="toggle-desc">
                        Enable alert prompts when customer balances exceed the payment cycle limit.
                      </p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={formData.smsReminders}
                        onChange={(e) =>
                          handleChange("smsReminders", e.target.checked)
                        }
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4 className="toggle-title">Automatic Cloud Sync & Backup</h4>
                      <p className="toggle-desc">
                        Keep your store ledger synced with cloud storage for emergency recovery.
                      </p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={formData.autoBackup}
                        onChange={(e) =>
                          handleChange("autoBackup", e.target.checked)
                        }
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Security & PIN */}
            {activeTab === "security" && (
              <div className="settings-section-content">
                <div className="security-notice-card">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <div>
                    <strong>Enterprise Bcrypt/PBKDF2 Cryptographic Security</strong>
                    <p>
                      HisabKitab secures your credentials using salted key-stretching (100,000 PBKDF2 iterations).
                      Passwords and PINs are never stored in plaintext.
                    </p>
                  </div>
                </div>

                <div className="security-status-strip" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  borderRadius: "10px",
                  margin: "18px 0",
                  fontSize: "13px",
                  color: "#166534"
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Active Hash: <strong>PBKDF2-HMAC-SHA256 (Bcrypt Standard)</strong> • 32-Byte CSPRNG Salt Protected</span>
                </div>

                {pinSuccessMsg && (
                  <div className="alert alert-success" style={{
                    padding: "10px 14px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px"
                  }}>
                    {pinSuccessMsg}
                  </div>
                )}

                {pinErrorMsg && (
                  <div className="alert alert-danger" style={{
                    padding: "10px 14px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px"
                  }}>
                    {pinErrorMsg}
                  </div>
                )}

                <div style={{ maxWidth: "420px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                    Rotate Owner Security PIN / Password
                  </h4>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="current-pin">
                      Current Security PIN
                    </label>
                    <input
                      id="current-pin"
                      type="password"
                      maxLength={16}
                      className="form-input"
                      placeholder="Enter current PIN"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="new-pin">
                      New Security PIN (min 4 characters)
                    </label>
                    <input
                      id="new-pin"
                      type="password"
                      maxLength={16}
                      className="form-input"
                      placeholder="e.g. 5678"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="confirm-pin">
                      Confirm New PIN
                    </label>
                    <input
                      id="confirm-pin"
                      type="password"
                      maxLength={16}
                      className="form-input"
                      placeholder="Confirm new PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={isUpdatingPin || !currentPin || !newPin || !confirmPin}
                    onClick={async () => {
                      setPinErrorMsg("");
                      setPinSuccessMsg("");
                      if (!currentPin) {
                        setPinErrorMsg("Please enter your current PIN.");
                        return;
                      }
                      if (!newPin || newPin.length < 4) {
                        setPinErrorMsg("New PIN must be at least 4 digits.");
                        return;
                      }
                      if (newPin !== confirmPin) {
                        setPinErrorMsg("New PIN and Confirm PIN do not match.");
                        return;
                      }

                      setIsUpdatingPin(true);
                      try {
                        const res = await updateOwnerPassword(currentPin, newPin);
                        if (!res.success) {
                          setPinErrorMsg(res.message);
                          toast.error("PIN Update Failed", { description: res.message });
                        } else {
                          setPinSuccessMsg(res.message);
                          toast.success("Security PIN Updated!", {
                            description: "New cryptographic salt generated and password re-hashed successfully.",
                          });
                          setCurrentPin("");
                          setNewPin("");
                          setConfirmPin("");
                          onUpdateShopInfo({
                            ...formData,
                            securityPin: newPin,
                          });
                        }
                      } catch {
                        setPinErrorMsg("An unexpected error occurred.");
                      } finally {
                        setIsUpdatingPin(false);
                      }
                    }}
                  >
                    {isUpdatingPin ? "Hashing & Rotating Salt..." : "Update PIN & Rotate Salt"}
                  </Button>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="settings-form-actions">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
              >
                Reset Changes
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                }
              >
                Save Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Profile Card Preview */}
        <div className="settings-preview-col">
          <div className="settings-card-preview">
            <div className="preview-badge-header">
              <span>LIVE PROFILE PREVIEW</span>
            </div>

            <div className="preview-card-body">
              {/* Avatar in preview */}
              <div
                className="preview-avatar-wrap"
                style={isColorPreset ? { backgroundColor: formData.avatar } : {}}
              >
                {isImageAvatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.owner}
                    className="preview-avatar-img"
                  />
                ) : (
                  <div className="preview-avatar-fallback">
                    {formData.owner ? formData.owner.charAt(0).toUpperCase() : "M"}
                  </div>
                )}
                <span className="preview-status-indicator" title="Active Shopkeeper"></span>
              </div>

              <h3 className="preview-owner-name">{formData.owner || "Owner Name"}</h3>
              <p className="preview-shop-name">{formData.name || "Business Name"}</p>
              <span className="preview-category-badge">{formData.category}</span>

              {formData.bio && (
                <div className="preview-bio-quote">
                  <p>"{formData.bio}"</p>
                </div>
              )}

              <div className="preview-details-list">
                <div className="preview-detail-item">
                  <span className="p-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <span className="p-text">{formData.location || "Location not set"}</span>
                </div>

                <div className="preview-detail-item">
                  <span className="p-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <span className="p-text">
                    {formData.phone
                      ? `${formData.countryCode || "+92"} ${formData.phone}`
                      : "No phone added"}
                  </span>
                </div>

                {formData.email && (
                  <div className="preview-detail-item">
                    <span className="p-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </span>
                    <span className="p-text">{formData.email}</span>
                  </div>
                )}

                <div className="preview-detail-item">
                  <span className="p-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </span>
                  <span className="p-text">Active Currency: <strong>{formData.currency}</strong></span>
                </div>
              </div>

              <div className="preview-trust-strip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Verified Khata Merchant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
