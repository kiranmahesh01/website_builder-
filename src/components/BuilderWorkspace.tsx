"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentProgress } from "@/components/AgentProgress";
import {
  BrandMemoryPanel,
  PublishFlowPanel,
  type BrandKitView,
} from "@/components/BrandMemoryPanel";
import {
  DesignCritic,
  buildAutoImproveMessage,
  type CriticReview,
} from "@/components/DesignCritic";
import { PreviewShowcase } from "@/components/PreviewShowcase";
import { VisualEditor } from "@/components/VisualEditor";
import type { AgentEvent } from "@/lib/agents/types";
import { deserializeProjectData } from "@/lib/site-data";
import {
  BRIEF_EXAMPLE_CHIP,
  composeBrief,
  parseBriefChip,
  type BriefFields,
} from "@/lib/brief-compose";
import {
  DEFAULT_SITE_THEME,
  pickThemeFromBrief,
  type SiteThemeName,
} from "@/lib/themes";
import {
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_MODEL_OPTIONS,
} from "@/lib/llm/openrouter-models";
import { DEFAULT_NVIDIA_MODEL } from "@/lib/llm/nvidia-models";

type Message = {
  id?: string;
  role: string;
  content: string;
};

type ModelOption = {
  id: string;
  label: string;
  role: string;
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
  initialTemplateId?: string;
  projectId?: string;
};

const EMPTY_BRIEF: BriefFields = {
  businessName: "",
  whatYouDo: "",
  city: "",
  vibe: "",
};

