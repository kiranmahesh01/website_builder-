"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { BrandKit } from "@/lib/create/brand-kit";
import {
  EMPTY_CREATE_ANSWERS,
  INDUSTRIES,
  STYLES,
  WEBSITE_TYPES,
  composeStructuredBrief,
  seedAnswersFromPrompt,
  type CreateWizardAnswers,
  type StyleId,
  type WebsiteTypeId,
} from "@/lib/create/brief";
import {
  applyConversationAnswer,
  conversationQuestions,
  openingMessage,
} from "@/lib/create/conversation";
import { pickThemeFromBrief } from "@/lib/themes";

type PlanTemplateCard = {
  id: string;
  name: string;
  industry: string;
  style: string;
  category: string;
  score: number;
  why: string;
  sections: string[];
};

const STEPS = [
  "Chat",
  "Plan",
  "Template",
  "Generate",
] as const;

type PlanResponse = {
  industry: string;
  websiteType: string;
  pages: string[];
  design: {
    style: string;
    theme: string;
    tokens: Record<string, string>;
    confidence: string;
  };
  sections: string[];
  components: string[];
  summary: string;
  steps: string[];
  designScorePreview: number;
  templates: PlanTemplateCard[];
  browseTemplates?: PlanTemplateCard[];
  brandKit?: BrandKit;
  error?: string;
};

type ChatMsg = { role: "assistant" | "user"; content: string };

const BROWSE_TABS = [
  { id: "matched", label: "Best match" },
  { id: "business", label: "Business" },
  { id: "store", label: "Store" },
  { id: "professional", label: "Professional" },
  { id: "technology", label: "Technology" },
] as const;

function syncStepQuery(step: number) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("step", String(step + 1));
  window.history.replaceState({}, "", url.toString());
}

