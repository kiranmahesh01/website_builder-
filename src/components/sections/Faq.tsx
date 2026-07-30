import type { Section } from "@/lib/schema";
import { DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type FaqProps = Extract<Section, { type: "faq" }>;

export function Faq(props: FaqProps) {
  return (
    <SectionShell id="faq" alt>
      <Wrap style={{ maxWidth: 760 }}>
        <DisplayHeading style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)", marginBottom: "1.75rem" }}>
          {props.headline}
        </DisplayHeading>
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {props.items.map((item) => (
            <details
              key={item.question}
              style={{
                borderBottom:
                  "1px solid color-mix(in srgb, var(--text) 12%, transparent)",
                paddingBottom: "0.85rem",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontFamily: "var(--display)",
                  fontSize: "1.15rem",
                  listStyle: "none",
                }}
              >
                {item.question}
              </summary>
              <Muted style={{ marginTop: "0.65rem" }}>{item.answer}</Muted>
            </details>
          ))}
        </div>
      </Wrap>
    </SectionShell>
  );
}
