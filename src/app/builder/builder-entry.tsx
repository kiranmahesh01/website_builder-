"use client";

import { useSearchParams } from "next/navigation";
import { BuilderWorkspace } from "@/components/BuilderWorkspace";

export function BuilderEntry() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  return <BuilderWorkspace initialPrompt={prompt} />;
}
