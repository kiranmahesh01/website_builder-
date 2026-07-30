import type { Section } from "@/lib/schema";
import { ButtonLink, DisplayHeading, Muted, Wrap } from "./shared";

type HeroProps = Extract<Section, { type: "hero" }>;

export function Hero(props: HeroProps) {
  const image =
    props.imageUrl ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80";

  if (props.layout === "split") {
    return (
      <section id="top" style={{ padding: "3.5rem 0 4rem" }}>
        <Wrap
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "2.5rem",
            alignItems: "center",
          }}
        >
          <div>
            {props.brand ? (
              <p
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  margin: "0 0 1rem",
                }}
              >
                {props.brand}
              </p>
            ) : null}
            <DisplayHeading
              as="h1"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)", maxWidth: "18ch" }}
            >
              {props.headline}
            </DisplayHeading>
            <Muted style={{ marginTop: "0.9rem", maxWidth: "36ch", fontSize: "1.05rem" }}>
              {props.subheadline}
            </Muted>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
              <ButtonLink href={props.primaryCta.href}>
                {props.primaryCta.label}
              </ButtonLink>
              {props.secondaryCta ? (
                <ButtonLink href={props.secondaryCta.href} ghost>
                  {props.secondaryCta.label}
                </ButtonLink>
              ) : null}
            </div>
          </div>
          <div
            role="img"
            aria-label={props.brand || props.headline}
            style={{
              minHeight: 340,
              borderRadius: "var(--radius)",
              background: `linear-gradient(160deg, color-mix(in srgb, var(--accent) 28%, transparent), transparent 55%), url(${image}) center/cover`,
            }}
          />
        </Wrap>
      </section>
    );
  }

  if (props.layout === "centered" || props.layout === "minimal") {
    const minimal = props.layout === "minimal";
    return (
      <section
        id="top"
        style={{
          padding: minimal ? "4rem 0 3rem" : "5.5rem 0 4.5rem",
          textAlign: "center",
          background: minimal
            ? "var(--surface)"
            : "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%), var(--surface)",
        }}
      >
        <Wrap style={{ maxWidth: minimal ? 560 : 720 }}>
          {props.brand ? (
            <p
              style={{
                fontFamily: "var(--display)",
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                margin: "0 0 1rem",
              }}
            >
              {props.brand}
            </p>
          ) : null}
          <DisplayHeading
            as="h1"
            style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              maxWidth: "22ch",
              marginInline: "auto",
            }}
          >
            {props.headline}
          </DisplayHeading>
          <Muted
            style={{
              marginTop: "0.9rem",
              marginInline: "auto",
              maxWidth: "40ch",
              fontSize: "1.05rem",
            }}
          >
            {props.subheadline}
          </Muted>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
              marginTop: "1.5rem",
            }}
          >
            <ButtonLink href={props.primaryCta.href}>
              {props.primaryCta.label}
            </ButtonLink>
            {props.secondaryCta ? (
              <ButtonLink href={props.secondaryCta.href} ghost>
                {props.secondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
        </Wrap>
      </section>
    );
  }

  return (
    <section
      id="top"
      style={{
        position: "relative",
        minHeight: "min(92vh, 820px)",
        display: "grid",
        alignItems: "end",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -2,
          background: `linear-gradient(120deg, color-mix(in srgb, var(--surface) 88%, transparent) 0%, color-mix(in srgb, var(--surface) 35%, transparent) 55%, transparent 100%), url(${image}) center/cover no-repeat`,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(ellipse at 70% 30%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 55%)",
        }}
      />
      <Wrap style={{ padding: "5.5rem 0 4rem", maxWidth: "38rem", marginLeft: "max(1.25rem, calc(50% - 560px))", marginRight: "auto", width: "min(38rem, calc(100% - 2.5rem))" }}>
        {props.brand ? (
          <p
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(2.6rem, 7vw, 4.4rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              margin: "0 0 1.1rem",
            }}
          >
            {props.brand}
          </p>
        ) : null}
        <DisplayHeading
          as="h1"
          style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.15rem)", maxWidth: "18ch" }}
        >
          {props.headline}
        </DisplayHeading>
        <Muted style={{ marginTop: "0.85rem", marginBottom: "1.6rem", maxWidth: "36ch", fontSize: "1.05rem" }}>
          {props.subheadline}
        </Muted>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <ButtonLink href={props.primaryCta.href}>
            {props.primaryCta.label}
          </ButtonLink>
          {props.secondaryCta ? (
            <ButtonLink href={props.secondaryCta.href} ghost>
              {props.secondaryCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </Wrap>
    </section>
  );
}
