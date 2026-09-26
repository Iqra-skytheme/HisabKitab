export default function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  onQuickAddTransaction,
  shopInfo,
  onOpenProfileSettings,
}) {
  const isImageAvatar =
    shopInfo?.avatar &&
    (shopInfo.avatar.startsWith("data:image") ||
      shopInfo.avatar.startsWith("http"));

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="header-titles">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        {onQuickAddTransaction && (
          <button
            type="button"
            className="btn btn-primary btn-sm btn-quick-action"
            onClick={onQuickAddTransaction}
          >
            <span className="plus-sign">+</span>
            <span>New Entry</span>
          </button>
        )}

        {/* Clickable Profile Badge */}
        <button
          type="button"
          className="user-profile-badge user-profile-clickable"
          onClick={onOpenProfileSettings}
          title="Click to edit profile, bio & settings"
        >
          <div className="profile-avatar">
            {isImageAvatar ? (
              <img
                src={shopInfo.avatar}
                alt={shopInfo.owner || "Owner"}
                className="header-avatar-img"
              />
            ) : shopInfo?.avatar ? (
              <span className="header-avatar-emoji">{shopInfo.avatar}</span>
            ) : (
              <span>{shopInfo?.owner ? shopInfo.owner.charAt(0).toUpperCase() : "M"}</span>
            )}
          </div>
          <div className="profile-meta">
            <span className="profile-name">{shopInfo?.owner || "Admin"}</span>
            <span className="profile-role">
              {shopInfo?.name ? "Shop Owner ⚙️" : "Profile ⚙️"}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
