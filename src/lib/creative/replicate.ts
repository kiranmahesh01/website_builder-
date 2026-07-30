const REPLICATE_API = "https://api.replicate.com/v1";

type Prediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: string;
};

export function hasReplicate(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

async function createModelPrediction(
  model: string,
  input: Record<string, unknown>,
): Promise<Prediction> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");

  const res = await fetch(`${REPLICATE_API}/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate error: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as Prediction;
}

async function pollPrediction(id: string, maxMs = 120_000): Promise<Prediction> {
  const token = process.env.REPLICATE_API_TOKEN!;
  const start = Date.now();

  while (Date.now() - start < maxMs) {
    const res = await fetch(`${REPLICATE_API}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Replicate poll failed");
    const prediction = (await res.json()) as Prediction;
    if (prediction.status === "succeeded") return prediction;
    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(prediction.error || "Replicate prediction failed");
    }
    await new Promise((r) => setTimeout(r, 2500));
  }

  throw new Error("Replicate prediction timed out");
}

export async function runReplicateModel(
  model: string,
  input: Record<string, unknown>,
  maxMs = 120_000,
): Promise<unknown> {
  const created = await createModelPrediction(model, input);
  if (created.status === "succeeded") return created.output;
  const done = await pollPrediction(created.id, maxMs);
  return done.output;
}

/** Flux Schnell — fast AI still generation */
export async function generateFluxImage(prompt: string): Promise<string> {
  const output = await runReplicateModel(
    "black-forest-labs/flux-schnell",
    {
      prompt,
      num_outputs: 1,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 90,
    },
    90_000,
  );

  const url = Array.isArray(output) ? output[0] : output;
  if (typeof url !== "string") throw new Error("Flux returned no image URL");
  return url;
}

/** Minimax video — image-to-video for key scenes */
export async function animateImageToVideo(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  const output = await runReplicateModel(
    "minimax/video-01-live",
    {
      prompt: prompt.slice(0, 200),
      first_frame_image: imageUrl,
    },
    120_000,
  );

  if (typeof output === "string") return output;
  if (output && typeof output === "object" && "video" in output) {
    return String((output as { video: string }).video);
  }
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  throw new Error("Video model returned no URL");
}
