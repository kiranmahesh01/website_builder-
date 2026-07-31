import type { SiteSpec } from "@/lib/spec/schema";
import type { DesignSystem } from "./schema";
import { designSystemToTokens } from "./generate";

/**
 * Merge DesignSystem tokens into SiteSpec so every section inherits brand rules.
 */
export function applyDesignSystemToSpec(
  spec: SiteSpec,
  designSystem: DesignSystem,
): SiteSpec {
  const tokens = designSystemToTokens(designSystem);
  return {
    ...spec,
    design: {
      ...(spec.design || {}),
      ...tokens,
    },
  };
}
