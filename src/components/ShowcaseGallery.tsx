import Link from "next/link";
import { SHOWCASE_EXAMPLES } from "@/lib/showcase-examples";

function BrowserFrame({
  slug,
  title,
  category,
}: {
  slug: string;
  title: string;
  category: string;
}) {
  return (
    <article className="group flex flex-col">
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-ink-soft shadow-2xl transition group-hover:border-lime/30">
        <div className="flex items-center gap-1.5 border-b border-[var(--line)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-mist/40" />
          <span className="ml-2 truncate text-[10px] text-mist">
            magic.ai/examples/{slug}
          </span>
        </div>
        <div className="relative aspect-[16/10] bg-white">
          <iframe
            title={`Preview of ${title}`}
            src={`/examples/${slug}`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-lime">{category}</p>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-fog">
            {title}
          </h3>
        </div>
        <Link
          href={`/examples/${slug}`}
          target="_blank"
          className="shrink-0 text-xs text-mist underline-offset-2 hover:text-lime hover:underline"
        >
          Open full
        </Link>
      </div>
    </article>
  );
}

export function ShowcaseGallery() {
  return (
    <section id="examples" className="border-t border-[var(--line)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-lime">Real output</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Sites people actually generated
        </h2>
        <p className="mt-4 max-w-2xl text-mist">
          Every frame below is a structured site built by Magic AI — typed sections,
          real copy, DaisyUI / shadcn / Preline kits — not a stock template swap.
        </p>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-2">
          {SHOWCASE_EXAMPLES.map((ex) => (
            <BrowserFrame
              key={ex.slug}
              slug={ex.slug}
              title={ex.title}
              category={ex.category}
            />
          ))}
        </div>
        <p className="mt-12 text-center text-sm text-mist">
          Want the full gallery?{" "}
          <Link href="/templates" className="text-lime underline-offset-2 hover:underline">
            Browse all templates →
          </Link>
        </p>
      </div>
    </section>
  );
}
