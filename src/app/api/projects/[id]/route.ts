import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableProviders } from "@/lib/llm/types";
import { parseWebsite } from "@/lib/schema";
import { renderWebsiteToHtml } from "@/lib/render-site";
import { deserializeSiteData, serializeSiteData } from "@/lib/site-data";
import { snapshotProjectVersion } from "@/lib/versions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      versions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      prompt: project.prompt,
      html: project.html,
      data: project.data,
      provider: project.provider,
      published: project.published,
      slug: project.slug,
      customDomain: project.customDomain,
      seoTitle: project.seoTitle,
      seoDescription: project.seoDescription,
      logoUrl: project.logoUrl,
      viewCount: project.viewCount,
    },
    messages: project.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
    versions: project.versions.map((v) => ({
      id: v.id,
      label: v.label,
      createdAt: v.createdAt,
    })),
    providers: availableProviders(),
  });
}

const patchSchema = z.object({
  data: z.unknown().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  logoUrl: z.string().optional(),
  customDomain: z.string().optional().nullable(),
  title: z.string().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await snapshotProjectVersion(project.id, "Before visual edit");

  let html = project.html;
  let dataStr = project.data;
  let seoTitle = parsed.data.seoTitle ?? project.seoTitle;
  let seoDescription = parsed.data.seoDescription ?? project.seoDescription;
  let logoUrl = parsed.data.logoUrl ?? project.logoUrl;

  if (parsed.data.data !== undefined) {
    const site = parseWebsite(parsed.data.data);
    if (!site) {
      return NextResponse.json({ error: "Invalid website JSON" }, { status: 400 });
    }
    site.seo = {
      ...(site.seo || {}),
      title: seoTitle || site.seo?.title,
      description: seoDescription || site.seo?.description,
    };
    if (logoUrl) site.logoUrl = logoUrl;
    html = await renderWebsiteToHtml(site);
    dataStr = serializeSiteData(site);
    seoTitle = site.seo?.title || seoTitle;
    seoDescription = site.seo?.description || seoDescription;
    logoUrl = site.logoUrl || logoUrl;
  } else if (project.data) {
    const site = deserializeSiteData(project.data);
    if (site) {
      site.seo = {
        ...(site.seo || {}),
        title: seoTitle || site.seo?.title,
        description: seoDescription || site.seo?.description,
      };
      if (logoUrl) site.logoUrl = logoUrl;
      html = await renderWebsiteToHtml(site);
      dataStr = serializeSiteData(site);
    }
  }

  let customDomain = parsed.data.customDomain;
  if (customDomain === "") customDomain = null;
  if (typeof customDomain === "string") {
    customDomain = customDomain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .trim();
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      html,
      data: dataStr,
      seoTitle,
      seoDescription,
      logoUrl,
      title: parsed.data.title ?? project.title,
      customDomain: customDomain === undefined ? undefined : customDomain,
    },
  });

  return NextResponse.json({
    project: {
      id: updated.id,
      title: updated.title,
      html: updated.html,
      data: updated.data,
      seoTitle: updated.seoTitle,
      seoDescription: updated.seoDescription,
      logoUrl: updated.logoUrl,
      customDomain: updated.customDomain,
      published: updated.published,
      slug: updated.slug,
    },
  });
}
