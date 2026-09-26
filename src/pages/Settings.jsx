import { useState } from "react";
import { toast } from "sonner";
import Button from "../components/Button";

const PRESET_AVATARS = [
  { id: "avatar-1", emoji: "🧔🏻‍♂️", label: "Shopkeeper" },
  { id: "avatar-2", emoji: "👨🏽‍💼", label: "Merchant" },
  { id: "avatar-3", emoji: "🧕", label: "Store Owner" },
  { id: "avatar-4", emoji: "🏪", label: "Mart" },
  { id: "avatar-5", emoji: "📦", label: "Distributor" },
  { id: "avatar-6", emoji: "🏬", label: "Super Store" },
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

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handleSelectPreset = (emoji) => {
    setSelectedAvatarPreset(emoji);
    handleChange("avatar", emoji);
    toast.info("Avatar updated", {
      description: `Selected preset ${emoji}. Click Save Settings to apply.`,
    });
  };

  const handleRemovePhoto = () => {
    handleChange("avatar", "");
    setSelectedAvatarPreset("");
    toast.info("Profile photo cleared", {
      description: "Default store initial will be shown.",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.owner.trim() || !formData.name.trim()) {
      toast.error("Missing Required Fields", {
        description: "Owner Name and Shop Name are required.",
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
            <span>✅</span>
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
              👤 Profile & Identity
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "store" ? "active" : ""}`}
              onClick={() => setActiveTab("store")}
            >
              🏪 Shop & Business
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              🔔 Khata Rules & Alerts
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              🔒 Security & PIN
            </button>
          </div>

          <form onSubmit={handleSubmit} className="settings-form">
            {/* TAB 1: Profile & Identity */}
            {activeTab === "profile" && (
              <div className="settings-section-content">
                {/* Profile Picture / Avatar Editor */}
                <div className="settings-avatar-editor">
                  <div className="avatar-preview-box">
                    {isImageAvatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile Preview"
                        className="avatar-preview-img"
                      />
                    ) : formData.avatar ? (
                      <span className="avatar-preview-emoji">{formData.avatar}</span>
                    ) : (
                      <div className="avatar-preview-fallback">
                        {formData.owner ? formData.owner.charAt(0).toUpperCase() : "M"}
                      </div>
                    )}
                  </div>

                  <div className="avatar-upload-controls">
                    <h4 className="avatar-ctrl-title">Profile Picture</h4>
                    <p className="avatar-ctrl-desc">
                      Upload your shop photo, brand logo, or choose a preset avatar
                    </p>

                    <div className="avatar-btn-row">
                      <label className="btn btn-outline btn-sm avatar-upload-label">
                        <span>📁 Upload Photo</span>
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

                    {/* Preset Avatars */}
                    <div className="preset-avatars-list">
                      <span className="preset-label">Or select preset avatar:</span>
                      <div className="preset-chips">
                        {PRESET_AVATARS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            className={`preset-chip ${
                              formData.avatar === preset.emoji ||
                              selectedAvatarPreset === preset.emoji
                                ? "active"
                                : ""
                            }`}
                            onClick={() => handleSelectPreset(preset.emoji)}
                            title={preset.label}
                          >
                            <span>{preset.emoji}</span>
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
                      Owner Full Name *
                    </label>
                    <input
                      id="setting-owner"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Muhammad Ali"
                      value={formData.owner}
                      onChange={(e) => handleChange("owner", e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="setting-phone">
                      Contact & WhatsApp Number
                    </label>
                    <input
                      id="setting-phone"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 0300-1234567"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
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
                      Bio / About You & Your Store
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
                    placeholder="Write a brief bio, motto, or store introduction..."
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  ></textarea>
                  <span className="field-hint">
                    This bio is displayed on ledger statements and your profile banner.
                  </span>
                </div>

                {/* Location / Address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="setting-location">
                    Shop Address & Location *
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon">📍</span>
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
                    Helps customers locate your physical counter and appears on print receipts.
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
                      <option value="General Store & Kiryana">🛒 General Store & Kiryana</option>
                      <option value="Medical Store & Pharmacy">💊 Medical Store & Pharmacy</option>
                      <option value="Mobile & Electronics">📱 Mobile & Electronics</option>
                      <option value="Meat, Fish & Poultry">🥩 Meat, Fish & Poultry</option>
                      <option value="Wholesale Grain & Pulses">🌾 Wholesale Grain & Pulses</option>
                      <option value="Garments & Clothing">👗 Garments & Clothing</option>
                      <option value="Hardware & Sanitary">🛠️ Hardware & Sanitary</option>
                      <option value="Restaurant & Cafe">☕ Restaurant & Cafe</option>
                      <option value="General Trading">🏷️ General Trading & Retail</option>
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
                      <h4 className="toggle-title">💬 WhatsApp Instant Receipts</h4>
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
                      <h4 className="toggle-title">📱 SMS Overdue Reminders</h4>
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
                      <h4 className="toggle-title">☁️ Automatic Cloud Sync & Backup</h4>
                      <p className="toggle-desc">
                        Keep your store ledger synced with cloud storage for emergency device recovery.
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
                  <span className="security-icon">🛡️</span>
                  <div>
                    <strong>Shopkeeper Security PIN</strong>
                    <p>
                      This 4-digit PIN is used to sign into HisabKitab on your shop tablet or phone.
                    </p>
                  </div>
                </div>

                <div className="form-group" style={{ maxWidth: "300px" }}>
                  <label className="form-label" htmlFor="setting-pin">
                    4-Digit Security PIN
                  </label>
                  <input
                    id="setting-pin"
                    type="password"
                    maxLength={4}
                    className="form-input"
                    placeholder="e.g. 1234"
                    value={formData.securityPin}
                    onChange={(e) => handleChange("securityPin", e.target.value)}
                  />
                  <span className="field-hint">
                    Current PIN: {formData.securityPin}
                  </span>
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
                icon="💾"
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
              <div className="preview-avatar-wrap">
                {isImageAvatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.owner}
                    className="preview-avatar-img"
                  />
                ) : formData.avatar ? (
                  <span className="preview-avatar-emoji">{formData.avatar}</span>
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
                  <p>“{formData.bio}”</p>
                </div>
              )}

              <div className="preview-details-list">
                <div className="preview-detail-item">
                  <span className="p-icon">📍</span>
                  <span className="p-text">{formData.location || "Location not set"}</span>
                </div>

                <div className="preview-detail-item">
                  <span className="p-icon">📞</span>
                  <span className="p-text">{formData.phone || "No phone added"}</span>
                </div>

                {formData.email && (
                  <div className="preview-detail-item">
                    <span className="p-icon">✉️</span>
                    <span className="p-text">{formData.email}</span>
                  </div>
                )}

                <div className="preview-detail-item">
                  <span className="p-icon">💰</span>
                  <span className="p-text">Active Currency: <strong>{formData.currency}</strong></span>
                </div>
              </div>

              <div className="preview-trust-strip">
                <span>🛡️ Verified Khata Merchant</span>
                <span>•</span>
                <span>Cloud Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
