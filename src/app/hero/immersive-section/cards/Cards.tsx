// ProjectCard.tsx
import "./Card.css";

interface ProjectCardProps {
  label?: string;
  coordinates?: string;
  title: string;
  tag?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  stats?: { value: string; label: string }[];
  subTag?: string;
  subTitle?: string;
  version?: string;
  badge?: string;
  progress?: number;
  status?: "active" | "pending" | "completed";
  metrics?: {
    label: string;
    value: string;
    trend?: "up" | "down" | "stable";
  }[];
}

export default function ProjectCard({
  label = "UTOPIA TOKYO — PROJECT",
  coordinates = "35.6762° N / 139.6503° E",
  title,
  tag,
  description,
  ctaLabel = "_EXECUTE",
  onCta,
  stats,
  subTag,
  subTitle,
  version = "VER: 2.0.0-RC.1",
  badge,
  progress = 0,
  status = "active",
  metrics,
}: ProjectCardProps) {
  return (
    <div className="project-card-wrapper">
      {/* Status Indicator */}
      <div className={`status-badge status-${status}`}>
        <span className="status-dot"></span>
        {status.toUpperCase()}
      </div>

      <div className="row-top">
        {/* Main Cell */}
        <div className="cell cell-red">
          <div className="grid-line-horizontal" style={{ top: 38 }} />
          <div className="grid-line-vertical" style={{ left: "38%" }} />
          <div
            className="crosshair"
            style={{ top: 33, left: "calc(38% - 5px)" }}
          />

          <div className="meta-row">
            <span className="label">{label}</span>
            <span className="label">{coordinates}</span>
          </div>

          <p className="heading-primary">{title}</p>

          {badge && <div className="featured-badge">{badge}</div>}

          <span className="version-stamp">{version}</span>
        </div>

        {/* Side Cell */}
        <div className="cell cell-dark side-cell-top">
          <div
            className="grid-line-horizontal grid-line-red"
            style={{ top: "45%" }}
          />

          {tag && <span className="tag tag-outline">{tag}</span>}

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="progress-section">
              <div className="progress-label">PROGRESS</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-value">{progress}%</div>
            </div>
          )}

          <div>
            {description && (
              <p className="body-text body-text-red">{description}</p>
            )}

            {onCta && (
              <button className="button button-red" onClick={onCta}>
                {ctaLabel} <span className="button-arrow">↗</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row-bottom">
        {/* Stats Cell */}
        {stats && (
          <div className="cell cell-dark stat-cell">
            <span className="label">SURVEILLANCE</span>
            <div className="stats-row">
              {stats.map((s, idx) => (
                <div key={s.label} className="stat-item">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Cell (New) */}
        {metrics && (
          <div className="cell cell-dark metrics-cell">
            <span className="label">KEY METRICS</span>
            <div className="metrics-grid">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric-item">
                  <div className="metric-value">
                    {metric.value}
                    {metric.trend && (
                      <span className={`trend-icon trend-${metric.trend}`}>
                        {metric.trend === "up" && "↑"}
                        {metric.trend === "down" && "↓"}
                        {metric.trend === "stable" && "→"}
                      </span>
                    )}
                  </div>
                  <div className="metric-label">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wide Bottom Cell */}
        <div className="cell cell-red wide-cell-bottom">
          <div className="grid-line-vertical" style={{ left: "33.33%" }} />
          <div className="grid-line-vertical" style={{ left: "66.66%" }} />
          <div className="grid-line-horizontal" style={{ top: "50%" }} />
          <div
            className="crosshair"
            style={{ top: "calc(50% - 5px)", left: "calc(33.33% - 5px)" }}
          />
          <div
            className="crosshair"
            style={{ top: "calc(50% - 5px)", left: "calc(66.66% - 5px)" }}
          />

          <div className="meta-row">
            {subTag && <span className="tag">{subTag}</span>}
            <span className="label">CRAFTED WITH</span>
          </div>

          {subTitle && <p className="heading-secondary">{subTitle}</p>}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="card-footer">
        <div className="footer-left">
          <span className="footer-label">SYSTEM STATUS</span>
          <span className="footer-value">OPERATIONAL</span>
        </div>
        <div className="footer-right">
          <button className="footer-button">VIEW DETAILS →</button>
          <button className="footer-button">SHARE ↗</button>
        </div>
      </div>
    </div>
  );
}
