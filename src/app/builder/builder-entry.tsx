"use client";

import { useSearchParams } from "next/navigation";
import { BuilderWorkspace } from "@/components/BuilderWorkspace";

export function BuilderEntry() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const templateId = searchParams.get("templateId") || "";
  return (
    <BuilderWorkspace
      initialPrompt={prompt}
      initialTemplateId={templateId || undefined}
    />
  );
}
