import type { Section } from "@/lib/schema";
import { ButtonLink, DisplayHeading, Muted, SectionShell, Wrap } from "./shared";

type Props = Extract<Section, { type: "checkout" }>;

export function Checkout(props: Props) {
  return (
    <SectionShell id="checkout">
      <Wrap style={{ maxWidth: 640 }}>
        <DisplayHeading as="h2">{props.headline}</DisplayHeading>
        {props.body ? (
          <Muted style={{ marginTop: "0.75rem" }}>{props.body}</Muted>
        ) : null}
        <ul style={{ listStyle: "none", margin: "1.75rem 0", padding: 0 }}>
          {props.items.map((item) => (
            <li
              key={`${item.name}-${item.price}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.85rem 0",
                borderBottom: "1px solid color-mix(in srgb, var(--text) 10%, transparent)",
              }}
            >
              <span>
                {item.name}
                <Muted style={{ display: "block", fontSize: "0.85rem" }}>
                  Qty {item.quantity ?? 1}
                </Muted>
              </span>
              <strong>{item.price}</strong>
            </li>
          ))}
        </ul>
        {props.currencyNote ? (
          <Muted style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
            {props.currencyNote}
          </Muted>
        ) : null}
        <ButtonLink href={props.cta.href}>{props.cta.label}</ButtonLink>
        <Muted style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
          Demo checkout — connect Stripe later for live payments.
        </Muted>
      </Wrap>
    </SectionShell>
  );
}
