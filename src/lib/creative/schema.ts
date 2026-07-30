import { z } from "zod";

export const creativeSceneSchema = z.object({
  id: z.string(),
  sceneNumber: z.number().int().min(1),
  durationSec: z.number().min(2).max(15),
  narration: z.string(),
  visualPrompt: z.string(),
  shotType: z.enum(["wide", "medium", "close"]),
  animate: z.boolean(),
  stillUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

export const creativeScriptSchema = z.object({
  title: z.string(),
  brand: z.string(),
  styleNotes: z.string(),
  referenceImageUrl: z.string().url().optional(),
  referenceStyle: z.string().optional(),
  scenes: z.array(creativeSceneSchema).min(4).max(12),
});

export type CreativeScene = z.infer<typeof creativeSceneSchema>;
export type CreativeScript = z.infer<typeof creativeScriptSchema>;

export type CreativeStage =
  | "script"
  | "stills"
  | "animate"
  | "voice"
  | "assembly"
  | "ready";

export type CreativeStageStatus = {
  stage: CreativeStage;
  status: "pending" | "running" | "done" | "skipped" | "error";
  message?: string;
};

export type CreativeProjectData = {
  version: 1;
  script?: CreativeScript;
  stages: CreativeStageStatus[];
  capabilities: {
    replicate: boolean;
    elevenlabs: boolean;
    cartesia: boolean;
    openrouter: boolean;
  };
};

export function emptyCreativeData(): CreativeProjectData {
  return {
    version: 1,
    stages: [
      { stage: "script", status: "pending" },
      { stage: "stills", status: "pending" },
      { stage: "animate", status: "pending" },
      { stage: "voice", status: "pending" },
      { stage: "assembly", status: "pending" },
      { stage: "ready", status: "pending" },
    ],
    capabilities: {
      replicate: Boolean(process.env.REPLICATE_API_TOKEN),
      elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
      cartesia: Boolean(process.env.CARTESIA_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    },
  };
}

export function parseCreativeData(raw: string | null | undefined): CreativeProjectData {
  if (!raw) return emptyCreativeData();
  try {
    const json = JSON.parse(raw) as CreativeProjectData;
    if (json.version === 1 && Array.isArray(json.stages)) return json;
  } catch {
    // fall through
  }
  return emptyCreativeData();
}

export function serializeCreativeData(data: CreativeProjectData): string {
  return JSON.stringify(data);
}

export function setStage(
  data: CreativeProjectData,
  stage: CreativeStage,
  status: CreativeStageStatus["status"],
  message?: string,
): CreativeProjectData {
  return {
    ...data,
    stages: data.stages.map((s) =>
      s.stage === stage ? { ...s, status, message } : s,
    ),
  };
}
