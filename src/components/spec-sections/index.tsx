import type { ComponentType, CSSProperties } from "react";
import type { SiteThemeName } from "@/lib/themes";
import { imageFromSlot } from "@/lib/spec/images";
import type { SectionId } from "@/lib/spec/schema";
import {
  SpecBody,
  SpecButton,
  SpecHeading,
  SpecSection,
  SpecWrap,
  str,
} from "./shared";

type SectionProps = {
  content: Record<string, unknown>;
  brand: string;
  theme: SiteThemeName;
};

export function HeroCentered({ content, brand, theme }: SectionProps) {
  return (
    <SpecSection theme={theme} id="top">
      <SpecWrap>
        <div style={{ textAlign: "center", maxWidth: "48rem", margin: "0 auto" }}>
          <SpecHeading level={1} theme={theme}>
            {str(content.headline, brand)}
          </SpecHeading>
          <div style={{ marginTop: "1.25rem" }}>
            <SpecBody>{str(content.subhead, `Welcome to ${brand}.`)}</SpecBody>
          </div>
          <div style={{ marginTop: "2rem" }}>
            <SpecButton theme={theme}>{str(content.ctaLabel, "Get started")}</SpecButton>
          </div>
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function HeroSplit({ content, brand, theme }: SectionProps) {
  const imageUrl = imageFromSlot(content.image, theme);
  return (
    <SpecSection theme={theme} id="top">
      <SpecWrap>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "2.5rem",
            alignItems: "center",
          }}
        >
          <div>
            <SpecHeading level={1} theme={theme}>
              {str(content.headline, brand)}
            </SpecHeading>
            <div style={{ marginTop: "1rem" }}>
              <SpecBody>{str(content.subhead, `Welcome to ${brand}.`)}</SpecBody>
            </div>
            <div style={{ marginTop: "1.75rem" }}>
              <SpecButton theme={theme}>{str(content.ctaLabel, "Get started")}</SpecButton>
            </div>
          </div>
          <div
            style={{
              minHeight: 320,
              borderRadius: "var(--radius)",
              background: imageUrl
                ? `center/cover url(${imageUrl})`
                : "linear-gradient(135deg, var(--accent), var(--surface-alt))",
            }}
          />
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function LogosStrip({ content, theme }: SectionProps) {
  const logos = Array.isArray(content.logos) ? content.logos : [];
  return (
    <SpecSection theme={theme} alt>
      <SpecWrap>
        <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: "1.5rem" }}>
          {str(content.headline, "Trusted by")}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2rem",
            opacity: 0.7,
            fontWeight: 600,
          }}
        >
          {logos.map((logo, i) => (
            <span key={i}>{str(logo)}</span>
          ))}
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function Features3Col({ content, theme }: SectionProps) {
  const items = Array.isArray(content.items) ? content.items : [];
  return (
    <SpecSection theme={theme} id="features">
      <SpecWrap>
        <SpecHeading theme={theme}>{str(content.headline, "What we offer")}</SpecHeading>
        <div
          style={{
            marginTop: "2.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {items.slice(0, 3).map((item, i) => {
            const o = item as Record<string, unknown>;
            return (
              <div
                key={i}
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
                  background: "var(--surface-alt)",
                }}
              >
                <h3 style={{ margin: "0 0 0.5rem", fontFamily: "var(--display)" }}>
                  {str(o.title, "Feature")}
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
                  {str(o.body)}
                </p>
              </div>
            );
          })}
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function FeatureImageLeft({ content, theme }: SectionProps) {
  const imageUrl = imageFromSlot(content.image, theme);
  return (
    <SpecSection theme={theme}>
      <SpecWrap>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "center" }}>
          <div
            style={{
              minHeight: 280,
              borderRadius: "var(--radius)",
              background: imageUrl
                ? `center/cover url(${imageUrl})`
                : "var(--surface-alt)",
            }}
          />
          <div>
            <SpecHeading theme={theme}>{str(content.headline, "Why us")}</SpecHeading>
            <div style={{ marginTop: "1rem" }}>
              <SpecBody>{str(content.body)}</SpecBody>
            </div>
          </div>
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function FeatureImageRight({ content, theme }: SectionProps) {
  const imageUrl = imageFromSlot(content.image, theme);
  return (
    <SpecSection theme={theme}>
      <SpecWrap>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "center" }}>
          <div>
            <SpecHeading theme={theme}>{str(content.headline, "Why us")}</SpecHeading>
            <div style={{ marginTop: "1rem" }}>
              <SpecBody>{str(content.body)}</SpecBody>
            </div>
          </div>
          <div
            style={{
              minHeight: 280,
              borderRadius: "var(--radius)",
              background: imageUrl
                ? `center/cover url(${imageUrl})`
                : "var(--surface-alt)",
            }}
          />
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function TestimonialSingle({ content, theme }: SectionProps) {
  const photo = imageFromSlot(content.image, theme);
  return (
    <SpecSection theme={theme} alt>
      <SpecWrap>
        <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "center" }}>
          {photo ? (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                margin: "0 auto 1.25rem",
                background: `center/cover url(${photo})`,
              }}
            />
          ) : null}
          <blockquote style={{ fontSize: "1.25rem", lineHeight: 1.5, margin: 0 }}>
            &ldquo;{str(content.quote)}&rdquo;
          </blockquote>
          <p style={{ marginTop: "1rem", color: "var(--muted)" }}>
            <strong style={{ color: "var(--text)" }}>{str(content.name)}</strong>
            {content.role ? ` · ${str(content.role)}` : ""}
          </p>
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function Pricing3Tier({ content, theme }: SectionProps) {
  const plans = Array.isArray(content.plans) ? content.plans : [];
  return (
    <SpecSection theme={theme} id="pricing">
      <SpecWrap>
        <div style={{ textAlign: "center" }}>
          <SpecHeading theme={theme}>{str(content.headline, "Pricing")}</SpecHeading>
        </div>
        <div
          style={{
            marginTop: "2.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {plans.slice(0, 3).map((plan, i) => {
            const p = plan as Record<string, unknown>;
            const highlighted = Boolean(p.highlighted) || i === 1;
            const features = Array.isArray(p.features) ? p.features.map((f) => str(f)) : [];
            return (
              <div
                key={i}
                style={{
                  padding: "1.75rem",
                  borderRadius: "var(--radius)",
                  border: highlighted
                    ? "2px solid var(--accent)"
                    : "1px solid color-mix(in srgb, var(--text) 12%, transparent)",
                  background: highlighted ? "color-mix(in srgb, var(--accent) 8%, var(--surface))" : "var(--surface-alt)",
                }}
              >
                <h3 style={{ margin: 0, fontFamily: "var(--display)" }}>{str(p.name)}</h3>
                <p style={{ margin: "0.75rem 0", fontSize: "2rem", fontWeight: 800 }}>
                  {str(p.price)}
                  <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--muted)" }}>
                    {str(p.period, "/mo")}
                  </span>
                </p>
                <ul style={{ margin: "0 0 1.25rem", paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {features.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
                <SpecButton theme={theme}>{str(p.ctaLabel, "Choose plan")}</SpecButton>
              </div>
            );
          })}
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function FaqAccordion({ content, theme }: SectionProps) {
  const items = Array.isArray(content.items) ? content.items : [];
  return (
    <SpecSection theme={theme}>
      <SpecWrap>
        <SpecHeading theme={theme}>{str(content.headline, "FAQ")}</SpecHeading>
        <dl style={{ marginTop: "2rem", maxWidth: "48rem" }}>
          {items.map((item, i) => {
            const o = item as Record<string, unknown>;
            return (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
                  padding: "1.25rem 0",
                }}
              >
                <dt style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{str(o.question)}</dt>
                <dd style={{ margin: 0, color: "var(--muted)" }}>{str(o.answer)}</dd>
              </div>
            );
          })}
        </dl>
      </SpecWrap>
    </SpecSection>
  );
}

export function AboutText({ content, brand, theme }: SectionProps) {
  const stats = Array.isArray(content.stats) ? content.stats : [];
  return (
    <SpecSection theme={theme} id="about">
      <SpecWrap>
        <SpecHeading theme={theme}>{str(content.headline, `About ${brand}`)}</SpecHeading>
        <div style={{ marginTop: "1.25rem" }}>
          {str(content.body)
            .split(/\n\n+/)
            .map((para, i) => (
              <div key={i} style={{ marginTop: i ? "1rem" : 0 }}>
                <SpecBody>{para}</SpecBody>
              </div>
            ))}
        </div>
        {stats.length ? (
          <div style={{ display: "flex", gap: "2rem", marginTop: "2rem", flexWrap: "wrap" }}>
            {stats.map((s, i) => {
              const o = s as Record<string, unknown>;
              return (
                <div key={i}>
                  <div style={{ fontSize: "2rem", fontWeight: 800 }}>{str(o.value)}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{str(o.label)}</div>
                </div>
              );
            })}
          </div>
        ) : null}
      </SpecWrap>
    </SpecSection>
  );
}

export function ContactForm({ content, theme }: SectionProps) {
  return (
    <SpecSection theme={theme} id="contact">
      <SpecWrap>
        <div style={{ maxWidth: "32rem" }}>
          <SpecHeading theme={theme}>{str(content.headline, "Contact us")}</SpecHeading>
          <div style={{ marginTop: "0.75rem" }}>
            <SpecBody>{str(content.subhead, "Send us a message.")}</SpecBody>
          </div>
          <form style={{ marginTop: "1.5rem", display: "grid", gap: "0.75rem" }}>
            <input placeholder="Name" style={inputStyle} readOnly />
            <input placeholder="Email" type="email" style={inputStyle} readOnly />
            <textarea placeholder="Message" rows={4} style={inputStyle} readOnly />
            <SpecButton theme={theme}>{str(content.submitLabel, "Send")}</SpecButton>
          </form>
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function CtaBand({ content, theme }: SectionProps) {
  return (
    <SpecSection theme={theme} style={{ background: "var(--accent)", color: "#111" }}>
      <SpecWrap>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--display)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
            {str(content.headline, "Ready to start?")}
          </h2>
          <div style={{ marginTop: "1.25rem" }}>
            <a
              href="#contact"
              style={{
                display: "inline-flex",
                padding: "0.85rem 1.5rem",
                background: "#111",
                color: "#fff",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {str(content.ctaLabel, "Contact us")}
            </a>
          </div>
        </div>
      </SpecWrap>
    </SpecSection>
  );
}

export function FooterSimple({ content, brand, theme }: SectionProps) {
  return (
    <footer
      style={{
        padding: "2.5rem 0",
        borderTop: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
      }}
    >
      <SpecWrap>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>{brand}</div>
            {content.tagline ? (
              <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                {str(content.tagline)}
              </p>
            ) : null}
          </div>
          <nav style={{ display: "flex", gap: "1.25rem", fontSize: "0.85rem" }}>
            <a href="#about" style={{ color: "var(--muted)", textDecoration: "none" }}>About</a>
            <a href="#features" style={{ color: "var(--muted)", textDecoration: "none" }}>Services</a>
            <a href="#contact" style={{ color: "var(--muted)", textDecoration: "none" }}>Contact</a>
          </nav>
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          © {new Date().getFullYear()} {brand}
        </p>
      </SpecWrap>
    </footer>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius)",
  border: "1px solid color-mix(in srgb, var(--text) 15%, transparent)",
  background: "var(--surface)",
  color: "var(--text)",
};

export const SPEC_SECTION_COMPONENTS: Record<
  SectionId,
  ComponentType<SectionProps>
> = {
  hero_centered: HeroCentered,
  hero_split: HeroSplit,
  logos_strip: LogosStrip,
  features_3col: Features3Col,
  feature_image_left: FeatureImageLeft,
  feature_image_right: FeatureImageRight,
  testimonial_single: TestimonialSingle,
  pricing_3tier: Pricing3Tier,
  faq_accordion: FaqAccordion,
  about_text: AboutText,
  contact_form: ContactForm,
  cta_band: CtaBand,
  footer_simple: FooterSimple,
};
