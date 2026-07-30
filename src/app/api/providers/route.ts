import { NextResponse } from "next/server";
import { availableProviders } from "@/lib/llm/types";

export async function GET() {
  return NextResponse.json({
    providers: availableProviders(),
    defaults: {
      provider: process.env.DEFAULT_LLM_PROVIDER || "demo",
    },
  });
}
