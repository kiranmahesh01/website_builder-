import type { Section } from "@/lib/schema";
import { DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type FeaturesProps = Extract<Section, { type: "features" }>;

export function Features(props: FeaturesProps) {
  return (
    <SectionShell id="features">
      <Wrap>
        <DisplayHeading style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}>
          {props.headline}
        </DisplayHeading>
        {props.subheadline ? (
          <Muted style={{ marginTop: "0.65rem", marginBottom: "2rem", maxWidth: "42ch" }}>
            {props.subheadline}
          </Muted>
        ) : (
          <div style={{ height: "2rem" }} />
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {props.items.map((item) => (
            <article
              key={item.title}
              style={{
                padding: "1.35rem 1.25rem",
                borderTop: "2px solid var(--accent)",
                background:
                  "color-mix(in srgb, var(--primary) 12%, transparent)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1.25rem",
                  margin: "0 0 0.5rem",
                }}
              >
                {item.title}
              </h3>
              <Muted style={{ fontSize: "0.95rem" }}>{item.body}</Muted>
            </article>
          ))}
        </div>
      </Wrap>
    </SectionShell>
  );
}
