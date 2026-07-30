import { analyzeReferenceImage } from "./reference";
import { generateCreativeScript } from "./script";
import { generateAllStills } from "./stills";
import { animateKeyScenes } from "./animate";
import { generateVoiceover } from "./voice";
import { assembleCreative } from "./assembly";
import {
  emptyCreativeData,
  serializeCreativeData,
  setStage,
  type CreativeProjectData,
  type CreativeScript,
} from "./schema";

export type CreativePipelineResult = {
  data: CreativeProjectData;
  script: CreativeScript;
  voiceoverUrl: string | null;
  outputUrl: string;
};

export async function runCreativePipeline(input: {
  prompt: string;
  referenceImageUrl?: string;
  onProgress?: (data: CreativeProjectData) => void;
}): Promise<CreativePipelineResult> {
  let data = emptyCreativeData();

  const progress = (patch: CreativeProjectData) => {
    data = patch;
    input.onProgress?.(data);
  };

  // Stage 1: Reference + Script
  progress(setStage(data, "script", "running", "Analyzing reference & writing script…"));

  let referenceStyle: string | undefined;
  if (input.referenceImageUrl) {
    referenceStyle = await analyzeReferenceImage(
      input.referenceImageUrl,
      input.prompt,
    );
  }

  let script = await generateCreativeScript({
    prompt: input.prompt,
    referenceImageUrl: input.referenceImageUrl,
    referenceStyle,
  });

  data = { ...data, script };
  progress(setStage(data, "script", "done", "Script ready"));

  // Stage 2: Stills
  progress(setStage(data, "stills", "running", "Generating scene stills…"));
  script = await generateAllStills(script);
  data = { ...data, script };
  progress(setStage(data, "stills", "done", `${script.scenes.length} stills generated`));

  // Stage 3: Animate key scenes (2-4)
  const keyScenes = script.scenes.filter((s) => s.animate).length;
  if (data.capabilities.replicate && keyScenes > 0) {
    progress(
      setStage(data, "animate", "running", `Animating ${keyScenes} key scenes…`),
    );
    script = await animateKeyScenes(script);
    data = { ...data, script };
    const animated = script.scenes.filter((s) => s.videoUrl).length;
    progress(
      setStage(
        data,
        "animate",
        animated > 0 ? "done" : "skipped",
        animated > 0 ? `${animated} scenes animated` : "Used Ken Burns fallback",
      ),
    );
  } else {
    progress(
      setStage(data, "animate", "skipped", "Ken Burns preview (add REPLICATE_API_TOKEN for video)"),
    );
  }

  // Stage 4: Voice
  if (data.capabilities.elevenlabs || data.capabilities.cartesia) {
    progress(setStage(data, "voice", "running", "Generating voiceover…"));
    const voiceoverUrl = await generateVoiceover(script);
    progress(
      setStage(
        data,
        "voice",
        voiceoverUrl ? "done" : "skipped",
        voiceoverUrl ? "Voiceover ready" : "Voice generation failed",
      ),
    );

    // Stage 5: Assembly
    progress(setStage(data, "assembly", "running", "Assembling preview…"));
    const outputUrl = await assembleCreative(script, voiceoverUrl);
    progress(setStage(data, "assembly", "done", "Preview assembled"));
    progress(setStage(data, "ready", "done", "Creative ready"));

    return { data, script, voiceoverUrl, outputUrl };
  }

  progress(
    setStage(
      data,
      "voice",
      "skipped",
      "Add ELEVENLABS_API_KEY or CARTESIA_API_KEY for voice",
    ),
  );

  progress(setStage(data, "assembly", "running", "Assembling preview…"));
  const outputUrl = await assembleCreative(script, null);
  progress(setStage(data, "assembly", "done", "Preview assembled"));
  progress(setStage(data, "ready", "done", "Creative ready"));

  return { data, script, voiceoverUrl: null, outputUrl };
}

export { serializeCreativeData, parseCreativeData } from "./schema";
