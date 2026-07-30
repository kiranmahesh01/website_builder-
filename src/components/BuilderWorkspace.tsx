"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VisualEditor } from "@/components/VisualEditor";

type Provider =
  | "openai"
  | "gemini"
  | "bytez"
  | "openrouter"
  | "openrouter-best"
  | "demo";

function shortModelName(model?: string): string {
  if (!model) return "";
  const id = model.split("/").pop() || model;
  return id;
}

function providerLabel(
  p: Provider | string,
  models?: Partial<Record<string, string>>,
): string {
  if (p === "openai") {
    const m = shortModelName(models?.openai);
    return m ? `OpenAI · ${m}` : "OpenAI";
  }
  if (p === "gemini") {
    const m = shortModelName(models?.gemini);
    return m ? `Gemini · ${m}` : "Gemini";
  }
  if (p === "bytez") {
    const m = shortModelName(models?.bytez);
    return m ? `Bytez · ${m}` : "Bytez";
  }
  if (p === "openrouter") {
    const m = shortModelName(models?.openrouter);
    return m ? `OpenRouter · ${m}` : "OpenRouter";
  }
  if (p === "openrouter-best") {
    return "OpenRouter · Race (free ×3)";
  }
  if (p === "demo") return "Demo (no API key)";
  return p;
}

type Message = {
  id?: string;
  role: string;
  content: string;
};

type ProjectState = {
  id: string;
  title: string;
  html: string;
  data?: unknown;
  provider: string;
  published: boolean;
  slug: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  logoUrl?: string | null;
  customDomain?: string | null;
  viewCount?: number;
};

type Props = {
  initialPrompt?: string;
  projectId?: string;
};

