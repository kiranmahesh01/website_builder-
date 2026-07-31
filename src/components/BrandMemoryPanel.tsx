"use client";

/** Inline shape so the builder client never pulls server plan modules. */
export type BrandKitView = {
  businessName: string;
  tagline: string;
  description: string;
  logoIdea: string;
  colors: {
    primary: string;
    accent: string;
    surface: string;
    text: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  audience: string;
  socialPosts: string[];
};

export function BrandMemoryPanel({
  brandKit,
  seo,
  theme,
}: {
  brandKit: BrandKitView | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string[] | null;
  } | null;
  theme?: string | null;
}) {
  if (!brandKit && !seo) return null;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-ink-soft/80 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
        Brand Memory
      </p>
      {brandKit ? (
        <div className="mt-2 space-y-2 text-[11px] leading-snug">
          <p className="font-semibold text-fog">{brandKit.businessName}</p>
          <p className="text-lime">{brandKit.tagline}</p>
          <p className="text-mist">{brandKit.description}</p>
          <p className="text-mist">
            <span className="text-fog">Logo idea — </span>
            {brandKit.logoIdea}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(brandKit.colors).map(([key, hex]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-mist"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: hex }}
                  aria-hidden
                />
                {key}
              </span>
            ))}
          </div>
          <p className="text-mist">
            Fonts: {brandKit.fonts.display} / {brandKit.fonts.body}
            {theme ? ` · theme ${theme}` : ""}
          </p>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-mist">
              Social ideas
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-mist">
              {brandKit.socialPosts.map((post) => (
                <li key={post}>{post}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {seo?.title || seo?.description ? (
        <div className="mt-3 border-t border-[var(--line)] pt-2 text-[11px]">
          <p className="text-[10px] uppercase tracking-[0.14em] text-mist">
            SEO
          </p>
          {seo.title ? (
            <p className="mt-1 text-fog">
              <span className="text-mist">Title — </span>
              {seo.title}
            </p>
          ) : null}
          {seo.description ? (
            <p className="mt-1 text-mist">{seo.description}</p>
          ) : null}
          {seo.keywords?.length ? (
            <p className="mt-1 text-mist">
              Keywords: {seo.keywords.slice(0, 6).join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PublishFlowPanel({
  published,
  publishUrl,
  customDomain,
  busy,
  onPublish,
  scoreOk,
}: {
  published: boolean;
  publishUrl: string | null;
  customDomain?: string | null;
  busy: boolean;
  onPublish: () => void;
  scoreOk: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-ink-soft/80 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
        Deploy
      </p>
      <ol className="mt-2 space-y-1 text-[11px] text-mist">
        <li className="text-lime">1. Generate ✓</li>
        <li className="text-lime">2. Preview ✓</li>
        <li className={scoreOk ? "text-lime" : "text-coral"}>
          3. Quality {scoreOk ? "ready" : "improve first"}
        </li>
        <li className={published ? "text-lime" : ""}>
          4. Publish {published ? "✓" : "→"}
        </li>
        <li className={customDomain ? "text-lime" : ""}>
          5. Domain {customDomain || "(optional in Visual edit)"}
        </li>
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPublish}
          disabled={busy}
          className="rounded-full bg-lime px-3 py-1.5 text-[11px] font-semibold text-ink disabled:opacity-40"
        >
          {published ? "Republish" : "Publish"}
        </button>
        {publishUrl ? (
          <a
            href={publishUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-lime/40 px-3 py-1.5 text-[11px] text-lime"
          >
            View live
          </a>
        ) : null}
      </div>
    </div>
  );
}
