"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CreativeProjectData, CreativeScript } from "@/lib/creative/schema";

type CreativeState = {
  id: string;
  title: string;
  prompt: string;
  status: string;
  referenceImageUrl?: string | null;
  outputUrl?: string | null;
  voiceoverUrl?: string | null;
  error?: string | null;
  data?: CreativeProjectData;
};

const STAGE_LABELS: Record<string, string> = {
  script: "Script & storyboard",
  stills: "Scene stills",
  animate: "Animate key scenes",
  voice: "AI voiceover",
  assembly: "Assemble preview",
  ready: "Ready",
};

const EXAMPLE_PROMPTS = [
  "Brooklyn bakery called Rye & Salt — sourdough, pastries, wholesale orders, warm rustic style",
  "Family dental clinic in Austin — cleanings, implants, insurance accepted, book online",
  "Portfolio for a freelance product designer — case studies, about, contact",
];

type Props = {
  creativeId?: string;
  initialPrompt?: string;
};

export function CreativeStudio({ creativeId, initialPrompt = "" }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [creative, setCreative] = useState<CreativeState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadCreative = useCallback(async (id: string) => {
    const res = await fetch(`/api/creative/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setCreative(data.creative);
    setPrompt(data.creative.prompt);
    if (data.creative.referenceImageUrl) {
      setReferenceUrl(data.creative.referenceImageUrl);
    }
  }, []);

  useEffect(() => {
    if (creativeId) loadCreative(creativeId);
  }, [creativeId, loadCreative]);

  async function uploadReference(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setReferenceUrl(data.asset.url);
    } catch {
      setError("Could not upload reference image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate(e?: FormEvent) {
    e?.preventDefault();
    if (!prompt.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/creative/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          referenceImageUrl: referenceUrl || undefined,
          creativeId: creative?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setCreative(data.creative);
      if (!creativeId && data.creative.id) {
        router.replace(`/studio/${data.creative.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const script = creative?.data?.script as CreativeScript | undefined;
  const stages = creative?.data?.stages || [];

  return (
    <div className="flex min-h-screen flex-col bg-ink text-fog lg:flex-row">
      <aside className="flex w-full flex-col border-b border-[var(--line)] lg:w-[420px] lg:border-b-0 lg:border-r">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-brand)] text-2xl italic text-fog"
          >
            magic ai
          </Link>
          <p className="mt-1 text-xs uppercase tracking-wider text-lime">
            Creative Studio
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Promo video pipeline
          </h1>
          <p className="mt-2 text-sm text-mist">
            Reference image → script → stills → animate 2–4 key scenes →
            voiceover → assembled preview.
          </p>

          <form onSubmit={handleGenerate} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-mist">
                Business brief
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-ink-soft px-4 py-3 text-sm text-fog outline-none focus:border-lime/50"
                placeholder="Describe your business for the promo video…"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-mist">
                Reference image (optional)
              </label>
              <p className="mt-1 text-xs text-mist/80">
                Pinterest-style brand reference — we analyze palette, lighting, and backdrop.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadReference(file);
                }}
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs text-mist hover:border-lime/40 hover:text-fog"
                >
                  {uploading ? "Uploading…" : "Upload reference"}
                </button>
                {referenceUrl ? (
                  <img
                    src={referenceUrl}
                    alt="Reference"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] text-mist hover:border-lime/40"
                >
                  {ex.split("—")[0].trim()}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={busy || !prompt.trim()}
              className="w-full rounded-full bg-lime py-3 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {busy ? "Generating…" : "Generate promo video"}
            </button>

            {error ? (
              <p className="text-sm text-coral">{error}</p>
            ) : null}
          </form>

          {stages.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-xs uppercase tracking-wider text-mist">Pipeline</h2>
              <ul className="mt-3 space-y-2">
                {stages.map((stage) => (
                  <li
                    key={stage.stage}
                    className="flex items-start gap-3 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    <span
                      className={
                        stage.status === "done"
                          ? "text-lime"
                          : stage.status === "running"
                            ? "text-coral animate-pulse"
                            : stage.status === "skipped"
                              ? "text-mist"
                              : "text-mist/50"
                      }
                    >
                      {stage.status === "done"
                        ? "✓"
                        : stage.status === "running"
                          ? "…"
                          : stage.status === "skipped"
                            ? "–"
                            : "○"}
                    </span>
                    <div>
                      <p className="font-medium text-fog">
                        {STAGE_LABELS[stage.stage] || stage.stage}
                      </p>
                      {stage.message ? (
                        <p className="text-xs text-mist">{stage.message}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {creative?.data?.capabilities ? (
            <div className="mt-6 rounded-lg border border-[var(--line)] bg-ink-soft/50 p-3 text-xs text-mist">
              <p className="font-medium text-fog">API integrations</p>
              <ul className="mt-2 space-y-1">
                <li>OpenRouter (script): {creative.data.capabilities.openrouter ? "✓" : "—"}</li>
                <li>Replicate (Flux + video): {creative.data.capabilities.replicate ? "✓" : "add REPLICATE_API_TOKEN"}</li>
                <li>ElevenLabs (voice): {creative.data.capabilities.elevenlabs ? "✓" : "optional"}</li>
                <li>Cartesia (voice): {creative.data.capabilities.cartesia ? "✓" : "optional"}</li>
              </ul>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="border-b border-[var(--line)] px-5 py-3 text-sm text-mist">
          {creative?.title || "Preview"}
          {creative?.status === "ready" ? (
            <span className="ml-2 text-lime">· Ready</span>
          ) : busy ? (
            <span className="ml-2 text-coral">· Generating…</span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="flex-1 bg-black">
            {creative?.outputUrl ? (
              <iframe
                title="Creative preview"
                src={creative.outputUrl}
                className="h-full min-h-[320px] w-full border-0 lg:min-h-[480px]"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center text-mist lg:min-h-[480px]">
                {busy
                  ? "Building your promo video…"
                  : "Generate a promo to see the preview player"}
              </div>
            )}
          </div>

          {script?.scenes?.length ? (
            <div className="w-full border-t border-[var(--line)] lg:w-72 lg:border-l lg:border-t-0">
              <div className="px-4 py-3 text-xs uppercase tracking-wider text-mist">
                Storyboard ({script.scenes.length} scenes)
              </div>
              <ul className="max-h-[400px] overflow-y-auto px-3 pb-4 lg:max-h-none">
                {script.scenes.map((scene) => (
                  <li
                    key={scene.id}
                    className="mb-3 overflow-hidden rounded-lg border border-[var(--line)]"
                  >
                    {scene.stillUrl ? (
                      <img
                        src={scene.stillUrl}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-video bg-ink-soft" />
                    )}
                    <div className="p-2">
                      <p className="text-[10px] uppercase text-lime">
                        Scene {scene.sceneNumber}
                        {scene.animate ? " · animated" : ""}
                        {scene.videoUrl ? " · video" : ""}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-mist">
                        {scene.narration}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {creative?.voiceoverUrl ? (
                <div className="border-t border-[var(--line)] px-4 py-3">
                  <p className="text-xs uppercase text-mist">Voiceover</p>
                  <audio controls src={creative.voiceoverUrl} className="mt-2 w-full" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
