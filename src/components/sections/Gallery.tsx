import type { Section } from "@/lib/schema";
import { DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type GalleryProps = Extract<Section, { type: "gallery" }>;

export function Gallery(props: GalleryProps) {
  return (
    <SectionShell id="gallery">
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
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {props.images.map((img, i) => (
            <figure key={`${img.url}-${i}`} style={{ margin: 0 }}>
              <div
                role="img"
                aria-label={img.alt || props.headline}
                style={{
                  aspectRatio: i % 3 === 0 ? "4/5" : "1/1",
                  borderRadius: "var(--radius)",
                  background: `url(${img.url}) center/cover`,
                }}
              />
              {img.caption ? (
                <figcaption>
                  <Muted style={{ marginTop: "0.45rem", fontSize: "0.85rem" }}>
                    {img.caption}
                  </Muted>
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </Wrap>
    </SectionShell>
  );
}
