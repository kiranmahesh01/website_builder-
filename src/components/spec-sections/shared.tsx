import type { CSSProperties, ReactNode } from "react";
import type { SiteThemeName } from "@/lib/themes";
import type { DesignTokens } from "@/lib/spec/schema";
import { getThemeLayout, sectionTokenVars } from "@/lib/themes/layout";

export function SpecWrap({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: "min(1120px, calc(100% - 2.5rem))", marginInline: "auto" }}>
      {children}
    </div>
  );
}

export function SpecSection({
  children,
  theme,
  alt,
  id,
  style,
  tokens,
}: {
  children: ReactNode;
  theme: SiteThemeName;
  alt?: boolean;
  id?: string;
  style?: CSSProperties;
  tokens?: DesignTokens;
}) {
  const layout = getThemeLayout(theme);
  const scoped = sectionTokenVars(tokens);
  return (
    <section
      id={id}
      style={{
        padding: layout.sectionPadding,
        background: alt ? "var(--surface-alt)" : undefined,
        ...style,
        ...scoped,
      }}
    >
      {children}
    </section>
  );
}

export function SpecHeading({
  children,
  level = 2,
  theme,
}: {
  children: ReactNode;
  level?: 1 | 2;
  theme: SiteThemeName;
}) {
  const layout = getThemeLayout(theme);
  const Tag = level === 1 ? "h1" : "h2";
  return (
    <Tag
      style={{
        fontFamily: "var(--display)",
        fontSize: level === 1 ? layout.h1 : layout.h2,
        lineHeight: 1.1,
        letterSpacing: layout.letterSpacing || "-0.02em",
        margin: 0,
        fontWeight: level === 1 ? 800 : 700,
      }}
    >
      {children}
    </Tag>
  );
}

export function SpecBody({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        color: "var(--muted)",
        lineHeight: 1.6,
        margin: 0,
        maxWidth: "65ch",
        fontSize: "var(--body-size, 1rem)",
      }}
    >
      {children}
    </p>
  );
}

export function SpecButton({
  children,
  theme,
  href = "#contact",
  type,
}: {
  children: ReactNode;
  theme: SiteThemeName;
  href?: string;
  type?: "submit" | "button";
}) {
  const layout = getThemeLayout(theme);
  const defaultPad =
    layout.buttonStyle === "pill" ? "0.9rem 1.75rem" : "0.85rem 1.35rem";
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: `var(--button-pad, ${defaultPad})`,
    fontWeight: 600,
    textDecoration: "none",
    letterSpacing: layout.letterSpacing,
    borderRadius:
      layout.buttonStyle === "pill"
        ? "999px"
        : layout.buttonStyle === "outline"
          ? "0"
          : "var(--radius)",
    cursor: "pointer",
    font: "inherit",
    fontSize: "var(--button-font-size, inherit)",
  } as const;

  const outlineStyle = {
    ...base,
    border: "1px solid var(--button-bg, var(--accent))",
    color: "var(--button-bg, var(--accent))",
    background: "transparent",
  };

  const solidStyle = {
    ...base,
    background: "var(--button-bg, var(--accent))",
    color: "var(--button-text, #111)",
    border: "none",
  };

  if (type) {
    return (
      <button type={type} style={layout.buttonStyle === "outline" ? outlineStyle : solidStyle}>
        {children}
      </button>
    );
  }

  if (layout.buttonStyle === "outline") {
    return (
      <a href={href} style={outlineStyle}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} style={solidStyle}>
      {children}
    </a>
  );
}

export function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

export function SpecNav({ brand }: { brand: string }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(12px)",
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        borderBottom: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
      }}
    >
      <SpecWrap>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 0",
            gap: "1rem",
          }}
        >
          <a
            href="#top"
            style={{
              fontFamily: "var(--display)",
              fontSize: "1.35rem",
              color: "var(--text)",
              textDecoration: "none",
            }}
          >
            {brand}
          </a>
          <nav style={{ display: "flex", gap: "1.25rem", fontSize: "0.9rem" }}>
            <a href="#features" style={{ color: "var(--muted)", textDecoration: "none" }}>
              Features
            </a>
            <a href="#about" style={{ color: "var(--muted)", textDecoration: "none" }}>
              About
            </a>
            <a href="#contact" style={{ color: "var(--muted)", textDecoration: "none" }}>
              Contact
            </a>
          </nav>
        </div>
      </SpecWrap>
    </header>
  );
}

export function SpecWatermark() {
  return (
    <div
      style={{
        borderTop: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
        padding: "0.75rem 0",
        textAlign: "center",
        fontSize: "0.75rem",
        color: "var(--muted)",
        background: "var(--surface-alt)",
      }}
    >
      Built with{" "}
      <a href="https://websitebuilder-main.vercel.app" style={{ color: "var(--accent)" }}>
        Magic AI
      </a>
    </div>
  );
}
