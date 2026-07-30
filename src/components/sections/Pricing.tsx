import type { Section } from "@/lib/schema";
import { ButtonLink, DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type PricingProps = Extract<Section, { type: "pricing" }>;

export function Pricing(props: PricingProps) {
  return (
    <SectionShell id="pricing" alt>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
            alignItems: "stretch",
          }}
        >
          {props.plans.map((plan) => (
            <article
              key={plan.name}
              style={{
                padding: "1.5rem",
                border: plan.highlighted
                  ? "2px solid var(--accent)"
                  : "1px solid color-mix(in srgb, var(--text) 14%, transparent)",
                borderRadius: "var(--radius)",
                background: plan.highlighted
                  ? "color-mix(in srgb, var(--accent) 10%, var(--surface))"
                  : "transparent",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <h3 style={{ fontFamily: "var(--display)", margin: 0, fontSize: "1.35rem" }}>
                {plan.name}
              </h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                <span style={{ fontFamily: "var(--display)", fontSize: "2rem" }}>
                  {plan.price}
                </span>
                {plan.period ? (
                  <Muted style={{ fontSize: "0.85rem" }}>{plan.period}</Muted>
                ) : null}
              </div>
              {plan.description ? <Muted>{plan.description}</Muted> : null}
              <ul style={{ margin: "0.5rem 0 1rem", paddingLeft: "1.1rem", color: "var(--muted)" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ marginBottom: "0.35rem" }}>
                    {f}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "auto" }}>
                <ButtonLink href={plan.cta.href} ghost={!plan.highlighted}>
                  {plan.cta.label}
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </Wrap>
    </SectionShell>
  );
}
