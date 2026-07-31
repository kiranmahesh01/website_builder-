"use client";

type BlueprintSection = {
  id: string;
  label: string;
  why: string;
  priority: string;
  expectedLift: string;
};

type DebateOpinion = {
  persona: string;
  stance: string;
  recommendation: string;
};

export type MagicBlueprintPayload = {
  title: string;
  summary: string;
  businessAnalysis: {
    industry: string;
    businessModelHints: string[];
    positioning: string;
    risks: string[];
    opportunities: string[];
  };
  customerStrategy: {
    primaryAudience: string;
    desires: string[];
    fears: string[];
    decisionTriggers: string[];
    messagingPillars: string[];
    recommendedOffers: string[];
  };
  websiteStructure: BlueprintSection[];
  designPlan: {
    name: string;
    style: string;
    colors: {
      primary: string;
      accent: string;
      surface: string;
      text: string;
    };
    typography: { displayFont: string; bodyFont: string; scale: string };
    spacing: { sectionY: string; contentMax: string };
    buttons: {
      size: string;
      radius: string;
      strength: string;
      primaryLabelHint: string;
    };
    componentStyles: {
      hero: string;
      cards: string;
      nav: string;
      footer: string;
    };
  };
  conversionImprovements: { title: string; why: string }[];
  strategyRecommendations: string[];
  debate: {
    opinions: DebateOpinion[];
    managerDecision: {
      sectionOrderHint: string[];
      ctaStrength: string;
      mobileNav: string;
      rationale: string;
    };
  };
  dna: { id: string; industry: string; confidence: string };
};

/**
 * Rich Magic Blueprint screen — strategist deliverable before generate.
 */
export function MagicBlueprintPanel({
  blueprint,
}: {
  blueprint: MagicBlueprintPayload;
}) {
  const colors = blueprint.designPlan.colors;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-lime/30 bg-ink-soft p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-lime">
          Magic AI Blueprint
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-fog">
          {blueprint.title}
        </h2>
        <p className="mt-2 text-sm text-mist">{blueprint.summary}</p>
        <p className="mt-2 text-xs text-mist">
          Website DNA: {blueprint.dna.industry} · {blueprint.dna.confidence}{" "}
          match
        </p>
      </div>

      <Section title="Business Analysis">
        <p className="text-sm text-fog">{blueprint.businessAnalysis.positioning}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-mist">
          {blueprint.businessAnalysis.opportunities.slice(0, 3).map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        {blueprint.businessAnalysis.risks[0] ? (
          <p className="mt-2 text-xs text-coral/90">
            Watch: {blueprint.businessAnalysis.risks[0]}
          </p>
        ) : null}
      </Section>

      <Section title="Customer Strategy">
        <p className="text-sm text-fog">
          {blueprint.customerStrategy.primaryAudience}
        </p>
        <p className="mt-2 text-xs text-mist">
          Desires: {blueprint.customerStrategy.desires.join(" · ")}
        </p>
        <p className="mt-1 text-xs text-mist">
          Triggers: {blueprint.customerStrategy.decisionTriggers.join(" · ")}
        </p>
        <p className="mt-2 text-xs text-lime">
          Offers: {blueprint.customerStrategy.recommendedOffers.join(" / ")}
        </p>
      </Section>

      <Section title="Website Structure">
        <ul className="space-y-3">
          {blueprint.websiteStructure.slice(0, 8).map((s) => (
            <li key={s.id} className="border-b border-[var(--line)] pb-2 last:border-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-fog">{s.label}</p>
                <span className="text-[10px] uppercase tracking-wider text-mist">
                  {s.priority}
                </span>
              </div>
              <p className="mt-1 text-xs text-mist">{s.why}</p>
              <p className="mt-0.5 text-[11px] text-lime/80">{s.expectedLift}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Design Plan">
        <p className="text-sm text-fog">
          {blueprint.designPlan.name} · {blueprint.designPlan.style}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["Primary", colors.primary],
              ["Accent", colors.accent],
              ["Surface", colors.surface],
              ["Text", colors.text],
            ] as const
          ).map(([label, hex]) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-[var(--line)] px-2 py-1 text-[11px] text-mist"
            >
              <span
                className="inline-block h-3 w-3 rounded-full border border-white/20"
                style={{ background: hex }}
              />
              {label} {hex}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-mist">
          Type {blueprint.designPlan.typography.displayFont} /{" "}
          {blueprint.designPlan.typography.bodyFont} · spacing{" "}
          {blueprint.designPlan.spacing.sectionY} · buttons{" "}
          {blueprint.designPlan.buttons.strength}
        </p>
        <p className="mt-2 text-xs text-mist">
          {blueprint.designPlan.componentStyles.hero}
        </p>
      </Section>

      <Section title="Expected conversion improvements">
        <ul className="space-y-2">
          {blueprint.conversionImprovements.slice(0, 5).map((c) => (
            <li key={c.title}>
              <p className="text-sm text-fog">{c.title}</p>
              <p className="text-xs text-mist">{c.why}</p>
            </li>
          ))}
        </ul>
        {blueprint.strategyRecommendations[0] ? (
          <p className="mt-3 text-xs text-lime">
            Strategy: {blueprint.strategyRecommendations[0]}
          </p>
        ) : null}
      </Section>

      <Section title="Multi-agent debate">
        <div className="grid gap-2 sm:grid-cols-2">
          {blueprint.debate.opinions.map((o) => (
            <div
              key={o.persona}
              className="rounded-xl border border-[var(--line)] bg-ink/40 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wider text-lime">
                {o.persona}
              </p>
              <p className="mt-1 text-xs text-mist">{o.recommendation}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-fog">
          Manager: CTA {blueprint.debate.managerDecision.ctaStrength} ·{" "}
          {blueprint.debate.managerDecision.mobileNav}
        </p>
        <p className="mt-1 text-xs text-mist">
          {blueprint.debate.managerDecision.rationale}
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-ink-soft p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-mist">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
