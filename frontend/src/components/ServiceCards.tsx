import { Link } from "react-router-dom";
import type { ServiceStatus } from "../types/service";
import { lastSuccessLabel, serviceStatusLabel } from "../utils/serviceStatus";

export function FeatureCard({
  to,
  icon,
  title,
  description,
  tag,
  muted = false,
  status,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
  tag: string;
  muted?: boolean;
  status?: ServiceStatus;
}) {
  const isMuted = muted || (status !== undefined && status.status !== "connected");
  const isTagMuted = status ? status.status !== "connected" : muted;
  const currentLabel = status ? serviceStatusLabel(status.status) : tag;
  return (
    <Link
      to={to}
      className={`feature-card${isMuted ? " muted" : ""}`}
    >
      <div className="feature-top">
        <span className="feature-icon">{icon}</span>
        <span
          className={`feature-tag${isTagMuted ? " tag-muted" : ""}`}
        >
          <i />
          {currentLabel}
        </span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="card-arrow">↗</span>
    </Link>
  );
}

export function StatusRow({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="status-row">
      <span><i className={active ? "status-dot live" : "status-dot"} />{label}</span>
      <small className={active ? "connected" : ""}>{value}</small>
    </div>
  );
}

export function ApiStatusRow({
  label,
  state,
}: {
  label: string;
  state?: ServiceStatus;
}) {
  const current: ServiceStatus = state ?? {
    status: "waiting",
    last_success_at: null,
  };
  const connected = current.status === "connected";

  return (
    <div className="api-status-row">
      <span className="api-status-label">
        <i className={`status-dot${connected ? " live" : ""}`} />
        {label}
      </span>
      <span className={`api-status-value status-${current.status}`}>
        {serviceStatusLabel(current.status)}
      </span>
      <small>{lastSuccessLabel(current)}</small>
    </div>
  );
}

export function UnavailableCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="unavailable-card">
      <span className="unavailable-icon">⌁</span>
      <div><strong>{title}</strong><p>{text}</p></div>
      <span className="feature-tag tag-muted"><i />준비 중</span>
    </div>
  );
}
