import { Link } from "react-router-dom";
import { normalizeDisplayText } from "../utils/normalizeText";

function NoteLink({
  link
}) {
  if (!link?.to || !link?.label) {
    return null;
  }

  return (
    <Link to={link.to}>
      {normalizeDisplayText(link.label)}
    </Link>
  );
}

function OaksNotes({
  note
}) {
  if (!note) {
    return null;
  }

  const sections = Array.isArray(note.sections)
    ? note.sections
    : [];
  const body = Array.isArray(note.body)
    ? note.body
    : [];

  if (
    !note.title &&
    sections.length === 0 &&
    body.length === 0
  ) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        marginBottom: "2rem",
        padding: "1rem",
        textAlign: "left"
      }}
    >
      <h2>{note.title ?? "Oak's Notes"}</h2>

      {body.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>
          {normalizeDisplayText(paragraph)}
        </p>
      ))}

      {sections.map((section, index) => (
        <section
          key={`${section.heading ?? "section"}-${index}`}
          style={{
            marginTop: index === 0 ? 0 : "1rem"
          }}
        >
          {section.heading && (
            <h3>{normalizeDisplayText(section.heading)}</h3>
          )}

          {(section.body ?? []).map((paragraph, bodyIndex) => (
            <p key={`${paragraph}-${bodyIndex}`}>
              {normalizeDisplayText(paragraph)}
            </p>
          ))}

          {section.links?.length > 0 && (
            <p
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".75rem",
                marginBottom: 0
              }}
            >
              {section.links.map(link => (
                <NoteLink
                  key={`${link.to}-${link.label}`}
                  link={link}
                />
              ))}
            </p>
          )}
        </section>
      ))}
    </section>
  );
}

export default OaksNotes;
