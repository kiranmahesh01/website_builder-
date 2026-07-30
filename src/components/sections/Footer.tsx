import type { Section } from "@/lib/schema";
import { Muted, Wrap } from "./shared";

type FooterProps = Extract<Section, { type: "footer" }>;

export function Footer(props: FooterProps) {
  return (
    <footer
      style={{
        borderTop: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
        padding: "1.75rem 0 2.25rem",
      }}
    >
      <Wrap
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>
            {props.brand}
          </div>
          {props.tagline ? (
            <Muted style={{ marginTop: "0.35rem", fontSize: "0.9rem" }}>
              {props.tagline}
            </Muted>
          ) : null}
        </div>
        {props.links.length ? (
          <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {props.links.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
        <Muted style={{ fontSize: "0.88rem" }}>
          {props.copyright || `© ${new Date().getFullYear()} ${props.brand}`}
        </Muted>
      </Wrap>
    </footer>
  );
}
