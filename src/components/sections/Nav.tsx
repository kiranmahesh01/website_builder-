import type { Section } from "@/lib/schema";
import { ButtonLink, Wrap } from "./shared";

type NavProps = Extract<Section, { type: "nav" }>;

export function Nav(props: NavProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(12px)",
        background: "color-mix(in srgb, var(--surface) 82%, transparent)",
        borderBottom:
          "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
      }}
    >
      <Wrap
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 0",
        }}
      >
        <a
          href="#top"
          style={{
            fontFamily: "var(--display)",
            fontSize: "1.45rem",
            letterSpacing: "-0.02em",
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          {props.brand}
        </a>
        <nav
          aria-label="Primary"
          style={{
            display: "flex",
            gap: "1.25rem",
            fontSize: "0.92rem",
            color: "var(--muted)",
            flexWrap: "wrap",
          }}
        >
          {(props.links || []).map((link) => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {link.label}
            </a>
          ))}
        </nav>
        {props.cta ? (
          <ButtonLink href={props.cta.href}>{props.cta.label}</ButtonLink>
        ) : null}
      </Wrap>
    </header>
  );
}