export function BuilderWorkspace({
  initialPrompt = "",
  initialTemplateId,
  projectId,
}: Props) {
  const router = useRouter();
  const [brief, setBrief] = useState<BriefFields>(EMPTY_BRIEF);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [bootError, setBootError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [siteTheme, setSiteTheme] = useState<SiteThemeName>(DEFAULT_SITE_THEME);
  const [llmProvider, setLlmProvider] = useState("openrouter");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([
    ...OPENROUTER_MODEL_OPTIONS,
  ]);
  const [llmReady, setLlmReady] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [criticReview, setCriticReview] = useState<CriticReview | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKitView | null>(null);
  const [seoInfo, setSeoInfo] = useState<{
    title?: string | null;
    description?: string | null;
    keywords?: string[] | null;
  } | null>(null);
  const [templateId] = useState(initialTemplateId || "");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("magic-brand-kit");
      if (raw) {
        setBrandKit(JSON.parse(raw) as BrandKitView);
        sessionStorage.removeItem("magic-brand-kit");
      }
    } catch {
      // ignore
    }
  }, []);

  const composedBrief = useMemo(() => composeBrief(brief), [brief]);
  const previewSrcDoc = useMemo(() => project?.html || "", [project?.html]);
  const selectedModelRole = useMemo(
    () =>
      modelOptions.find((m) => m.id === selectedModel)?.role ||
      (llmProvider === "nvidia"
        ? "NVIDIA NIM models"
        : "OpenRouter free models"),
    [modelOptions, selectedModel, llmProvider],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, agentEvents]);

  useEffect(() => {
    if (initialPrompt.trim()) {
      setBrief(parseBriefChip(initialPrompt));
    }
  }, [initialPrompt]);

  useEffect(() => {
    async function boot() {
      try {
        setBootError("");
        const providersRes = await fetch("/api/providers");
        if (!providersRes.ok) {
          setBootError("Could not connect to generation. Try again in a moment.");
          return;
        }
        const providersData = (await providersRes.json()) as {
          defaults?: { provider?: string; model?: string };
          openrouterOptions?: ModelOption[];
          nvidiaOptions?: ModelOption[];
        };
        const provider = providersData.defaults?.provider || "openrouter";
        const defaultModel =
          providersData.defaults?.model ||
          (provider === "nvidia" ? DEFAULT_NVIDIA_MODEL : DEFAULT_OPENROUTER_MODEL);
        setLlmProvider(provider);
        if (provider === "nvidia") {
          const options =
            providersData.nvidiaOptions && providersData.nvidiaOptions.length > 0
              ? providersData.nvidiaOptions
              : [
                  {
                    id: defaultModel,
                    label: "Auto (NVIDIA)",
                    role: "Default — NVIDIA NIM primary + fallbacks",
                  },
                ];
          setModelOptions(options);
          setSelectedModel(defaultModel);
        } else {
          setModelOptions(
            providersData.openrouterOptions &&
              providersData.openrouterOptions.length > 0
              ? providersData.openrouterOptions
              : [...OPENROUTER_MODEL_OPTIONS],
          );
          setSelectedModel(defaultModel);
        }
        setLlmReady(true);

        if (projectId) {
          const res = await fetch(`/api/projects/${projectId}`);
          if (res.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(`/builder/${projectId}`)}`,
            );
            return;
          }
          if (!res.ok) {
            setBootError("Could not load this project.");
            return;
          }
          const data = await res.json();
          setProject(data.project);
          setMessages(data.messages || []);
          if (data.project.published && data.project.slug) {
            setPublishUrl(`/s/${data.project.slug}`);
          }
          const site = deserializeProjectData(data.project.data);
          if (site?.brandKit) setBrandKit(site.brandKit);
          if (site?.spec.seo || data.project.seoTitle) {
            setSeoInfo({
              title: data.project.seoTitle || site?.spec.seo?.title,
              description:
                data.project.seoDescription || site?.spec.seo?.description,
              keywords: site?.spec.seo?.keywords,
            });
          }
        }
      } catch {
        setBootError("Something went wrong loading the builder. Please refresh.");
      }
    }
    boot();
  }, [projectId, router]);

  useEffect(() => {
    if (!llmReady || projectId || !initialPrompt.trim() || autoStarted.current) {
      return;
    }
    const t = setTimeout(() => {
      if (!autoStarted.current && initialPrompt.trim()) {
        autoStarted.current = true;
        void generate(initialPrompt);
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, projectId, llmReady, llmProvider, selectedModel]);

  async function ensureAuth(callback: string): Promise<boolean> {
    const sessionProbe = await fetch("/api/projects");
    if (sessionProbe.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
      return false;
    }
    return true;
  }

  async function generate(briefText: string) {
    const value = briefText.trim();
    if (!value || busy) return;

    const theme = pickThemeFromBrief(value);
    setSiteTheme(theme);

    const authCallback = templateId
      ? `/builder?prompt=${encodeURIComponent(value)}&templateId=${encodeURIComponent(templateId)}`
      : `/builder?prompt=${encodeURIComponent(value)}`;
    const ok = await ensureAuth(authCallback);
    if (!ok) return;

    setBusy(true);
    setError("");
    setAgentEvents([]);
    setCriticReview(null);
    setStatus("Building your site from your brief…");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: value },
      { role: "assistant", content: "Generating your website…" },
    ]);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 110_000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: value,
          projectId: project?.id,
          theme,
          provider: llmProvider,
          model: selectedModel,
          templateId: templateId || undefined,
          brandKit: brandKit
            ? { ...brandKit, source: "deterministic" as const }
            : undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let data: {
        error?: string;
        project?: ProjectState;
        review?: CriticReview | null;
        events?: AgentEvent[];
        brandKit?: BrandKitView | null;
        seo?: {
          title?: string;
          description?: string;
          keywords?: string[];
        } | null;
      } = {};
      try {
        data = await res.json();
      } catch {
        setError(
          res.ok
            ? "Generation returned an invalid response."
            : `Generation failed (HTTP ${res.status}). Please try again.`,
        );
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      if (!res.ok) {
        setError(data.error || "Generation failed. Please try again.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      if (!data.project) {
        setError("Generation succeeded but no project was returned.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setProject(data.project);
      if (data.events?.length) setAgentEvents(data.events);
      if (data.review) setCriticReview(data.review);
      if (data.brandKit) setBrandKit(data.brandKit);
      if (data.seo) setSeoInfo(data.seo);
      else if (data.project.seoTitle || data.project.seoDescription) {
        setSeoInfo({
          title: data.project.seoTitle,
          description: data.project.seoDescription,
        });
      }
      const scoreNote =
        data.review != null
          ? ` Magic Score ${data.review.scores?.overall ?? data.review.score}/100 — use Auto fix or chat to polish.`
          : "";
      setMessages([
        { role: "user", content: value },
        {
          role: "assistant",
          content: `Your site is ready — preview on the right.${scoreNote}`,
        },
      ]);
      if (!projectId) {
        router.replace(`/builder/${data.project.id}`);
      }
    } catch (err) {
      const aborted =
        err instanceof DOMException && err.name === "AbortError";
      setError(
        aborted
          ? "That took too long. Try a shorter brief or try again."
          : "Network error. Check your connection and try again.",
      );
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  function onGenerateClick() {
    const value = composedBrief.trim();
    if (!value) {
      setError("Add at least a business name and what you do.");
      return;
    }
    void generate(value);
  }

  function applyExampleChip() {
    setBrief(parseBriefChip(BRIEF_EXAMPLE_CHIP));
    setError("");
  }

  /**
   * Streams the agent loop so the user sees each agent as it runs.
   * Returns false when the endpoint is unavailable, so the caller can fall back
   * to the non-streaming route.
   */
  async function refineStreaming(projectId: string, value: string) {
    const res = await fetch("/api/agent/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        message: value,
        provider: llmProvider,
        model: selectedModel,
      }),
    });

    const isStream = (res.headers.get("content-type") || "").includes("ndjson");
    if (!res.ok || !res.body || !isStream) return false;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let handled = false;

    const consume = (line: string) => {
      if (!line.trim()) return;
      let chunk: {
        type?: string;
        event?: AgentEvent;
        project?: ProjectState;
        messages?: Message[];
        review?: CriticReview;
        error?: string;
      };
      try {
        chunk = JSON.parse(line);
      } catch {
        return;
      }
      if (chunk.type === "event" && chunk.event) {
        const event = chunk.event;
        setAgentEvents((prev) => [...prev, event]);
        setStatus(event.message);
        return;
      }
      if (chunk.type === "result" && chunk.project) {
        setProject(chunk.project);
        setMessages(chunk.messages || []);
        if (chunk.review) setCriticReview(chunk.review);
        handled = true;
        return;
      }
      if (chunk.type === "error") {
        setError(chunk.error || "Could not apply that change. Try rephrasing.");
        handled = true;
      }
    };

    for (;;) {
      const { done, value: bytes } = await reader.read();
      if (done) break;
      buffer += decoder.decode(bytes, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(consume);
    }
    consume(buffer);

    return handled;
  }

  async function refineOnce(projectId: string, value: string) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        message: value,
        provider: llmProvider,
        model: selectedModel,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not apply that change. Try rephrasing.");
      return;
    }
    setProject(data.project);
    setMessages(data.messages || []);
  }

  async function runRefine(value: string) {
    if (!project?.html || !value.trim() || busy) return;
    const id = project.id;
    setBusy(true);
    setError("");
    setAgentEvents([]);
    setStatus("Applying your changes…");
    setMessages((prev) => [...prev, { role: "user", content: value }]);

    try {
      const streamed = await refineStreaming(id, value);
      if (!streamed) await refineOnce(id, value);
    } catch {
      setError("Could not apply that change. Please try again.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  async function onChat(e: FormEvent) {
    e.preventDefault();
    const value = chatInput.trim();
    if (!value || busy) return;

    if (value.length > 12_000) {
      setError(
        "Message is too long (max 12,000 characters). Split it into a shorter request.",
      );
      return;
    }

    if (!project?.html) {
      await generate(value);
      setChatInput("");
      return;
    }

    setChatInput("");
    await runRefine(value);
  }

  async function onAutoImprove() {
    if (!criticReview || !project?.html || busy) return;
    await runRefine(buildAutoImproveMessage(criticReview));
  }

  async function onExport(format: "html" | "react" | "astro" | "wordpress") {
    if (!project?.id || busy) return;
    setBusy(true);
    setError("");
    setStatus(`Exporting ${format}…`);
    try {
      const res = await fetch(`/api/projects/${project.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");

      const blob = new Blob([data.export.content], {
        type: data.export.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.export.filename;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(`Exported ${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(""), 2000);
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
        setError(data.error || "Publish failed. Please try again.");
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
      setError("Publish failed. Please try again.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  function updateBriefField<K extends keyof BriefFields>(key: K, value: string) {
    setBrief((prev) => ({ ...prev, [key]: value }));
    setError("");
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
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="max-w-[14rem] rounded-full border border-[var(--line)] bg-ink-soft px-3 py-1.5 text-xs outline-none"
            disabled={busy}
            title={
              llmProvider === "nvidia"
                ? "NVIDIA NIM model — falls back automatically if one fails"
                : "OpenRouter free model — falls back automatically if one fails"
            }
          >
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
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
          <div className="relative group">
            <button
              type="button"
              disabled={!project?.html || busy}
              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-mist disabled:opacity-40"
            >
              Export ↓
            </button>
            <div className="invisible absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-[var(--line)] bg-ink py-1 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
              {(["html", "react", "astro", "wordpress"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onExport(fmt)}
                  className="block w-full px-4 py-2 text-left text-xs text-mist hover:bg-ink-soft hover:text-fog"
                >
                  {fmt === "wordpress" ? "WordPress XML" : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
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

      {bootError ? (
        <div className="flex items-center justify-between gap-3 border-b border-coral/30 bg-coral/10 px-4 py-2 text-xs text-coral">
          <span>{bootError}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-coral/40 px-3 py-1 hover:bg-coral/10"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div
        className={`grid min-h-0 flex-1 ${
          showEditor && project
            ? "lg:grid-cols-[340px_1fr_340px]"
            : "lg:grid-cols-[380px_1fr]"
        }`}
      >
        <aside className="flex min-h-0 flex-col border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-mist">Chat</p>
            <h1 className="mt-1 truncate font-[family-name:var(--font-display)] text-lg font-bold">
              {project?.title || "New website"}
            </h1>
            <p className="mt-1 text-[11px] text-mist">{selectedModelRole}</p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !project?.html ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm">
                <p className="text-fog">Tell us about your business</p>
                <label className="block">
                  <span className="text-xs text-mist">Business name</span>
                  <input
                    value={brief.businessName}
                    onChange={(e) => updateBriefField("businessName", e.target.value)}
                    placeholder="Petal & Stem"
                    className="mt-1 w-full rounded-xl border border-[var(--line)] bg-ink-soft px-3 py-2 text-sm outline-none focus:border-lime/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-mist">What you do</span>
                  <input
                    value={brief.whatYouDo}
                    onChange={(e) => updateBriefField("whatYouDo", e.target.value)}
                    placeholder="orchid boutique with online shop and pickup"
                    className="mt-1 w-full rounded-xl border border-[var(--line)] bg-ink-soft px-3 py-2 text-sm outline-none focus:border-lime/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-mist">City</span>
                  <input
                    value={brief.city}
                    onChange={(e) => updateBriefField("city", e.target.value)}
                    placeholder="Brooklyn"
                    className="mt-1 w-full rounded-xl border border-[var(--line)] bg-ink-soft px-3 py-2 text-sm outline-none focus:border-lime/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-mist">Vibe</span>
                  <input
                    value={brief.vibe}
                    onChange={(e) => updateBriefField("vibe", e.target.value)}
                    placeholder="warm editorial, green accents"
                    className="mt-1 w-full rounded-xl border border-[var(--line)] bg-ink-soft px-3 py-2 text-sm outline-none focus:border-lime/40"
                  />
                </label>
                <button
                  type="button"
                  onClick={applyExampleChip}
                  className="text-left text-xs text-lime underline-offset-2 hover:underline"
                >
                  Try example: {BRIEF_EXAMPLE_CHIP}
                </button>
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
            <AgentProgress events={agentEvents} busy={busy} />
            {project?.html ? (
              <>
                <DesignCritic
                  review={criticReview}
                  busy={busy}
                  onAutoImprove={() => void onAutoImprove()}
                />
                <BrandMemoryPanel
                  brandKit={brandKit}
                  seo={seoInfo}
                  theme={siteTheme}
                />
                <PublishFlowPanel
                  published={Boolean(project.published)}
                  publishUrl={publishUrl}
                  customDomain={project.customDomain}
                  busy={busy}
                  onPublish={() => void onPublish()}
                  scoreOk={
                    !criticReview ||
                    (criticReview.scores?.overall ?? criticReview.score) >= 70
                  }
                />
              </>
            ) : null}
            {status ? (
              <p className="animate-pulse text-xs text-lime">{status}</p>
            ) : null}
            {error ? <p className="text-xs text-coral">{error}</p> : null}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={onChat} className="border-t border-[var(--line)] p-3">
            {project?.html ? (
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Make the hero darker and add a pricing section…"
                  disabled={busy}
                  className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-ink-soft px-4 py-2.5 text-sm outline-none focus:border-lime/40"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-fog px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onGenerateClick}
                disabled={busy || !composedBrief.trim()}
                className="w-full rounded-full bg-fog py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Generate site
              </button>
            )}
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
                <PreviewShowcase />
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
