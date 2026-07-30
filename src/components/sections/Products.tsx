import type { Section } from "@/lib/schema";
import { DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type ProductsProps = Extract<Section, { type: "products" }>;

export function Products(props: ProductsProps) {
  return (
    <SectionShell id="products">
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
            gap: "1.15rem",
          }}
        >
          {props.items.map((item) => {
            const inner = (
              <>
                <div
                  role="img"
                  aria-label={item.name}
                  style={{
                    aspectRatio: "4/3",
                    borderRadius: "var(--radius)",
                    marginBottom: "0.85rem",
                    background: item.imageUrl
                      ? `url(${item.imageUrl}) center/cover`
                      : "linear-gradient(135deg, color-mix(in srgb, var(--accent) 35%, transparent), color-mix(in srgb, var(--primary) 25%, transparent))",
                  }}
                />
                <h3 style={{ fontFamily: "var(--display)", margin: "0 0 0.35rem", fontSize: "1.2rem" }}>
                  {item.name}
                </h3>
                <Muted style={{ fontSize: "0.92rem" }}>{item.description}</Muted>
                {item.price ? (
                  <p
                    style={{
                      margin: "0.65rem 0 0",
                      fontFamily: "var(--display)",
                      fontSize: "1.1rem",
                    }}
                  >
                    {item.price}
                  </p>
                ) : null}
              </>
            );
            return item.href ? (
              <a
                key={item.name}
                href={item.href}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {inner}
              </a>
            ) : (
              <article key={item.name}>{inner}</article>
            );
          })}
        </div>
      </Wrap>
    </SectionShell>
  );
}
