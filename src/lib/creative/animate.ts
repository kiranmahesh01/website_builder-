import { animateImageToVideo, hasReplicate } from "./replicate";
import type { CreativeScript } from "./schema";

export async function animateKeyScenes(
  script: CreativeScript,
): Promise<CreativeScript> {
  if (!hasReplicate()) {
    return script;
  }

  const scenes = await Promise.all(
    script.scenes.map(async (scene) => {
      if (!scene.animate || !scene.stillUrl) return scene;

      try {
        const videoUrl = await animateImageToVideo(
          scene.stillUrl,
          scene.visualPrompt,
        );
        return { ...scene, videoUrl };
      } catch {
        return scene;
      }
    }),
  );

  return { ...script, scenes };
}
