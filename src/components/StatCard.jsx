export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "primary",
  trend,
  onClick,
}) {
  return (
    <div
      className={`stat-card stat-card-${variant} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && <div className={`stat-card-icon-badge badge-${variant}`}>{icon}</div>}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {(subtitle || trend) && (
          <div className="stat-card-footer">
            {trend && (
              <span className={`stat-card-trend trend-${trend.direction}`}>
                {trend.direction === "up" ? "▲" : "▼"} {trend.label}
              </span>
            )}
            {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
