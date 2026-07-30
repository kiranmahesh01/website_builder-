import type { Section } from "@/lib/schema";
import { ButtonLink, DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type Props = Extract<Section, { type: "booking" }>;

export function Booking(props: Props) {
  return (
    <SectionShell id="booking">
      <Wrap>
        <DisplayHeading as="h2">{props.headline}</DisplayHeading>
        {props.body ? (
          <Muted style={{ marginTop: "0.75rem", maxWidth: "48ch" }}>{props.body}</Muted>
        ) : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          {props.services.map((s) => (
            <article
              key={s.name}
              style={{
                padding: "1.25rem",
                border: "1px solid color-mix(in srgb, var(--text) 12%, transparent)",
                borderRadius: "var(--radius)",
                background: "color-mix(in srgb, var(--primary) 8%, transparent)",
              }}
            >
              <h3 style={{ fontFamily: "var(--display)", margin: 0, fontSize: "1.15rem" }}>
                {s.name}
              </h3>
              <Muted style={{ marginTop: "0.4rem", fontSize: "0.9rem" }}>
                {[s.duration, s.price].filter(Boolean).join(" · ")}
              </Muted>
            </article>
          ))}
        </div>
        {props.cta ? (
          <div style={{ marginTop: "1.75rem" }}>
            <ButtonLink href={props.cta.href}>{props.cta.label}</ButtonLink>
          </div>
        ) : null}
      </Wrap>
    </SectionShell>
  );
}
