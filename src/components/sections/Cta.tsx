import type { Section } from "@/lib/schema";
import { ButtonLink, DisplayHeading, Muted, Wrap } from "./shared";

type CtaProps = Extract<Section, { type: "cta" }>;

export function Cta(props: CtaProps) {
  return (
    <section
      id="cta"
      style={{
        textAlign: "center",
        padding: "5rem 0",
        background:
          "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%), var(--surface)",
      }}
    >
      <Wrap>
        <DisplayHeading
          as="h2"
          style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", marginBottom: "0.75rem" }}
        >
          {props.headline}
        </DisplayHeading>
        {props.body ? (
          <Muted style={{ marginBottom: "1.5rem", maxWidth: "42ch", marginInline: "auto" }}>
            {props.body}
          </Muted>
        ) : null}
        <ButtonLink href={props.cta.href}>{props.cta.label}</ButtonLink>
      </Wrap>
    </section>
  );
}
