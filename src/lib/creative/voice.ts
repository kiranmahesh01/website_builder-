import { uploadBuffer } from "./blob";
import type { CreativeScript } from "./schema";

const ELEVENLABS_DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

export function hasElevenLabs(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export function hasCartesia(): boolean {
  return Boolean(process.env.CARTESIA_API_KEY);
}

async function elevenLabsTts(text: string): Promise<Buffer> {
  const key = process.env.ELEVENLABS_API_KEY!;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || ELEVENLABS_DEFAULT_VOICE;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs error: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function cartesiaTts(text: string): Promise<Buffer> {
  const key = process.env.CARTESIA_API_KEY!;
  const voiceId = process.env.CARTESIA_VOICE_ID || "79a125e8-cd45-4c13-8a67-188112f4dd22";

  const res = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "X-API-Key": key,
      "Cartesia-Version": "2024-06-10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-english",
      transcript: text,
      voice: { mode: "id", id: voiceId },
      output_format: { container: "mp3", encoding: "mp3", sample_rate: 44100 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Cartesia error: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function generateVoiceover(
  script: CreativeScript,
): Promise<string | null> {
  const narration = script.scenes
    .sort((a, b) => a.sceneNumber - b.sceneNumber)
    .map((s) => s.narration)
    .filter(Boolean)
    .join(" ");

  if (!narration) return null;

  let audio: Buffer | null = null;

  if (hasElevenLabs()) {
    try {
      audio = await elevenLabsTts(narration);
    } catch {
      audio = null;
    }
  }

  if (!audio && hasCartesia()) {
    try {
      audio = await cartesiaTts(narration);
    } catch {
      audio = null;
    }
  }

  if (!audio) return null;

  const filename = `voice-${Date.now()}.mp3`;
  return uploadBuffer(filename, audio, "audio/mpeg");
}
