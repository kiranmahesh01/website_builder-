import type { Section } from "@/lib/schema";
import { ButtonLink, DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type ContactProps = Extract<Section, { type: "contact" }>;

export function Contact(props: ContactProps) {
  return (
    <SectionShell id="contact">
      <Wrap
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        <div>
          <DisplayHeading style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}>
            {props.headline}
          </DisplayHeading>
          {props.body ? (
            <Muted style={{ marginTop: "0.85rem", maxWidth: "42ch" }}>{props.body}</Muted>
          ) : null}
          {props.cta ? (
            <div style={{ marginTop: "1.5rem" }}>
              <ButtonLink href={props.cta.href}>{props.cta.label}</ButtonLink>
            </div>
          ) : null}
        </div>
        <div
          style={{
            padding: "1.35rem",
            borderTop: "2px solid var(--accent)",
            background: "color-mix(in srgb, var(--primary) 10%, transparent)",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          {props.email ? (
            <p style={{ margin: 0 }}>
              <Muted style={{ fontSize: "0.8rem", marginBottom: "0.2rem" }}>Email</Muted>
              <a href={`mailto:${props.email}`} style={{ color: "var(--text)" }}>
                {props.email}
              </a>
            </p>
          ) : null}
          {props.phone ? (
            <p style={{ margin: 0 }}>
              <Muted style={{ fontSize: "0.8rem", marginBottom: "0.2rem" }}>Phone</Muted>
              <a href={`tel:${props.phone}`} style={{ color: "var(--text)" }}>
                {props.phone}
              </a>
            </p>
          ) : null}
          {props.address ? (
            <p style={{ margin: 0 }}>
              <Muted style={{ fontSize: "0.8rem", marginBottom: "0.2rem" }}>Address</Muted>
              <span>{props.address}</span>
            </p>
          ) : null}
          {!props.email && !props.phone && !props.address ? (
            <Muted>Reach out — we usually reply within one business day.</Muted>
          ) : null}
        </div>
      </Wrap>
    </SectionShell>
  );
}
