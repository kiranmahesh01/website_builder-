import type { ComponentType } from "react";
import type { Section } from "@/lib/schema";
import type { UiKit } from "@/lib/ui-kits";
import * as Magic from "../sections";
import * as Daisy from "./daisyui";
import * as Flowbite from "./flowbite";
import * as Preline from "./preline";
import * as Shadcn from "./shadcn";

type SectionMap = Partial<Record<Section["type"], ComponentType<Section>>>;

const KITS: Record<UiKit, SectionMap> = {
  magic: {},
  daisyui: Daisy as SectionMap,
  flowbite: Flowbite as SectionMap,
  preline: Preline as SectionMap,
  shadcn: Shadcn as SectionMap,
};

const MAGIC_REGISTRY = {
  nav: Magic.Nav,
  hero: Magic.Hero,
  features: Magic.Features,
  about: Magic.About,
  gallery: Magic.Gallery,
  pricing: Magic.Pricing,
  testimonials: Magic.Testimonials,
  faq: Magic.Faq,
  cta: Magic.Cta,
  contact: Magic.Contact,
  products: Magic.Products,
  booking: Magic.Booking,
  checkout: Magic.Checkout,
  footer: Magic.Footer,
} as const;

export function getSectionComponent(
  kit: UiKit,
  type: Section["type"],
): ComponentType<Section> | undefined {
  if (kit === "magic") {
    return MAGIC_REGISTRY[type] as ComponentType<Section> | undefined;
  }
  const override = KITS[kit][type];
  if (override) return override;
  return MAGIC_REGISTRY[type] as ComponentType<Section> | undefined;
}
