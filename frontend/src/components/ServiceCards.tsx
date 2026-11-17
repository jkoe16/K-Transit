import { Link } from "react-router-dom";

export function FeatureCard({
  to,
  icon,
  title,
  description,
  tag,
  muted = false,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
  tag: string;
  muted?: boolean;
}) {
  return (
    <Link to={to} className={`feature-card${muted ? " muted" : ""}`}>
      <div className="feature-top">
        <span className="feature-icon">{icon}</span>
        <span className={`feature-tag${muted ? " tag-muted" : ""}`}><i />{tag}</span>
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

export function UnavailableCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="unavailable-card">
      <span className="unavailable-icon">⌁</span>
      <div><strong>{title}</strong><p>{text}</p></div>
      <span className="feature-tag tag-muted"><i />연동 대기</span>
    </div>
  );
}