export function CreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"chat" | "form">("chat");
  const [answers, setAnswers] = useState<CreateWizardAnswers>(EMPTY_CREATE_ANSWERS);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [browseTab, setBrowseTab] = useState<(typeof BROWSE_TABS)[number]["id"]>("matched");
  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "assistant", content: openingMessage() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [shotBusy, setShotBusy] = useState(false);
  const [shotMsg, setShotMsg] = useState("");
  const [visionOk, setVisionOk] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const questions = useMemo(() => conversationQuestions(), []);
  const brief = useMemo(() => composeStructuredBrief(answers), [answers]);
  const currentQ = questions[qIndex];

  useEffect(() => {
    if (seeded) return;
    const prompt = searchParams.get("prompt") || "";
    const stepParam = Number(searchParams.get("step") || "1");
    if (prompt.trim()) {
      setAnswers((prev) => ({
        ...prev,
        ...seedAnswersFromPrompt(prompt),
      }));
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Got your starting idea: “${prompt.trim()}”. I’ll confirm a few details.`,
        },
        {
          role: "assistant",
          content: questions[0]?.prompt || "What kind of website?",
        },
      ]);
    } else {
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: questions[0]?.prompt || "What kind of website?" },
      ]);
    }
    if (stepParam >= 1 && stepParam <= STEPS.length) {
      setStep(stepParam - 1);
    }
    setSeeded(true);
    void fetch("/api/agent/screenshot")
      .then((r) => r.json())
      .then((d: { visionAvailable?: boolean }) =>
        setVisionOk(Boolean(d.visionAvailable)),
      )
      .catch(() => setVisionOk(false));
  }, [searchParams, seeded, questions]);

  useEffect(() => {
    if (!seeded) return;
    syncStepQuery(step);
  }, [step, seeded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, step]);

  function patch<K extends keyof CreateWizardAnswers>(
    key: K,
    value: CreateWizardAnswers[K],
  ) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function loadPlan(
    templateId?: string | null,
    browseCategory?: string | null,
  ) {
    setPlanBusy(true);
    setPlanError("");
    try {
      const res = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: brief,
          websiteType: answers.websiteType,
          templateId: templateId || undefined,
          browseCategory:
            browseCategory && browseCategory !== "matched"
              ? browseCategory
              : undefined,
        }),
      });
      const data = (await res.json()) as PlanResponse;
      if (!res.ok) {
        setPlanError(data.error || "Could not build a plan. Try again.");
        return null;
      }
      setPlan(data);
      if (data.brandKit) setBrandKit(data.brandKit);
      if (!selectedTemplateId && data.templates[0]) {
        setSelectedTemplateId(data.templates[0].id);
      }
      return data;
    } catch {
      setPlanError("Network error while building the plan.");
      return null;
    } finally {
      setPlanBusy(false);
    }
  }

  function answerChat(raw: string) {
    const value = raw.trim();
    if (!value || !currentQ) return;
    const nextAnswers = applyConversationAnswer(answers, currentQ.id, value);
    setAnswers(nextAnswers);
    setChat((prev) => [...prev, { role: "user", content: value }]);
    setChatInput("");

    const nextIndex = qIndex + 1;
    if (nextIndex >= questions.length) {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thanks — I’ll draft an AI Website Plan and template matches next. You can still edit details in form mode.",
        },
      ]);
      void (async () => {
        // compose brief from nextAnswers immediately
        const composed = composeStructuredBrief(nextAnswers);
        setPlanBusy(true);
        try {
          const res = await fetch("/api/agent/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: composed,
              websiteType: nextAnswers.websiteType,
            }),
          });
          const data = (await res.json()) as PlanResponse;
          if (res.ok) {
            setPlan(data);
            if (data.brandKit) setBrandKit(data.brandKit);
            if (data.templates[0]) setSelectedTemplateId(data.templates[0].id);
            setStep(1);
          } else {
            setPlanError(data.error || "Could not build a plan.");
          }
        } catch {
          setPlanError("Network error while building the plan.");
        } finally {
          setPlanBusy(false);
        }
      })();
      return;
    }

    setQIndex(nextIndex);
    const nextQ = questions[nextIndex];
    setChat((prev) => [
      ...prev,
      {
        role: "assistant",
        content: nextQ?.hint
          ? `${nextQ.prompt}\n(${nextQ.hint})`
          : nextQ?.prompt || "",
      },
    ]);
  }

  function onChatSubmit(e: FormEvent) {
    e.preventDefault();
    answerChat(chatInput);
  }

  async function onScreenshot(file: File) {
    setShotBusy(true);
    setShotMsg("Analyzing screenshot…");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/agent/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          hint: answers.extraDetails || undefined,
        }),
      });
      const data = (await res.json()) as {
        available?: boolean;
        message?: string;
        answers?: Partial<CreateWizardAnswers>;
        summary?: string;
      };
      setShotMsg(data.message || "");
      if (data.answers && Object.keys(data.answers).length > 0) {
        setAnswers((prev) => ({ ...prev, ...data.answers }));
        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I read the screenshot${data.summary ? `: ${data.summary}` : "."} Review the filled answers, or keep chatting.`,
          },
        ]);
        setQIndex(questions.length - 1);
      }
    } catch {
      setShotMsg("Could not analyze that image. Continue in chat.");
    } finally {
      setShotBusy(false);
    }
  }

  async function goNext() {
    if (step === 0) {
      const data = await loadPlan();
      if (!data) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
    }
  }

  function generate() {
    const theme = pickThemeFromBrief(brief);
    const params = new URLSearchParams({ prompt: brief, theme });
    if (selectedTemplateId) params.set("templateId", selectedTemplateId);
    if (brandKit) {
      params.set("brandKit", "1");
      try {
        sessionStorage.setItem("magic-brand-kit", JSON.stringify(brandKit));
      } catch {
        // ignore
      }
    }
    router.push(`/builder?${params.toString()}`);
  }

  const templateList =
    browseTab === "matched"
      ? plan?.templates || []
      : plan?.browseTemplates || [];

  return (
    <main className="bg-atmosphere min-h-screen px-4 py-8 text-fog sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-brand)] text-2xl italic"
          >
            magic ai
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={`rounded-full px-3 py-1 ${
                mode === "chat" ? "bg-lime text-ink" : "text-mist"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMode("form")}
              className={`rounded-full px-3 py-1 ${
                mode === "form" ? "bg-lime text-ink" : "text-mist"
              }`}
            >
              Steps
            </button>
            <Link href="/builder" className="text-mist hover:text-fog">
              Skip
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-mist">
          Create · {STEPS[step]} · {step + 1}/{STEPS.length}
        </p>
        <div className="mt-3 flex gap-1">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-lime" : "bg-[var(--line)]"
              }`}
            />
          ))}
        </div>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          {step === 0 && "Tell me about the site"}
          {step === 1 && "AI Website Plan"}
          {step === 2 && "Choose a template"}
          {step === 3 && "Ready to generate"}
        </h1>

        <div className="mt-8 space-y-4">
          {step === 0 && mode === "chat" ? (
            <div className="rounded-2xl border border-[var(--line)] bg-ink-soft">
              <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4 py-4">
                {chat.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={`rounded-2xl px-3 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "ml-8 bg-lime/15 text-fog"
                        : "mr-6 bg-ink text-mist"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {planBusy ? (
                  <p className="animate-pulse text-xs text-lime">
                    Building your AI Website Plan…
                  </p>
                ) : null}
                <div ref={chatEndRef} />
              </div>

              {currentQ?.choices && qIndex < questions.length ? (
                <div className="flex flex-wrap gap-2 border-t border-[var(--line)] px-4 py-3">
                  {currentQ.choices.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => answerChat(c.id)}
                      className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-mist hover:border-lime/40 hover:text-fog"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={onChatSubmit}
                className="flex gap-2 border-t border-[var(--line)] p-3"
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={currentQ?.hint || "Type your answer…"}
                  disabled={planBusy || qIndex >= questions.length}
                  className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-ink px-4 py-2.5 text-sm outline-none focus:border-lime/40"
                />
                <button
                  type="submit"
                  disabled={planBusy || !chatInput.trim()}
                  className="rounded-full bg-fog px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
                >
                  Send
                </button>
              </form>

              <div className="border-t border-[var(--line)] px-4 py-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onScreenshot(f);
                  }}
                />
                <button
                  type="button"
                  disabled={shotBusy}
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-lime underline-offset-2 hover:underline disabled:opacity-40"
                >
                  {shotBusy
                    ? "Analyzing screenshot…"
                    : "Upload screenshot to rebuild"}
                </button>
                <p className="mt-1 text-[11px] text-mist">
                  {visionOk === false
                    ? "Vision key not configured — upload will explain and you can continue in chat."
                    : shotMsg ||
                      "Optional. Uses OpenRouter vision when available."}
                </p>
              </div>
            </div>
          ) : null}

          {step === 0 && mode === "form" ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {WEBSITE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => patch("websiteType", t.id as WebsiteTypeId)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                      answers.websiteType === t.id
                        ? "border-lime/50 bg-lime/10"
                        : "border-[var(--line)] bg-ink-soft"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => {
                      patch("industry", industry);
                      patch("industryCustom", "");
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                      answers.industry === industry && !answers.industryCustom
                        ? "border-lime/50 bg-lime/10"
                        : "border-[var(--line)] bg-ink-soft"
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
              <input
                value={answers.industryCustom}
                onChange={(e) => patch("industryCustom", e.target.value)}
                placeholder="Or type industry…"
                className="w-full rounded-2xl border border-[var(--line)] bg-ink-soft px-4 py-3 text-sm outline-none focus:border-lime/40"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => patch("style", s.id as StyleId)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                      answers.style === s.id
                        ? "border-lime/50 bg-lime/10"
                        : "border-[var(--line)] bg-ink-soft"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {(
                [
                  ["businessName", "Business name", "Northbeam Coffee"],
                  ["goal", "Goal", "Attract walk-ins"],
                  ["targetCustomers", "Target customers", "Remote workers"],
                  ["brandFeeling", "Brand feeling", "Warm, artisan"],
                  ["colors", "Colors", "Espresso + cream"],
                ] as const
              ).map(([key, label, ph]) => (
                <label key={key} className="block">
                  <span className="text-xs text-mist">{label}</span>
                  <input
                    value={answers[key]}
                    onChange={(e) => patch(key, e.target.value)}
                    placeholder={ph}
                    className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-ink-soft px-4 py-3 text-sm outline-none focus:border-lime/40"
                  />
                </label>
              ))}
              <textarea
                value={answers.extraDetails}
                onChange={(e) => patch("extraDetails", e.target.value)}
                rows={3}
                placeholder="Extra details…"
                className="w-full rounded-2xl border border-[var(--line)] bg-ink-soft px-4 py-3 text-sm outline-none focus:border-lime/40"
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              {planBusy ? (
                <p className="animate-pulse text-sm text-lime">
                  Building your AI Website Plan…
                </p>
              ) : null}
              {planError ? <p className="text-sm text-coral">{planError}</p> : null}
              {plan ? (
                <div className="rounded-2xl border border-[var(--line)] bg-ink-soft p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
                        AI Website Plan
                      </p>
                      <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
                        {plan.summary}
                      </h2>
                    </div>
                    <span className="rounded-full border border-lime/40 px-3 py-1 text-xs text-lime">
                      Preview {plan.designScorePreview}/100
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <PlanRow label="Industry" value={plan.industry} />
                    <PlanRow label="Website type" value={plan.websiteType} />
                    <PlanRow label="Pages" value={plan.pages.join(" · ")} />
                    <PlanRow label="Design" value={plan.design.style} />
                    <PlanRow
                      label="Sections"
                      value={plan.sections
                        .map((s) => s.replace(/_/g, " "))
                        .join(", ")}
                    />
                  </dl>
                </div>
              ) : null}
              {brandKit ? (
                <div className="rounded-2xl border border-[var(--line)] bg-ink-soft p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
                    AI Brand Kit
                  </p>
                  <p className="mt-2 text-sm font-semibold text-fog">
                    {brandKit.tagline}
                  </p>
                  <p className="mt-1 text-xs text-mist">{brandKit.description}</p>
                  <p className="mt-2 text-xs text-mist">
                    Fonts {brandKit.fonts.display} / {brandKit.fonts.body}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {BROWSE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setBrowseTab(tab.id);
                      if (tab.id !== "matched") {
                        void loadPlan(selectedTemplateId, tab.id);
                      }
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      browseTab === tab.id
                        ? "bg-lime text-ink"
                        : "border border-[var(--line)] text-mist"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {templateList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(t.id);
                    void loadPlan(t.id, browseTab === "matched" ? null : browseTab);
                  }}
                  className={`w-full rounded-2xl border px-4 py-4 text-left ${
                    selectedTemplateId === t.id
                      ? "border-lime/50 bg-lime/10"
                      : "border-[var(--line)] bg-ink-soft"
                  }`}
                >
                  <p className="text-sm font-semibold text-fog">{t.name}</p>
                  <p className="mt-1 text-xs text-mist">
                    {t.industry} · {t.style} · {t.category}
                  </p>
                  <p className="mt-2 text-xs text-mist">{t.why}</p>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-ink-soft p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-mist">
                Structured brief
              </p>
              <pre className="whitespace-pre-wrap font-[family-name:var(--font-body)] text-xs leading-relaxed text-fog">
                {brief}
              </pre>
              {selectedTemplateId ? (
                <p className="text-xs text-mist">
                  Template:{" "}
                  <span className="text-lime">{selectedTemplateId}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm text-mist"
            >
              Back to edit
            </button>
          ) : null}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => void goNext()}
              disabled={planBusy || (step === 0 && mode === "chat" && qIndex < questions.length - 1 && !answers.businessName && !answers.goal)}
              className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
            >
              {step === 0
                ? planBusy
                  ? "Planning…"
                  : "See AI plan"
                : step === 1
                  ? "Choose template"
                  : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-ink"
            >
              Generate website
            </button>
          )}

          {step === 1 && plan ? (
            <button
              type="button"
              onClick={generate}
              className="rounded-full border border-lime/40 px-5 py-2.5 text-sm text-lime"
            >
              Generate website
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-mist">{label}</dt>
      <dd className="mt-1 text-fog">{value}</dd>
    </div>
  );
}
