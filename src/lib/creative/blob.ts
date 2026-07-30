import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

export async function uploadBuffer(
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`creative/${filename}`, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType,
    });
    return blob.url;
  }

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(process.cwd(), "public", "creative");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safe), buffer);
  return `/creative/${safe}`;
}

export async function uploadText(filename: string, text: string): Promise<string> {
  return uploadBuffer(filename, Buffer.from(text, "utf-8"), "text/html; charset=utf-8");
}
