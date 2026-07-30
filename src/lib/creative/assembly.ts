import { uploadText } from "./blob";
import type { CreativeScript } from "./schema";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPreviewHtml(
  script: CreativeScript,
  voiceoverUrl?: string | null,
): string {
  const scenes = script.scenes
    .sort((a, b) => a.sceneNumber - b.sceneNumber)
    .map((scene, i) => {
      const media = scene.videoUrl
        ? `<video src="${escapeHtml(scene.videoUrl)}" autoplay muted playsinline loop class="media"></video>`
        : scene.stillUrl
          ? `<img src="${escapeHtml(scene.stillUrl)}" alt="" class="media ken-burns" />`
          : `<div class="media placeholder"></div>`;

      return `
        <section class="scene" data-duration="${scene.durationSec}" style="animation-delay: ${i}s">
          ${media}
          <div class="caption">
            <p class="scene-num">Scene ${scene.sceneNumber}</p>
            <p class="narration">${escapeHtml(scene.narration)}</p>
          </div>
        </section>`;
    })
    .join("\n");

  const totalSec = script.scenes.reduce((n, s) => n + s.durationSec, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(script.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; }
    .player { position: relative; width: 100vw; height: 100vh; }
    .scene {
      position: absolute; inset: 0; opacity: 0;
      animation: sceneShow ${totalSec}s infinite;
    }
    .media { width: 100%; height: 100%; object-fit: cover; }
    .ken-burns { animation: kenBurns 8s ease-in-out infinite alternate; }
    .placeholder { background: linear-gradient(135deg, #1a1a2e, #16213e); }
    .caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 2rem 2.5rem 3rem;
      background: linear-gradient(transparent, rgba(0,0,0,0.85));
    }
    .scene-num { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.7; }
    .narration { margin-top: 0.5rem; font-size: 1.25rem; max-width: 40rem; line-height: 1.4; }
    .brand { position: absolute; top: 1.5rem; left: 2rem; font-size: 0.85rem; opacity: 0.8; }
    @keyframes kenBurns {
      from { transform: scale(1) translate(0, 0); }
      to { transform: scale(1.08) translate(-1%, -1%); }
    }
    @keyframes sceneShow {
      0%, 100% { opacity: 0; }
      2%, 18% { opacity: 1; }
      20% { opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="player">
    <div class="brand">${escapeHtml(script.brand)} · Magic AI Creative</div>
    ${scenes}
  </div>
  ${voiceoverUrl ? `<audio id="vo" src="${escapeHtml(voiceoverUrl)}" autoplay></audio><script>document.getElementById('vo').play().catch(()=>{});</script>` : ""}
</body>
</html>`;
}

export async function assembleCreative(
  script: CreativeScript,
  voiceoverUrl?: string | null,
): Promise<string> {
  const html = buildPreviewHtml(script, voiceoverUrl);
  return uploadText(`preview-${Date.now()}.html`, html);
}
