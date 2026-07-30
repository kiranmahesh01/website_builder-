import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { makeSlug } from "@/lib/utils";
import { deserializeSiteData } from "@/lib/site-data";
import { renderWebsiteToHtml } from "@/lib/render-site";

const schema = z.object({
  projectId: z.string().min(1),
  customDomain: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.html && !project.data) {
      return NextResponse.json(
        { error: "Generate a website before publishing." },
        { status: 400 },
      );
    }

    let html = project.html;
    const site = deserializeSiteData(project.data);
    if (site) {
      html = await renderWebsiteToHtml(site);
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

    const slug = project.slug || makeSlug(project.title);
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        html,
        published: true,
        slug,
        publishedAt: new Date(),
        customDomain:
          customDomain === undefined ? project.customDomain : customDomain,
        seoTitle: site?.seo?.title || project.seoTitle,
        seoDescription: site?.seo?.description || project.seoDescription,
        logoUrl: site?.logoUrl || project.logoUrl,
      },
    });

    return NextResponse.json({
      published: true,
      slug: updated.slug,
      url: `/s/${updated.slug}`,
      customDomain: updated.customDomain,
      domainUrl: updated.customDomain
        ? `/domain/${encodeURIComponent(updated.customDomain)}`
        : null,
    });
  } catch (error) {
    console.error("publish error", error);
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
}