export function BuilderWorkspace({ initialPrompt = "", projectId }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState<Provider>("demo");
  const [models, setModels] = useState<Partial<Record<string, string>>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showEditor, setShowEditor] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);

  const previewSrcDoc = useMemo(() => project?.html || "", [project?.html]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    async function boot() {
      try {
        const providersRes = await fetch("/api/providers");
        const providersData = await providersRes.json();
        const list = (providersData.providers || []) as Provider[];
        setProviders(list);
        if (providersData.models) {
          setModels(providersData.models);
        }
        if (list.length) {
          const preferred = providersData.defaults?.provider;
          setProvider(
            list.includes(preferred) ? preferred : list[0],
          );
        }

        if (projectId) {
          const res = await fetch(`/api/projects/${projectId}`);
          if (res.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(`/builder/${projectId}`)}`,
            );
            return;
          }
          if (!res.ok) {
            setError("Could not load project.");
            return;
          }
          const data = await res.json();
          setProject(data.project);
          setMessages(data.messages || []);
          setProvider(data.project.provider || list[0] || "demo");
          if (data.project.published && data.project.slug) {
            setPublishUrl(`/s/${data.project.slug}`);
          }
          if (data.providers?.length) setProviders(data.providers);
        }
      } catch {
        setError("Failed to initialize builder.");
      }
    }
    boot();
  }, [projectId, router]);

  useEffect(() => {
    if (!projectId && initialPrompt && !autoStarted.current && providers.length >= 0) {
      // wait a tick for providers fetch; start when prompt present and not already generating
      if (autoStarted.current) return;
      const t = setTimeout(() => {
        if (!autoStarted.current && initialPrompt.trim()) {
          autoStarted.current = true;
          void generate(initialPrompt);
        }
      }, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, projectId, providers]);

  async function ensureAuth(callback: string): Promise<boolean> {
    const sessionProbe = await fetch("/api/projects");
    if (sessionProbe.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
      return false;
    }
    return true;
  }

  async function generate(brief: string) {
    const value = brief.trim();
    if (!value || busy) return;

    const ok = await ensureAuth(
      `/builder?prompt=${encodeURIComponent(value)}`,
    );
    if (!ok) return;

    setBusy(true);
    setError("");
    setStatus(
      provider === "openrouter-best"
        ? "Racing 3 free models — first valid site wins…"
        : "Magic AI is designing your site…",
    );
    setMessages((prev) => [
      ...prev,
      { role: "user", content: value },
      { role: "assistant", content: "Generating your website…" },
    ]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: value,
          provider,
          projectId: project?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setProject(data.project);
      setProviders(data.providers || providers);
      setMessages([
        { role: "user", content: value },
        {
          role: "assistant",
          content:
            "Generated your website. Preview it on the right — ask me to refine anything.",
        },
      ]);
      if (!projectId) {
        router.replace(`/builder/${data.project.id}`);
      }
    } catch {
      setError("Generation failed. Check your API keys and try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  async function onChat(e: FormEvent) {
    e.preventDefault();
    const value = chatInput.trim();
    if (!value || busy) return;

    if (!project?.html) {
      await generate(value);
      setChatInput("");
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Applying your changes…");
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: value }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          message: value,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Refine failed");
        return;
      }
      setProject(data.project);
      setMessages(data.messages || []);
    } catch {
      setError("Could not refine the site.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  async function onPublish() {
    if (!project?.id || busy) return;
    setBusy(true);
    setError("");
    setStatus("Publishing…");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          customDomain: project.customDomain || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Publish failed");
        return;
      }
      setPublishUrl(data.url);
      setProject((p) =>
        p
          ? {
              ...p,
              published: true,
              slug: data.slug,
              customDomain: data.customDomain ?? p.customDomain,
            }
          : p,
      );
      const domainNote = data.domainUrl
        ? ` Custom domain preview: ${data.domainUrl}`
        : "";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Published! Your site is live at ${data.url}.${domainNote}`,
        },
      ]);
    } catch {
      setError("Publish failed.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-ink text-fog">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-brand)] text-2xl italic"
          >
            magic ai
          </Link>
          <Link href="/dashboard" className="text-xs text-mist hover:text-fog">
            Dashboard
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {providers.length > 0 ? (
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="rounded-full border border-[var(--line)] bg-ink-soft px-3 py-1.5 text-xs outline-none"
              disabled={busy}
            >
              {providers.map((p) => (
                <option key={p} value={p}>
                  {providerLabel(p, models)}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="max-w-[14rem] truncate text-xs text-coral"
              title="Demo should always be available. Restart the server if this persists."
            >
              No providers — restart the server
            </span>
          )}
          <div className="hidden rounded-full border border-[var(--line)] p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`rounded-full px-3 py-1 text-xs ${device === "desktop" ? "bg-fog text-ink" : "text-mist"}`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`rounded-full px-3 py-1 text-xs ${device === "mobile" ? "bg-fog text-ink" : "text-mist"}`}
            >
              Mobile
            </button>
          </div>
          {publishUrl ? (
            <Link
              href={publishUrl}
              target="_blank"
              className="rounded-full border border-lime/40 px-3 py-1.5 text-xs text-lime hover:bg-lime/10"
            >
              View live
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            disabled={!project?.data}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-mist disabled:opacity-40"
          >
            {showEditor ? "Hide editor" : "Visual edit"}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={!project?.html || busy}
            className="rounded-full bg-lime px-4 py-1.5 text-xs font-semibold text-ink disabled:opacity-40"
          >
            {project?.published ? "Republish" : "Publish"}
          </button>
        </div>
      </header>

      <div
        className={`grid min-h-0 flex-1 ${
          showEditor && project
            ? "lg:grid-cols-[340px_1fr_340px]"
            : "lg:grid-cols-[380px_1fr]"
        }`}
      >
        <aside className="flex min-h-0 flex-col border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-mist">
              Chat
            </p>
            <h1 className="mt-1 truncate font-[family-name:var(--font-display)] text-lg font-bold">
              {project?.title || "New website"}
            </h1>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-mist">
                Describe the site you want. Magic AI generates structured
                sections (schema → renderer), then you refine and publish.
              </div>
            ) : null}
            {messages.map((m, i) => (
              <div
                key={m.id || `${m.role}-${i}`}
                className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-6 bg-lime/15 text-fog"
                    : "mr-4 bg-ink-soft text-mist"
                }`}
              >
                {m.content}
              </div>
            ))}
            {status ? (
              <p className="text-xs text-lime animate-pulse">{status}</p>
            ) : null}
            {error ? <p className="text-xs text-coral">{error}</p> : null}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={onChat}
            className="border-t border-[var(--line)] p-3"
          >
            {!project?.html ? (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="What kind of website do you want to build?"
                className="mb-2 w-full resize-none rounded-2xl border border-[var(--line)] bg-ink-soft px-3 py-2 text-sm outline-none focus:border-lime/40"
              />
            ) : null}
            <div className="flex gap-2">
              <input
                value={project?.html ? chatInput : ""}
                onChange={(e) =>
                  project?.html
                    ? setChatInput(e.target.value)
                    : setPrompt(e.target.value)
                }
                placeholder={
                  project?.html
                    ? "Make the hero darker and add a pricing section…"
                    : "Or type a short brief and hit Generate"
                }
                disabled={busy}
                className={`min-w-0 flex-1 rounded-full border border-[var(--line)] bg-ink-soft px-4 py-2.5 text-sm outline-none focus:border-lime/40 ${!project?.html ? "hidden" : ""}`}
              />
              <button
                type={project?.html ? "submit" : "button"}
                onClick={
                  project?.html
                    ? undefined
                    : () => {
                        void generate(prompt || chatInput || initialPrompt);
                      }
                }
                disabled={busy}
                className="rounded-full bg-fog px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {project?.html ? "Send" : "Generate"}
              </button>
            </div>
          </form>
        </aside>

        <section className="relative min-h-0 bg-[#0c0d10] p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-mist">
            <span>Live preview</span>
            <span>{busy ? "Working…" : project?.html ? "Ready" : "Waiting"}</span>
          </div>
          <div className="flex h-[calc(100%-1.75rem)] items-stretch justify-center">
            <div
              className={`overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-2xl transition-all ${
                device === "mobile" ? "w-[390px] max-w-full" : "w-full"
              }`}
            >
              {previewSrcDoc ? (
                <iframe
                  title="Website preview"
                  srcDoc={previewSrcDoc}
                  className="h-full min-h-[60vh] w-full bg-white lg:min-h-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,#1a1d24,transparent_55%),#0e1014] p-8 text-center lg:min-h-0">
                  <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
                    Your site will appear here
                  </p>
                  <p className="max-w-sm text-sm text-mist">
                    Chat a brief on the left. Magic AI builds a schema-driven
                    site (sections + theme), then renders it for preview.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
        {showEditor && project ? (
          <VisualEditor
            project={project}
            onClose={() => setShowEditor(false)}
            onUpdated={(p) => {
              setProject((prev) =>
                prev
                  ? {
                      ...prev,
                      ...p,
                      html: p.html || prev.html,
                      data: p.data ?? prev.data,
                    }
                  : prev,
              );
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
