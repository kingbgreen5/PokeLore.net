export default function CollapsibleSection({ id, title, summary, expanded, onToggle, children, contentStyle, className, style }) {
  return <details id={id} className={`reference-accordion ${className ?? ''}`} open={expanded}
    style={style} onToggle={event => { if (event.currentTarget.open !== expanded) onToggle?.(); }}>
    <summary><h2>{title}</h2>{summary && <span className="accordion-count">{summary}</span>}</summary>
    <div className="accordion-body" style={contentStyle}>{children}</div>
  </details>;
}
