import type { Section } from "@/lib/schema";
import { DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type TestimonialsProps = Extract<Section, { type: "testimonials" }>;

export function Testimonials(props: TestimonialsProps) {
  return (
    <SectionShell id="testimonials">
      <Wrap>
        <DisplayHeading style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)", marginBottom: "2rem" }}>
          {props.headline}
        </DisplayHeading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {props.items.map((item) => (
            <blockquote
              key={`${item.name}-${item.quote.slice(0, 24)}`}
              style={{
                margin: 0,
                padding: "1.4rem 1.25rem",
                borderLeft: "3px solid var(--accent)",
                background: "color-mix(in srgb, var(--primary) 10%, transparent)",
              }}
            >
              <p style={{ margin: 0, fontSize: "1.05rem", lineHeight: 1.55 }}>
                “{item.quote}”
              </p>
              <footer style={{ marginTop: "1rem" }}>
                <strong style={{ fontFamily: "var(--display)" }}>{item.name}</strong>
                {item.role ? (
                  <Muted style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                    {item.role}
                  </Muted>
                ) : null}
              </footer>
            </blockquote>
          ))}
        </div>
      </Wrap>
    </SectionShell>
  );
}
