import { resolveImageQuery } from "@/lib/spec/images";
import { enhanceVisualPrompt } from "./reference";
import { generateFluxImage, hasReplicate } from "./replicate";
import type { CreativeScene, CreativeScript } from "./schema";

export async function generateSceneStill(
  scene: CreativeScene,
  referenceStyle?: string,
): Promise<string> {
  const prompt = await enhanceVisualPrompt(scene.visualPrompt, referenceStyle);

  if (hasReplicate()) {
    try {
      const fluxUrl = await generateFluxImage(
        `${prompt}. ${referenceStyle || "commercial photography, 16:9, high quality"}`,
      );
      return fluxUrl;
    } catch {
      // fall through to stock
    }
  }

  return resolveImageQuery(prompt, "warm_editorial");
}

export async function generateAllStills(
  script: CreativeScript,
): Promise<CreativeScript> {
  const scenes = await Promise.all(
    script.scenes.map(async (scene) => {
      const stillUrl = await generateSceneStill(scene, script.referenceStyle);
      return { ...scene, stillUrl };
    }),
  );

  return { ...script, scenes };
}
