"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Website } from "@/lib/schema";
import { deserializeSiteData } from "@/lib/site-data";

type ProjectLike = {
  id: string;
  html: string;
  data?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
  logoUrl?: string | null;
  customDomain?: string | null;
  title?: string;
};

type Props = {
  project: ProjectLike;
  onUpdated: (project: ProjectLike) => void;
  onClose: () => void;
};

export function VisualEditor({ project, onUpdated, onClose }: Props) {
  const initial = useMemo(
    () => deserializeSiteData(project.data),
    [project.data],
  );
  const [brand, setBrand] = useState(initial?.brand || project.title || "");
  const [headline, setHeadline] = useState(() => {
    const hero = initial?.pages[0]?.sections.find((s) => s.type === "hero");
    return hero && hero.type === "hero" ? hero.headline : "";
  });
  const [subheadline, setSubheadline] = useState(() => {
    const hero = initial?.pages[0]?.sections.find((s) => s.type === "hero");
    return hero && hero.type === "hero" ? hero.subheadline : "";
  });
  const [seoTitle, setSeoTitle] = useState(
    project.seoTitle || initial?.seo?.title || "",
  );
  const [seoDescription, setSeoDescription] = useState(
    project.seoDescription || initial?.seo?.description || "",
  );
  const [logoUrl, setLogoUrl] = useState(
    project.logoUrl || initial?.logoUrl || "",
  );
  const [customDomain, setCustomDomain] = useState(project.customDomain || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState<
    { id: string; label: string | null; createdAt: string }[]
  >([]);

  async function loadVersions() {
    const res = await fetch(`/api/projects/${project.id}/versions`);
    if (!res.ok) return;
    const data = await res.json();
    setVersions(data.versions || []);
  }

  async function onUpload(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setLogoUrl(data.asset.url);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!initial) {
      setError("This project has no structured data to edit yet.");
      return;
    }
    setBusy(true);
    setError("");
    const next: Website = structuredClone(initial);
    next.brand = brand || next.brand;
    next.logoUrl = logoUrl || undefined;
    next.seo = {
      ...(next.seo || {}),
      title: seoTitle || next.brand,
      description: seoDescription || next.seo?.description,
    };
    const page = next.pages[0];
    if (page) {
      next.pages[0] = {
        ...page,
        sections: page.sections.map((section) => {
          if (section.type !== "hero") return section;
          return {
            ...section,
            headline: headline || section.headline,
            subheadline: subheadline || section.subheadline,
            brand: brand || section.brand,
          };
        }),
      };
    }

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: next,
        seoTitle,
        seoDescription,
        logoUrl,
        customDomain: customDomain || null,
        title: brand || project.title,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    onUpdated(data.project);
    await loadVersions();
  }

  async function restore(versionId: string) {
    setBusy(true);
    const res = await fetch(`/api/projects/${project.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Restore failed");
      return;
    }
    onUpdated({ ...project, ...data.project });
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-[var(--line)] bg-ink-soft lg:w-[340px]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mist">Visual edit</p>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Site details
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-mist"
        >
          Close
        </button>
      </div>
      <form onSubmit={onSave} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-mist">Brand</span>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-ink px-3 py-2 outline-none focus:border-lime/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist">Hero headline</span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-ink px-3 py-2 outline-none focus:border-lime/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist">Hero supporting line</span>
          <textarea
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--line)] bg-ink px-3 py-2 outline-none focus:border-lime/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist">SEO title</span>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-ink px-3 py-2 outline-none focus:border-lime/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist">SEO description</span>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--line)] bg-ink px-3 py-2 outline-none focus:border-lime/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist">Logo URL</span>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-ink px-3 py-2 outline-none focus:border-lime/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist">Upload logo / asset</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
            className="w-full text-xs text-mist"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist">Custom domain</span>
          <input
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="shop.example.com"
            className="w-full rounded-xl border border-[var(--line)] bg-ink px-3 py-2 outline-none focus:border-lime/40"
          />
          <span className="mt-1 block text-[11px] text-mist">
            After publish, open /domain/your.domain — point DNS/proxy there.
          </span>
        </label>
        {error ? <p className="text-xs text-coral">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-lime py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save visual edits"}
        </button>
        <button
          type="button"
          onClick={() => void loadVersions()}
          className="w-full rounded-full border border-[var(--line)] py-2 text-xs text-mist"
        >
          Load version history
        </button>
        {versions.length ? (
          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-xs"
              >
                <span>
                  {v.label || "Version"}
                  <span className="block text-mist">
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void restore(v.id)}
                  className="rounded-full bg-fog px-2 py-1 text-[11px] font-semibold text-ink"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </aside>
  );
}
