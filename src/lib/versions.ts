import { prisma } from "@/lib/db";

/** Snapshot current project HTML/data before an overwrite. Keeps last 20. */
export async function snapshotProjectVersion(
  projectId: string,
  label?: string,
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || (!project.html && !project.data)) return;

  await prisma.projectVersion.create({
    data: {
      projectId,
      label: label || "Autosave",
      html: project.html || "",
      data: project.data,
    },
  });

  const old = await prisma.projectVersion.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    skip: 20,
    select: { id: true },
  });
  if (old.length) {
    await prisma.projectVersion.deleteMany({
      where: { id: { in: old.map((v) => v.id) } },
    });
  }
}
