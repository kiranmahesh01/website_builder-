"use client";

import { AGENT_ROLE_LABELS, type AgentEvent } from "@/lib/agents/types";

/**
 * Live trace of the manager → planner → designer → developer → reviewer → fix loop.
 *
 * Imports only from `@/lib/agents/types`, which is types and plain constants,
 * so nothing server-only crosses the client boundary.
 */

const DOT_CLASS: Record<AgentEvent["type"], string> = {
  start: "bg-mist",
  progress: "bg-mist",
  pass: "bg-lime",
  fail: "bg-coral",
  retry: "bg-lime-deep",
  done: "bg-lime",
  error: "bg-coral",
};

const TEXT_CLASS: Record<AgentEvent["type"], string> = {
  start: "text-mist",
  progress: "text-mist",
  pass: "text-fog",
  fail: "text-coral",
  retry: "text-fog",
  done: "text-fog",
  error: "text-coral",
};

export function AgentProgress({
  events,
  busy,
}: {
  events: AgentEvent[];
  busy: boolean;
}) {
  if (events.length === 0) return null;

  const latest = events[events.length - 1];
  const scoreEvent = [...events]
    .reverse()
    .find(
      (e) =>
        e.role === "reviewer" && /score\s+\d+\/100/i.test(e.message),
    );
  const scoreMatch = scoreEvent?.message.match(/score\s+(\d+)\/100/i);
  const designScore = scoreMatch ? Number(scoreMatch[1]) : null;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-ink-soft/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
          Agents
        </p>
        <div className="flex items-center gap-2">
          {designScore !== null ? (
            <span
              className={`text-[10px] tabular-nums ${
                designScore >= 70 ? "text-lime" : "text-coral"
              }`}
            >
              Design {designScore}/100
            </span>
          ) : null}
          {busy ? (
            <span className="animate-pulse text-[10px] text-lime">
              {AGENT_ROLE_LABELS[latest.role]} working…
            </span>
          ) : null}
        </div>
      </div>
      <ul className="mt-2 space-y-1.5">
        {events.map((event, i) => (
          <li
            key={`${event.at}-${i}`}
            className="flex items-start gap-2 text-[11px] leading-snug"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASS[event.type]}`}
              aria-hidden
            />
            <span className={TEXT_CLASS[event.type]}>
              <span className="font-semibold text-fog">
                {AGENT_ROLE_LABELS[event.role]}
              </span>
              {event.attempt && event.attempt > 1 ? (
                <span className="text-mist"> (pass {event.attempt})</span>
              ) : null}
              <span className="text-mist"> — </span>
              {event.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
