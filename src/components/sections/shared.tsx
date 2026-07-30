import type { CSSProperties, ReactNode } from "react";

export function Wrap({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: "min(1120px, calc(100% - 2.5rem))",
        marginInline: "auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionShell({
  children,
  alt,
  id,
  style,
}: {
  children: ReactNode;
  alt?: boolean;
  id?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      id={id}
      style={{
        padding: "4.5rem 0",
        background: alt ? "var(--surface-alt, var(--surface))" : undefined,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function DisplayHeading({
  children,
  as: Tag = "h2",
  style,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  style?: CSSProperties;
}) {
  return (
    <Tag
      style={{
        fontFamily: "var(--display)",
        letterSpacing: "-0.02em",
        lineHeight: 1.15,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function Muted({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.55, ...style }}>
      {children}
    </p>
  );
}

export function ButtonLink({
  href,
  children,
  ghost,
}: {
  href: string;
  children: ReactNode;
  ghost?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.85rem 1.35rem",
        background: ghost ? "transparent" : "var(--accent)",
        color: ghost ? "var(--text)" : "#111",
        fontWeight: 600,
        borderRadius: "var(--radius)",
        border: ghost
          ? "1px solid color-mix(in srgb, var(--text) 22%, transparent)"
          : "none",
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </a>
  );
}
