import type { Section } from "@/lib/schema";
import { DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type AboutProps = Extract<Section, { type: "about" }>;

export function About(props: AboutProps) {
  const image =
    props.imageUrl ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80";

  return (
    <SectionShell id="about" alt>
      <Wrap
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "2.5rem",
          alignItems: "center",
        }}
      >
        <div>
          <DisplayHeading style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}>
            {props.headline}
          </DisplayHeading>
          <Muted style={{ marginTop: "1rem", maxWidth: "48ch" }}>{props.body}</Muted>
          {props.stats?.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                marginTop: "1.75rem",
              }}
            >
              {props.stats.map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: "1.75rem",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stat.value}
                  </div>
                  <Muted style={{ fontSize: "0.85rem" }}>{stat.label}</Muted>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div
          role="img"
          aria-label={props.headline}
          style={{
            minHeight: 280,
            borderRadius: "var(--radius)",
            background: `linear-gradient(160deg, color-mix(in srgb, var(--accent) 25%, transparent), transparent 60%), url(${image}) center/cover`,
          }}
        />
      </Wrap>
    </SectionShell>
  );
}
