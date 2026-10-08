export default function MaintenanceNotice() {
  return (
    <aside
      role="status"
      style={{
        background: "#3a2a0b",
        border: "1px solid #d9a441",
        borderRadius: "8px",
        color: "#fff3cf",
        lineHeight: 1.45,
        margin: "0 auto 1.25rem",
        maxWidth: "760px",
        padding: ".7rem .9rem"
      }}
    >
      <strong>Scheduled maintenance:</strong> We are making site improvements and may experience brief outages.
    </aside>
  );
}
